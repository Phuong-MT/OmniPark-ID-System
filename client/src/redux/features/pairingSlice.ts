import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PairingState {
	devices: any[];
	selectedDeviceMac: string;
	selectedClusterId: string;
	sectionId: string;
	isLoading: boolean;
	isPairingState: boolean;
	errorMsg: string;
	successMsg: string;
}

const initialState: PairingState = {
	devices: [],
	selectedDeviceMac: "",
	selectedClusterId: "",
	sectionId: "",
	isLoading: false,
	isPairingState: false,
	errorMsg: "",
	successMsg: "",
};

const pairingSlice = createSlice({
	name: "pairing",
	initialState,
	reducers: {
		setDevices(state, action: PayloadAction<any[]>) {
			state.devices = action.payload;
		},
		setSelectedDeviceMac(state, action: PayloadAction<string>) {
			state.selectedDeviceMac = action.payload;
		},
		setSelectedClusterId(state, action: PayloadAction<string>) {
			state.selectedClusterId = action.payload;
		},
		setSectionId(state, action: PayloadAction<string>) {
			state.sectionId = action.payload;
		},
		setIsLoading(state, action: PayloadAction<boolean>) {
			state.isLoading = action.payload;
		},
		setIsPairingState(state, action: PayloadAction<boolean>) {
			state.isPairingState = action.payload;
		},
		setErrorMsg(state, action: PayloadAction<string>) {
			state.errorMsg = action.payload;
		},
		setSuccessMsg(state, action: PayloadAction<string>) {
			state.successMsg = action.payload;
		},
		resetPairing(state) {
			return initialState;
		},
	},
});

export const {
	setDevices,
	setSelectedDeviceMac,
	setSelectedClusterId,
	setSectionId,
	setIsLoading,
	setIsPairingState,
	setErrorMsg,
	setSuccessMsg,
	resetPairing,
} = pairingSlice.actions;

export default pairingSlice.reducer;
