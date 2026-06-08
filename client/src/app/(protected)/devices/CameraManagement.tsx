"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/utils/api/axios";
import {
	Activity,
	Camera,
	ChevronLeft,
	ChevronRight,
	Loader2,
	Plus,
	Save,
	Search,
	SlidersHorizontal,
	Trash2,
} from "lucide-react";

type CameraDirection = "IN" | "OUT" | "BOTH";
type CameraType = "CAMERA_LRP" | "CAMERA_FACE";

interface ParkOption {
	_id: string;
	name: string;
	tenantCode?: string;
}

interface CameraItem {
	_id: string;
	deviceName: string;
	macAddress: string;
	type: CameraType;
	status: string;
	parkId?: string;
	cameraConfig?: {
		streamUrl?: string;
		direction?: CameraDirection;
		enabled?: boolean;
		edgeNodeId?: string;
		aiEnabled?: boolean;
		lastHealthAt?: string;
	};
}

interface CameraFormState {
	deviceName: string;
	macAddress: string;
	type: CameraType;
	parkId: string;
	streamUrl: string;
	direction: CameraDirection;
	edgeNodeId: string;
	enabled: boolean;
	aiEnabled: boolean;
}

const emptyForm: CameraFormState = {
	deviceName: "",
	macAddress: "",
	type: "CAMERA_LRP",
	parkId: "",
	streamUrl: "",
	direction: "BOTH",
	edgeNodeId: "edge-default",
	enabled: true,
	aiEnabled: true,
};

const PAGE_SIZE = 10;
const HEALTHY_WITHIN_MS = 2 * 60 * 1000;

function maskStreamUrl(url?: string) {
	if (!url) return "No stream";
	return url.replace(/(rtsp:\/\/)([^:@/]+):([^@/]+)@/i, "$1$2:***@");
}

function getHealthStatus(lastHealthAt?: string) {
	if (!lastHealthAt) return { label: "No health data", healthy: false };
	const elapsed = Date.now() - new Date(lastHealthAt).getTime();
	return {
		label: elapsed <= HEALTHY_WITHIN_MS ? "Online" : "Offline",
		healthy: elapsed <= HEALTHY_WITHIN_MS,
	};
}

function formatLastHealth(lastHealthAt?: string) {
	if (!lastHealthAt) return "Never reported";
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: "short",
		timeStyle: "short",
	}).format(new Date(lastHealthAt));
}

function getApiErrorMessage(error: unknown, fallback: string) {
	if (
		typeof error === "object" &&
		error !== null &&
		"response" in error
	) {
		const response = (error as { response?: { data?: { message?: string } } }).response;
		if (response?.data?.message) return response.data.message;
	}
	return fallback;
}

