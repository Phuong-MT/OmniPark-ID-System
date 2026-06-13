"use client";

import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import Socket from "@/socket/socket";
import { usePairingSocketListeners } from "./usePairingSocketListeners";
import {
	setSelectedDeviceMac as setSelectedDeviceMacAction,
	setSelectedClusterId as setSelectedClusterIdAction,
	setSectionId as setSectionIdAction,
	setIsLoading,
	setErrorMsg,
	setSuccessMsg,
	resetPairing,
} from "@/redux/features/pairingSlice";

interface UseAddDeviceModalProps {
	isOpen: boolean;
	onClose: () => void;
	clusters: { _id: string; name: string }[];
}

export function useAddDeviceModal({ isOpen, onClose, clusters }: UseAddDeviceModalProps) {
	const dispatch = useDispatch();
	const pairingState = useSelector((state: RootState) => state.pairing);

	// --- Socket Actions ---

	const refreshList = React.useCallback(() => {
		const socket = Socket.getInstant("");
		if (socket) {
			socket.emit("request_pairing_list");
		}
	}, []);

	// --- Lifecycle: Reset state and start polling when modal opens/closes ---

	React.useEffect(() => {
		if (!isOpen) {
			dispatch(resetPairing());
			return;
		}

		dispatch(resetPairing());
		dispatch(setSelectedClusterIdAction(clusters[0]?._id || ""));

		refreshList();

		const interval = setInterval(refreshList, 5000);
		return () => {
			clearInterval(interval);
		};
	}, [isOpen, clusters, refreshList, dispatch]);

	// --- Socket Listeners (error, timeout, success) ---

	usePairingSocketListeners({ isOpen, onClose });

	// --- User Actions ---

	const handleSelectDevice = React.useCallback(
		(macAddress: string) => {
			dispatch(setSelectedDeviceMacAction(macAddress));
		},
		[dispatch],
	);

	const handleSelectCluster = React.useCallback(
		(clusterId: string) => {
			dispatch(setSelectedClusterIdAction(clusterId));
		},
		[dispatch],
	);

	const handleSectionIdChange = React.useCallback(
		(value: string) => {
			const digitsOnly = value.replace(/\D/g, "");
			if (digitsOnly.length <= 6) {
				dispatch(setSectionIdAction(digitsOnly));
			}
		},
		[dispatch],
	);

	const handlePair = React.useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			const socket = Socket.getInstant("");
			const { selectedDeviceMac, selectedClusterId, sectionId, devices } = pairingState;

			if (!selectedDeviceMac || !selectedClusterId || !socket) return;

			const device = devices.find((d) => d.macAddress === selectedDeviceMac);
			if (!device) return;

			dispatch(setIsLoading(true));
			dispatch(setErrorMsg(""));
			dispatch(setSuccessMsg(""));

			socket.emit("pair_device", {
				macAddress: selectedDeviceMac,
				objectId: selectedClusterId,
				sectionId,
			});
		},
		[dispatch, pairingState],
	);

	const canSubmit =
		!pairingState.isLoading &&
		!!pairingState.selectedDeviceMac &&
		!!pairingState.selectedClusterId &&
		pairingState.devices.length > 0;

	return {
		// State
		...pairingState,
		clusters,

		// Computed
		canSubmit,

		// Actions
		refreshList,
		handleSelectDevice,
		handleSelectCluster,
		handleSectionIdChange,
		handlePair,
		onClose,
	};
}
