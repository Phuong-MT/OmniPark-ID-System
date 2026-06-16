"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu, MapPin, Activity, CheckCircle2 } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { fetchParkCount } from "@/redux/features/adminParksThunks";

export function DashboardHeaderSection() {
    const dispatch = useDispatch<AppDispatch>();
    const {total, totalDevices} = useSelector((state: RootState)=> state.adminParks)
    // fetch parks
    React.useEffect(()=>{
    	const promise = dispatch(fetchParkCount());

		return ()=>{
			promise.abort();
		}
    },[])

	return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Parks</CardTitle>
                        <MapPin className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{total}</div>
                        <p className="text-xs text-zinc-500 mt-1">Active locations</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
                        <Cpu className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalDevices}</div>
                        <p className="text-xs text-zinc-500 mt-1">Online and functioning</p>
                    </CardContent>
                </Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Current Occupancy</CardTitle>
						<Activity className="h-4 w-4 text-zinc-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">84%</div>
						<p className="text-xs text-green-500 font-medium flex items-center gap-1 mt-1">
							+2% from last hour
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">System Health</CardTitle>
						<CheckCircle2 className="h-4 w-4 text-green-500" />
					</CardHeader>
					<CardContent>
						<div className="text-xl font-bold text-green-500">Operational</div>
						<p className="text-xs text-zinc-500 mt-1">All systems nominal</p>
					</CardContent>
				</Card>
			</div>
	);
}