import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "@/utils/api/axios";

interface FetchParksParams {
    page: number;
    limit: number;
    tenantCode?: string;
    search?: string;
    status?: string;
}

export const fetchParksList = createAsyncThunk(
    "adminParks/fetchParksList",
    async (params: FetchParksParams, { rejectWithValue , signal}) => {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append("page", params.page.toString());
            queryParams.append("limit", params.limit.toString());
            
            if (params.tenantCode) queryParams.append("tenantCode", params.tenantCode);
            if (params.search) queryParams.append("search", params.search);
            if (params.status) queryParams.append("status", params.status);

            const response = await axiosClient.get(`/parks?${queryParams.toString()}`, {signal});
            return response.data; // Should return { data, total, page, limit }
        } catch (error: any) {
            if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
                return rejectWithValue("Canceled");
            }
            return rejectWithValue(
                error.response?.data?.message || "Failed to fetch parks"
            );
        }
    }
);

interface CreateParkPayload {
    name: string;
    description?: string;
}

export const createNewPark = createAsyncThunk(
    "adminParks/createNewPark",
    async (payload: CreateParkPayload, { rejectWithValue }) => {
        try {
            const response = await axiosClient.post("/parks", payload);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to create park"
            );
        }
    }
);
