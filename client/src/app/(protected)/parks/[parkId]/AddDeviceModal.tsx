"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, Loader2, RefreshCw, Cpu, CheckCircle2 } from "lucide-react";
import { useAddDeviceModal } from "./hook/useAddDeviceModal";

interface AddDeviceModalProps {
	isOpen: boolean;
	onClose: () => void;
	clusters: { _id: string; name: string }[];
}

export function AddDeviceModal({ isOpen, onClose, clusters }: AddDeviceModalProps) {
	const modal = useAddDeviceModal({ isOpen, onClose, clusters });

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg w-full max-w-lg overflow-hidden flex flex-col text-zinc-900 dark:text-zinc-50">
				<ModalHeader onClose={modal.onClose} />

				<div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
					<StatusMessages
						errorMsg={modal.errorMsg}
						successMsg={modal.successMsg}
					/>

					{!modal.successMsg && (
						<form
							onSubmit={modal.handlePair}
							id="pair-device-form"
							className="flex flex-col gap-4"
						>
							<DeviceListSection
								devices={modal.devices}
								selectedDeviceMac={modal.selectedDeviceMac}
								sectionId={modal.sectionId}
								isLoading={modal.isLoading}
								onRefresh={modal.refreshList}
								onSelectDevice={modal.handleSelectDevice}
								onSectionIdChange={modal.handleSectionIdChange}
							/>
							<ClusterSelectSection
								clusters={modal.clusters}
								selectedClusterId={modal.selectedClusterId}
								isLoading={modal.isLoading}
								onSelectCluster={modal.handleSelectCluster}
							/>
						</form>
					)}

					{modal.isLoading && (
						<LoadingView isPairingState={modal.isPairingState} />
					)}
				</div>

				{!modal.successMsg && (
					<ModalFooter
						isLoading={modal.isLoading}
						canSubmit={modal.canSubmit}
						onClose={modal.onClose}
					/>
				)}
			</div>
		</div>
	);
}

function ModalHeader({ onClose }: { onClose: () => void }) {
	return (
		<div className="flex justify-between items-center p-4 border-b border-zinc-200 dark:border-zinc-800">
			<div>
				<h2 className="text-lg font-semibold flex items-center gap-2">
					<Cpu className="h-5 w-5 text-indigo-500" />
					Pair Device for Park
				</h2>
				<p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
					Pair a physical device using its displayed 6-digit session ID.
				</p>
			</div>
			<Button variant="ghost" size="icon" onClick={onClose}>
				<X className="h-4 w-4" />
			</Button>
		</div>
	);
}

function StatusMessages({
	errorMsg,
	successMsg,
}: {
	errorMsg: string;
	successMsg: string;
}) {
	return (
		<>
			{errorMsg && (
				<div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
					{errorMsg}
				</div>
			)}
			{successMsg && (
				<div className="text-sm text-green-500 bg-green-50 dark:bg-green-900/20 p-3 rounded flex items-center gap-2 font-medium">
					<CheckCircle2 className="h-5 w-5 text-green-500" />
					{successMsg}
				</div>
			)}
		</>
	);
}

