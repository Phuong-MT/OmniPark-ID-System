import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { loginAsync } from "./authThunks";

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
					id: action.payload.user.id,
					name: action.payload.user.name || action.payload.user.email.split("@")[0],
					email: action.payload.user.email,
					avatar: `https://i.pravatar.cc/150?u=${action.payload.user.email}`,
				};
				// Hardcoded role assignment for demonstration
				state.role = "ADMIN";
			})
			.addCase(loginAsync.rejected, (state, action) => {
				state.status = "failed";
				state.error = action.payload as string;
			});
	},
});

export const { setRole, logout, login } = authSlice.actions;
export default authSlice.reducer;
