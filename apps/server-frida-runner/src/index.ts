import express, { Request, Response } from 'express';
import { spawn, ChildProcess } from 'child_process';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const parentDir = path.join(__dirname, '..');
const SCRIPTS_DIR = path.join(parentDir, 'scripts');
const TEMP_DIR = path.join(parentDir, 'temp');

const activeProcesses = new Map<string, ChildProcess>();

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

app.post('/start-server', async (req: Request, res: Response): Promise<any> => {
  try {
    const { serial } = req.body; // Add this line to get serial from request
    if (!serial) {
      return res.status(400).json({ error: 'Device serial is required' });
    }

    // Check device architecture
    const archProcess = spawn('adb', ['-s', serial, 'shell', 'getprop', 'ro.product.cpu.abi']);
    const architecture = await new Promise<string>((resolve) => {
      let arch = '';
      archProcess.stdout.on('data', (data) => {
        arch = data.toString().trim();
      });
      archProcess.on('close', () => {
        resolve(arch);
      });
    });

    // Determine correct Frida server binary
    const fridaServerBinary = architecture === 'armeabi-v7a' ? 'frida-server-arm' : 'frida-server-arm64';
    
    // First check if Frida server is already running
    const checkProcess = spawn('adb', ['-s', serial, 'shell', 'netstat -anp | grep 27042']);
    
    let isRunning = false;
    
    checkProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes(fridaServerBinary )) {
        isRunning = true;
      }
    });

    await new Promise((resolve) => {
      checkProcess.on('close', (code) => {
        resolve(undefined);
      });
    });

    if (isRunning) {
      return res.json({ status: 'success', message: 'Frida server is already running' });
    }

    

    
    // If server is not running, proceed with the original startup sequence
    // Step 1: Restart ADB as root
    await new Promise<void>((resolve, reject) => {
      const rootProcess = spawn('adb', ['-s', serial, 'root']);
      rootProcess.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error('Failed to restart ADB as root'));
      });
    });

    // Step 2: Push Frida server binary
    await new Promise<void>((resolve, reject) => {
      const pushProcess = spawn('adb', [ '-s', serial,
        'push',
        path.join(__dirname, '..', fridaServerBinary),
        `/data/local/tmp/${fridaServerBinary}`
      ]);
      pushProcess.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error('Failed to push Frida server'));
      });
    });

    // Step 3: Set executable permissions
    await new Promise<void>((resolve, reject) => {
      const chmodProcess = spawn('adb', [ '-s', serial,
        'shell',
        `chmod +x /data/local/tmp/${fridaServerBinary}`
      ]);
      chmodProcess.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error('Failed to set executable permissions'));
      });
    });

    // Step 4: Start Frida server in detached mode
    const serverProcess = spawn('adb', [ '-s', serial,
      'shell',
      `/data/local/tmp/${fridaServerBinary} -D`
    ], {
      detached: true,
      stdio: ['ignore', 'ignore', 'pipe'] // only capture stderr for error logging
    });

    // Listen for initial errors
    let hasError = false;
    const errorTimeout = setTimeout(() => {
      if (!hasError) {
        serverProcess.stderr?.removeAllListeners();
        serverProcess.unref(); // Let the process run independently
        res.json({ status: 'success' });
      }
    }, 1000); // Give it 1 second to check for immediate startup errors

    serverProcess.stderr?.on('data', (data) => {
      hasError = true;
      console.error(`Frida server error: ${data}`);
      clearTimeout(errorTimeout);
      res.status(500).json({ error: 'Failed to start Frida server', details: data.toString() });
    });

  } catch (error) {
    console.error('Start server error:', error);
    res.status(500).json({ 
      error: 'Error starting Frida server',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

app.get('/scripts', (req: Request, res: Response) => {
  fs.readdir(SCRIPTS_DIR, (err, files) => {
    if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error reading scripts' });}
    res.json(files);
  });
});

app.post('/execute', async (req: Request, res: Response): Promise<any> => {
  const { script, type, target, serial } = req.body;

  if (!script || !target || !serial) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Validate Frida server connection
    await new Promise<void>((resolve, reject) => {
      const checker = spawn('frida-ps', ['-D', serial]);
      checker.on('close', (code) => (code === 0 ? resolve() : reject()));
    });
  } catch {
    return res.status(500).json({ error: 'Frida server not available' });
  }

  let scriptPath: string;
  if (type === 'custom') {
    scriptPath = path.join(TEMP_DIR, `custom-${Date.now()}.js`);
    fs.writeFileSync(scriptPath, script);
  } else {
    scriptPath = path.join(SCRIPTS_DIR, script);
    if (!fs.existsSync(scriptPath)) {
      return res.status(404).json({ error: 'Script not found' });
    }
  }

  const fridaProcess = spawn('frida', [
    '-D', serial,
    '-l', scriptPath,
    '-f', target
  ]);

  activeProcesses.set(serial, fridaProcess);

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');

  fridaProcess.stdout.pipe(res);
  fridaProcess.stderr.pipe(res);

  req.on('close', () => cleanupProcess(serial, scriptPath, type));
  fridaProcess.on('exit', () => cleanupProcess(serial, scriptPath, type));
});

app.post('/stop', (req: Request, res: Response) => {
  const { serial } = req.body;
  if (!serial) res.status(400).json({ error: 'Serial required' });
  
  const process = activeProcesses.get(serial);
  if (process) {
    process.kill();
    res.json({ status: 'success' });
  } else {
    res.status(404).json({ error: 'No active process' });
  }
});

function cleanupProcess(serial: string, scriptPath: string, type: string) {
  const process = activeProcesses.get(serial);
  if (process) {
    process.kill();
    activeProcesses.delete(serial);
  }
  if (type === 'custom') {
    fs.unlink(scriptPath, () => {});
  }
}

const PORT = config.FRIDA_SERVER;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));