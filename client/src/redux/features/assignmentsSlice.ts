import { createSlice } from "@reduxjs/toolkit";
import { fetchAssignmentsByMonth, assignPoc } from "./assignmentsThunks";

interface AssignmentsState {
	assignments: any[];
	loadingAssignments: boolean;
	errorAssignments: string | null;

	assigningPoc: boolean;
	assignError: string | null;
	assignSuccess: string | null;
}

const initialState: AssignmentsState = {
	assignments: [],
	loadingAssignments: false,
	errorAssignments: null,

	assigningPoc: false,
	assignError: null,
	assignSuccess: null,
};

const assignmentsSlice = createSlice({
	name: "assignments",
	initialState,
	reducers: {
		clearAssignMessages: (state) => {
			state.assignError = null;
			state.assignSuccess = null;
		},
	},
	extraReducers: (builder) => {
		// fetchAssignmentsByMonth
		builder.addCase(fetchAssignmentsByMonth.pending, (state) => {
			state.loadingAssignments = true;
			state.errorAssignments = null;
		});
		builder.addCase(fetchAssignmentsByMonth.fulfilled, (state, action) => {
			state.loadingAssignments = false;
			state.assignments = action.payload;
		});
		builder.addCase(fetchAssignmentsByMonth.rejected, (state, action) => {
			if (action.payload !== "Canceled") {
				state.loadingAssignments = false;
				state.errorAssignments = action.payload as string;
			}
		});

		// assignPoc
		builder.addCase(assignPoc.pending, (state) => {
			state.assigningPoc = true;
			state.assignError = null;
			state.assignSuccess = null;
		});
		builder.addCase(assignPoc.fulfilled, (state) => {
			state.assigningPoc = false;
			state.assignSuccess = "POC assigned successfully!";
		});
		builder.addCase(assignPoc.rejected, (state, action) => {
			state.assigningPoc = false;
			state.assignError = action.payload as string;
		});
	},
});

export const { clearAssignMessages } = assignmentsSlice.actions;
export default assignmentsSlice.reducer;
