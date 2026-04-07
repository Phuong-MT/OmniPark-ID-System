import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/api/axios";

interface FetchDevicesParams {
    page: number;
    limit: number;
    type?: string;
    tenantCode?: string;
    search?: string;
}

export const fetchDevicesList = createAsyncThunk(
    "adminDevices/fetchDevicesList",
    async (params: FetchDevicesParams, { rejectWithValue, signal }) => {
        try {
            const { page, limit, type, tenantCode, search } = params;
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            if (type) queryParams.append("type", type);
            if (tenantCode) queryParams.append("tenantCode", tenantCode);
            if (search) queryParams.append("search", search);

            const response = await api.get(`/devices?${queryParams.toString()}`, { signal });
            return response.data; // { data: [], total: number, page: number, limit: number }
        } catch (error: any) {
            if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
                return rejectWithValue("Canceled");
            }
            if (error.response && error.response.data) {
                return rejectWithValue(error.response.data.message || "Failed to fetch devices");
            }
            return rejectWithValue("Network error or server is down");
        }
    }
);
