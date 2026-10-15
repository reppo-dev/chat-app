"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, X } from "lucide-react";
import userApi from "@/lib/api/user.api";
import friendApi from "@/lib/api/friend.api";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import { setSearchOpen } from "@/lib/redux/slices/uiSlice";
import { User } from "@/lib/types";
import { extractNullableString, getApiErrorMessage } from "@/lib/utils";

export const UserSearchDialog: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isSearchOpen);
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const onlineUserIds = useAppSelector((state) => state.realtime.onlineUserIds);

  const [searchTerm, setSearchTerm] = useState("");
  const [sentMap, setSentMap] = useState<Record<number, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["search_users", searchTerm],
    queryFn: () => userApi.searchUsers(searchTerm.trim()),
    enabled: isOpen && searchTerm.trim().length > 0,
  });

  const sendRequestMutation = useMutation({
    mutationFn: (targetUserId: number) =>
      friendApi.sendFriendRequest(targetUserId),
    onSuccess: (_data, targetUserId) => {
      setSentMap((prev) => ({ ...prev, [targetUserId]: true }));
    },
    onError: (err: unknown) => {
      alert(getApiErrorMessage(err, "Failed to send friend request"));
    },
  });

  if (!isOpen) return null;

  const users: User[] = (data?.data?.data?.users || []).filter(
    (u) => u.id !== currentUser?.id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md bg-card p-5 border shadow-xl relative animate-in fade-in zoom-in-95">
        <button
          type="button"
          onClick={() => dispatch(setSearchOpen(false))}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X size={18} />
        </button>

        <h2 className="text-base font-bold mb-3">Find People</h2>

        <div className="relative mb-4">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name..."
            className="pl-9 text-xs"
            autoFocus
          />
        </div>

        <div className="max-h-72 overflow-y-auto flex flex-col gap-2 pr-1">
          {isLoading ? (
            <p className="text-xs text-center py-6 text-muted-foreground">
              Searching...
            </p>
          ) : searchTerm.trim().length === 0 ? (
            <p className="text-xs text-center py-6 text-muted-foreground">
              Type a name above to search for people.
            </p>
          ) : users.length === 0 ? (
            <p className="text-xs text-center py-6 text-muted-foreground">
              No users found matching &quot;{searchTerm}&quot;.
            </p>
          ) : (
            users.map((u) => {
              const isOnline = onlineUserIds.includes(u.id);
              const isSent = !!sentMap[u.id];

              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2 rounded-lg border bg-muted/20"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={extractNullableString(u.avatar)} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {u.name?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {u.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                        {u.email}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={isSent ? "outline" : "default"}
                    disabled={isSent || sendRequestMutation.isPending}
                    onClick={() => sendRequestMutation.mutate(u.id)}
                    className="h-7 text-xs px-2.5 flex items-center gap-1"
                  >
                    <UserPlus size={12} />
                    {isSent ? "Sent" : "Add Friend"}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
};
