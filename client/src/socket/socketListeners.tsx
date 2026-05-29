"use client";

import { useCallback } from "react";
import { useSocket } from "./useSocket";

interface PairingListenersProps {
	isOpen: boolean;
	selectedDeviceMac: string;
	setDevices: (devices: any[]) => void;
	setIsPairingState: (isPairing: boolean) => void;
	setSuccessMsg: (msg: string) => void;
	setIsLoading: (loading: boolean) => void;
	onClose: () => void;
}

export function usePairingSocketListeners({
	isOpen,
	selectedDeviceMac,
	setDevices,
	setIsPairingState,
	setSuccessMsg,
	setIsLoading,
	onClose,
}: PairingListenersProps) {
	const listenCallback = useCallback((socket: any) => {
		if (!isOpen) return;

		socket.on("pairing_devices_list", (data: any[]) => {
			console.log("pairing_devices_list", data);
			setDevices(data || []);
		});

		socket.on("pair_initiated", (data: { macAddress: string; status: string }) => {
			console.log("pair_initiated", data);
			if (data.macAddress.toUpperCase() === selectedDeviceMac.toUpperCase()) {
				setIsPairingState(true);
			}
		});

		socket.on("pair_success", (data: { macAddress: string; device: any }) => {
			console.log("pair_success", data);
			setSuccessMsg(`Device ${data.macAddress} successfully paired to park!`);
			setIsLoading(false);
			setIsPairingState(false);
			setTimeout(() => {
				onClose();
				window.location.reload();
			}, 2000);
		});

		return () => {
			socket.off("pairing_devices_list");
			socket.off("pair_initiated");
			socket.off("pair_success");
		};
	}, [
		isOpen,
		selectedDeviceMac,
		setDevices,
		setIsPairingState,
		setSuccessMsg,
		setIsLoading,
		onClose,
	]);

	useSocket({
		namespace: "", // root namespace
		listen: listenCallback,
	});
}
