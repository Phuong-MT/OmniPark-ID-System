"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function ParkHeaderActions({ currentUserRole }: { currentUserRole: string }) {
	return (
		<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Park Management</h1>
				<p className="text-zinc-500 dark:text-zinc-400">
					{currentUserRole === "POC"
						? "Manage your assigned parking facilities."
						: "Manage all parking facilities across the network."}
				</p>
			</div>
			{(currentUserRole === "ADMIN" || currentUserRole === "SUPER_ADMIN") && (
				<Button>
					<Plus className="mr-2 h-4 w-4" />
					Add New Park
				</Button>
			)}
		</div>
	);
}
