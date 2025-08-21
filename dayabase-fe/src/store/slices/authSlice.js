import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API } from "axios/axios";

// Token verify
export const verifyToken = createAsyncThunk(
  "auth/verifyToken",
  async (_, { rejectWithValue }) => {
    try {
      // men-decode token dan mengembalikan data user yang valid.
      const response = await API.get("/api/auth/me");
      return response.data;
    } catch (error) {
      // Jika token tidak valid, backend akan mengembalikan error (misal: 401)
      return rejectWithValue(error.response.data);
    }
  }
);

const token = localStorage.getItem("authToken");

const initialState = {
  user: null,
  token: token || null,
  isAuthenticated: false,
  isAuthLoading: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem("authToken", token);
    },
    logOut: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem("authToken");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(verifyToken.pending, (state) => {
        state.isAuthLoading = true;
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isAuthLoading = false;
      })
      .addCase(verifyToken.rejected, (state) => {
        // Jika verifikasi gagal, pastikan semua state bersih
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isAuthLoading = false;
        localStorage.removeItem("authToken");
      });
  },
});

export const { setCredentials, logOut } = authSlice.actions;
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAdmin = (state) => state.auth.user?.role === "ADMIN";

export default authSlice.reducer;
