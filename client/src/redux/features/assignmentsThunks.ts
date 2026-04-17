import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "@/utils/api/axios";

export const fetchAssignmentsByMonth = createAsyncThunk(
	"assignments/fetchAssignmentsByMonth",
	async (params: { year: number; month: number }, { rejectWithValue, signal }) => {
		try {
			const response = await axiosClient.get("/assignments/month", {
				params,
				signal,
			});
			return response.data;
		} catch (error: any) {
			if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
				return rejectWithValue("Canceled");
			}
			return rejectWithValue(error.response?.data?.message || "Failed to fetch assignments");
		}
	},
);

export const assignPoc = createAsyncThunk(
	"assignments/assignPoc",
	async (
		payload: {
			pocId: string;
			parkId: string;
			schedule?: { startTime?: string; endTime?: string };
		},
		{ rejectWithValue },
	) => {
		try {
			const response = await axiosClient.post("/assignments", payload);
			return response.data;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message || "Failed to assign POC");
		}
	},
);
