import { createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../utils/api/axios";

export const getAllTenantsAsync = createAsyncThunk(
    "tenant/getAllTenantsAsync",
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiClient.get("/tenant");
            return response.data;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "Login failed";
            return rejectWithValue(errorMessage);
        }
    },
);