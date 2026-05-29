"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddDeviceModal } from "./AddDeviceModal";

export function AddDeviceAction({ clusters }: { clusters: any[] }) {
	const [isOpen, setIsOpen] = React.useState(false);

	return (
		<>
			<Button
				onClick={() => setIsOpen(true)}
				className="flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700"
			>
				<Plus className="h-4 w-4" />
				Add device for park
			</Button>
			<AddDeviceModal
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				clusters={clusters}
			/>
		</>
	);
}
