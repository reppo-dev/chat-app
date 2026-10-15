import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "@/lib/types";
import { setStoredToken } from "@/lib/api";

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user?: User | null; token: string }>
    ) => {
      state.token = action.payload.token;
      if (action.payload.user) {
        state.user = action.payload.user;
      }
      state.isAuthenticated = true;
      state.isLoading = false;
      setStoredToken(action.payload.token);
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isLoading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      setStoredToken(null);
    },
  },
});

export const { setCredentials, setUser, setLoading, logout } =
  authSlice.actions;

export default authSlice.reducer;
