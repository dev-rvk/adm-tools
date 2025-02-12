import express from 'express';
import {WebSocketServer} from "ws";
import {AdbBanner, AdbBannerKey, AdbFeature, AdbServerClient, AdbTransport} from '@yume-chan/adb';
import { AdbServerNodeTcpConnector } from "@yume-chan/adb-server-node-tcp";
import { Server as HttpServer } from 'http';
import { WritableStream } from '@yume-chan/stream-extra';
import cors from 'cors';
import { createProxy } from './websockify.js';
import { config } from 'config';

const app = express();
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());

const port = config.TANGO_BACKEND_MANAGER_PORT;
const server = new HttpServer(app);

type WebsockifyServer = {
    server: import('http').Server;
    wsUrl: string;
};
const activeWebsockifyServers = new Map<string, WebsockifyServer>();

// WebSocket server for device communication
const wss = new WebSocketServer({ noServer: true });

// Setup AdbServerClient with a TCP connector for Node.js
const connector = new AdbServerNodeTcpConnector({ port: 5037 });
const client = new AdbServerClient(connector);

async function listDevices() {
    const devices = await client.getDevices();
    return devices.map(device => ({
        serial: device.serial,
        product: device.product,
        model: device.model,
        transportId: device.transportId.toString(),
    }));
}

type DeviceInfo = {
    transport_id: number;
    serial: string;
    product: string;
    model: string;
    type: 'emulator' | 'WIFI' | 'USB';
    port: number | null;
    ip_address: string;
    wsUrl: string | null;
    status: 'available' | 'busy' | null;
}

// Get connected devices
app.get('/devices', async (req, res) => {
    try {
        const devices = await listDevices();
        const deviceInfo = await Promise.all(devices.map(async device => {
            const transport = await client.createTransport(device);
            const banner = new AdbBanner(
                device.product,
                device.model,
                device.serial,
                ['cmd', 'stat_v2', 'shell_v2'] as AdbFeature[]
            );

            // Convert banner to string format
            const bannerString = `::${[
                `${AdbBannerKey.Product}=${banner.product}`,
                `${AdbBannerKey.Model}=${banner.model}`,
                `${AdbBannerKey.Device}=${banner.device}`,
                `${AdbBannerKey.Features}=${banner.features.join(',')}`
            ].join(';')}`;

            return {
                ...device,
                maxPayloadSize: transport.maxPayloadSize,
                banner: bannerString,
                wsUrl: `ws://localhost:${port}/device/${device.transportId}?serial=${device.serial}&maxPayload=${transport.maxPayloadSize}&banner=${encodeURIComponent(bannerString)}&service=${encodeURIComponent('')}`
            };
        }));
        res.json(deviceInfo);
    } catch (error) {
        console.error('Error fetching devices:', error);
        res.status(500).json({ error: 'Failed to retrieve devices' });
    }
});

const deviceRegistry = new Map<string, DeviceInfo>();

app.get('/list', async (req, res) => {
    try {
        const devices = await listDevices();
        const deviceInfoList: DeviceInfo[] = await Promise.all(devices.map(async device => {
            const wsServer = activeWebsockifyServers.get(device.serial);

            const existingDevice = deviceRegistry.get(device.serial);
            
            // Base device info with existing status if available
            const baseDeviceInfo = {
                transport_id: Number(device.transportId),
                serial: device.serial,
                product: device.product || '',
                model: device.model || '',
                wsUrl: null as string | null,
                status: existingDevice?.status ?? 'available' as const
            };

            // Check for emulator
            const emulatorMatch = device.serial.match(/^emulator-(\d+)$/);
            if (emulatorMatch) {
                const deviceInfo: DeviceInfo = {
                    ...baseDeviceInfo,
                    type: 'emulator' as const,
                    port: Number(emulatorMatch[1]) + 1,
                    ip_address: 'NA',
                    wsUrl: wsServer?.wsUrl || null
                };
                deviceRegistry.set(device.serial, deviceInfo);
                return deviceInfo;
            }

            // Check for WIFI device
            const wifiMatch = device.serial.match(/^([\d.]+):(\d+)$/);
            if (wifiMatch) {
                const deviceInfo: DeviceInfo = {
                    ...baseDeviceInfo,
                    type: 'WIFI' as const,
                    port: Number(wifiMatch[2]),
                    ip_address: wifiMatch[1],
                    wsUrl: wsServer?.wsUrl || null
                };
                deviceRegistry.set(device.serial, deviceInfo);
                return deviceInfo;
            }

            // Default to USB device
            const transport = await client.createTransport(device);
            const banner = new AdbBanner(
                device.product,
                device.model,
                device.serial,
                ['cmd', 'stat_v2', 'shell_v2'] as AdbFeature[]
            );

            const bannerString = `::${[
                `${AdbBannerKey.Product}=${banner.product}`,
                `${AdbBannerKey.Model}=${banner.model}`,
                `${AdbBannerKey.Device}=${banner.device}`,
                `${AdbBannerKey.Features}=${banner.features.join(',')}`
            ].join(';')}`;

            const wsUrl = `ws://localhost:${port}/device/${device.transportId}?serial=${device.serial}&maxPayload=${transport.maxPayloadSize}&banner=${encodeURIComponent(bannerString)}&service=${encodeURIComponent('')}`;
                
            const deviceInfo: DeviceInfo = {
                ...baseDeviceInfo,
                type: 'USB' as const,
                port: null,
                ip_address: '',
                wsUrl: wsUrl // Constructed as before
            };

            // Update registry with serial as key
            deviceRegistry.set(device.serial, deviceInfo);
            return deviceInfo;
        }));

        // Only remove devices that are no longer connected
        const currentSerials = new Set(devices.map(d => d.serial));
        for (const [serial] of deviceRegistry) {
            if (!currentSerials.has(serial)) {
                deviceRegistry.delete(serial);
            }
        }

        // Add some debug logging
        console.log('Current device registry:', 
            Array.from(deviceRegistry.entries()).map(([id, device]) => ({
                id,
                serial: device.serial,
                status: device.status
            }))
        );

        res.json(Array.from(deviceRegistry.values()));

    } catch (error) {
        console.error('Error fetching devices:', error);
        res.status(500).json({ error: 'Failed to retrieve devices' });
    }
});

