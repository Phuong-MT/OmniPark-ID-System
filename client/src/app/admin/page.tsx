"use client";

import * as React from "react";
import { useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Shield, Lock, Search, MoreHorizontal, Loader2 } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { TenantManagement } from "./TenantManagement";
import { InviteUserModal } from "./InviteUserModal";
import { fetchUsersList } from "@/redux/features/adminUsersThunks";
import { setFilters } from "@/redux/features/adminUsersSlice";
import api from "@/utils/api/axios";

export default function AdminPage() {
	const dispatch = useDispatch<AppDispatch>();
	const { role: currentUserRole } = useSelector((state: RootState) => state.user);
	const { users, hasMore, loading, page, filters } = useSelector((state: RootState) => state.adminUsers);

	const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);
	const [tenants, setTenants] = React.useState<{ _id: string, name: string, tenantCode: string }[]>([]);
	const [searchTerm, setSearchTerm] = React.useState("");
	const loaderRef = useRef<HTMLDivElement>(null);

	// Debounce search input
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			dispatch(setFilters({ search: searchTerm }));
		}, 500);
		return () => clearTimeout(timeoutId);
	}, [searchTerm, dispatch]);

	// Fetch tenants for super_admin filter dropdown
	useEffect(() => {
		if (currentUserRole === "SUPER_ADMIN") {
			api.get("/tenant")
				.then(res => setTenants(res.data))
				.catch(err => console.error("Failed to load tenants", err));
		}
	}, [currentUserRole]);

	// Initial fetch
	useEffect(() => {
		dispatch(fetchUsersList({ page: 1, limit: 10, ...filters }));
	}, [dispatch, filters]);

	// Intersection Observer for Infinite Scroll
	useEffect(() => {
		const observer = new IntersectionObserver((entries) => {
			const target = entries[0];
			if (target.isIntersecting && hasMore && !loading) {
				dispatch(fetchUsersList({ page: page + 1, limit: 10, ...filters }));
			}
		}, {
			root: null,
			rootMargin: "20px",
			threshold: 1.0
		});

		if (loaderRef.current) {
			observer.observe(loaderRef.current);
		}

		return () => {
			if (loaderRef.current) observer.unobserve(loaderRef.current);
		};
	}, [hasMore, loading, page, filters, dispatch]);

	const handleRoleFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
		dispatch(setFilters({ role: e.target.value || undefined }));
	};

	const handleTenantFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
		dispatch(setFilters({ tenantCode: e.target.value || undefined }));
	};

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
				<Button onClick={() => setIsInviteModalOpen(true)}>
					<Users className="mr-2 h-4 w-4" />
					Invite User
				</Button>
			</div>

			<div className="grid gap-6">
				{currentUserRole === "SUPER_ADMIN" && <TenantManagement />}

				<Card>
					<CardHeader className="py-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
						<div className="space-y-1">
							<CardTitle>User Management</CardTitle>
							<CardDescription>Control who has access to the system.</CardDescription>
						</div>
						<div className="flex flex-col sm:flex-row gap-3">
							<select
								className="h-9 rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:focus-visible:ring-zinc-300"
								onChange={handleRoleFilter}
								defaultValue=""
							>
								<option value="">All Roles</option>
								<option value="SUPER_ADMIN">Super Admin</option>
								<option value="ADMIN">Admin</option>
								<option value="USER">User</option>
								<option value="POC">POC</option>
							</select>

							{currentUserRole === "SUPER_ADMIN" && (
								<select
									className="h-9 rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:focus-visible:ring-zinc-300"
									onChange={handleTenantFilter}
									defaultValue=""
								>
									<option value="">All Tenants</option>
									{tenants.map(t => (
										<option key={t._id} value={t._id}>{t.name}</option>
									))}
								</select>
							)}

							<div className="relative w-full sm:w-64">
								<Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
								<input
									placeholder="Search users..."
									className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 pl-9"
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead className="[&_tr]:border-b border-zinc-200 dark:border-zinc-800">
									<tr className="border-b transition-colors bg-muted/20">
										<th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">
											Name
										</th>
										<th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">
											Tenant
										</th>
										<th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">
											Role
										</th>
										<th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">
											Status
										</th>
										<th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">
											Created
										</th>
										<th className="h-12 px-4 text-center align-middle font-medium text-zinc-500 w-[50px]"></th>
									</tr>
								</thead>
								<tbody className="[&_tr:last-child]:border-0">
									{users.map((user, idx) => (
										<tr
											key={user.id + idx.toString()}
											className="border-b border-zinc-100 dark:border-zinc-800"
										>
											<td className="p-4 align-middle">
												<div className="font-medium">{user.name || "N/A"}</div>
												<div className="text-xs text-zinc-500">
													{user.email}
												</div>
											</td>
											<td className="p-4 align-middle">
												<div className="font-medium">{user.tenant?.name || "N/A"}</div>
											</td>
											<td className="p-4 align-middle">
												<Badge
													variant={
														user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? "default" : "secondary"
													}
												>
													{user.role}
												</Badge>
											</td>
											<td className="p-4 align-middle">
												<div className="flex items-center gap-2 text-zinc-500">
													<span
														className={`h-2 w-2 rounded-full ${user.status === "ACTIVE" ? "bg-green-500" : "bg-red-500"}`}
													/>
													{user.status || "UNKNOWN"}
												</div>
											</td>
											<td className="p-4 align-middle text-zinc-500">
												{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
											</td>
											<td className="p-4 align-middle text-center">
												<Button variant="ghost" size="icon">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
							{users.length === 0 && !loading && (
								<div className="p-8 text-center text-zinc-500">No users found.</div>
							)}
							<div ref={loaderRef} className="h-10 flex items-center justify-center m-2">
								{loading && <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />}
							</div>
						</div>
					</CardContent>
				</Card>

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

			<InviteUserModal
				isOpen={isInviteModalOpen}
				onClose={() => setIsInviteModalOpen(false)}
				currentUserRole={currentUserRole}
			/>
		</div>
	);
}
