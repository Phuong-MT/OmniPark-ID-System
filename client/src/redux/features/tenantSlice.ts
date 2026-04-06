import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getAllTenantsAsync } from "./tenantThunks";

interface Tenant {
    _id: string
    name: string,
    status: string,
    description?: string;
    address?: string,
    contactEmail?: string,
    contactPhone?: string,
    maxDevices?: number,
    maxUsers?: number,
};

interface TenantState {
    tenants: Tenant[];
    myTenant: Tenant | null;
    status: "idle" | "loading" | "succeeded" | "failed";
    error: string | null;
}

const initialState: TenantState = {
    tenants: [],
    myTenant: null,
    status: "idle",
    error: null,
};

const tenantSlice = createSlice({
    name: "tenant",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getAllTenantsAsync.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(getAllTenantsAsync.fulfilled, (state, action: PayloadAction<Tenant[]>) => {
                state.tenants = action.payload;
                state.status = "succeeded";
            })
            .addCase(getAllTenantsAsync.rejected, (state, action) => {
                state.error = action.payload as string;
                state.status = "failed";
            })
    }
})

export const { } = tenantSlice.actions;
export default tenantSlice.reducer;