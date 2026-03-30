import { createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../utils/api/axios";
import { LoginResponse } from "./authSlice";

export const loginAsync = createAsyncThunk(
	"auth/loginAsync",
	async ({ username, password }: Record<string, string>, { rejectWithValue }) => {
		try {
			const response = await apiClient.post<LoginResponse>("/auth/login", {
				username,
				password,
			});
			return response.data;
		} catch (err: any) {
			const errorMessage = err.response?.data?.message || err.message || "Login failed";
			return rejectWithValue(errorMessage);
		}
	},
);

export const sendVerificationCodeAsync = createAsyncThunk(
	"auth/sendVerificationCodeAsync",
	async ({ email }: Record<string, string>, { rejectWithValue }) => {
		try {
			const response = await apiClient.post<{ message: string }>("/auth/send-code", {
				email,
			});
			return response.data;
		} catch (err: any) {
			const errorMessage = err.response?.data?.message || err.message || "Failed to send code";
			return rejectWithValue(errorMessage);
		}
	},
);

export const loginWithCodeAsync = createAsyncThunk(
	"auth/loginWithCodeAsync",
	async ({ email, code }: Record<string, string>, { rejectWithValue }) => {
		try {
			const response = await apiClient.post<LoginResponse>("/auth/login-with-code", {
				email,
				code,
			});
			return response.data;
		} catch (err: any) {
			const errorMessage = err.response?.data?.message || err.message || "Login failed";
			return rejectWithValue(errorMessage);
		}
	},
);

export const sendForgotPasswordCodeAsync = createAsyncThunk(
	"auth/sendForgotPasswordCodeAsync",
	async ({ email }: Record<string, string>, { rejectWithValue }) => {
		try {
			const response = await apiClient.post<{ message: string }>("/auth/forgot-password/send-code", {
				email,
			});
			return response.data;
		} catch (err: any) {
			const errorMessage = err.response?.data?.message || err.message || "Failed to send code";
			return rejectWithValue(errorMessage);
		}
	},
);

export const resetPasswordAsync = createAsyncThunk(
	"auth/resetPasswordAsync",
	async ({ email, code, newPassword }: Record<string, string>, { rejectWithValue }) => {
		try {
			const response = await apiClient.post<{ message: string }>("/auth/forgot-password/reset", {
				email,
				code,
				newPassword,
			});
			return response.data;
		} catch (err: any) {
			const errorMessage = err.response?.data?.message || err.message || "Password reset failed";
			return rejectWithValue(errorMessage);
		}
	},
);
