import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Lock } from "lucide-react";
import { TenantManagement } from "./TenantManagement";
import { UserManagement } from "./UserManagement";
import { AdminHeaderActions } from "./AdminHeaderActions";
import { axiosServer } from "@/utils/api/axiosServer";

export default async function AdminPage() {
	// Fetch user role on server side
	let currentUserRole = "USER";
	try {
		const res = await axiosServer.get<{ user: any; role: string }>("/user/me");
		currentUserRole = res.data.role;
	} catch (error) {
		console.error("Failed to fetch user profile in AdminPage", error);
		// Assuming redirection is handled by layout or middleware, we just default here
	}

	if (currentUserRole === "POC") {
		return (
			<div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
				<div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 dark:bg-red-900/30 dark:text-red-400">
					<Lock className="h-8 w-8" />
				</div>
				<h2 className="text-2xl font-bold tracking-tight mb-2">Access Denied</h2>
				<p className="text-zinc-500 max-w-sm">
					You do not have the required permissions to view this page. Contact an
					administrator.
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Admin Controls</h1>
					<p className="text-zinc-500 dark:text-zinc-400">
						Manage users, roles, and tenant configuration.
					</p>
				</div>
				<AdminHeaderActions currentUserRole={currentUserRole} />
			</div>

			<div className="grid gap-6">
				{currentUserRole === "SUPER_ADMIN" && <TenantManagement />}

				<UserManagement currentUserRole={currentUserRole} />

				<div className="grid md:grid-cols-2 gap-6">
					<Card>
						<CardHeader>
							<div className="flex items-center gap-2">
								<Shield className="h-5 w-5 text-blue-500" />
								<CardTitle>Role Permissions</CardTitle>
							</div>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-zinc-500 mb-4">
								Review and modify the capabilities assigned to each role.
							</p>
							<Button variant="outline" className="w-full">
								Edit Policy Definitions
							</Button>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<div className="flex items-center gap-2">
								<Lock className="h-5 w-5 text-zinc-500" />
								<CardTitle>Access Logs</CardTitle>
							</div>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-zinc-500 mb-4">
								View detailed audit logs of system access and permission changes.
							</p>
							<Button variant="outline" className="w-full">
								View Audit Trail
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
