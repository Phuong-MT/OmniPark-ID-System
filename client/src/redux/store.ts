import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/authSlice";
import userReducer from "./features/userSlice";
import adminUsersReducer from "./features/adminUsersSlice";
import tenantReducer from "./features/tenantSlice";

export const store = configureStore({
	reducer: {
		auth: authReducer,
		tenant: tenantReducer,
		user: userReducer,
		adminUsers: adminUsersReducer,
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