app.post('/connect', async (req, res) : Promise<any>=> {
    
    console.log(req.body)
    const { serial } = req.body;
    
    if (!serial) {
        return res.status(400).json({ error: 'Device serial is required' });
    }

    // Check if already connected
    if (activeWebsockifyServers.has(serial)) {
        return res.json({ 
            status: "success",
            message: "WebSocket proxy already running",
            wsUrl: activeWebsockifyServers.get(serial)?.wsUrl 
        });
    }

    const emulatorMatch = serial.match(/^emulator-(\d+)$/);
    const wifiMatch = serial.match(/^([\d.]+):(\d+)$/);

    if (!emulatorMatch && !wifiMatch) {
        return res.status(400).json({ 
            status: "error",
            message: "Only WIFI or emulator devices supported" 
        });
    }

    let devicePort: string;
    let deviceIP: string;

    if (emulatorMatch) {
        devicePort = String(Number(emulatorMatch[1]) + 1);
        deviceIP = 'localhost';
    } else {
        devicePort = wifiMatch![2];
        deviceIP = wifiMatch![1];
    }

    // Start a new WebSocket server
    const wsPort = 10000 + parseInt(devicePort);

    try {
        createProxy({
            sourcePort: wsPort,
            targetHost: deviceIP,
            targetPort: parseInt(devicePort),
        });

        const wsUrl = `ws://localhost:${wsPort}`;
        activeWebsockifyServers.set(serial, { server, wsUrl });

        res.json({
            status: "success",
            message: "WebSocket proxy started",
            wsUrl: wsUrl,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

// Device Client Map
const deviceClientMap = new Map<string, Set<string>>();

server.on('upgrade', async (req, socket, head) => {
    console.log('Upgrade request received for URL:', req.url);
    const match = req.url?.match(/\/device\/(\d+)/);

    if (match) {
        const transportId = BigInt(match[1]);
        console.log(`Parsed transport ID: ${transportId}`);

        wss.handleUpgrade(req, socket, head, async (ws) => {
            wss.emit('connection', ws, req);
            console.log('Upgrade successful, establishing WebSocket connection');
            await handleDeviceWebSocket(ws, transportId, req);
        });

    } else {
        console.log('No matching route for URL:', req.url);
        socket.destroy();
    }
});

async function handleDeviceWebSocket(ws: import("ws"), transportId: bigint, req: import("http").IncomingMessage) {
    console.log('handling connection....');
    const deviceId = transportId.toString();
    try {
        const url = new URL(req.url!, `http://${req.headers.host}`);
        const clientId = url.searchParams.get('clientId');
        if (!clientId) {
            throw new Error("Client ID is required");
        }

        const device = (await client.getDevices()).find(d => d.transportId === transportId);
        if (!device) throw new Error("Device not found");
        const serial = device.serial;

        const existingDevice = deviceRegistry.get(serial);
        if (!existingDevice) {
            throw new Error("Device not found in registry");
        }

        if (existingDevice.status === 'busy' && !deviceClientMap.has(serial)) {
            throw new Error(`Device is busy`);
        }

        // Update status using serial as key
        const updatedDevice: DeviceInfo = {
            ...existingDevice,
            status: 'busy'
        };
        deviceRegistry.set(serial, updatedDevice);

        // Update deviceClientMap with serial
        let clientSet = deviceClientMap.get(serial);
        if (!clientSet) {
            clientSet = new Set();
            deviceClientMap.set(serial, clientSet);
        }
        clientSet.add(clientId);

        console.log('Device registry updated:', updatedDevice.serial, updatedDevice.status);
        console.log('Connected to ClientID:', clientId);

        const transport = await client.createTransport(device);
        const service = decodeURIComponent(url.searchParams.get('service') || '');
        console.log('Connecting to service:', service);

        const adbSocket = await transport.connect(service);
        const writer = adbSocket.writable.getWriter();

        ws.binaryType = 'arraybuffer';

        ws.on('close', async () => {
            try {
                writer.releaseLock();
                await adbSocket.close();

                const clientSet = deviceClientMap.get(deviceId);
                if (clientSet) {
                    clientSet.delete(clientId);
                    if (clientSet.size === 0) {
                        deviceClientMap.delete(deviceId);
                        const device = deviceRegistry.get(deviceId);
                        if (device) {
                            const resetDevice: DeviceInfo = {
                                ...device,
                                status: 'available' as const  // Explicitly type as 'available'
                            };
                            deviceRegistry.set(deviceId, resetDevice);
                            console.log('Device status reset to available:', device.serial);
                        }
                    }
                }
            } catch (error) {
                console.error('Error during cleanup:', error);
            }
        });

        ws.on('message', async (data: Iterable<number>) => {
            try {
                const uint8Data = new Uint8Array(data instanceof Buffer ? data : data);
                await writer.write(uint8Data);
            } catch (error) {
                console.error('Error writing to socket:', error);
                ws.close();
            }
        });

        ws.on('error', () => {
            writer.releaseLock();
            adbSocket.close();
        });

        adbSocket.readable
            .pipeTo(new WritableStream({
                write(chunk) {
                    if (ws.readyState === ws.OPEN) {
                        ws.send(chunk.buffer, {binary: true});
                    }
                },
                close() {
                    ws.close();
                },
                abort(reason) {
                    console.error('Stream aborted:', reason);
                    ws.close();
                }
            }))
            .catch(error => {
                console.error('Stream pipeline error:', error);
                ws.close();
            });

    } catch (error: unknown) {
        const device = deviceRegistry.get(deviceId);
        if (device) {
            const resetDevice: DeviceInfo = {
                ...device,
                status: 'available' as const  // Explicitly type as 'available'
            };
            deviceRegistry.set(deviceId, resetDevice);
            console.log('Device status reset due to error:', device.serial);
        }
        console.error(`Failed to handle WebSocket connection: ${(error as Error)?.message ?? 'Unknown error'}`);
        ws.close();
    }
}

app.get('/test', (req, res) => {
    res.send('Server is running on port 3000');
});

app.post('/connected', async (req, res): Promise<any> => {
    const { clientId, serial } = req.body;

    if (!clientId || !serial) {
        return res.status(400).json({ error: 'Client ID and device serial are required' });
    }

    const device = deviceRegistry.get(serial);
    if (!device) {
        return res.status(404).json({ error: 'Device not found' });
    }

    device.status = 'busy';
    deviceClientMap.set(serial, new Set([clientId]));
    console.log('Device Connected:', device.serial, '/n Client ID:', clientId);


    res.json({ status: 'success', message: 'Device marked as busy' });
});

app.post('/disconnected', async (req, res): Promise<any> => {
    const { clientId, serial } = req.body;

    if (!clientId || !serial) {
        return res.status(400).json({ error: 'Client ID and device serial are required' });
    }

    const device = deviceRegistry.get(serial);
    if (!device) {
        return res.status(404).json({ error: 'Device not found' });
    }

    device.status = 'available';
    deviceClientMap.delete(serial);
    console.log('Device Disconnected:', device.serial);

    res.json({ status: 'success', message: 'Device marked as available' });
});

app.post('/reset', async (req, res): Promise<any> => {
    const { serial } = req.body;

    if (!serial) {
        return res.status(400).json({ error: 'Device serial is required' });
    }

    const device = deviceRegistry.get(serial);
    if (!device) {
        return res.status(404).json({ error: 'Device not found' });
    }

    // Reset device status
    device.status = 'available';
    
    // Remove from client map
    deviceClientMap.delete(serial);

    console.log('Device Reset:', device.serial);

    res.json({ status: 'success', message: 'Device reset successfully' });
});

server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});