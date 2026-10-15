import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface RealtimeState {
  isConnected: boolean;
  onlineUserIds: number[];
  typingUsers: Record<number, { userId: number; userName: string }[]>;
}

const initialState: RealtimeState = {
  isConnected: false,
  onlineUserIds: [],
  typingUsers: {},
};

export const realtimeSlice = createSlice({
  name: "realtime",
  initialState,
  reducers: {
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setOnlineUsers: (state, action: PayloadAction<number[]>) => {
      state.onlineUserIds = action.payload;
    },
    userConnected: (state, action: PayloadAction<number>) => {
      if (!state.onlineUserIds.includes(action.payload)) {
        state.onlineUserIds.push(action.payload);
      }
    },
    userDisconnected: (state, action: PayloadAction<number>) => {
      state.onlineUserIds = state.onlineUserIds.filter(
        (id) => id !== action.payload
      );
    },
    setUserTyping: (
      state,
      action: PayloadAction<{
        conversationId: number;
        userId: number;
        userName: string;
        isTyping: boolean;
      }>
    ) => {
      const { conversationId, userId, userName, isTyping } = action.payload;
      const current = state.typingUsers[conversationId] || [];

      if (isTyping) {
        if (!current.some((u) => u.userId === userId)) {
          state.typingUsers[conversationId] = [
            ...current,
            { userId, userName },
          ];
        }
      } else {
        state.typingUsers[conversationId] = current.filter(
          (u) => u.userId !== userId
        );
      }
    },
  },
});

export const {
  setConnected,
  setOnlineUsers,
  userConnected,
  userDisconnected,
  setUserTyping,
} = realtimeSlice.actions;

export default realtimeSlice.reducer;
