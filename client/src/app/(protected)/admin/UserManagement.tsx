"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MoreHorizontal, Loader2 } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { fetchUsersList } from "@/redux/features/adminUsersThunks";
import { setFilters } from "@/redux/features/adminUsersSlice";

export function UserManagement({ currentUserRole }: { currentUserRole: string }) {
	const dispatch = useDispatch<AppDispatch>();
	const { users, hasMore, loading, page, filters } = useSelector(
		(state: RootState) => state.adminUsers,
	);

	const [tenants, setTenants] = React.useState<
		{ _id: string; name: string; tenantCode: string }[]
	>([]);
	const [searchTerm, setSearchTerm] = React.useState("");
	const loaderRef = useRef<HTMLDivElement>(null);

	// Debounce search input
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			dispatch(setFilters({ search: searchTerm }));
		}, 500);
		return () => clearTimeout(timeoutId);
	}, [searchTerm, dispatch]);

	// Initial fetch
	useEffect(() => {
		const promise = dispatch(fetchUsersList({ page: 1, limit: 10, ...filters }));
		return () => promise.abort();
	}, [dispatch, filters]);

	// Intersection Observer for Infinite Scroll
	useEffect(() => {
		let promise: any = null;
		const observer = new IntersectionObserver(
			(entries) => {
				const target = entries[0];
				if (target.isIntersecting && hasMore && !loading && users.length > 0) {
					promise = dispatch(fetchUsersList({ page: page + 1, limit: 10, ...filters }));
				}
			},
			{
				root: null,
				rootMargin: "20px",
				threshold: 1.0,
			},
		);

		if (loaderRef.current) {
			observer.observe(loaderRef.current);
		}

		return () => {
			if (loaderRef.current) observer.unobserve(loaderRef.current);
			if (promise) promise.abort();
		};
	}, [hasMore, loading, page, filters, users.length, dispatch]);

	const handleRoleFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
		dispatch(setFilters({ role: e.target.value || undefined }));
	};

	const handleTenantFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
		dispatch(setFilters({ tenantCode: e.target.value || undefined }));
	};

	return (
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
							{tenants.map((t) => (
								<option key={t._id} value={t._id}>
									{t.name}
								</option>
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
										<div className="text-xs text-zinc-500">{user.email}</div>
									</td>
									<td className="p-4 align-middle">
										<div className="font-medium">
											{user.tenant?.name || "N/A"}
										</div>
									</td>
									<td className="p-4 align-middle">
										<Badge
											variant={
												user.role === "ADMIN" || user.role === "SUPER_ADMIN"
													? "default"
													: "secondary"
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
										{user.createdAt
											? new Date(user.createdAt).toLocaleDateString()
											: "N/A"}
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
	);
}
