"use client";

import * as React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Role } from "@/redux/features/userSlice";

export function DashboardLayoutClient({
	children,
	currentUserRole,
}: {
	children: React.ReactNode;
	currentUserRole: Role;
}) {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

	return (
		<>
			{/* Hydrate Redux Store with Server Fetched User Data */}
			<div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50">
				<Sidebar
					role={currentUserRole}
					isMobileMenuOpen={isMobileMenuOpen}
					setIsMobileMenuOpen={setIsMobileMenuOpen}
				/>
				<div className="flex flex-1 flex-col overflow-hidden">
					<Header
						role={currentUserRole}
						setIsMobileMenuOpen={setIsMobileMenuOpen} />
					<main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
				</div>
			</div>
		</>
	);
}
