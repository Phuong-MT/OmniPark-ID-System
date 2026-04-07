import { createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "@/utils/api/axios";

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

export const updateUserProfileAsync = createAsyncThunk(
    "user/updateUserProfileAsync",
    async (updateData: { username?: string }, { rejectWithValue }) => {
        try {
            const response = await apiClient.put<{ message: string; user: any }>("/user/me", updateData);
            return response.data;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "Failed to update profile";
            return rejectWithValue(errorMessage);
        }
    },
);