"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Camera, Cpu } from "lucide-react";
import { CameraManagement } from "./CameraManagement";
import { DeviceManagement } from "./DeviceManagement";

export function DevicesWorkspace({ currentUserRole }: { currentUserRole: string }) {
	const [view, setView] = React.useState<"devices" | "cameras">("devices");

	return (
		<div className="flex flex-col gap-4">
			<div className="flex w-fit rounded-md border border-zinc-200 p-1 dark:border-zinc-800">
				<Button
					type="button"
					variant={view === "devices" ? "secondary" : "ghost"}
					size="sm"
					onClick={() => setView("devices")}
				>
					<Cpu className="mr-2 h-4 w-4" />
					Devices
				</Button>
				<Button
					type="button"
					variant={view === "cameras" ? "secondary" : "ghost"}
					size="sm"
					onClick={() => setView("cameras")}
				>
					<Camera className="mr-2 h-4 w-4" />
					Cameras
				</Button>
			</div>

			{view === "devices" ? (
				<DeviceManagement currentUserRole={currentUserRole} />
			) : (
				<CameraManagement currentUserRole={currentUserRole} />
			)}
		</div>
	);
}
