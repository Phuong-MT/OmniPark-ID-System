"use client";

import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api/axios";
import { useSocket } from "@/socket/useSocket";
import { motion, AnimatePresence } from "framer-motion";
import {
	Cpu,
	Video,
	Camera,
	Wifi,
	WifiOff,
	RefreshCw,
	Layers,
	Clock,
	AlertCircle,
	CheckCircle2,
	ShieldAlert,
	MonitorPlay,
	Maximize2,
	Copy,
	Check,
	ChevronDown,
	ChevronUp,
} from "lucide-react";

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
}

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
										<DeviceDashboardCard
											key={device._id || device.macAddress}
											device={device}
										/>
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

interface DetectionData {
	plate: string;
	confidence: number;
	timestamp: string;
	vehicleType: string;
	status: "Allowed" | "Denied" | "Visitor" | "Pending";
	imageUrl?: string;
}

function DeviceDashboardCard({ device }: { device: any }) {
	const [copied, setCopied] = useState(false);

	// Default initial/mock values for Lane 1 (Entry) & Lane 2 (Exit)
	const [lane1, setLane1] = useState<DetectionData>({
		plate: "29A-123.45",
		confidence: 98.7,
		timestamp: new Date().toLocaleTimeString(),
		vehicleType: "Car (Sedan)",
		status: "Allowed",
	});

	const [lane2, setLane2] = useState<DetectionData>({
		plate: "30F-987.65",
		confidence: 96.2,
		timestamp: new Date(Date.now() - 5000).toLocaleTimeString(),
		vehicleType: "Motorcycle",
		status: "Visitor",
	});

	// copy MAC handler
	const copyMac = () => {
		navigator.clipboard.writeText(device.macAddress);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	// --- Socket listener setup for real-time license plate detection ---
	const handleDetectionSocket = useCallback(
		(socket: any) => {
			// Event name for plate detect event
			socket.on(
				"device_plate_detected",
				(data: {
					macAddress: string;
					deviceId?: string;
					lane: number; // 1 or 2
					plate: string;
					confidence: number;
					vehicleType?: string;
					status?: "Allowed" | "Denied" | "Visitor" | "Pending";
					imageUrl?: string;
				}) => {
					// Check if this detection belongs to our device
					const isTargetDevice =
						data.macAddress?.toUpperCase() === device.macAddress?.toUpperCase() ||
						data.deviceId === device._id;

					if (isTargetDevice) {
						const parsedData: DetectionData = {
							plate: data.plate,
							confidence: data.confidence || 100,
							timestamp: new Date().toLocaleTimeString(),
							vehicleType: data.vehicleType || "Unknown",
							status: data.status || "Allowed",
							imageUrl: data.imageUrl,
						};

						if (data.lane === 1) {
							setLane1(parsedData);
						} else if (data.lane === 2) {
							setLane2(parsedData);
						}
					}
				},
			);

			return () => {
				socket.off("device_plate_detected");
			};
		},
		[device.macAddress, device._id],
	);

	useSocket({
		namespace: "", // connect to standard root Socket namespace
		listen: handleDetectionSocket,
	});

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
								{isOnline ? (
									<Wifi className="h-3 w-3" />
								) : (
									<WifiOff className="h-3 w-3" />
								)}
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

			{/* Channels / Lanes monitoring */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
				{/* Lane 1: Entry */}
				<LaneMonitorSection
					laneNumber={1}
					laneName="CAM 01 - ENTRY LANE"
					isOnline={isOnline}
					data={lane1}
				/>

				{/* Lane 2: Exit */}
				<LaneMonitorSection
					laneNumber={2}
					laneName="CAM 02 - EXIT LANE"
					isOnline={isOnline}
					data={lane2}
				/>
			</div>
		</div>
	);
}

interface LaneMonitorProps {
	laneNumber: number;
	laneName: string;
	isOnline: boolean;
	data: DetectionData;
}

function LaneMonitorSection({ laneNumber, laneName, isOnline, data }: LaneMonitorProps) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<div
			className="flex flex-col gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-4 transition-all duration-300"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-2">
				<span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1.5">
					<Video className="h-3.5 w-3.5 text-zinc-400" />
					{laneName}
				</span>
				<span className="flex items-center gap-1 text-[10px] text-zinc-500">
					<span
						className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`}
					/>
					{isOnline ? "LIVE FEED" : "DISCONNECTED"}
				</span>
			</div>

			<div className="flex flex-col gap-4">
				{/* Camera View Box */}
				<div className="relative aspect-video w-full rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col items-center justify-center group/cam shadow-inner">
					{/* Live Stream Simulator */}
					{isOnline ? (
						<>
							{/* Scanning effect */}
							<div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent h-1/2 w-full animate-[scan_3s_linear_infinite]" />

							{/* Video grid overlay */}
							<div className="absolute inset-0 opacity-15 pointer-events-none bg-[linear-gradient(rgba(18,24,38,0)_95%,rgba(31,41,55,0.4)_95%),linear-gradient(90deg,rgba(18,24,38,0)_95%,rgba(31,41,55,0.4)_95%)] bg-[size:16px_16px]" />

							{/* Camera Info Overlay */}
							<div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-zinc-200 font-mono">
								<span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
								<span>REC</span>
							</div>

							<div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-zinc-300 font-mono">
								<span>1080P @ 30fps</span>
							</div>

							{/* Simulating a car passing by inside camera */}
							<div className="text-zinc-500 text-xs text-center p-3 select-none">
								<MonitorPlay className="h-8 w-8 text-indigo-500/40 mx-auto mb-1 group-hover/cam:scale-110 transition-transform" />
								<span className="font-mono text-[10px] text-zinc-400 block mt-1">
									STREAMING ACTIVE
								</span>
								<span className="text-[9px] text-zinc-600 dark:text-zinc-500 block">
									LENS: AUTO / EXPOSURE: 1/120
								</span>
							</div>

							{/* Corner brackets for HUD design */}
							<div className="absolute top-1.5 left-1.5 w-3 h-3 border-t border-l border-zinc-500/60" />
							<div className="absolute top-1.5 right-1.5 w-3 h-3 border-t border-r border-zinc-500/60" />
							<div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b border-l border-zinc-500/60" />
							<div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b border-r border-zinc-500/60" />
						</>
					) : (
						<div className="text-zinc-500 text-xs text-center p-4">
							<WifiOff className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
							<span>Feed unavailable</span>
						</div>
					)}
				</div>

				{/* Plate Detection Result Box */}
				<div
					className={`relative flex flex-col gap-3 rounded-lg border p-3.5 justify-between transition-all duration-300 ${
						!isOnline
							? "bg-zinc-100/50 dark:bg-zinc-900/20 border-zinc-200 dark:border-zinc-900"
							: data.status === "Allowed"
								? "bg-emerald-500/[0.02] border-emerald-500/25 dark:bg-emerald-950/[0.05] dark:border-emerald-500/20"
								: data.status === "Denied"
									? "bg-rose-500/[0.02] border-rose-500/25 dark:bg-rose-950/[0.05] dark:border-rose-500/20"
									: "bg-indigo-500/[0.02] border-indigo-500/25 dark:bg-indigo-950/[0.05] dark:border-indigo-500/20"
					}`}
				>
					<div className="flex items-center justify-between">
						<span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-wide flex items-center gap-1">
							<Camera className="h-3 w-3" />
							AI PLATE DETECTION
						</span>

						{isOnline && (
							<span
								className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
									data.status === "Allowed"
										? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
										: data.status === "Denied"
											? "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400"
											: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400"
								}`}
							>
								{data.status}
							</span>
						)}
					</div>

					{/* License Plate Display Graphic */}
					{isOnline ? (
						<div className="flex flex-col gap-2 my-1">
							{/* The Vietnam-style plate container */}
							<div className="border-2 border-zinc-700 dark:border-zinc-300 rounded-md bg-white p-1.5 shadow-sm text-center font-bold tracking-wide relative max-w-[170px] mx-auto w-full group/plate overflow-hidden">
								<div className="absolute inset-0 bg-indigo-500/10 pointer-events-none opacity-0 group-hover/plate:opacity-100 transition-opacity" />
								<div className="h-0.5 w-full bg-zinc-300 mb-1" />
								<span className="text-zinc-900 text-lg md:text-xl font-mono leading-none tracking-wider font-extrabold drop-shadow-[0.5px_0.5px_0_rgba(0,0,0,0.1)] block py-0.5">
									{data.plate}
								</span>
							</div>

							<div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-500 mt-1">
								<div className="flex flex-col">
									<span className="text-[9px] text-zinc-400 uppercase">
										Confidence
									</span>
									<span className="font-semibold text-zinc-800 dark:text-zinc-200">
										{data.confidence.toFixed(1)}%
									</span>
								</div>
								<div className="flex flex-col items-end">
									<span className="text-[9px] text-zinc-400 uppercase">
										Vehicle
									</span>
									<span className="font-semibold text-zinc-800 dark:text-zinc-200 text-right truncate max-w-full">
										{data.vehicleType}
									</span>
								</div>
							</div>
						</div>
					) : (
						<div className="text-center py-4 text-zinc-400 text-xs">
							<Clock className="h-4 w-4 mx-auto mb-1 opacity-50" />
							<span>No active scanner</span>
						</div>
					)}

					<div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-2 text-[9px] text-zinc-400">
						<span>LANE {laneNumber} SCAN</span>
						<span>{isOnline ? data.timestamp : "--:--:--"}</span>
					</div>
				</div>
			</div>
		</div>
	);
}