export function CameraManagement({ currentUserRole }: { currentUserRole: string }) {
	const [cameras, setCameras] = React.useState<CameraItem[]>([]);
	const [parks, setParks] = React.useState<ParkOption[]>([]);
	const [form, setForm] = React.useState<CameraFormState>(emptyForm);
	const [editingId, setEditingId] = React.useState<string | null>(null);
	const [deletingId, setDeletingId] = React.useState<string | null>(null);
	const [parkFilter, setParkFilter] = React.useState("");
	const [search, setSearch] = React.useState("");
	const [page, setPage] = React.useState(1);
	const [total, setTotal] = React.useState(0);
	const [loading, setLoading] = React.useState(false);
	const [saving, setSaving] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	const canManage = currentUserRole === "SUPER_ADMIN" || currentUserRole === "ADMIN";

	const loadCameras = React.useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const query = new URLSearchParams({
				page: page.toString(),
				limit: PAGE_SIZE.toString(),
			});
			if (parkFilter) query.append("parkId", parkFilter);
			if (search) query.append("search", search);
			const res = await api.get(`/devices/cameras?${query.toString()}`);
			setCameras(res.data.data || []);
			setTotal(res.data.total || 0);
		} catch (error: unknown) {
			setError(getApiErrorMessage(error, "Failed to load cameras"));
		} finally {
			setLoading(false);
		}
	}, [page, parkFilter, search]);

	React.useEffect(() => {
		const timeoutId = setTimeout(loadCameras, 300);
		return () => clearTimeout(timeoutId);
	}, [loadCameras]);

	React.useEffect(() => {
		setPage(1);
	}, [parkFilter, search]);

	React.useEffect(() => {
		let ignore = false;
		api.get("/parks?page=1&limit=100")
			.then((res) => {
				if (!ignore) setParks(res.data.data || []);
			})
			.catch(() => {
				if (!ignore) setParks([]);
			});
		return () => {
			ignore = true;
		};
	}, []);

	function startEdit(camera: CameraItem) {
		setEditingId(camera._id);
		setForm({
			deviceName: camera.deviceName || "",
			macAddress: camera.macAddress || "",
			type: camera.type || "CAMERA_LRP",
			parkId: camera.parkId || "",
			streamUrl: camera.cameraConfig?.streamUrl || "",
			direction: camera.cameraConfig?.direction || "BOTH",
			edgeNodeId: camera.cameraConfig?.edgeNodeId || "edge-default",
			enabled: camera.cameraConfig?.enabled ?? true,
			aiEnabled: camera.cameraConfig?.aiEnabled ?? true,
		});
	}

	function resetForm() {
		setEditingId(null);
		setForm(emptyForm);
	}

	async function submitCamera(event: React.FormEvent) {
		event.preventDefault();
		setSaving(true);
		setError(null);

		try {
			const payload = {
				deviceName: form.deviceName.trim(),
				macAddress: form.macAddress.trim(),
				type: form.type,
				parkId: form.parkId,
				tenantCode:
					currentUserRole === "SUPER_ADMIN"
						? parks.find((park) => park._id === form.parkId)?.tenantCode
						: undefined,
				streamUrl: form.streamUrl.trim(),
				direction: form.direction,
				edgeNodeId: form.edgeNodeId.trim() || undefined,
				enabled: form.enabled,
				aiEnabled: form.aiEnabled,
			};

			if (editingId) {
				await api.patch(`/devices/cameras/${editingId}`, payload);
			} else {
				await api.post("/devices/cameras", payload);
			}

			resetForm();
			await loadCameras();
		} catch (error: unknown) {
			setError(getApiErrorMessage(error, "Failed to save camera"));
		} finally {
			setSaving(false);
		}
	}

	async function deleteCamera(camera: CameraItem) {
		if (!window.confirm(`Delete camera "${camera.deviceName}"?`)) return;

		setDeletingId(camera._id);
		setError(null);
		try {
			await api.delete(`/devices/cameras/${camera._id}`);
			if (editingId === camera._id) resetForm();
			if (cameras.length === 1 && page > 1) {
				setPage((current) => current - 1);
			} else {
				await loadCameras();
			}
		} catch (error: unknown) {
			setError(getApiErrorMessage(error, "Failed to delete camera"));
		} finally {
			setDeletingId(null);
		}
	}

	const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

	return (
		<Card>
			<CardHeader className="border-b border-zinc-100 py-4 dark:border-zinc-800">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Camera className="h-5 w-5" />
							Camera Management
						</CardTitle>
						<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
							RTSP cameras linked to parks and edge AI processing.
						</p>
					</div>
					<div className="flex flex-col gap-2 sm:flex-row">
						<select
							className="h-9 rounded-md border border-zinc-200 bg-transparent px-3 text-sm dark:border-zinc-800"
							value={parkFilter}
							onChange={(event) => setParkFilter(event.target.value)}
						>
							<option value="">All Parks</option>
							{parks.map((park) => (
								<option key={park._id} value={park._id}>
									{park.name}
								</option>
							))}
						</select>
						<div className="relative">
							<Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
							<input
								className="h-9 w-full rounded-md border border-zinc-200 bg-transparent pl-9 pr-3 text-sm dark:border-zinc-800 sm:w-64"
								placeholder="Search camera or edge..."
								value={search}
								onChange={(event) => setSearch(event.target.value)}
							/>
						</div>
					</div>
				</div>
			</CardHeader>

			<CardContent className="grid gap-6 p-4 lg:grid-cols-[minmax(0,1fr)_360px]">
				<div className="overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800">
					<table className="w-full text-sm">
						<thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
							<tr>
								<th className="h-11 px-4 text-left font-medium text-zinc-500">Camera</th>
								<th className="h-11 px-4 text-left font-medium text-zinc-500">Direction</th>
								<th className="h-11 px-4 text-left font-medium text-zinc-500">Stream</th>
								<th className="h-11 px-4 text-left font-medium text-zinc-500">Edge</th>
								<th className="h-11 px-4 text-right font-medium text-zinc-500">Actions</th>
							</tr>
						</thead>
						<tbody>
							{cameras.map((camera) => {
								const health = getHealthStatus(camera.cameraConfig?.lastHealthAt);
								return (
									<tr
										key={camera._id}
										className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
									>
									<td className="p-4">
										<div className="font-medium text-zinc-950 dark:text-zinc-50">
											{camera.deviceName}
										</div>
										<div className="text-xs text-zinc-500">{camera.macAddress}</div>
										<div className="mt-2 flex gap-2">
											<Badge variant="secondary">{camera.type}</Badge>
											<Badge
												variant={
													camera.cameraConfig?.enabled ? "success" : "destructive"
												}
											>
												{camera.cameraConfig?.enabled ? "Enabled" : "Disabled"}
											</Badge>
										</div>
									</td>
									<td className="p-4 text-zinc-600 dark:text-zinc-300">
										{camera.cameraConfig?.direction || "BOTH"}
									</td>
									<td className="max-w-[280px] p-4 font-mono text-xs text-zinc-500">
										<span title={camera.cameraConfig?.streamUrl}>
											{maskStreamUrl(camera.cameraConfig?.streamUrl)}
										</span>
									</td>
									<td className="p-4 text-zinc-600 dark:text-zinc-300">
										<div>{camera.cameraConfig?.edgeNodeId || "edge-default"}</div>
										<div className="mt-1 text-xs text-zinc-500">
											AI {camera.cameraConfig?.aiEnabled ? "on" : "off"}
										</div>
										<div
											className="mt-2 flex items-center gap-1 text-xs text-zinc-500"
											title={formatLastHealth(camera.cameraConfig?.lastHealthAt)}
										>
											<Activity
												className={`h-3.5 w-3.5 ${
													health.healthy ? "text-emerald-500" : "text-zinc-400"
												}`}
											/>
											{health.label}
										</div>
									</td>
									<td className="p-4 text-right">
										<div className="flex justify-end gap-2">
											<Button
												type="button"
												size="sm"
												variant="outline"
												disabled={!canManage}
												onClick={() => startEdit(camera)}
											>
												<SlidersHorizontal className="mr-2 h-4 w-4" />
												Edit
											</Button>
											<Button
												type="button"
												size="sm"
												variant="destructive"
												disabled={!canManage || deletingId === camera._id}
												onClick={() => deleteCamera(camera)}
											>
												{deletingId === camera._id ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<Trash2 className="h-4 w-4" />
												)}
												<span className="sr-only">Delete camera</span>
											</Button>
										</div>
									</td>
									</tr>
								);
							})}
						</tbody>
					</table>
					{loading && (
						<div className="flex h-24 items-center justify-center">
							<Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
						</div>
					)}
					{!loading && cameras.length === 0 && (
						<div className="p-8 text-center text-sm text-zinc-500">
							No cameras found.
						</div>
					)}
					{total > 0 && (
						<div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800">
							<span className="text-zinc-500">
								Page {page} of {pageCount} · {total} cameras
							</span>
							<div className="flex gap-2">
								<Button
									type="button"
									size="sm"
									variant="outline"
									disabled={loading || page <= 1}
									onClick={() => setPage((current) => current - 1)}
								>
									<ChevronLeft className="h-4 w-4" />
									<span className="sr-only">Previous page</span>
								</Button>
								<Button
									type="button"
									size="sm"
									variant="outline"
									disabled={loading || page >= pageCount}
									onClick={() => setPage((current) => current + 1)}
								>
									<ChevronRight className="h-4 w-4" />
									<span className="sr-only">Next page</span>
								</Button>
							</div>
						</div>
					)}
				</div>

				<form onSubmit={submitCamera} className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
					<div className="mb-4 flex items-center justify-between">
						<h3 className="font-medium text-zinc-950 dark:text-zinc-50">
							{editingId ? "Edit camera" : "Add camera"}
						</h3>
						{editingId && (
							<Button type="button" size="sm" variant="ghost" onClick={resetForm}>
								New
							</Button>
						)}
					</div>
					<div className="grid gap-3">
						<input
							className="h-9 rounded-md border border-zinc-200 bg-transparent px-3 text-sm dark:border-zinc-800"
							placeholder="Camera name"
							disabled={!canManage}
							required
							value={form.deviceName}
							onChange={(event) =>
								setForm((current) => ({ ...current, deviceName: event.target.value }))
							}
						/>
						<input
							className="h-9 rounded-md border border-zinc-200 bg-transparent px-3 text-sm dark:border-zinc-800"
							placeholder="MAC address"
							disabled={!canManage || Boolean(editingId)}
							required
							value={form.macAddress}
							onChange={(event) =>
								setForm((current) => ({ ...current, macAddress: event.target.value }))
							}
						/>
						<select
							className="h-9 rounded-md border border-zinc-200 bg-transparent px-3 text-sm dark:border-zinc-800"
							disabled={!canManage}
							value={form.type}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									type: event.target.value as CameraType,
								}))
							}
						>
							<option value="CAMERA_LRP">Camera LPR</option>
							<option value="CAMERA_FACE">Camera Face</option>
						</select>
						<select
							className="h-9 rounded-md border border-zinc-200 bg-transparent px-3 text-sm dark:border-zinc-800"
							disabled={!canManage}
							required
							value={form.parkId}
							onChange={(event) =>
								setForm((current) => ({ ...current, parkId: event.target.value }))
							}
						>
							<option value="">Select park</option>
							{parks.map((park) => (
								<option key={park._id} value={park._id}>
									{park.name}
								</option>
							))}
						</select>
						<input
							className="h-9 rounded-md border border-zinc-200 bg-transparent px-3 text-sm dark:border-zinc-800"
							placeholder="rtsp://user:pass@host:554/stream"
							disabled={!canManage}
							pattern="rtsp://.*"
							required
							value={form.streamUrl}
							onChange={(event) =>
								setForm((current) => ({ ...current, streamUrl: event.target.value }))
							}
						/>
						<div className="grid grid-cols-2 gap-3">
							<select
								className="h-9 rounded-md border border-zinc-200 bg-transparent px-3 text-sm dark:border-zinc-800"
								disabled={!canManage}
								value={form.direction}
								onChange={(event) =>
									setForm((current) => ({
										...current,
										direction: event.target.value as CameraDirection,
									}))
								}
							>
								<option value="IN">In</option>
								<option value="OUT">Out</option>
								<option value="BOTH">Both</option>
							</select>
							<input
								className="h-9 rounded-md border border-zinc-200 bg-transparent px-3 text-sm dark:border-zinc-800"
								placeholder="edge-default"
								disabled={!canManage}
								value={form.edgeNodeId}
								onChange={(event) =>
									setForm((current) => ({
										...current,
										edgeNodeId: event.target.value,
									}))
								}
							/>
						</div>
						<label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
							<input
								type="checkbox"
								disabled={!canManage}
								checked={form.enabled}
								onChange={(event) =>
									setForm((current) => ({ ...current, enabled: event.target.checked }))
								}
							/>
							Enabled
						</label>
						<label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
							<input
								type="checkbox"
								disabled={!canManage}
								checked={form.aiEnabled}
								onChange={(event) =>
									setForm((current) => ({
										...current,
										aiEnabled: event.target.checked,
									}))
								}
							/>
							AI processing
						</label>
						{error && <div className="text-sm text-red-500">{error}</div>}
						<Button type="submit" disabled={!canManage || saving}>
							{editingId ? (
								<Save className="mr-2 h-4 w-4" />
							) : (
								<Plus className="mr-2 h-4 w-4" />
							)}
							{saving ? "Saving..." : editingId ? "Save camera" : "Add camera"}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
