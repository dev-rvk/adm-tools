"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import DeviceCard from "../components/device-card";
import { NavBar } from "../components/nav-bar";
import { config } from "config";


// import { AddDeviceForm } from '@/components/add-device-form'


const PORT = config.TANGO_BACKEND_MANAGER_PORT;
const HOST = config.HOST;
// Update this with your actual backend URL
const BACKEND_URL = `http://${HOST}:${PORT}`;

// Local app url
// const ADM_BASE = 'http://localhost:5050'
// const ADM_BASE_GITHUB = "https://dev-rvk.github.io/adm-emulator";

export interface DeviceProps {
    transport_id: number;
    serial: string;
    product: string;
    model: string;
    type: 'emulator' | 'WIFI' | 'USB';
    port: number | null;
    ip_address: string;
    wsUrl: string | null;
    status: 'available' | 'busy' | null;
    refreshButtonRef?: React.RefObject<HTMLButtonElement>;
  }

export default function DeviceManagement() {
    const [devices, setDevices] = useState<DeviceProps[]>([]);
    const [loading, setLoading] = useState(false);
    const refreshButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        fetchDevices();
    }, []);

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${BACKEND_URL}/list`);
            const data = await response.json();
            console.log(data);
            setDevices(data);
        } catch (error) {
            console.error("Error fetching devices:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <NavBar />
            <main className="container mx-auto p-4">
                <div className="text-center mb-10 relative">
                    <h1 className="text-2xl font-bold mb-4">Device Management</h1>
                    <button
                        ref={refreshButtonRef}
                        onClick={fetchDevices}
                        className="absolute right-0 top-0 p-2 hover:bg-gray-100 rounded-full"
                        disabled={loading}
                    >
                        <RefreshCw
                            className={`h-6 w-6 ${loading ? "animate-spin" : ""}`}
                        />
                    </button>
                    <hr />
                </div>
                {loading && <Loader2 className="mx-auto h-8 w-8 animate-spin" />}

                {!Array.isArray(devices) || devices.length === 0 ? (
                    <div className="flex items-center justify-center h-[60vh]">
                        <div className="flex items-center space-x-4 bg-red-100 border border-red-400 text-red-700 px-8 py-4 rounded-lg shadow-md max-w-3xl">
                            <p className="text-lg font-semibold">
                                Unable to fetch devices.
                            </p>
                            <p className="text-sm">
                                Please ensure the Google ADB server is running and the device is connected to the server.
                            </p>
                            <Loader2 className="h-6 w-6 animate-spin text-red-500" />
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mx-auto">
                        {devices.map((device) => (
                            <DeviceCard
                                key={device.serial}
                                {...device}
                                refreshButtonRef={refreshButtonRef}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}