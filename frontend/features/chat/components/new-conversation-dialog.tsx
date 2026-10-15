"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquarePlus, X } from "lucide-react";
import friendApi from "@/lib/api/friend.api";
import conversationApi from "@/lib/api/conversation.api";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import {
  openChat,
  setNewConversationOpen,
} from "@/lib/redux/slices/chatSlice";
import { User } from "@/lib/types";
import { extractNullableString } from "@/lib/utils";

export const NewConversationDialog: React.FC = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const isOpen = useAppSelector((state) => state.chat.isNewConversationOpen);

  const [selectedFriendIds, setSelectedFriendIds] = useState<number[]>([]);
  const [groupName, setGroupName] = useState("");

  const { data } = useQuery({
    queryKey: ["friends"],
    queryFn: () => friendApi.getFriends(),
    enabled: isOpen,
  });

  const friends: User[] = data?.data?.data?.friends || [];

  const toggleSelectFriend = (id: number) => {
    if (selectedFriendIds.includes(id)) {
      setSelectedFriendIds(selectedFriendIds.filter((fId) => fId !== id));
    } else {
      setSelectedFriendIds([...selectedFriendIds, id]);
    }
  };

  const createMutation = useMutation({
    mutationFn: () => {
      const isGroup = selectedFriendIds.length > 1;
      return conversationApi.createConversation({
        conversation_type: isGroup ? "group" : "direct",
        member_ids: selectedFriendIds,
        group_name: isGroup ? groupName.trim() || "New Group" : undefined,
      });
    },
    onSuccess: (res) => {
      const conv = res.data?.data?.conversation;
      if (conv) {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        dispatch(openChat(conv.id));
        dispatch(setNewConversationOpen(false));
        setSelectedFriendIds([]);
        setGroupName("");
      }
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md bg-card p-5 border shadow-xl relative animate-in fade-in zoom-in-95">
        <button
          type="button"
          onClick={() => dispatch(setNewConversationOpen(false))}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <MessageSquarePlus size={20} className="text-primary" />
          <h2 className="text-base font-bold">New Message</h2>
        </div>

        {selectedFriendIds.length > 1 && (
          <div className="mb-3">
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name (optional)..."
              className="text-xs h-8"
            />
          </div>
        )}

        <p className="text-xs text-muted-foreground mb-2">
          Select friends to start a chat:
        </p>

        <div className="max-h-64 overflow-y-auto flex flex-col gap-1 pr-1 mb-4">
          {friends.length === 0 ? (
            <p className="text-xs text-center py-6 text-muted-foreground">
              You need to add friends first before starting a chat.
            </p>
          ) : (
            friends.map((friend) => {
              const isSelected = selectedFriendIds.includes(friend.id);

              return (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() => toggleSelectFriend(friend.id)}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                    isSelected
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-muted/20 border-transparent hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={extractNullableString(friend.avatar)} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {friend.name?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-semibold text-foreground">
                      {friend.name}
                    </span>
                  </div>

                  <span
                    className={`h-4 w-4 rounded border flex items-center justify-center text-[10px] ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-muted-foreground"
                    }`}
                  >
                    {isSelected ? "✓" : ""}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch(setNewConversationOpen(false))}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={
              selectedFriendIds.length === 0 || createMutation.isPending
            }
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending
              ? "Starting..."
              : selectedFriendIds.length > 1
              ? "Create Group Chat"
              : "Start Chat"}
          </Button>
        </div>
      </Card>
    </div>
  );
};
