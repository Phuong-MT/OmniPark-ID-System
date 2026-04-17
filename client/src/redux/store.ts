import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/authSlice";
import userReducer from "./features/userSlice";
import adminUsersReducer from "./features/adminUsersSlice";
import tenantReducer from "./features/tenantSlice";
import adminDevicesReducer from "./features/adminDevicesSlice";
import adminParksReducer from "./features/adminParksSlice";
import assignmentsReducer from "./features/assignmentsSlice";
import { combineReducers } from "@reduxjs/toolkit";

import { AnyAction } from "@reduxjs/toolkit";

type HydrateAction = {
	type: "HYDRATE";
	payload: Partial<RootState>;
};

const combinedReducer = combineReducers({
	auth: authReducer,
	tenant: tenantReducer,
	user: userReducer,
	adminUsers: adminUsersReducer,
	adminDevices: adminDevicesReducer,
	adminParks: adminParksReducer,
	assignments: assignmentsReducer,
});

export const rootReducer = (
	state: RootState | undefined,
	action: HydrateAction | AnyAction
): RootState => {
	if (action.type === "HYDRATE") {
		const payload = action.payload;

		// Ensure state is initialized
		const currentState = state || combinedReducer(undefined, { type: "@@INIT" });
		const nextState = { ...currentState };

		Object.keys(payload).forEach((key) => {
			const k = key as keyof RootState;
			if (payload[k]) {
			    // Combine existing slice state with the new hydrated state for this slice
				nextState[k] = {
					...currentState[k],
					...(payload[k] as any),
				};
			}
		});

		return nextState;
	}

	return combinedReducer(state, action);
};

export const Store = (preloadedState?: any) =>
	configureStore({
		reducer: rootReducer,
		preloadedState,
	});

export type RootState = ReturnType<typeof combinedReducer>;
export type AppDispatch = ReturnType<typeof Store>["dispatch"];
