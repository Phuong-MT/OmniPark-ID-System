import * as React from "react";
import { axiosServer } from "@/utils/api/axiosServer";
import Link from "next/link";
import { ArrowLeft, MapPin, Clock } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ parkId: string }> }) {
	const resolvedParams = await params;
	return {
		title: `Park Details | OmniPark ID`,
		description: "View details of the parking facility.",
	};
}

export default async function ParkDetailPage({ params }: { params: Promise<{ parkId: string }> }) {
	const resolvedParams = await params;
	let park = null;
	let error = null;
	try {
		const res = await axiosServer.get(`/parks/${resolvedParams.parkId}`);		
		park = res.data;
	} catch (err: any) {
		error = err.response?.data?.message || "Failed to load park details";
	}

	if (error || !park) {
		return (
			<div className="flex flex-col items-center justify-center py-12 gap-4">
				<p className="text-red-500 font-medium">{error || "Park not found"}</p>
				<Link
					href="/parks"
					className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-2"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Parks
				</Link>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
			<div className="flex items-center gap-4">
				<Link
					href="/parks"
					className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
				>
					<ArrowLeft className="h-5 w-5" />
				</Link>
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
						{park.name}
					</h1>
					<p className="text-sm text-zinc-500 dark:text-zinc-400">
						Park ID: {park._id}
					</p>
				</div>
			</div>

			<div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 p-6">
				<div className="grid gap-6 md:grid-cols-2">
					<div className="flex flex-col gap-2">
						<h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
							<MapPin className="h-4 w-4" />
							Description
						</h3>
						<p className="text-sm text-zinc-950 dark:text-zinc-50 whitespace-pre-wrap">
							{park.description || "No description provided."}
						</p>
					</div>

					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-2">
							<h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
								<Clock className="h-4 w-4" />
								Status
							</h3>
							<div className="flex items-center">
								<span
									className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
										park.status === "active"
											? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
											: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
									}`}
								>
									{park.status === "active" ? "Active" : "Inactive"}
								</span>
							</div>
						</div>
						<div className="flex flex-col gap-2">
							<h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
								Created At
							</h3>
							<p className="text-sm text-zinc-950 dark:text-zinc-50">
								{new Date(park.createdAt).toLocaleString()}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
