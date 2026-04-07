"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Power, RefreshCw } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { setFilters } from "@/redux/features/adminDevicesSlice";
import { fetchDevicesList } from "@/redux/features/adminDevicesThunks";

export function DeviceManagement({ currentUserRole }: { currentUserRole: string }) {
	const dispatch = useDispatch<AppDispatch>();
	const tenants = useSelector((state: RootState) => state.tenant.tenants);

	const { devices, page, hasMore, loading, filters } = useSelector(
		(state: RootState) => state.adminDevices
	);

	const [searchTerm, setSearchTerm] = useState(filters.search || "");
	const loaderRef = useRef<HTMLDivElement>(null);

	// Debounce search input
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			dispatch(setFilters({ search: searchTerm }));
		}, 500);
		return () => clearTimeout(timeoutId);
	}, [searchTerm, dispatch]);

	// Fetch devices whenever filters or page changes based on initial load
	useEffect(() => {
		const promise = dispatch(fetchDevicesList({ page: 1, limit: 10, ...filters }));
		return () => promise.abort();
	}, [dispatch, filters]);

	// Intersection Observer for Infinite Scroll
	useEffect(() => {
		let promise: any = null;
		const observer = new IntersectionObserver(
			(entries) => {
				const target = entries[0];
				if (target.isIntersecting && !loading && hasMore && devices.length > 0) {
					promise = dispatch(fetchDevicesList({ page: page + 1, limit: 10, ...filters }));
				}
			},
			{ root: null, rootMargin: "20px", threshold: 1.0 }
		);

		if (loaderRef.current) observer.observe(loaderRef.current);
		return () => {
			if (loaderRef.current) observer.unobserve(loaderRef.current);
			if (promise) promise.abort();
		};
	}, [loading, hasMore, devices.length, page, filters, dispatch]);

	const handleTypeFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
		dispatch(setFilters({ type: e.target.value || undefined }));
	};

	const handleTenantFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
		dispatch(setFilters({ tenantCode: e.target.value || undefined }));
	};

	return (
		<Card>
			<CardHeader className="py-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
				<div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
					<select
						className="h-9 rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:focus-visible:ring-zinc-300"
						onChange={handleTypeFilter}
						value={filters.type || ""}
					>
						<option value="">All Types</option>
						<option value="Gateway">Gateway</option>
						<option value="Sensor">Sensor</option>
						<option value="Camera">Camera</option>
						<option value="Terminal">Terminal</option>
					</select>

					{currentUserRole === "SUPER_ADMIN" && (
						<select
							className="h-9 rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:focus-visible:ring-zinc-300"
							onChange={handleTenantFilter}
							value={filters.tenantCode || ""}
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
							placeholder="Search devices by Name or MAC..."
							className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 pl-9"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
				</div>
                <div className="flex items-center gap-2">
					<Button variant="outline" onClick={() => {
						dispatch(setFilters({})); 
						dispatch(fetchDevicesList({ page: 1, limit: 10 }));
						setSearchTerm("");
					}}>
						<RefreshCw className="mr-2 h-4 w-4" />
						Sync All
					</Button>
				</div>
			</CardHeader>

			<CardContent className="p-0">
				<div className="relative w-full overflow-auto">
					<table className="w-full caption-bottom text-sm">
						<thead className="[&_tr]:border-b border-zinc-200 dark:border-zinc-800">
							<tr className="border-b transition-colors bg-muted/20 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50">
								<th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">
									Device
								</th>
								<th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">
									Type
								</th>
								<th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">
									Status
								</th>
								<th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">
									Pairing
								</th>
								<th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">
									Firmware
								</th>
								<th className="h-12 px-4 text-right align-middle font-medium text-zinc-500">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="[&_tr:last-child]:border-0">
							{devices.map((device: any, idx: number) => (
								<tr
									key={device._id || device.deviceId || device.macAddress + idx.toString()}
									className="border-b border-zinc-100 dark:border-zinc-800 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/20"
								>
									<td className="p-4 align-middle">
										<div className="font-medium text-zinc-900 dark:text-zinc-100">
											{device.deviceName}
										</div>
										<div className="text-xs text-zinc-500">{device.macAddress}</div>
									</td>
									<td className="p-4 align-middle text-zinc-500">
										{device.type}
									</td>
									<td className="p-4 align-middle">
										<div className="flex items-center gap-2">
											<span
												className={`flex h-2 w-2 rounded-full ${device.status === "ACTIVE" ? "bg-green-500" : device.status === "INACTIVE" ? "bg-yellow-500" : "bg-red-500"}`}
											/>
											<span className="capitalize text-zinc-700 dark:text-zinc-300">
												{device.status?.toLowerCase()}
											</span>
										</div>
									</td>
									<td className="p-4 align-middle">
										<Badge
											variant={device.pairState === "PAIRED" ? "secondary" : (device.pairState === "PAIRING" ? "warning" : "destructive")}
										>
											{device.pairState || "PENDING"}
										</Badge>
									</td>
									<td className="p-4 align-middle text-zinc-500 font-mono text-xs">
										{device.firmwareVersion || "N/A"}
									</td>
									<td className="p-4 align-middle text-right">
										<Button
											variant="ghost"
											size="sm"
											className="h-8 w-8 px-0"
										>
											<Power className="h-4 w-4 text-zinc-500" />
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
                    {devices.length === 0 && !loading && (
						<div className="p-8 text-center text-zinc-500">No devices found.</div>
					)}
					<div ref={loaderRef} className="h-10 flex items-center justify-center m-2">
						{loading && <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
