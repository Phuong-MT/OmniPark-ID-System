'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu, MapPin } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

export function RoleBasedStats() {
    const role = useSelector((state: RootState) => state.auth.role);

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Parks</CardTitle>
                    <MapPin className="h-4 w-4 text-zinc-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{role === 'POC' ? '2' : '15'}</div>
                    <p className="text-xs text-zinc-500 mt-1">Active locations</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
                    <Cpu className="h-4 w-4 text-zinc-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{role === 'POC' ? '12' : '142'}</div>
                    <p className="text-xs text-zinc-500 mt-1">Online and functioning</p>
                </CardContent>
            </Card>
        </>
    );
}
