"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Search, Map as MapIcon, Plus, Filter } from "lucide-react";

const mockParks = [
	{
		id: 1,
		name: "Alpha Gateway",
		location: "North District",
		status: "active",
		occupancy: "85%",
		devices: 12,
	},
	{
		id: 2,
		name: "Beta Sector",
		location: "South District",
		status: "maintenance",
		occupancy: "42%",
		devices: 8,
	},
	{
		id: 3,
		name: "Gamma Hub",
		location: "East District",
		status: "active",
		occupancy: "91%",
		devices: 15,
	},
	{
		id: 4,
		name: "Delta Point",
		location: "West District",
		status: "offline",
		occupancy: "---",
		devices: 5,
	},
];

export default function ParksPage() {
	const role = useSelector((state: RootState) => state.auth.role);

	// POC only sees simplified subset
	const displayParks = role === "POC" ? mockParks.slice(0, 2) : mockParks;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Park Management</h1>
					<p className="text-zinc-500 dark:text-zinc-400">
						{role === "POC"
							? "Manage your assigned parking facilities."
							: "Manage all parking facilities across the network."}
					</p>
				</div>
				{(role === "ADMIN" || role === "SUPER_ADMIN") && (
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Add New Park
					</Button>
				)}
			</div>

			<div className="flex items-center gap-4 py-4">
				<div className="relative flex-1 md:max-w-md">
					<Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
					<input
						placeholder="Search parks..."
						className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 pl-9"
					/>
				</div>
				<Button variant="outline" className="hidden sm:flex">
					<Filter className="mr-2 h-4 w-4" />
					Filters
				</Button>
			</div>

			<div className="grid gap-6 md:grid-cols-3">
				<div className="md:col-span-2 grid gap-4 grid-cols-1 sm:grid-cols-2">
					{displayParks.map((park) => (
						<Card
							key={park.id}
							className="hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-colors"
						>
							<CardHeader className="pb-2">
								<div className="flex items-center justify-between">
									<CardTitle className="text-lg">{park.name}</CardTitle>
									<Badge
										variant={
											park.status === "active"
												? "success"
												: park.status === "maintenance"
													? "warning"
													: "destructive"
										}
									>
										{park.status}
									</Badge>
								</div>
								<div className="text-sm text-zinc-500 flex items-center gap-1 mt-1">
									<MapIcon className="h-3 w-3" />
									{park.location}
								</div>
							</CardHeader>
							<CardContent>
								<div className="flex justify-between items-center text-sm">
									<span className="text-zinc-500">Occupancy:</span>
									<span className="font-medium">{park.occupancy}</span>
								</div>
								<div className="flex justify-between items-center text-sm mt-1">
									<span className="text-zinc-500">Active Devices:</span>
									<span className="font-medium">{park.devices}</span>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Map Preview Panel */}
				<div className="hidden md:block">
					<Card className="h-full min-h-[400px] flex flex-col">
						<CardHeader>
							<CardTitle>Map Preview</CardTitle>
						</CardHeader>
						<CardContent className="flex-1 flex flex-col">
							<div className="flex-1 rounded-md bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
								<div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=40.714728,-73.998672&zoom=12&size=400x400&sensor=false')] bg-cover opacity-20 grayscale" />
								<div className="flex flex-col items-center gap-2 relative z-10 text-zinc-500 dark:text-zinc-400">
									<MapIcon className="h-8 w-8 text-blue-500" />
									<span className="text-sm font-medium">
										Select a park to view
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
