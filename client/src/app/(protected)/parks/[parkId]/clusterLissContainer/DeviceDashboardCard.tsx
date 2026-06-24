"use client";

import { Check, Clock, Copy, Cpu, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { GateCameraSection } from "./GateCameraSection";

export function DeviceDashboardCard({
	device: initialDevice,
	onRefresh,
}: {
	device: any;
	onRefresh?: () => void;
}) {
	const [device, setDevice] = useState<any>(initialDevice);
	const [copied, setCopied] = useState(false);

	// Sync with parent refresh
	useEffect(() => {
		setDevice(initialDevice);
	}, [initialDevice]);

	// copy MAC handler
	const copyMac = () => {
		navigator.clipboard.writeText(device.macAddress);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const isOnline = device.status === "ACTIVE";

	return (
		<div className="group relative rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/30 dark:hover:bg-zinc-900/60 p-5 flex flex-col gap-5 transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden">
			{/* Device Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10">
				<div className="flex items-center gap-3">
					<div
						className={`p-2 rounded-lg border transition-colors ${
							isOnline
								? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
								: "bg-zinc-500/10 border-zinc-500/20 text-zinc-500 dark:text-zinc-400"
						}`}
					>
						<Cpu className="h-5 w-5" />
					</div>

					<div className="flex flex-col">
						<div className="flex items-center gap-2">
							<span className="font-bold text-zinc-950 dark:text-zinc-50">
								{device.deviceName || "Unnamed Controller"}
							</span>
							<span
								className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
									isOnline
										? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
										: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400"
								}`}
							>
								{isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
								{isOnline ? "Online" : "Offline"}
							</span>
						</div>
						<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
							<span className="flex items-center gap-1">
								MAC:
								<span className="font-mono">{device.macAddress}</span>
								<button
									onClick={copyMac}
									className="p-0.5 hover:text-zinc-950 dark:hover:text-zinc-50"
								>
									{copied ? (
										<Check className="h-3.5 w-3.5 text-emerald-500" />
									) : (
										<Copy className="h-3.5 w-3.5" />
									)}
								</button>
							</span>
							{device.localIp && (
								<span>
									IP: <span className="font-mono">{device.localIp}</span>
								</span>
							)}
							{device.type && (
								<span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
									{device.type}
								</span>
							)}
						</div>
					</div>
				</div>

				<div className="text-xs text-zinc-400 dark:text-zinc-500 self-end md:self-auto flex items-center gap-1.5">
					<Clock className="h-3.5 w-3.5" />
					<span>
						Last heartbeat:{" "}
						{device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : "Never"}
					</span>
				</div>
			</div>

			{/* Body: Gate cameras or generic lane monitor */}
            <GateCameraSection
                device={device}
                onCameraAdded={(updated) => setDevice(updated)}
            />
		</div>
	);
}