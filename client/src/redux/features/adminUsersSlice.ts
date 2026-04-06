import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchUsersList } from "./adminUsersThunks";

export interface UserItem {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    tenant?: { name: string; status: string };
    createdAt?: string;
}

interface AdminUsersState {
    users: UserItem[];
    total: number;
    page: number;
    hasMore: boolean;
    loading: boolean;
    error: string | null;
    filters: {
        role?: string;
        tenantCode?: string;
        search?: string;
    };
}

const initialState: AdminUsersState = {
    users: [],
    total: 0,
    page: 1,
    hasMore: true,
    loading: false,
    error: null,
    filters: {},
};

const adminUsersSlice = createSlice({
    name: "adminUsers",
    initialState,
    reducers: {
        setFilters(state, action: PayloadAction<{ role?: string; tenantCode?: string; search?: string }>) {
            const newFilters = { ...state.filters, ...action.payload };
            
            // Prevent update if filters are logically identical
            const isSame = 
                (state.filters.role || "") === (newFilters.role || "") && 
                (state.filters.tenantCode || "") === (newFilters.tenantCode || "") &&
                (state.filters.search || "") === (newFilters.search || "");
                
            if (isSame) return;

            state.filters = newFilters;
            // Reset pagination and list when filters change
            state.users = [];
            state.page = 1;
            state.hasMore = true;
        },
        resetAdminUsers(state) {
            return initialState;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsersList.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUsersList.fulfilled, (state, action) => {
                state.loading = false;
                const newUsers = action.payload.users;

                // If it's page 1, replace the list. Otherwise, append.
                if (action.payload.page === 1) {
                    state.users = newUsers;
                } else {
                    // Prevent duplicates in case of strict mode or multiple fetch
                    const existingIds = new Set(state.users.map(u => u.id));
                    const uniqueNewUsers = newUsers.filter((u: UserItem) => !existingIds.has(u.id));
                    state.users = [...state.users, ...uniqueNewUsers];
                }

                state.total = action.payload.total;
                state.page = action.payload.page;

                // Check if we fetched all
                state.hasMore = state.users.length < action.payload.total;
            })
            .addCase(fetchUsersList.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setFilters, resetAdminUsers } = adminUsersSlice.actions;

export default adminUsersSlice.reducer;
