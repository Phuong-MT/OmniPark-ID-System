"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Map as MapIcon, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { fetchParksList } from "@/redux/features/adminParksThunks";
import { setFilters } from "@/redux/features/adminParksSlice";

export function ParkManagement({ currentUserRole }: { currentUserRole: string }) {
	const dispatch = useDispatch<AppDispatch>();
	const { parks, hasMore, loading, page, filters } = useSelector(
		(state: RootState) => state.adminParks,
	);
	const tenants = useSelector((state: RootState) => state.tenant.tenants);

	const [searchTerm, setSearchTerm] = React.useState("");
	const loaderRef = useRef<HTMLDivElement>(null);
	const [selectedPark, setSelectedPark] = React.useState<string | null>(null);

	// Debounce search input
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			dispatch(setFilters({ search: searchTerm }));
		}, 500);
		return () => clearTimeout(timeoutId);
	}, [searchTerm, dispatch]);

	// Initial fetch
	useEffect(() => {
		const promise = dispatch(fetchParksList({ page: 1, limit: 10, ...filters }));
		return () => promise.abort();
	}, [dispatch, filters]);

	// Intersection Observer for Infinite Scroll
	useEffect(() => {
		let promise: any = null;
		const observer = new IntersectionObserver(
			(entries) => {
				const target = entries[0];
				if (target.isIntersecting && hasMore && !loading && parks.length > 0) {
					promise = dispatch(fetchParksList({ page: page + 1, limit: 10, ...filters }));
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
	}, [hasMore, loading, page, filters, parks.length, dispatch]);

	const handleTenantFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
		dispatch(setFilters({ tenantCode: e.target.value || undefined }));
	};

	const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
		dispatch(setFilters({ status: e.target.value || undefined }));
	};

	return (
		<>
			<div className="flex flex-col sm:flex-row items-center gap-4 py-4">
				<div className="relative flex-1 md:max-w-md w-full">
					<Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
					<input
						placeholder="Search parks..."
						className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 pl-9"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
				<div className="flex gap-2 w-full sm:w-auto">
					<select
						className="h-9 w-full sm:w-auto rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:focus-visible:ring-zinc-300"
						onChange={handleStatusFilter}
						defaultValue=""
					>
						<option value="">All Statuses</option>
						<option value="active">Active</option>
						<option value="inactive">Inactive</option>
					</select>

					{currentUserRole === "SUPER_ADMIN" && (
						<select
							className="h-9 w-full sm:w-auto rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:focus-visible:ring-zinc-300"
							onChange={handleTenantFilter}
							defaultValue=""
						>
							<option value="">All Tenants</option>
							{tenants.map((t: any) => (
								<option key={t._id} value={t._id}>
									{t.name}
								</option>
							))}
						</select>
					)}
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-3">
				<div className="md:col-span-2 flex flex-col gap-4">
					<div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
						{parks.map((park) => (
							<Card
								key={park._id}
								className={`cursor-pointer transition-colors ${selectedPark === park._id ? "border-blue-500 dark:border-blue-500 ring-1 ring-blue-500" : "hover:border-blue-300 dark:hover:border-blue-700"}`}
								onClick={() => setSelectedPark(park._id!)}
							>
								<CardHeader className="pb-2">
									<div className="flex items-center justify-between gap-2">
										<CardTitle className="text-lg truncate" title={park.name}>
											{park.name}
										</CardTitle>
										<Badge
											variant={
												park.status === "active" ? "success" : "secondary"
											}
										>
											{park.status}
										</Badge>
									</div>
									<div className="text-sm text-zinc-500 flex flex-col gap-1 mt-1">
										<span className="flex items-center gap-1">
											<MapIcon className="h-3 w-3" />
											{park.description || "No description"}
										</span>
										{currentUserRole === "SUPER_ADMIN" && (
											<span className="text-xs break-all">
												Tenant: {park.tenantCode || "N/A"}
											</span>
										)}
									</div>
								</CardHeader>
								<CardContent>
									<div className="flex justify-between items-center text-sm">
										<span className="text-zinc-500">Total Devices:</span>
										<span className="font-medium">
											{park.stats?.totalDevices || 0}
										</span>
									</div>
									<div className="flex justify-between items-center text-sm mt-1">
										<span className="text-zinc-500">Online Devices:</span>
										<span className="font-medium text-green-600 dark:text-green-400">
											{park.stats?.onlineDevices || 0}
										</span>
									</div>
									<div className="flex justify-between items-center text-sm mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
										<Link
											href={`/parks/${park._id}`}
											className="text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
											onClick={(e) => e.stopPropagation()}
										>
											View Details <ArrowRight className="h-3 w-3" />
										</Link>
									</div>
								</CardContent>
							</Card>
						))}
					</div>

					{parks.length === 0 && !loading && (
						<div className="p-8 text-center text-zinc-500 border border-dashed rounded-lg border-zinc-200 dark:border-zinc-800">
							No parks found.
						</div>
					)}
					<div ref={loaderRef} className="h-10 flex items-center justify-center m-2">
						{loading && <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />}
					</div>
				</div>

				{/* Map Preview Panel */}
				<div className="hidden md:block">
					<Card className="h-full min-h-[400px] flex flex-col sticky top-6">
						<CardHeader>
							<CardTitle>Map Preview</CardTitle>
						</CardHeader>
						<CardContent className="flex-1 flex flex-col">
							<div className="flex-1 rounded-md bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
								<div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=40.714728,-73.998672&zoom=12&size=400x400&sensor=false')] bg-cover opacity-20 grayscale" />
								<div className="flex flex-col items-center gap-2 relative z-10 text-zinc-500 dark:text-zinc-400">
									<MapIcon
										className={`h-8 w-8 ${selectedPark ? "text-blue-500" : "text-zinc-400"}`}
									/>
									<span className="text-sm font-medium text-center px-4">
										{selectedPark
											? `Showing view for ${parks.find((p) => p._id === selectedPark)?.name}`
											: "Select a park to view its map layout"}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);
}
