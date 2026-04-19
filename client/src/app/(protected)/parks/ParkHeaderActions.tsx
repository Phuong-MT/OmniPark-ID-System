"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus } from "lucide-react";
import { AssignPocModal } from "./AssignPocModal";
import { NewParkModal } from "./NewParkModal";

export function ParkHeaderActions({ currentUserRole }: { currentUserRole: string }) {
	const [isAssignModalOpen, setIsAssignModalOpen] = React.useState(false);
	const [isNewParkModalOpen, setIsNewParkModalOpen] = React.useState(false);

	const showAdminActions = currentUserRole === "ADMIN" || currentUserRole === "SUPER_ADMIN";

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
			{showAdminActions && (
				<div className="flex items-center gap-2">
					<Button variant="outline" onClick={() => setIsAssignModalOpen(true)}>
						<UserPlus className="mr-2 h-4 w-4" />
						Assign POC
					</Button>
					<Button onClick={() => setIsNewParkModalOpen(true)}>
						<Plus className="mr-2 h-4 w-4" />
						Add New Park
					</Button>
				</div>
			)}

			<AssignPocModal
				isOpen={isAssignModalOpen}
				onClose={() => setIsAssignModalOpen(false)}
			/>
			<NewParkModal
				isOpen={isNewParkModalOpen}
				onClose={() => setIsNewParkModalOpen(false)}
			/>
		</div>
	);
}
