"use client";

import React, { useState, useEffect } from "react";
import { X, MapPin } from "lucide-react";
import apiClient from "@/utils/api/axios";

interface AddClusterActionProps {
	parkId: string;
	initialClusters?: any[];
	mapContainerRef: React.RefObject<HTMLDivElement | null>;
	previewUrl: string | null;
}

export function AddClusterAction({
	parkId,
	initialClusters = [],
	mapContainerRef,
	previewUrl,
}: AddClusterActionProps) {
	const [clusters, setClusters] = useState<any[]>(initialClusters);
	const [activeCluster, setActiveCluster] = useState<any | null>(null);
	const [isAddingCluster, setIsAddingCluster] = useState<boolean>(false);

	// Sync local clusters state when initialClusters prop updates
	useEffect(() => {
		setClusters(initialClusters);
	}, [initialClusters]);

	// Listen to add-cluster trigger event from ParkDetailAction button
	useEffect(() => {
		const handleTriggerAdd = () => {
			if (isAddingCluster) return;

			if (!previewUrl) {
				alert("Please upload a park map before creating clusters.");
				return;
			}

			const tempId = `new-cluster-${Date.now()}`;
			const newCluster = {
				_id: tempId,
				name: "New Cluster",
				position: { x: 50, y: 50, lat: 0, lng: 0 },
				stats: { totalDevices: 0, onlineDevices: 0 },
			};

			setClusters((prev) => [...prev, newCluster]);
			setActiveCluster(newCluster);
			setIsAddingCluster(true);
		};

		window.addEventListener("trigger-add-cluster", handleTriggerAdd);
		return () => {
			window.removeEventListener("trigger-add-cluster", handleTriggerAdd);
		};
	}, [isAddingCluster, previewUrl]);

	// // Close editor on clicking background of map container
	// useEffect(() => {
	// 	const handleOutsideClick = (e: MouseEvent) => {
	// 		if (!activeCluster) return;
	// 		const container = mapContainerRef.current;
	// 		if (container && container.contains(e.target as Node)) {
	// 			// If clicked inside map container, but not on a pin or properties card
	// 			const isCardOrPin =
	// 				(e.target as Element).closest(".pointer-events-auto") ||
	// 				(e.target as Element).closest(".cursor-pointer");
	// 			if (!isCardOrPin) {
	// 				handleCancelEdit();
	// 			}
	// 		}
	// 	};

	// 	window.addEventListener("click", handleOutsideClick);
	// 	return () => {
	// 		window.removeEventListener("click", handleOutsideClick);
	// 	};
	// }, [activeCluster, isAddingCluster, initialClusters]);

	// Draggable handler for cluster markers
	const handleStartDrag = (e: React.MouseEvent | React.TouchEvent, cluster: any) => {
		e.stopPropagation();

		// Activate this cluster if it isn't the active one
		if (activeCluster?._id !== cluster._id) {
			setActiveCluster(cluster);
			setIsAddingCluster(cluster._id.toString().startsWith("new-cluster"));
		}

		const container = mapContainerRef.current;
		if (!container) return;

		const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
			const rect = container.getBoundingClientRect();
			const clientX =
				"touches" in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
			const clientY =
				"touches" in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

			const xPx = clientX - rect.left;
			const yPx = clientY - rect.top;

			// Convert to coordinates as percentages
			const xPercent = Math.max(0, Math.min(100, (xPx / rect.width) * 100));
			const yPercent = Math.max(0, Math.min(100, (yPx / rect.height) * 100));

			setActiveCluster((prev: any) => {
				if (!prev) return null;
				return {
					...prev,
					position: {
						...prev.position,
						x: xPercent,
						y: yPercent,
					},
				};
			});

			// Realtime update visually
			setClusters((prevClusters) =>
				prevClusters.map((c) =>
					c._id === cluster._id
						? {
								...c,
								position: {
									...c.position,
									x: xPercent,
									y: yPercent,
								},
							}
						: c,
				),
			);
		};

		const handleEnd = () => {
			window.removeEventListener("mousemove", handleMove);
			window.removeEventListener("mouseup", handleEnd);
			window.removeEventListener("touchmove", handleMove);
			window.removeEventListener("touchend", handleEnd);
		};

		window.addEventListener("mousemove", handleMove);
		window.addEventListener("mouseup", handleEnd);
		window.addEventListener("touchmove", handleMove);
		window.addEventListener("touchend", handleEnd);
	};

	const handleUpdateActiveClusterField = (field: string, value: any) => {
		setActiveCluster((prev: any) => {
			if (!prev) return null;
			const updated = { ...prev, [field]: value };
			setClusters((prevClusters) =>
				prevClusters.map((c) => (c._id === prev._id ? updated : c)),
			);
			return updated;
		});
	};

	const handleUpdateActiveClusterPosition = (key: string, value: number) => {
		setActiveCluster((prev: any) => {
			if (!prev) return null;
			const updated = {
				...prev,
				position: {
					...prev.position,
					[key]: value,
				},
			};
			setClusters((prevClusters) =>
				prevClusters.map((c) => (c._id === prev._id ? updated : c)),
			);
			return updated;
		});
	};

	const handleSaveCluster = async () => {
		if (!activeCluster) return;

		if (!activeCluster.name.trim()) {
			alert("Cluster name cannot be empty.");
			return;
		}

		try {
			let res;
			if (isAddingCluster) {
				res = await apiClient.post(`/parks/${parkId}/clusters`, {
					name: activeCluster.name,
					position: activeCluster.position,
				});
			} else {
				res = await apiClient.patch(`/parks/${parkId}/clusters/${activeCluster._id}`, {
					name: activeCluster.name,
					position: activeCluster.position,
				});
			}

			if (res.data?.clusters) {
				setClusters(res.data.clusters);
			}
			setActiveCluster(null);
			setIsAddingCluster(false);
		} catch (err: any) {
			console.error("Save cluster failed", err);
			alert(err.response?.data?.message || "Failed to save cluster.");
		}
	};

	const handleCancelEdit = () => {
		if (isAddingCluster) {
			setClusters((prev) => prev.filter((c) => c._id !== activeCluster?._id));
		} else {
			setClusters(initialClusters);
		}
		setActiveCluster(null);
		setIsAddingCluster(false);
	};

	const handleDeleteCluster = async () => {
		if (!activeCluster || isAddingCluster) return;
		const confirmed = window.confirm("Are you sure you want to delete this cluster?");
		if (!confirmed) return;

		try {
			const res = await apiClient.delete(`/parks/${parkId}/clusters/${activeCluster._id}`);
			if (res.data?.clusters) {
				setClusters(res.data.clusters);
			}
			setActiveCluster(null);
			setIsAddingCluster(false);
		} catch (err: any) {
			console.error("Delete cluster failed", err);
			alert(err.response?.data?.message || "Failed to delete cluster.");
		}
	};

	return (
		<>
			{/* Interactive Clusters Pins */}
			{clusters.map((cluster) => {
				const isEditing = activeCluster?._id === cluster._id;
				const posX = cluster.position?.x ?? 50;
				const posY = cluster.position?.y ?? 50;

				return (
					<div
						key={cluster._id}
						style={{
							position: "absolute",
							left: `${posX}%`,
							top: `${posY}%`,
							transform: "translate(-50%, -100%)",
						}}
						className={`absolute z-10 cursor-pointer ${
							isEditing ? "z-20 scale-110" : "hover:scale-105"
						}`}
					>
						{/* Pin Icon */}
						<div
							onClick={(e) => {
								e.stopPropagation();
								setActiveCluster(cluster);
								setIsAddingCluster(
									cluster._id.toString().startsWith("new-cluster"),
								);
							}}
							onMouseDown={(e) => handleStartDrag(e, cluster)}
							onTouchStart={(e) => handleStartDrag(e, cluster)}
							className={`p-1.5 rounded-full shadow-lg border-2 transition-colors ${
								isEditing
									? "bg-indigo-600 border-white text-white"
									: "bg-white border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:bg-zinc-900 dark:border-indigo-400 dark:text-indigo-400"
							}`}
						>
							<MapPin className="h-5 w-5" />
						</div>
					</div>
				);
			})}

			{/* Float Property Panel */}
			{activeCluster &&
				(() => {
					const posX = activeCluster.position?.x ?? 50;
					const posY = activeCluster.position?.y ?? 50;
					const isLeftEdge = posX < 35;
					const isRightEdge = posX > 65;

					const panelStyle: React.CSSProperties = {
						position: "absolute",
						top: `${posY}%`,
						zIndex: 30,
					};

					// Horizontal positioning relative to pin
					if (isLeftEdge) {
						panelStyle.left = `calc(${posX}% + 24px)`;
						panelStyle.transform = "translateY(-50%)";
					} else if (isRightEdge) {
						panelStyle.right = `calc(${100 - posX}% + 24px)`;
						panelStyle.transform = "translateY(-50%)";
					} else {
						panelStyle.right = `calc(${100 - posX}% + 24px)`;
						panelStyle.transform = "translateY(-50%)";
					}

					// Vertical boundaries check to prevent top/bottom edge clipping
					if (posY < 20) {
						panelStyle.top = `${posY}%`;
						panelStyle.transform = "translateY(0%)";
					} else if (posY > 80) {
						panelStyle.top = "auto";
						panelStyle.bottom = `calc(${100 - posY}% - 20px)`;
						panelStyle.transform = "none";
					}

					return (
						<div
							onClick={(e) => e.stopPropagation()}
							style={panelStyle}
							className="z-30 w-72 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-4 flex flex-col gap-3 text-zinc-900 dark:text-zinc-50 pointer-events-auto"
						>
							<div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
								<span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
									{isAddingCluster ? "New Cluster" : "Edit Cluster"}
								</span>
								<button
									onClick={handleCancelEdit}
									className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
								>
									<X className="h-4 w-4" />
								</button>
							</div>

							{/* Name */}
							<div className="flex flex-col gap-1">
								<label className="text-[10px] font-semibold text-zinc-500 uppercase">
									Cluster Name
								</label>
								<input
									type="text"
									value={activeCluster.name}
									onChange={(e) =>
										handleUpdateActiveClusterField("name", e.target.value)
									}
									className="w-full text-sm px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-transparent focus:ring-1 focus:ring-indigo-500 outline-none"
									placeholder="e.g. Zone A"
								/>
							</div>

							{/* X and Y (percent coordinates) */}
							<div className="grid grid-cols-2 gap-2">
								<div className="flex flex-col gap-1">
									<label className="text-[10px] font-semibold text-zinc-500 uppercase">
										X (%)
									</label>
									<input
										type="number"
										min={0}
										max={100}
										step="0.1"
										value={
											activeCluster.position?.x !== undefined
												? parseFloat(activeCluster.position.x.toFixed(1))
												: 50
										}
										onChange={(e) =>
											handleUpdateActiveClusterPosition(
												"x",
												parseFloat(e.target.value) || 0,
											)
										}
										className="w-full text-sm px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-transparent focus:ring-1 focus:ring-indigo-500 outline-none"
									/>
								</div>
								<div className="flex flex-col gap-1">
									<label className="text-[10px] font-semibold text-zinc-500 uppercase">
										Y (%)
									</label>
									<input
										type="number"
										min={0}
										max={100}
										step="0.1"
										value={
											activeCluster.position?.y !== undefined
												? parseFloat(activeCluster.position.y.toFixed(1))
												: 50
										}
										onChange={(e) =>
											handleUpdateActiveClusterPosition(
												"y",
												parseFloat(e.target.value) || 0,
											)
										}
										className="w-full text-sm px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-transparent focus:ring-1 focus:ring-indigo-500 outline-none"
									/>
								</div>
							</div>

							{/* GeoCoordinates (Lat, Lng) */}
							<div className="grid grid-cols-2 gap-2">
								<div className="flex flex-col gap-1">
									<label className="text-[10px] font-semibold text-zinc-500 uppercase">
										Latitude
									</label>
									<input
										type="number"
										step="0.000001"
										value={activeCluster.position?.lat ?? ""}
										onChange={(e) =>
											handleUpdateActiveClusterPosition(
												"lat",
												parseFloat(e.target.value) || 0,
											)
										}
										className="w-full text-sm px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-transparent focus:ring-1 focus:ring-indigo-500 outline-none"
										placeholder="0"
									/>
								</div>
								<div className="flex flex-col gap-1">
									<label className="text-[10px] font-semibold text-zinc-500 uppercase">
										Longitude
									</label>
									<input
										type="number"
										step="0.000001"
										value={activeCluster.position?.lng ?? ""}
										onChange={(e) =>
											handleUpdateActiveClusterPosition(
												"lng",
												parseFloat(e.target.value) || 0,
											)
										}
										className="w-full text-sm px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-transparent focus:ring-1 focus:ring-indigo-500 outline-none"
										placeholder="0"
									/>
								</div>
							</div>

							{/* Actions (Save, Cancel, Delete) */}
							<div className="flex justify-between items-center gap-2 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
								{!isAddingCluster ? (
									<button
										onClick={handleDeleteCluster}
										className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
									>
										Delete
									</button>
								) : (
									<div />
								)}

								<div className="flex gap-2">
									<button
										onClick={handleCancelEdit}
										className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium px-2.5 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 transition-colors"
									>
										Cancel
									</button>
									<button
										onClick={handleSaveCluster}
										className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 font-semibold px-3 py-1.5 rounded shadow-sm transition-colors"
									>
										Save
									</button>
								</div>
							</div>
						</div>
					);
				})()}
		</>
	);
}
