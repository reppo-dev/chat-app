import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ChatState {
  activeConversationId: number | null;
  openChatIds: number[];
  unreadCounts: Record<number, number>;
  isNewConversationOpen: boolean;
}

const initialState: ChatState = {
  activeConversationId: null,
  openChatIds: [],
  unreadCounts: {},
  isNewConversationOpen: false,
};

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveConversation: (state, action: PayloadAction<number | null>) => {
      state.activeConversationId = action.payload;
      if (action.payload && !state.openChatIds.includes(action.payload)) {
        state.openChatIds.push(action.payload);
      }
      if (action.payload) {
        state.unreadCounts[action.payload] = 0;
      }
    },
    openChat: (state, action: PayloadAction<number>) => {
      if (!state.openChatIds.includes(action.payload)) {
        // Keep max 3 open floating chat windows
        if (state.openChatIds.length >= 3) {
          state.openChatIds.shift();
        }
        state.openChatIds.push(action.payload);
      }
      state.activeConversationId = action.payload;
      state.unreadCounts[action.payload] = 0;
    },
    closeChat: (state, action: PayloadAction<number>) => {
      state.openChatIds = state.openChatIds.filter((id) => id !== action.payload);
      if (state.activeConversationId === action.payload) {
        state.activeConversationId = state.openChatIds[state.openChatIds.length - 1] || null;
      }
    },
    incrementUnread: (state, action: PayloadAction<number>) => {
      const convId = action.payload;
      if (state.activeConversationId !== convId) {
        state.unreadCounts[convId] = (state.unreadCounts[convId] || 0) + 1;
      }
    },
    clearUnread: (state, action: PayloadAction<number>) => {
      state.unreadCounts[action.payload] = 0;
    },
    setNewConversationOpen: (state, action: PayloadAction<boolean>) => {
      state.isNewConversationOpen = action.payload;
    },
  },
});

export const {
  setActiveConversation,
  openChat,
  closeChat,
  incrementUnread,
  clearUnread,
  setNewConversationOpen,
} = chatSlice.actions;

export default chatSlice.reducer;
