"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import  DeviceCard from "../components/device-card";
import {config} from "config";


// import { AddDeviceForm } from '@/components/add-device-form'

const PORT = config.TANGO_BACKEND_MANAGER_PORT;
// Update this with your actual backend URL
const BACKEND_URL = `http://localhost:${PORT}`;
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
    const refreshButtonRef = useRef<HTMLButtonElement>(null); // Add this line

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
        <div className="container mx-auto p-4">
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
                <hr></hr>
            </div>
            {/* <AddDeviceForm onAddDevice={addDevice} /> */}

            {loading && <Loader2 className="mx-auto h-8 w-8 animate-spin" />}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mx-auto">
                {devices.map((device) => (
                    <DeviceCard
                        key={device.serial}
                        {...device}
                        refreshButtonRef={refreshButtonRef}
                    />
                ))}
            </div>
        </div>
    );
}