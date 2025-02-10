import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone } from "lucide-react";
import { useState } from "react";
import { DeviceProps } from "@/app/page";
import { useRouter } from "next/navigation";

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
            const response = await fetch('http://localhost:3003/connect', {
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

    return (
        <>
            <Card className="w-full max-w-[350px] flex flex-col justify-between">
                <CardHeader className="pb-2">
                    <div className="flex justify-center mb-4">
                        <Smartphone className="h-16 w-16 text-primary" />
                    </div>
                    <CardTitle className="text-center text-2xl font-bold">
                        {formatModelName(model)}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="text-sm font-medium text-muted-foreground">
                            Product
                        </div>
                        <div className="text-sm text-right">{product}</div>
                        <div className="text-sm font-medium text-muted-foreground">
                            Serial
                        </div>
                        <div className="text-sm text-right">{serial}</div>
                        <div className="text-sm font-medium text-muted-foreground">
                            Type
                        </div>
                        <div className="text-sm text-right">{type}</div>
                        <div className="text-sm font-medium text-muted-foreground">
                            IP Address
                        </div>
                        <div className="text-sm text-right">{ip_address || 'N/A'}</div>
                        <div className="text-sm font-medium text-muted-foreground">
                            Port
                        </div>
                        <div className="text-sm text-right">{port || 'N/A'}</div>
                        {(type === 'emulator' || type === 'WIFI') && (
                            <>
                                <div className="text-sm font-medium text-muted-foreground">
                                    WS URL
                                </div>
                                <div className="text-sm text-right">{deviceWsUrl || 'N/A'}</div>
                            </>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    {(type === 'emulator' || type === 'WIFI') && (
                        <Button
                            disabled={isLoading || deviceWsUrl !== null}
                            onClick={handleStartServer}
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
                    >
                        {isLoading ? "Connecting..." : "Connect"}
                    </Button>
                </CardFooter>
            </Card>
        </>
    );
}