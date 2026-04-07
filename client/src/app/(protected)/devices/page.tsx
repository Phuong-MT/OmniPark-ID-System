import * as React from "react";
import { axiosServer } from "@/utils/api/axiosServer";
import { DeviceManagement } from "./DeviceManagement";

export default async function DevicesPage() {
	let currentUserRole = "USER";
	try {
		const res = await axiosServer.get("/user/me");
		currentUserRole = res.data.role;
	} catch (error) {
		console.error("Failed to fetch user in DevicesPage", error);
	}
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Device Infrastructure</h1>
					<p className="text-zinc-500 dark:text-zinc-400">
						Monitor and manage interconnected Anti-Gravity devices.
					</p>
				</div>
			</div>
			
			<DeviceManagement currentUserRole={currentUserRole} />
		</div>
	);
}
