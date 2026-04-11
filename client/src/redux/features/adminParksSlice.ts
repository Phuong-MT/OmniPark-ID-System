import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchParksList } from "./adminParksThunks";

export interface ParkItem {
	_id?: string;
	tenantCode?: string;
	name: string;
	description?: string;
	status: string;
	map?: any;
	clusters?: any[];
	stats?: {
		totalDevices: number;
		onlineDevices: number;
	};
	createdAt?: string;
}

interface AdminParksState {
	parks: ParkItem[];
	total: number;
	page: number;
	hasMore: boolean;
	loading: boolean;
	error: string | null;
	filters: {
		tenantCode?: string;
		search?: string;
		status?: string;
	};
}

const initialState: AdminParksState = {
	parks: [],
	total: 0,
	page: 1,
	hasMore: true,
	loading: false,
	error: null,
	filters: {},
};

const adminParksSlice = createSlice({
	name: "adminParks",
	initialState,
	reducers: {
		setFilters(
			state,
			action: PayloadAction<{ tenantCode?: string; search?: string; status?: string }>,
		) {
			const newFilters = { ...state.filters, ...action.payload };

			const isSame =
				(state.filters.tenantCode || "") === (newFilters.tenantCode || "") &&
				(state.filters.search || "") === (newFilters.search || "") &&
				(state.filters.status || "") === (newFilters.status || "");

			if (isSame) return;

			state.filters = newFilters;
			state.parks = [];
			state.page = 1;
			state.hasMore = true;
		},
		resetAdminParks(state) {
			return initialState;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchParksList.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchParksList.fulfilled, (state, action) => {
				state.loading = false;
				const newParks = action.payload.data || [];

				if (action.payload.page === 1) {
					state.parks = newParks;
				} else {
					const existingIds = new Set(state.parks.map((p) => p._id));
					const uniqueNewParks = newParks.filter(
						(p: ParkItem) => !existingIds.has(p._id),
					);
					state.parks = [...state.parks, ...uniqueNewParks];
				}

				state.total = action.payload.total;
				state.page = action.payload.page;
				state.hasMore = state.parks.length < action.payload.total;
			})
			.addCase(fetchParksList.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			});
	},
});

export const { setFilters, resetAdminParks } = adminParksSlice.actions;

export default adminParksSlice.reducer;
