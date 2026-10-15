"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  Edit,
  Mail,
  MessageSquare,
  Phone,
  Users,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import { setEditProfileOpen } from "@/lib/redux/slices/uiSlice";
import { openChat } from "@/lib/redux/slices/chatSlice";
import postApi from "@/lib/api/post.api";
import friendApi from "@/lib/api/friend.api";
import conversationApi from "@/lib/api/conversation.api";
import { PostCard } from "@/features/feed/components/post-card";
import { Post, User } from "@/lib/types";
import {
  extractNullableString,
  formatDisplayDate,
} from "@/lib/utils";

const ProfilePage = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const onlineUserIds = useAppSelector((state) => state.realtime.onlineUserIds);

  const [activeTab, setActiveTab] = useState<"posts" | "friends">("posts");

  // Fetch user posts
  const { data: postsData, isLoading: loadingPosts } = useQuery({
    queryKey: ["user_posts", currentUser?.id],
    queryFn: () => postApi.getUserPosts(currentUser!.id, 50),
    enabled: !!currentUser?.id,
  });

  // Fetch user friends
  const { data: friendsData, isLoading: loadingFriends } = useQuery({
    queryKey: ["friends", currentUser?.id],
    queryFn: () => friendApi.getFriends(currentUser?.id),
    enabled: !!currentUser?.id,
  });

  const posts: Post[] = postsData?.data?.data?.posts || [];
  const friends: User[] = friendsData?.data?.data?.friends || [];

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
      console.error(err);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const userAvatar = extractNullableString(currentUser.avatar);
  const userBio = extractNullableString(currentUser.bio);
  const userPhone = extractNullableString(currentUser.phone_number);
  const userBirthdate = formatDisplayDate(currentUser.birthdate);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 flex flex-col gap-6">
      {/* Cover & Profile Header Card */}
      <Card className="overflow-hidden border shadow-sm bg-card">
        {/* Banner */}
        <div className="h-44 sm:h-56 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative" />

        <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
            <div className="relative">
              <Avatar className="h-28 w-28 sm:h-32 sm:w-32 ring-4 ring-card shadow-lg">
                <AvatarImage src={userAvatar} />
                <AvatarFallback className="text-3xl font-bold bg-primary text-primary-foreground">
                  {currentUser.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-2 right-2 h-4 w-4 rounded-full bg-green-500 ring-2 ring-card" />
            </div>

            <div className="text-center sm:text-left space-y-1">
              <h1 className="text-2xl font-bold text-foreground">
                {currentUser.name}
              </h1>
              <p className="text-xs text-muted-foreground">{currentUser.email}</p>
              {userBio && (
                <p className="text-xs text-muted-foreground/90 max-w-md pt-1">
                  {userBio}
                </p>
              )}
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => dispatch(setEditProfileOpen(true))}
            className="flex items-center gap-1.5 self-center sm:self-end"
          >
            <Edit size={14} />
            Edit Profile
          </Button>
        </div>

        {/* Info stats bar */}
        <div className="border-t px-6 py-3 bg-muted/20 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users size={14} />
            <span>
              <strong className="text-foreground">{friends.length}</strong> Friends
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Mail size={14} />
            <span>{currentUser.email}</span>
          </div>

          {userPhone && (
            <div className="flex items-center gap-1.5">
              <Phone size={14} />
              <span>{userPhone}</span>
            </div>
          )}

          {userBirthdate && (
            <div className="flex items-center gap-1.5">
              <Calendar size={14} />
              <span>{userBirthdate}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          type="button"
          onClick={() => setActiveTab("posts")}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === "posts"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Posts ({posts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("friends")}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === "friends"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Friends ({friends.length})
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "posts" ? (
        <div className="flex flex-col gap-4">
          {loadingPosts ? (
            <p className="text-center text-xs py-8 text-muted-foreground">
              Loading posts...
            </p>
          ) : posts.length === 0 ? (
            <Card className="p-8 text-center text-xs text-muted-foreground">
              You haven&apos;t shared any posts yet.
            </Card>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {loadingFriends ? (
            <p className="text-center text-xs py-8 text-muted-foreground col-span-full">
              Loading friends...
            </p>
          ) : friends.length === 0 ? (
            <Card className="p-8 text-center text-xs text-muted-foreground col-span-full">
              No friends in your list yet.
            </Card>
          ) : (
            friends.map((friend) => {
              const isOnline = onlineUserIds.includes(friend.id);
              const friendAvatar = extractNullableString(friend.avatar);

              return (
                <Card
                  key={friend.id}
                  className="p-3 border flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={friendAvatar} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {friend.name?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-card" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{friend.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {isOnline ? "Online" : "Offline"}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 cursor-pointer"
                    onClick={() => handleStartChat(friend.id)}
                    title="Send message"
                  >
                    <MessageSquare size={14} />
                  </Button>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
