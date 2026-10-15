"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, UserPlus, X } from "lucide-react";
import friendApi from "@/lib/api/friend.api";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import { setFriendRequestsOpen } from "@/lib/redux/slices/uiSlice";
import { FriendRequest } from "@/lib/types";
import { extractNullableString } from "@/lib/utils";

export const FriendRequestsModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const isOpen = useAppSelector((state) => state.ui.isFriendRequestsOpen);

  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");

  const { data: receivedData, isLoading: loadingReceived } = useQuery({
    queryKey: ["friend_requests_received"],
    queryFn: () => friendApi.getReceivedRequests(),
    enabled: isOpen,
  });

  const { data: sentData, isLoading: loadingSent } = useQuery({
    queryKey: ["friend_requests_sent"],
    queryFn: () => friendApi.getSentRequests(),
    enabled: isOpen,
  });

  const acceptMutation = useMutation({
    mutationFn: (requestId: number) => friendApi.acceptRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend_requests_received"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: number) => friendApi.rejectRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend_requests_received"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (requestId: number) => friendApi.cancelRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend_requests_sent"] });
    },
  });

  if (!isOpen) return null;

  const receivedRequests: FriendRequest[] =
    receivedData?.data?.data?.friend_requests || [];
  const sentRequests: FriendRequest[] =
    sentData?.data?.data?.friend_requests || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md bg-card p-5 border shadow-xl relative animate-in fade-in zoom-in-95">
        <button
          type="button"
          onClick={() => dispatch(setFriendRequestsOpen(false))}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <UserPlus size={20} className="text-primary" />
          <h2 className="text-base font-bold">Friend Requests</h2>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("received")}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "received"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Received ({receivedRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sent")}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "sent"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Sent ({sentRequests.length})
          </button>
        </div>

        {/* Content list */}
        <div className="max-h-72 overflow-y-auto flex flex-col gap-3 pr-1">
          {activeTab === "received" ? (
            loadingReceived ? (
              <p className="text-xs text-center py-4 text-muted-foreground">
                Loading requests...
              </p>
            ) : receivedRequests.length === 0 ? (
              <p className="text-xs text-center py-8 text-muted-foreground">
                No pending received friend requests.
              </p>
            ) : (
              receivedRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-2 rounded-lg border bg-muted/20"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={extractNullableString(req.sender?.avatar)} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {req.sender?.name?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {req.sender?.name || `User #${req.sender_id}`}
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      className="h-7 px-2.5 text-xs bg-primary text-primary-foreground flex items-center gap-1"
                      disabled={acceptMutation.isPending}
                      onClick={() => acceptMutation.mutate(req.id)}
                    >
                      <Check size={12} /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-xs text-muted-foreground hover:text-red-500"
                      disabled={rejectMutation.isPending}
                      onClick={() => rejectMutation.mutate(req.id)}
                    >
                      <X size={12} /> Reject
                    </Button>
                  </div>
                </div>
              ))
            )
          ) : loadingSent ? (
            <p className="text-xs text-center py-4 text-muted-foreground">
              Loading requests...
            </p>
          ) : sentRequests.length === 0 ? (
            <p className="text-xs text-center py-8 text-muted-foreground">
              No sent friend requests pending.
            </p>
          ) : (
            sentRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-2 rounded-lg border bg-muted/20"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={extractNullableString(req.receiver?.avatar)} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {req.receiver?.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {req.receiver?.name || `User #${req.receiver_id}`}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      Pending acceptance
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-xs text-muted-foreground hover:text-red-500"
                  disabled={cancelMutation.isPending}
                  onClick={() => cancelMutation.mutate(req.id)}
                >
                  Cancel
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
