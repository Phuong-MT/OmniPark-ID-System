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
    async (params: FetchParksParams, { rejectWithValue }) => {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append("page", params.page.toString());
            queryParams.append("limit", params.limit.toString());
            
            if (params.tenantCode) queryParams.append("tenantCode", params.tenantCode);
            if (params.search) queryParams.append("search", params.search);
            if (params.status) queryParams.append("status", params.status);

            const response = await axiosClient.get(`/parks?${queryParams.toString()}`);
            return response.data; // Should return { data, total, page, limit }
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to fetch parks"
            );
        }
    }
);
