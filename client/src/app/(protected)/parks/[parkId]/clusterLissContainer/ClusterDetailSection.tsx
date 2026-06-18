"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/utils/api/axios";
import { AlertCircle, ChevronDown, ChevronUp, Cpu, Layers, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { DeviceDashboardCard } from "./DeviceDashboardCard";

export function ClusterDetailSection({ cluster }: { cluster: any }) {
	const [devices, setDevices] = useState<any[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [isOpen, setIsOpen] = useState<boolean>(false);

	const fetchDevices = useCallback(
		async (signal?: AbortSignal) => {
			try {
				setLoading(true);
				setError(null);
				const response = await api.get(`parks/cluster/${cluster._id}/devices`, {
					signal,
				});
				const allDevices = response.data || [];
				const clusterDevices = allDevices.filter((d: any) => d.clusterId === cluster._id);
				setDevices(clusterDevices);
			} catch (err: any) {
				// Ignore abort errors
				if (err.name === "AbortError" || err.code === "ERR_CANCELED") {
					return;
				}
				setError(err.response?.data?.message || "Failed to load cluster devices");
			} finally {
				setLoading(false);
			}
		},
		[cluster._id],
	);

	useEffect(() => {
		if (!cluster._id) return;

		const controller = new AbortController();

		fetchDevices(controller.signal);

		return () => {
			controller.abort();
		};
	}, [cluster._id, fetchDevices]);

	const activeDevicesCount = devices.filter((d) => d.status === "ACTIVE").length;

	return (
		<div className="rounded-xl border border-zinc-200 bg-white/60 backdrop-blur-md shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60 flex flex-col transition-all duration-300">
			{/* Cluster Header — always visible, clickable to toggle */}
			<button
				type="button"
				onClick={() => setIsOpen((prev) => !prev)}
				className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 w-full text-left cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors rounded-xl"
			>
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-3">
						<span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
							<Layers className="h-5 w-5" />
						</span>
						<h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
							{cluster.name || "Unnamed Zone"}
						</h3>
						<span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
							ID: {cluster._id}
						</span>
					</div>
				</div>

				<div className="flex items-center gap-3 self-end sm:self-auto">
					<div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
						<span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
						<span>
							{activeDevicesCount}/{devices.length} Devices
						</span>
					</div>

					<span
						onClick={(e) => {
							e.stopPropagation();
							fetchDevices();
						}}
						className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
						title="Refresh Devices"
					>
						<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
					</span>

					<span className="p-1.5 text-zinc-400 dark:text-zinc-500">
						{isOpen ? (
							<ChevronUp className="h-5 w-5" />
						) : (
							<ChevronDown className="h-5 w-5" />
						)}
					</span>
				</div>
			</button>

			{/* Collapsible body */}
			<AnimatePresence initial={false}>
				{isOpen && (
					<motion.div
						key="cluster-body"
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.3, ease: "easeInOut" }}
						className="overflow-hidden"
					>
						<div className="px-6 pb-6 flex flex-col gap-6 border-t border-zinc-100 dark:border-zinc-800 pt-4">
							{/* Devices Loading / State */}
							{loading ? (
								<div className="flex flex-col items-center justify-center py-12 gap-2 text-sm text-zinc-500">
									<RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
									<p>Loading devices assigned to this cluster...</p>
								</div>
							) : error ? (
								<div className="flex items-center gap-2 p-4 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg">
									<AlertCircle className="h-4 w-4 flex-shrink-0" />
									<span>{error}</span>
								</div>
							) : devices.length === 0 ? (
								<div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
									<Cpu className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
									<p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
										No paired devices
									</p>
									<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
										Use the &quot;Pair Device&quot; option above to register
										hardware for this cluster.
									</p>
								</div>
							) : (
								<div className="grid grid-cols-1 gap-6 w-full">
									{devices.map((device) => (
										<div key={device._id || device.macAddress}>
											{device.type === "GATE" && <DeviceDashboardCard
												device={device}
												onRefresh={fetchDevices}
											/>}
										</div>
									))}
								</div>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}