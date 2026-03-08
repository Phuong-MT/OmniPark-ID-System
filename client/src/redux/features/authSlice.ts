import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Role = 'POC' | 'ADMIN' | 'SUPER_ADMIN';

interface AuthState {
    role: Role;
    user: {
        name: string;
        email: string;
        avatar: string;
    } | null;
}

const initialState: AuthState = {
    role: 'SUPER_ADMIN', // Default for demonstration
    user: {
        name: 'Jane Doe',
        email: 'jane@omnipark.com',
        avatar: 'https://i.pravatar.cc/150?u=jane',
    },
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setRole: (state, action: PayloadAction<Role>) => {
            state.role = action.payload;
        },
        // Mock user login/logout
        logout: (state) => {
            state.user = null;
            state.role = 'POC'; // Downgrade role on logout
        },
        login: (state, action: PayloadAction<{ role: Role, name: string }>) => {
            state.role = action.payload.role;
            state.user = {
                name: action.payload.name,
                email: `${action.payload.name.toLowerCase().replace(' ', '.')}@omnipark.com`,
                avatar: `https://i.pravatar.cc/150?u=${action.payload.name}`,
            };
        }
    },
});

export const { setRole, logout, login } = authSlice.actions;
export default authSlice.reducer;
