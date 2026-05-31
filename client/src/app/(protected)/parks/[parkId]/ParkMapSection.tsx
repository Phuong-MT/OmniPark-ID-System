"use client";

import React, { useRef, useState, useCallback } from "react";
import { ImagePlus, UploadCloud, X, CheckCircle, AlertCircle } from "lucide-react";
import apiClient from "@/utils/api/axios";

interface ParkMapSectionProps {
	parkId: string;
	map?: {
        image: {
            original: string;
            preview: string;
            thumbnail: string;
        };
		config: {
			width: number;
            height: number;
		}
	}
}

type UploadStatus = "idle" | "previewing" | "uploading" | "success" | "error";

export function ParkMapSection({ parkId, map }: ParkMapSectionProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [status, setStatus] = useState<UploadStatus>(
		map ? "success" : "idle"
	);
	const [previewUrl, setPreviewUrl] = useState<string | null>(
		map?.image?.original ?? null
	);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const handleSelectFile = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate
		if (!file.type.match(/^image\/(jpeg|jpg|png|webp|gif)$/)) {
			setErrorMsg("Only JPEG, PNG, WebP, or GIF images are allowed.");
			return;
		}
		if (file.size > 10 * 1024 * 1024) {
			setErrorMsg("File size must be less than 10 MB.");
			return;
		}

		setErrorMsg(null);
		setSelectedFile(file);
		setPreviewUrl(URL.createObjectURL(file));
		setStatus("previewing");

		// Reset input so same file can be re-selected
		e.target.value = "";
	};

	const handleCancel = () => {
		if (previewUrl && !map?.image?.original) {
			URL.revokeObjectURL(previewUrl);
			setPreviewUrl(null);
		} else {
			// Revert to original map url
			setPreviewUrl(map?.image?.original ?? null);
		}
		setSelectedFile(null);
		setStatus(map?.image?.original ? "success" : "idle");
		setErrorMsg(null);
	};

	const handleConfirm = async () => {
		if (!selectedFile) return;
		setStatus("uploading");
		setErrorMsg(null);

		try {
			const formData = new FormData();
			formData.append("file", selectedFile);

			const res = await apiClient.patch(`/parks/${parkId}/map`, formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});

			const newUrl = res.data?.map?.image?.original ?? previewUrl;
			setPreviewUrl(newUrl);
			setSelectedFile(null);
			setStatus("success");
		} catch (err: any) {
			setErrorMsg(
				err?.response?.data?.message ?? "Upload failed. Please try again."
			);
			setStatus("previewing");
		}
	};

	return (
		<div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
			{/* Header */}
			<div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
				<div className="flex items-center gap-2">
					<ImagePlus className="h-4 w-4 text-indigo-500" />
					<h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
						Park Map
					</h2>
					{status === "success" && !selectedFile && (
						<span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
							<CheckCircle className="h-3 w-3" />
							Active
						</span>
					)}
				</div>

				{/* Actions */}
				<div className="flex items-center gap-2">
					{status === "previewing" && (
						<>
							<button
								onClick={handleCancel}
								className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
							>
								<X className="h-3.5 w-3.5" />
								Cancel
							</button>
							<button
								onClick={handleConfirm}
								className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
							>
								<UploadCloud className="h-3.5 w-3.5" />
								Save Map
							</button>
						</>
					)}

					{(status === "idle" || status === "success") && (
						<button
							onClick={handleSelectFile}
							className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
						>
							<ImagePlus className="h-3.5 w-3.5" />
							{status === "success" ? "Change Map" : "Select Map"}
						</button>
					)}
				</div>
			</div>

			{/* Body */}
			<div className="p-6">
				{/* Error message */}
				{errorMsg && (
					<div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-2.5 text-sm text-red-700 dark:text-red-400">
						<AlertCircle className="h-4 w-4 shrink-0" />
						{errorMsg}
					</div>
				)}

				{/* Map image / Placeholder */}
				{previewUrl ? (
					<div className="relative group rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
						<img
							src={previewUrl}
							alt="Park map"
							width={map?.config?.width}
							height={map?.config?.height}
							className="w-full object-contain bg-zinc-50 dark:bg-zinc-900"
						/>
						{/* Uploading overlay */}
						{status === "uploading" && (
							<div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm gap-3">
								<div className="h-10 w-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
								<p className="text-sm font-medium text-white">Uploading…</p>
							</div>
						)}
						{/* Preview label */}
						{status === "previewing" && (
							<div className="absolute top-3 left-3">
								<span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full shadow-sm">
									Preview
								</span>
							</div>
						)}
					</div>
				) : (
					/* Empty placeholder */
					<button
						onClick={handleSelectFile}
						className="w-full group flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 py-16 transition-all hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10"
					>
						<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
							<ImagePlus className="h-7 w-7 text-zinc-400 dark:text-zinc-500 group-hover:text-indigo-500 transition-colors" />
						</div>
						<div className="text-center">
							<p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
								No map uploaded yet
							</p>
							<p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
								Click to select an image &bull; JPEG, PNG, WebP, GIF &bull; max
								10 MB
							</p>
						</div>
					</button>
				)}

				{/* Hidden file input */}
				<input
					ref={fileInputRef}
					id="park-map-file-input"
					type="file"
					accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
					className="hidden"
					onChange={handleFileChange}
				/>
			</div>
		</div>
	);
}
