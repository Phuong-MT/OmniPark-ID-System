import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { loginAsync, sendVerificationCodeAsync, loginWithCodeAsync, sendForgotPasswordCodeAsync, resetPasswordAsync } from "./authThunks";

export type Role = "POC" | "ADMIN" | "SUPER_ADMIN";

export interface LoginResponse {
	user: {
		id: string;
		email: string;
		name?: string;
	};
	token: string;
}

interface AuthState {
	role: Role;
	user: {
		id?: string;
		name: string;
		email: string;
		avatar: string;
	} | null;
	status: "idle" | "loading" | "succeeded" | "failed";
	codeStatus: "idle" | "loading" | "succeeded" | "failed";
	forgotPasswordCodeStatus: "idle" | "loading" | "succeeded" | "failed";
	resetPasswordStatus: "idle" | "loading" | "succeeded" | "failed";
	error: string | null;
}

const initialState: AuthState = {
	role: "SUPER_ADMIN", // Default for demonstration
	user: {
		name: "Jane Doe",
		email: "jane@omnipark.com",
		avatar: "https://i.pravatar.cc/150?u=jane",
	},
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
		setRole: (state, action: PayloadAction<Role>) => {
			state.role = action.payload;
		},
		logout: (state) => {
			state.user = null;
			state.role = "POC";
			state.status = "idle";
			state.error = null;
		},
		login: (state, action: PayloadAction<{ role: Role; name: string }>) => {
			state.role = action.payload.role;
			state.user = {
				name: action.payload.name,
				email: `${action.payload.name.toLowerCase().replace(" ", ".")}@omnipark.com`,
				avatar: `https://i.pravatar.cc/150?u=${action.payload.name}`,
			};
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(loginAsync.pending, (state) => {
				state.status = "loading";
				state.error = null;
			})
			.addCase(loginAsync.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
				state.status = "succeeded";
				state.user = {
					id: action.payload.user?.id,
					name: action.payload.user?.name || action.payload.user?.email?.split("@")[0] || "User",
					email: action.payload.user?.email || "",
					avatar: `https://i.pravatar.cc/150?u=${action.payload.user?.email || "default"}`,
				};
				state.role = "ADMIN";
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
			.addCase(loginWithCodeAsync.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
				state.status = "succeeded";
				state.user = {
					id: action.payload.user?.id,
					name: action.payload.user?.name || action.payload.user?.email?.split("@")[0] || "User",
					email: action.payload.user?.email || "",
					avatar: `https://i.pravatar.cc/150?u=${action.payload.user?.email || "default"}`,
				};
				state.role = "ADMIN";
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
			});
	},
});

export const { setRole, logout, login } = authSlice.actions;
export default authSlice.reducer;
