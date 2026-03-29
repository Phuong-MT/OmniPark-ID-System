import { createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../utils/api/axios";
import { LoginResponse } from "./authSlice";

export const loginAsync = createAsyncThunk(
	"auth/loginAsync",
	async ({ email, password }: Record<string, string>, { rejectWithValue }) => {
		try {
			const response = await apiClient.post<LoginResponse>("/auth/login", {
				email,
				password,
			});
			return response.data;
		} catch (err: any) {
			const errorMessage = err.response?.data?.message || err.message || "Login failed";
			return rejectWithValue(errorMessage);
		}
	},
);
