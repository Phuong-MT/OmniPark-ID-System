import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api/axios";

interface FetchUsersParams {
    page: number;
    limit: number;
    role?: string;
    tenantCode?: string;
    search?: string;
}

export const fetchUsersList = createAsyncThunk(
    "adminUsers/fetchUsersList",
    async (params: FetchUsersParams, { rejectWithValue, signal }) => {
        try {
            const { page, limit, role, tenantCode, search } = params;
            // Build query params
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            if (role) queryParams.append("role", role);
            if (tenantCode) queryParams.append("tenantCode", tenantCode);
            if (search) queryParams.append("search", search);

            const response = await api.get(`/user?${queryParams.toString()}`, { signal });
            return response.data; // { users: [], total: number, page: number, limit: number }
        } catch (error: any) {
            if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
                return rejectWithValue("Canceled");
            }
            if (error.response && error.response.data) {
                return rejectWithValue(error.response.data.message || "Failed to fetch users");
            }
            return rejectWithValue("Network error or server is down");
        }
    }
);
