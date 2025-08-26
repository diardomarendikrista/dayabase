import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API } from "axios/axios"; // Pastikan path ini benar

// Thunk untuk mengambil semua koleksi
export const fetchCollections = createAsyncThunk(
  "collections/fetchCollections",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/api/collections");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Thunk untuk membuat koleksi baru
export const createCollection = createAsyncThunk(
  "collections/createCollection",
  async (collectionData, { rejectWithValue }) => {
    try {
      const response = await API.post("/api/collections", collectionData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Thunk untuk edit koleksi
export const updateCollection = createAsyncThunk(
  "collections/updateCollection",
  async ({ id, name, description }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/api/collections/${id}`, {
        name,
        description,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Thunk untuk menghapus koleksi
export const deleteCollection = createAsyncThunk(
  "collections/deleteCollection",
  async (collectionId, { rejectWithValue }) => {
    try {
      await API.delete(`/api/collections/${collectionId}`);
      return collectionId; // Kirim kembali ID yang dihapus untuk update state
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  items: [],
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const collectionsSlice = createSlice({
  name: "collections",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Collections
      .addCase(fetchCollections.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCollections.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchCollections.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Create Collection
      .addCase(createCollection.fulfilled, (state, action) => {
        state.items.push(action.payload);
        state.items.sort((a, b) => a.name.localeCompare(b.name));
      })
      // Update Collection
      .addCase(updateCollection.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
          state.items.sort((a, b) => a.name.localeCompare(b.name));
        }
      })
      // Delete Collection
      .addCase(deleteCollection.fulfilled, (state, action) => {
        // Hapus koleksi dari state berdasarkan ID
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export default collectionsSlice.reducer;
