import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Smartphone, RefreshCw } from "lucide-react";
import { useState } from "react";
import { DeviceProps } from "../app/page";
import { useRouter } from "next/navigation";
import {config} from "config";



const PORT = config.TANGO_BACKEND_MANAGER_PORT;
// Add this helper function before the DeviceCard component
const formatModelName = (model: string) => {
    return model.replace(/_/g, ' ');
};

export default function DeviceCard({
    transport_id,
    serial,
    product,
    model,
    type,
    port,
    ip_address,
    wsUrl,
    status,
    refreshButtonRef,
}: DeviceProps) {
    const [deviceWsUrl, setDeviceWsUrl] = useState<string | null>(wsUrl);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleStartServer = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:${PORT}/connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ serial }),
            });
            const data = await response.json();
            setDeviceWsUrl(data.wsUrl);
        } catch (error) {
            console.error('Error starting server:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnect = () => {
        // const baseUrl = 'https://dev-rvk.github.io/adm-emulator/';
        const baseUrl = 'http://localhost:5051/'
        const params = new URLSearchParams({
            type: type,
            wsUrl: deviceWsUrl || '',
            serial: serial,
        });
        console.log('Opening new window with URL:', `${baseUrl}?${params.toString()}`);
        window.open(`${baseUrl}?${params.toString()}`, '_blank');

        // Simulate clicking the refresh button
        setTimeout(() => {
            if (refreshButtonRef?.current) {
                refreshButtonRef.current.click();
            }
        }, 1000);
    };

    const handleReset = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:${PORT}/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ serial }),
            });
            
            if (response.ok) {
                // setDeviceWsUrl(null);
                // Refresh the device list
                if (refreshButtonRef?.current) {
                    refreshButtonRef.current.click();
                }
            }
        } catch (error) {
            console.error('Error resetting device:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Card className="w-full max-w-[350px] flex flex-col justify-between bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-colors">
                <CardHeader className="pb-2">
                    <div className="flex justify-center mb-4">
                        <Smartphone className="h-16 w-16 text-slate-700 dark:text-slate-300" />
                    </div>
                    <CardTitle className="text-center text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {formatModelName(model)}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Product
                        </div>
                        <div className="text-sm text-right text-slate-900 dark:text-slate-100">{product}</div>
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Serial
                        </div>
                        <div className="text-sm text-right text-slate-900 dark:text-slate-100">{serial}</div>
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Type
                        </div>
                        <div className="text-sm text-right text-slate-900 dark:text-slate-100">{type}</div>
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            IP Address
                        </div>
                        <div className="text-sm text-right text-slate-900 dark:text-slate-100">{ip_address || 'N/A'}</div>
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Port
                        </div>
                        <div className="text-sm text-right text-slate-900 dark:text-slate-100">{port || 'N/A'}</div>
                        {(type === 'emulator' || type === 'WIFI') && (
                            <>
                                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    WS URL
                                </div>
                                <div className="text-sm text-right text-slate-900 dark:text-slate-100">{deviceWsUrl || 'N/A'}</div>
                            </>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-2">
                    {status === 'busy' && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleReset}
                            disabled={isLoading}
                            title="Reset device"
                            className="hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    )}
                    
                    <div className="flex gap-2">
                        {(type === 'emulator' || type === 'WIFI') && (
                            <Button
                                disabled={isLoading || deviceWsUrl !== null}
                                onClick={handleStartServer}
                                className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900"
                            >
                                {isLoading ? "Starting..." : "Start Server"}
                            </Button>
                        )}
                        <Button
                            disabled={
                                status === 'busy' || 
                                isLoading || 
                                ((type === 'emulator' || type === 'WIFI') && !deviceWsUrl)
                            }
                            onClick={handleConnect}
                            className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900"
                        >
                            {isLoading ? "Connecting..." : "Connect"}
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </>
    );
}