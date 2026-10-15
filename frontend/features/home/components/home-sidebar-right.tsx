"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, Users } from "lucide-react";
import friendApi from "@/lib/api/friend.api";
import conversationApi from "@/lib/api/conversation.api";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import { openChat } from "@/lib/redux/slices/chatSlice";
import {
  setFriendRequestsOpen,
  setSearchOpen,
} from "@/lib/redux/slices/uiSlice";
import { User } from "@/lib/types";
import { extractNullableString } from "@/lib/utils";

export function RightHomeSidebar() {
  const dispatch = useAppDispatch();
  const onlineUserIds = useAppSelector((state) => state.realtime.onlineUserIds);

  const { data, isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: () => friendApi.getFriends(),
  });

  const { data: pendingReqData } = useQuery({
    queryKey: ["friend_requests_received"],
    queryFn: () => friendApi.getReceivedRequests(),
  });

  const pendingCount =
    pendingReqData?.data?.data?.friend_requests?.length || 0;

  const friends: User[] = data?.data?.data?.friends || [];

  const handleStartChat = async (friendId: number) => {
    try {
      const res = await conversationApi.createConversation({
        conversation_type: "direct",
        member_ids: [friendId],
      });
      const conv = res.data?.data?.conversation;
      if (conv) {
        dispatch(openChat(conv.id));
      }
    } catch (err) {
      console.error("Failed to start chat with friend:", err);
    }
  };

  return (
    <aside className="w-64 h-[calc(100vh-4rem)] sticky top-16 hidden lg:flex flex-col border-l bg-card p-3 gap-3">
      {/* Action shortcuts */}
      <div className="flex items-center justify-between gap-1 pb-2 border-b">
        <Button
          variant="outline"
          size="sm"
          onClick={() => dispatch(setSearchOpen(true))}
          className="flex-1 h-8 text-xs flex items-center justify-center gap-1.5 font-medium"
        >
          <Search size={13} />
          Find People
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => dispatch(setFriendRequestsOpen(true))}
          className="h-8 px-2.5 text-xs relative"
          title="Friend Requests"
        >
          <UserPlus size={14} />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {pendingCount}
            </span>
          )}
        </Button>
      </div>

      {/* Friends list title */}
      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
        <span>Contacts</span>
        <span>{friends.length}</span>
      </div>

      {/* Friends list */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : friends.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground flex flex-col items-center gap-2">
            <Users size={28} className="opacity-40" />
            <p>No friends added yet.</p>
            <Button
              variant="link"
              size="sm"
              onClick={() => dispatch(setSearchOpen(true))}
              className="text-xs h-auto p-0"
            >
              Search for friends
            </Button>
          </div>
        ) : (
          friends.map((friend) => {
            const isOnline = onlineUserIds.includes(friend.id);

            return (
              <button
                key={friend.id}
                type="button"
                onClick={() => handleStartChat(friend.id)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left w-full group"
              >
                <div className="relative">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={extractNullableString(friend.avatar)} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                      {friend.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-card" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {friend.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {isOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
