"use client";

import { ReduxHydrator } from "@/redux/provider";
import { Tenant } from "@/types/tenants";

export function AdminLayout({
	children,
	initialState,
}: {
	children: React.ReactNode;
	initialState: {
		tenant: {
			tenants: Tenant[];
			myTenant: Tenant | null;
			status: "loading" | "idle" | "succeeded" | "failed";
			error: string;
		};
	};
}) {
	return (
		<>
			<ReduxHydrator initialState={initialState} />
			{children}
		</>
	);
}
