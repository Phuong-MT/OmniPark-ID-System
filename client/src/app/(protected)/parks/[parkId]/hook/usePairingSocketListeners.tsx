"use client";

import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useSocket } from "../../../../../socket/useSocket";
import {
	setDevices,
	setIsPairingState,
	setSuccessMsg,
	setIsLoading,
	setErrorMsg,
} from "@/redux/features/pairingSlice";

interface PairingListenersProps {
	isOpen: boolean;
	onClose: () => void;
}

export function usePairingSocketListeners({ isOpen, onClose }: PairingListenersProps) {
	const dispatch = useDispatch();
	const { selectedDeviceMac } = useSelector((state: RootState) => state.pairing);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Clear timeout when modal is closed or unmounted
	useEffect(() => {
		if (!isOpen) {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
		}
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [isOpen]);

	const listenCallback = useCallback(
		(socket: any) => {
			if (!isOpen) return;

			socket.on("pairing_devices_list", (data: any[]) => {
				dispatch(setDevices(data || []));
			});

			socket.on("pair_initiated", (data: { macAddress: string; status: string }) => {
				console.log("pair_initiated", data);
				if (data.macAddress.toUpperCase() === selectedDeviceMac.toUpperCase()) {
					dispatch(setIsPairingState(true));

					// Clear any existing timeout
					if (timeoutRef.current) {
						clearTimeout(timeoutRef.current);
					}

					// Set a 30-second timeout for the device HTTP POST confirmation
					timeoutRef.current = setTimeout(() => {
						console.log("Pairing confirmation timed out");
						dispatch(
							setErrorMsg(
								"Pairing timed out. Physical device did not confirm in time.",
							),
						);
						dispatch(setIsLoading(false));
						dispatch(setIsPairingState(false));
						timeoutRef.current = null;
					}, 30000);
				}
			});

			socket.on("pair_success", (data: { macAddress: string; device: any }) => {
				console.log("pair_success", data);
				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
					timeoutRef.current = null;
				}
				dispatch(setSuccessMsg(`Device ${data.macAddress} successfully paired to park!`));
				dispatch(setIsLoading(false));
				dispatch(setIsPairingState(false));
				setTimeout(() => {
					onClose();
					window.location.reload();
				}, 2000);
			});

			socket.on("error", (data: { message: string }) => {
				console.log("Pairing socket error:", data);
				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
					timeoutRef.current = null;
				}
				dispatch(setErrorMsg(data.message || "Pairing failed"));
				dispatch(setIsLoading(false));
				dispatch(setIsPairingState(false));
				setTimeout(() => {
					dispatch(setErrorMsg(""));
				}, 3000);
			});

			return () => {
				socket.off("pairing_devices_list");
				socket.off("pair_initiated");
				socket.off("pair_success");
				socket.off("error");
			};
		},
		[isOpen, selectedDeviceMac, dispatch, onClose],
	);

	useSocket({
		namespace: "", // root namespace
		listen: listenCallback,
	});
}
