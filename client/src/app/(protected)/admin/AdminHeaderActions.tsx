"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { InviteUserModal } from "./InviteUserModal";

export function AdminHeaderActions({ currentUserRole }: { currentUserRole: string }) {
	const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);

	if (!["SUPER_ADMIN", "ADMIN"].includes(currentUserRole)) return null;

	return (
		<>
			<Button onClick={() => setIsInviteModalOpen(true)}>
				<Users className="mr-2 h-4 w-4" />
				Invite User
			</Button>

			<InviteUserModal
				isOpen={isInviteModalOpen}
				onClose={() => setIsInviteModalOpen(false)}
				currentUserRole={currentUserRole}
			/>
		</>
	);
}
