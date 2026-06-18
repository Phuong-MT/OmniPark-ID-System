"use client";

import { useState } from "react";
import api from "@/utils/api/axios";
import { motion } from "framer-motion";
import { AlertCircle, Camera, Plus, RefreshCw, X } from "lucide-react";

export function AddCameraModal({
	gateId,
	gateType,
	onClose,
	onSuccess,
}: {
	gateId: string;
	gateType: "ENTRY" | "EXIT";
	onClose: () => void;
	onSuccess: (updatedGate: any) => void;
}) {
	const [form, setForm] = useState({
		cameraUrl: "",
		macAddress: "",
		deviceName: "",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.cameraUrl.trim() || !form.macAddress.trim()) {
			setError("Camera URL and MAC address are required.");
			return;
		}
		try {
			setLoading(true);
			setError(null);
			const response = await api.post(`devices/${gateId}/cameras`, {
				gateType,
				cameraUrl: form.cameraUrl.trim(),
				macAddress: form.macAddress.trim(),
				deviceName: form.deviceName.trim() || undefined,
			});
			onSuccess(response.data.gate);
		} catch (err: any) {
			setError(err.response?.data?.message || "Failed to add camera.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
			<motion.div
				initial={{ opacity: 0, scale: 0.95, y: 10 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.95, y: 10 }}
				transition={{ duration: 0.2 }}
				className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-md"
			>
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
					<div className="flex items-center gap-2">
						<Camera className="h-5 w-5 text-indigo-500" />
						<h3 className="font-bold text-zinc-900 dark:text-zinc-50">
							Add Camera — {gateType} Lane
						</h3>
					</div>
					<button
						onClick={onClose}
						className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
					{error && (
						<div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
							<AlertCircle className="h-4 w-4 shrink-0" />
							{error}
						</div>
					)}

					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
							Camera Stream URL <span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							placeholder="rtsp://192.168.1.x:554/stream"
							value={form.cameraUrl}
							onChange={(e) => setForm((f) => ({ ...f, cameraUrl: e.target.value }))}
							className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
							MAC Address <span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							placeholder="AA:BB:CC:DD:EE:FF"
							value={form.macAddress}
							onChange={(e) => setForm((f) => ({ ...f, macAddress: e.target.value }))}
							className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono uppercase"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
							Device Name <span className="text-zinc-400">(optional)</span>
						</label>
						<input
							type="text"
							placeholder="e.g. CAM_ENTRY_GATE_A"
							value={form.deviceName}
							onChange={(e) => setForm((f) => ({ ...f, deviceName: e.target.value }))}
							className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>
					</div>

					<div className="flex gap-3 pt-1">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading}
							className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
						>
							{loading ? (
								<RefreshCw className="h-4 w-4 animate-spin" />
							) : (
								<>
									<Plus className="h-4 w-4" />
									Add Camera
								</>
							)}
						</button>
					</div>
				</form>
			</motion.div>
		</div>
	);
}