function DeviceRow({
	dev,
	isSelected,
	sectionId,
	isLoading,
	onSelect,
	onSectionIdChange,
}: {
	dev: any;
	isSelected: boolean;
	sectionId: string;
	isLoading: boolean;
	onSelect: (mac: string) => void;
	onSectionIdChange: (value: string) => void;
}) {
	return (
		<label
			className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
				isSelected
					? "border-indigo-600 bg-indigo-50/20 dark:bg-indigo-900/10"
					: "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
			}`}
		>
			<div className="flex items-center gap-3">
				<input
					type="radio"
					name="selectedDevice"
					value={dev.macAddress}
					checked={isSelected}
					onChange={() => onSelect(dev.macAddress)}
					className="text-indigo-600 focus:ring-indigo-500"
					disabled={isLoading}
				/>
				<div className="flex flex-col">
					<span className="font-semibold text-sm">
						{dev.deviceName || `New ${dev.type}`}
					</span>
					<span className="text-xs text-zinc-500 dark:text-zinc-400">
						MAC: {dev.macAddress}
					</span>
				</div>
			</div>
			<div className="flex flex-col items-end gap-1">
				<span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded text-xs font-semibold">
					Code
					<input
						type="text"
						value={isSelected ? sectionId : ""}
						onChange={(e) => onSectionIdChange(e.target.value)}
						className="ml-1 w-16 rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-1 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400"
						disabled={isLoading || !isSelected}
						maxLength={6}
					/>
				</span>
				<span className="text-[10px] text-zinc-400">
					Type: {dev.type}
				</span>
			</div>
		</label>
	);
}

function DeviceListSection({
	devices,
	selectedDeviceMac,
	sectionId,
	isLoading,
	onRefresh,
	onSelectDevice,
	onSectionIdChange,
}: {
	devices: any[];
	selectedDeviceMac: string;
	sectionId: string;
	isLoading: boolean;
	onRefresh: () => void;
	onSelectDevice: (mac: string) => void;
	onSectionIdChange: (value: string) => void;
}) {
	return (
		<>
			<div className="flex justify-between items-center">
				<Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
					1. Select Device Requesting Pairing
				</Label>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={onRefresh}
					className="flex items-center gap-1 h-8"
					disabled={isLoading}
				>
					<RefreshCw className="h-3 w-3" />
					Refresh
				</Button>
			</div>

			{devices.length === 0 ? (
				<div className="text-center py-6 px-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-500 dark:text-zinc-400">
					No devices are currently requesting to pair.
					<br />
					Ensure the device is powered, connected to WiFi, and displaying
					the pairing screen.
				</div>
			) : (
				<div className="grid gap-2 max-h-[180px] overflow-y-auto pr-1">
					{devices.map((dev) => (
						<DeviceRow
							key={dev.macAddress}
							dev={dev}
							isSelected={selectedDeviceMac === dev.macAddress}
							sectionId={sectionId}
							isLoading={isLoading}
							onSelect={onSelectDevice}
							onSectionIdChange={onSectionIdChange}
						/>
					))}
				</div>
			)}
		</>
	);
}

function ClusterSelectSection({
	clusters,
	selectedClusterId,
	isLoading,
	onSelectCluster,
}: {
	clusters: { _id: string; name: string }[];
	selectedClusterId: string;
	isLoading: boolean;
	onSelectCluster: (id: string) => void;
}) {
	return (
		<div className="grid gap-2">
			<Label
				htmlFor="cluster-select"
				className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
			>
				2. Select Cluster/Zone Location
			</Label>
			{clusters.length === 0 ? (
				<div className="text-sm text-amber-500 dark:text-amber-400">
					No clusters exist in this park. Please create a cluster
					first.
				</div>
			) : (
				<select
					id="cluster-select"
					value={selectedClusterId}
					onChange={(e) => onSelectCluster(e.target.value)}
					disabled={isLoading}
					className="flex h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-300"
				>
					{clusters.map((cluster) => (
						<option
							key={cluster._id}
							value={cluster._id}
							className="dark:bg-zinc-900"
						>
							{cluster.name}
						</option>
					))}
				</select>
			)}
		</div>
	);
}

function LoadingView({ isPairingState }: { isPairingState: boolean }) {
	return (
		<div className="flex flex-col items-center justify-center py-6 gap-2 text-sm text-zinc-500">
			<Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
			{isPairingState ? (
				<div className="text-center">
					<p className="font-medium text-zinc-900 dark:text-zinc-100">
						Pairing request initiated...
					</p>
					<p className="text-xs mt-1">
						Please look at the physical device OLED screen.
					</p>
				</div>
			) : (
				<p>Sending request to server...</p>
			)}
		</div>
	);
}

function ModalFooter({
	isLoading,
	canSubmit,
	onClose,
}: {
	isLoading: boolean;
	canSubmit: boolean;
	onClose: () => void;
}) {
	return (
		<div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
			<Button
				type="button"
				variant="outline"
				onClick={onClose}
				disabled={isLoading}
			>
				Cancel
			</Button>
			<Button
				type="submit"
				form="pair-device-form"
				disabled={!canSubmit}
				className="bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700"
			>
				{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
				Pair Selected Device
			</Button>
		</div>
	);
}