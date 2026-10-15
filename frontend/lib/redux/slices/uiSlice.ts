import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UiState {
  isCreatePostOpen: boolean;
  editingPostId: number | null;
  isSearchOpen: boolean;
  isFriendRequestsOpen: boolean;
  isEditProfileOpen: boolean;
}

const initialState: UiState = {
  isCreatePostOpen: false,
  editingPostId: null,
  isSearchOpen: false,
  isFriendRequestsOpen: false,
  isEditProfileOpen: false,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setCreatePostOpen: (state, action: PayloadAction<boolean>) => {
      state.isCreatePostOpen = action.payload;
    },
    setEditingPostId: (state, action: PayloadAction<number | null>) => {
      state.editingPostId = action.payload;
    },
    setSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.isSearchOpen = action.payload;
    },
    setFriendRequestsOpen: (state, action: PayloadAction<boolean>) => {
      state.isFriendRequestsOpen = action.payload;
    },
    setEditProfileOpen: (state, action: PayloadAction<boolean>) => {
      state.isEditProfileOpen = action.payload;
    },
  },
});

export const {
  setCreatePostOpen,
  setEditingPostId,
  setSearchOpen,
  setFriendRequestsOpen,
  setEditProfileOpen,
} = uiSlice.actions;

export default uiSlice.reducer;
