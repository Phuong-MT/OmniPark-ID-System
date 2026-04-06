import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getUserMeAsync, updateUserProfileAsync } from "./userThunks";

export type Role = "POC" | "ADMIN" | "SUPER_ADMIN";

interface UserState {
    user: {
        id?: string;
        name: string;
        email: string;
        avatar: string;
    } | null;
    role: Role;
    status: "idle" | "loading" | "succeeded" | "failed";
    error: string | null;
}

const initialState: UserState = {
    user: null,
    role: "POC",
    status: "idle",
    error: null,
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        clearUser: (state) => {
            state.user = null;
            state.role = "POC";
            state.status = "idle";
            state.error = null;
        },
        setRole: (state, action: PayloadAction<Role>) => {
            state.role = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getUserMeAsync.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(getUserMeAsync.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.user = {
                    id: action.payload.user?.id,
                    name: action.payload.user?.name || action.payload.user?.email?.split("@")[0] || "User",
                    email: action.payload.user?.email || "",
                    avatar: `https://i.pravatar.cc/150?u=${action.payload.user?.email || "default"}`,
                };
                state.role = action.payload.role as Role || "ADMIN";
            })
            .addCase(getUserMeAsync.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload as string;
                state.user = null;
            })
            .addCase(updateUserProfileAsync.fulfilled, (state, action) => {
                if (state.user) {
                    state.user.name = action.payload.user?.name || action.payload.user?.email?.split("@")[0] || "User";
                    state.user.email = action.payload.user?.email || state.user.email;
                }
            });
    },
});

export const { clearUser, setRole } = userSlice.actions;
export default userSlice.reducer;