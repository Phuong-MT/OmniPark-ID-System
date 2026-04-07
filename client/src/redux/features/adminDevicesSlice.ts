import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchDevicesList } from "./adminDevicesThunks";

export interface DeviceItem {
    _id?: string;
    deviceId?: string;
    macAddress: string;
    deviceName: string;
    type: string;
    status: string;
    pairState?: string;
    firmwareVersion?: string;
}

interface AdminDevicesState {
    devices: DeviceItem[];
    total: number;
    page: number;
    hasMore: boolean;
    loading: boolean;
    error: string | null;
    filters: {
        type?: string;
        tenantCode?: string;
        search?: string;
    };
}

const initialState: AdminDevicesState = {
    devices: [],
    total: 0,
    page: 1,
    hasMore: true,
    loading: false,
    error: null,
    filters: {},
};

const adminDevicesSlice = createSlice({
    name: "adminDevices",
    initialState,
    reducers: {
        setFilters(state, action: PayloadAction<{ type?: string; tenantCode?: string; search?: string }>) {
            const newFilters = { ...state.filters, ...action.payload };
            
            const isSame = 
                (state.filters.type || "") === (newFilters.type || "") && 
                (state.filters.tenantCode || "") === (newFilters.tenantCode || "") &&
                (state.filters.search || "") === (newFilters.search || "");
                
            if (isSame) return;

            state.filters = newFilters;
            state.devices = [];
            state.page = 1;
            state.hasMore = true;
        },
        resetAdminDevices(state) {
            return initialState;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDevicesList.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDevicesList.fulfilled, (state, action) => {
                state.loading = false;
                const newDevices = action.payload.data || [];

                if (action.payload.page === 1) {
                    state.devices = newDevices;
                } else {
                    const existingIds = new Set(state.devices.map(d => d._id || d.macAddress));
                    const uniqueNewDevices = newDevices.filter((d: DeviceItem) => !existingIds.has(d._id || d.macAddress));
                    state.devices = [...state.devices, ...uniqueNewDevices];
                }

                state.total = action.payload.total;
                state.page = action.payload.page;
                state.hasMore = state.devices.length < action.payload.total;
            })
            .addCase(fetchDevicesList.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setFilters, resetAdminDevices } = adminDevicesSlice.actions;

export default adminDevicesSlice.reducer;
