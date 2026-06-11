"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddDeviceModal } from "./AddDeviceModal";

export function AddParkDetailAction({ clusters }: { clusters: any[] }) {
	const [isDevicesModalOpen, setIsDevicesModalOpen] = React.useState(false);

	return (
		<>
			<div className="flex items-center gap-2">
				<Button
					onClick={() => setIsDevicesModalOpen(true)}
					className="flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700"
				>
					<Plus className="h-4 w-4" />
					Add device for park
				</Button>
				<Button
					onClick={() => {
						if (typeof window !== "undefined") {
							window.dispatchEvent(new CustomEvent("trigger-add-cluster"));
						}
					}}
					className="flex items-center gap-2"
					variant="outline"
				>
					<Plus className="h-4 w-4" />
					Add cluster
				</Button>
			</div>
			<AddDeviceModal
				isOpen={isDevicesModalOpen}
				onClose={() => setIsDevicesModalOpen(false)}
				clusters={clusters}
			/>
		</>
	);
}
