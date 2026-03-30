import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { loginAsync, sendVerificationCodeAsync, loginWithCodeAsync, sendForgotPasswordCodeAsync, resetPasswordAsync } from "./authThunks";

interface AuthState {
	status: "idle" | "loading" | "succeeded" | "failed";
	codeStatus: "idle" | "loading" | "succeeded" | "failed";
	forgotPasswordCodeStatus: "idle" | "loading" | "succeeded" | "failed";
	resetPasswordStatus: "idle" | "loading" | "succeeded" | "failed";
	error: string | null;
}

const initialState: AuthState = {
	status: "idle",
	codeStatus: "idle",
	forgotPasswordCodeStatus: "idle",
	resetPasswordStatus: "idle",
	error: null,
};

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		logout: (state) => {
			// state.role = "POC";
			state.status = "idle";
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(loginAsync.pending, (state) => {
				state.status = "loading";
				state.error = null;
			})
			.addCase(loginAsync.fulfilled, (state) => {
				state.status = "succeeded";
			})
			.addCase(loginAsync.rejected, (state, action) => {
				state.status = "failed";
				state.error = action.payload as string;
			})
			.addCase(sendVerificationCodeAsync.pending, (state) => {
				state.codeStatus = "loading";
				state.error = null;
			})
			.addCase(sendVerificationCodeAsync.fulfilled, (state) => {
				state.codeStatus = "succeeded";
			})
			.addCase(sendVerificationCodeAsync.rejected, (state, action) => {
				state.codeStatus = "failed";
				state.error = action.payload as string;
			})
			.addCase(loginWithCodeAsync.pending, (state) => {
				state.status = "loading";
				state.error = null;
			})
			.addCase(loginWithCodeAsync.fulfilled, (state) => {
				state.status = "succeeded";
			})
			.addCase(loginWithCodeAsync.rejected, (state, action) => {
				state.status = "failed";
				state.error = action.payload as string;
			})
			.addCase(sendForgotPasswordCodeAsync.pending, (state) => {
				state.forgotPasswordCodeStatus = "loading";
				state.error = null;
			})
			.addCase(sendForgotPasswordCodeAsync.fulfilled, (state) => {
				state.forgotPasswordCodeStatus = "succeeded";
			})
			.addCase(sendForgotPasswordCodeAsync.rejected, (state, action) => {
				state.forgotPasswordCodeStatus = "failed";
				state.error = action.payload as string;
			})
			.addCase(resetPasswordAsync.pending, (state) => {
				state.resetPasswordStatus = "loading";
				state.error = null;
			})
			.addCase(resetPasswordAsync.fulfilled, (state) => {
				state.resetPasswordStatus = "succeeded";
			})
			.addCase(resetPasswordAsync.rejected, (state, action) => {
				state.resetPasswordStatus = "failed";
				state.error = action.payload as string;
			})

	},
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
