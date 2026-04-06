"use client";

import * as React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ReduxHydrator } from "@/redux/provider";
import { RootState } from "@/redux/store";

export function DashboardLayoutClient({ children, initialState }: { children: React.ReactNode, initialState: Partial<RootState> }) {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

	return (
		<>
			{/* Hydrate Redux Store with Server Fetched User Data */}
			<ReduxHydrator initialState={initialState} />
			<div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50">
				<Sidebar
					isMobileMenuOpen={isMobileMenuOpen}
					setIsMobileMenuOpen={setIsMobileMenuOpen}
				/>
				<div className="flex flex-1 flex-col overflow-hidden">
					<Header setIsMobileMenuOpen={setIsMobileMenuOpen} />
					<main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
				</div>
			</div>
		</>
	);
}