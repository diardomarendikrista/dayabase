import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import toastReducer from "./slices/toastSlice";
import collectionsReducer from "./slices/collectionsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    toast: toastReducer,
    collections: collectionsReducer,
  },
});
