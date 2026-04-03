import { createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../utils/api/axios";

export const getUserMeAsync = createAsyncThunk(
    "user/getUserMeAsync",
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiClient.get<{ user: any; role: string }>("/user/me");
            return response.data;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "Failed to get user";
            return rejectWithValue(errorMessage);
        }
    },
);