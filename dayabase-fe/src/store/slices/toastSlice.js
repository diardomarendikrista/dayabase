import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  toasts: [], // Array untuk menyimpan semua notifikasi
};

const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    // Action untuk menambahkan toast baru
    addToast: (state, action) => {
      const { message, type = "success" } = action.payload;
      const id = Date.now() + Math.random();
      state.toasts.push({ id, message, type });
    },
    // Action untuk menghapus toast
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter(
        (toast) => toast.id !== action.payload.id
      );
    },
  },
});

// Ekspor actions agar bisa digunakan di komponen lain
export const { addToast, removeToast } = toastSlice.actions;

// Ekspor reducer
export default toastSlice.reducer;
