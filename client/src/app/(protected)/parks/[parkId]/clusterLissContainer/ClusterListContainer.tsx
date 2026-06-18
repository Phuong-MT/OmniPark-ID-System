"use client";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Layers } from "lucide-react";
import { ClusterDetailSection } from "./ClusterDetailSection";

const EMPTY_ARRAY: any[] = [];

export function ClusterListContainer() {
	const clusters = useSelector(
		(state: RootState) => state.adminParks.currentPark?.clusters || EMPTY_ARRAY,
	);
	return (
		<div className="flex flex-col gap-6 w-full mt-6 min-h-[120px]">
			<div className="flex items-center gap-2 px-1">
				<Layers className="h-5 w-5 text-indigo-500" />
				<h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
					Cluster Zones ({clusters.length})
				</h2>
			</div>
			{clusters.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 dark:text-zinc-500 text-sm gap-1">
					<Layers className="h-6 w-6 mb-1 opacity-50" />
					<span>No clusters configured for this park.</span>
				</div>
			) : (
				clusters.map((cluster: any, index: number) => (
					<ClusterDetailSection cluster={cluster} key={cluster._id || index} />
				))
			)}
		</div>
	);
};