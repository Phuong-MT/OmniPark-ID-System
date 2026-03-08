'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, Power } from 'lucide-react';

const mockDevices = [
    { id: 'dev-001', name: 'Gate Controller A', type: 'Gateway', status: 'online', firmware: 'v2.1.0', paired: true },
    { id: 'dev-002', name: 'Entry Sensor 1', type: 'Sensor', status: 'online', firmware: 'v1.4.2', paired: true },
    { id: 'dev-003', name: 'Exit Sensor 1', type: 'Sensor', status: 'offline', firmware: 'v1.4.1', paired: true },
    { id: 'dev-004', name: 'Payment Kiosk', type: 'Terminal', status: 'pairing', firmware: 'v3.0.0', paired: false },
    { id: 'dev-005', name: 'LPR Camera', type: 'Camera', status: 'online', firmware: 'v2.2.1', paired: true },
];

export default function DevicesPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Device Infrastructure</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Monitor and manage interconnected Anti-Gravity devices.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Sync All
                    </Button>
                    <Button>Pair New Device</Button>
                </div>
            </div>

            <Card>
                <CardHeader className="py-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                            <input
                                placeholder="Search devices by ID or Name..."
                                className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 pl-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b border-zinc-200 dark:border-zinc-800">
                                <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">Device</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">Type</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">Status</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">Pairing</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">Firmware</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {mockDevices.map((device) => (
                                    <tr key={device.id} className="border-b border-zinc-100 dark:border-zinc-800 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/20">
                                        <td className="p-4 align-middle">
                                            <div className="font-medium text-zinc-900 dark:text-zinc-100">{device.name}</div>
                                            <div className="text-xs text-zinc-500">{device.id}</div>
                                        </td>
                                        <td className="p-4 align-middle text-zinc-500">{device.type}</td>
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-2">
                                                <span className={`flex h-2 w-2 rounded-full ${device.status === 'online' ? 'bg-green-500' : device.status === 'pairing' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} />
                                                <span className="capitalize text-zinc-700 dark:text-zinc-300">{device.status}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <Badge variant={device.paired ? 'secondary' : 'warning'}>
                                                {device.paired ? 'Paired' : 'Pending'}
                                            </Badge>
                                        </td>
                                        <td className="p-4 align-middle text-zinc-500 font-mono text-xs">{device.firmware}</td>
                                        <td className="p-4 align-middle text-right">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
                                                <Power className="h-4 w-4 text-zinc-500" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
