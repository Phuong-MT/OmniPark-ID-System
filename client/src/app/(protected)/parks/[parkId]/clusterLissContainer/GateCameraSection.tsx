import { Camera, Clock, Link2, MonitorPlay, Plus, Video } from "lucide-react";
import { useCallback, useState } from "react";
import { AddCameraModal } from "./AddCameraModal";
import { useSocketListenStreamCamera } from "./hook/useSocketListenStreamCamera";
import { WebRTCPlayer } from "@/components/WebRTCPlayer";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";


interface DetectionData {
	plate: string;
	confidence: number;
	timestamp: string;
	vehicleType: string;
	status: "Allowed" | "Denied" | "Visitor" | "Pending";
	imageUrl?: string;
}

const GATE_SLOTS: Array<{ gateType: "ENTRY" | "EXIT"; label: string; laneLabel: string }> = [
	{ gateType: "ENTRY", label: "Entry Lane", laneLabel: "CAM 01 - ENTRY LANE" },
	{ gateType: "EXIT", label: "Exit Lane", laneLabel: "CAM 02 - EXIT LANE" },
];

export function GateCameraSection({
	device,
	onCameraAdded,
}: {
	device: any;
	onCameraAdded: (updated: any) => void;
}) {
	// cameraLprs is populated from server: [{ cameraId: { _id, deviceName, cameraUrl, ... }, gateType }]
	const cameraLprs: Array<{ cameraId: any; gateType: "ENTRY" | "EXIT" }> =
		device.cameraLprs || [];

	const [addingSlot, setAddingSlot] = useState<"ENTRY" | "EXIT" | null>(null);

	const getCameraForSlot = (slot: "ENTRY" | "EXIT") =>
		cameraLprs.find((c) => c.gateType === slot)?.cameraId ?? null;

	const isOnline = device.status === "ACTIVE";
	const [data, setLane1] = useState<DetectionData>({
		plate: "29A-123.45",
		confidence: 98.7,
		timestamp: new Date().toLocaleTimeString(),
		vehicleType: "Car (Sedan)",
		status: "Allowed",
	});

	// Lấy tenantCode của park hiện tại từ redux
	const currentPark = useSelector((state: RootState) => state.adminParks.currentPark);
	const tenantCode = currentPark?.tenantCode;

	// State chứa streamUrl của từng camera slot
	const [streamUrls, setStreamUrls] = useState<Record<string, string>>({});

	// Hook lắng nghe và fetch WebRTC stream URL qua socket cho từng camera
	const entryCam = getCameraForSlot("ENTRY");
	const exitCam = getCameraForSlot("EXIT");

	useSocketListenStreamCamera(
		tenantCode,
		entryCam?._id,
		useCallback((url: string) => {
			setStreamUrls(prev => ({ ...prev, [entryCam._id]: url }));
		}, [entryCam?._id])
	);

	useSocketListenStreamCamera(
		tenantCode,
		exitCam?._id,
		useCallback((url: string) => {
			setStreamUrls(prev => ({ ...prev, [exitCam._id]: url }));
		}, [exitCam?._id])
	);

	return (
		<>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{GATE_SLOTS.map((slot) => {
					const cam = getCameraForSlot(slot.gateType);
					const streamUrl = cam ? streamUrls[cam._id] : undefined;
					return (
						<div
							key={slot.gateType}
							className="flex flex-col gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-4"
						>
							{/* Slot header */}
							<div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-2">
								<span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1.5">
									<Video className="h-3.5 w-3.5" />
									{slot.laneLabel}
								</span>
								{cam ? (
									<span className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold">
										<span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
										LINKED
									</span>
								) : (
									<span className="flex items-center gap-1 text-[10px] text-zinc-400">
										<span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
										NO CAMERA
									</span>
								)}
							</div>

							{cam ? (
								/* Camera is linked — show info + URL */
								<div className="flex flex-col gap-2">
									{/* Camera view stub or WebRTC Video Player */}
									{streamUrl ? (
										<WebRTCPlayer streamUrl={streamUrl} />
									) : (
										<div className="relative aspect-video w-full rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col items-center justify-center shadow-inner">
											<div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent h-1/2 w-full animate-[scan_3s_linear_infinite]" />
											<div className="absolute inset-0 opacity-15 pointer-events-none bg-[linear-gradient(rgba(18,24,38,0)_95%,rgba(31,41,55,0.4)_95%),linear-gradient(90deg,rgba(18,24,38,0)_95%,rgba(31,41,55,0.4)_95%)] bg-[size:16px_16px]" />
											<div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-zinc-200 font-mono">
												<span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
												<span>REC</span>
											</div>
											<MonitorPlay className="h-8 w-8 text-indigo-500/40 animate-pulse" />
											<span className="font-mono text-[10px] text-zinc-400 block mt-1">WAITING FOR STREAM URL...</span>
											{/* Corner brackets */}
											<div className="absolute top-1.5 left-1.5 w-3 h-3 border-t border-l border-zinc-500/60" />
											<div className="absolute top-1.5 right-1.5 w-3 h-3 border-t border-r border-zinc-500/60" />
											<div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b border-l border-zinc-500/60" />
											<div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b border-r border-zinc-500/60" />
										</div>
									)}


									{/* Camera meta
									<div className="flex flex-col gap-1 text-xs">
										<div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
											<Camera className="h-3.5 w-3.5 shrink-0" />
											<span className="font-semibold truncate">{cam.deviceName || cam.macAddress}</span>
										</div>
										{cam.cameraUrl && (
											<div className="flex items-start gap-1.5 text-indigo-500 dark:text-indigo-400">
												<Link2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
												<span className="font-mono text-[10px] break-all leading-tight">{cam.cameraUrl}</span>
											</div>
										)}
									</div> */}
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
                                            <span>LANE {slot.laneLabel} SCAN</span>
                                            <span>{isOnline ? data.timestamp : "--:--:--"}</span>
                                        </div>
                                    </div>
								</div>
							) : (
								/* No camera — show Add button */
								<div className="flex flex-col items-center justify-center py-8 gap-3">
									<div className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800">
										<Camera className="h-6 w-6 text-zinc-400" />
									</div>
									<p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
										No camera linked for <span className="font-bold">{slot.label}</span>
									</p>
									<button
										onClick={() => setAddingSlot(slot.gateType)}
										className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-sm"
									>
										<Plus className="h-3.5 w-3.5" />
										Add Camera
									</button>
								</div>
							)}
						</div>
					);
				})}
			</div>

			{/* Modal for adding camera */}
			{addingSlot && (
				<AddCameraModal
					gateId={device._id}
					gateType={addingSlot}
					onClose={() => setAddingSlot(null)}
					onSuccess={(updatedGate) => {
						setAddingSlot(null);
						onCameraAdded(updatedGate);
					}}
				/>
			)}
		</>
	);
}
