import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/authSlice";
import userReducer from "./features/userSlice";
import adminUsersReducer from "./features/adminUsersSlice";

export const store = configureStore({
	reducer: {
		auth: authReducer,
		user: userReducer,
		adminUsers: adminUsersReducer,
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
