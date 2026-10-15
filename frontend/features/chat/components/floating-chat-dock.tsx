"use client";

import React from "react";
import { useAppSelector } from "@/lib/redux/store";
import { ChatWindow } from "./chat-window";

export const FloatingChatDock: React.FC = () => {
  const openChatIds = useAppSelector((state) => state.chat.openChatIds);

  if (openChatIds.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-4 z-40 flex items-end gap-3 pointer-events-none">
      {openChatIds.map((conversationId) => (
        <div key={conversationId} className="pointer-events-auto">
          <ChatWindow conversationId={conversationId} />
        </div>
      ))}
    </div>
  );
};
