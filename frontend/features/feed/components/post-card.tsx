"use client";

import React, { useState } from "react";
import { InfiniteData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Globe,
  Lock,
  MessageSquare,
  MoreHorizontal,
  Share2,
  ThumbsUp,
  Trash2,
  Users,
} from "lucide-react";
import { ApiResponse, Post, ReactionType } from "@/lib/types";
import postApi from "@/lib/api/post.api";
import reactionApi from "@/lib/api/reaction.api";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import { setEditingPostId } from "@/lib/redux/slices/uiSlice";
import { CommentSection } from "@/features/comments/components/comment-section";
import { extractNullableString } from "@/lib/utils";
import uploadApi from "@/lib/api/upload.api";

const REACTIONS_CONFIG: Array<{
  type: ReactionType;
  emoji: string;
  label: string;
  color: string;
}> = [
  { type: "like", emoji: "👍", label: "Like", color: "text-blue-500" },
  { type: "love", emoji: "❤️", label: "Love", color: "text-rose-500" },
  { type: "haha", emoji: "😆", label: "Haha", color: "text-amber-500" },
  { type: "wow", emoji: "😮", label: "Wow", color: "text-yellow-500" },
  { type: "sad", emoji: "😢", label: "Sad", color: "text-amber-600" },
  { type: "angry", emoji: "😡", label: "Angry", color: "text-red-500" },
];

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [showComments, setShowComments] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  // Fetch current user's active reaction for this post
  const { data: reactionData } = useQuery({
    queryKey: ["reaction", post.id],
    queryFn: () => reactionApi.getReaction(post.id),
  });

  const currentReaction: ReactionType | null =
    reactionData?.data?.data?.reaction?.type || null;

  // Optimistic reaction mutation
  const reactionMutation = useMutation({
    mutationFn: (type: ReactionType) =>
      reactionApi.createOrUpdateReaction(post.id, type),
    onMutate: async (newType) => {
      await queryClient.cancelQueries({ queryKey: ["reaction", post.id] });
      await queryClient.cancelQueries({ queryKey: ["feed"] });

      const prevReaction = queryClient.getQueryData(["reaction", post.id]);

      // Optimistically update single reaction query
      queryClient.setQueryData(["reaction", post.id], {
        data: {
          data: {
            reaction: currentReaction === newType ? null : { type: newType },
          },
        },
      });

      type FeedQueryData = InfiniteData<AxiosResponse<ApiResponse<{ posts: Post[] }>>>;

      // Optimistically update post in feed cache
      queryClient.setQueriesData<FeedQueryData>({ queryKey: ["feed"] }, (oldData) => {
        if (!oldData || !oldData.pages) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            data: {
              ...page.data,
              data: {
                ...page.data.data,
                posts: page.data.data.posts.map((p: Post) => {
                  if (p.id !== post.id) return p;

                  const updated = { ...p };

                  // Decrement previous if existed
                  if (currentReaction) {
                    const key = `${currentReaction}_count` as keyof Post;
                    if (typeof updated[key] === "number") {
                      (updated[key] as number) = Math.max(
                        0,
                        (updated[key] as number) - 1
                      );
                    }
                  }

                  // Increment new if not toggling off
                  if (currentReaction !== newType) {
                    const key = `${newType}_count` as keyof Post;
                    if (typeof updated[key] === "number") {
                      (updated[key] as number) =
                        ((updated[key] as number) || 0) + 1;
                    }
                  }

                  return updated;
                }),
              },
            },
          })),
        };
      });

      return { prevReaction };
    },
    onError: (_err, _newType, context) => {
      if (context?.prevReaction) {
        queryClient.setQueryData(["reaction", post.id], context.prevReaction);
      }
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["reaction", post.id] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  // Delete post mutation
  const deleteMutation = useMutation({
    mutationFn: () => postApi.deletePost(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const isAuthor = post.author_id === user?.id;
  const isCustomBg = post.background_color && post.background_color !== "#ffffff";

  const totalReactions =
    (post.like_count || 0) +
    (post.love_count || 0) +
    (post.haha_count || 0) +
    (post.wow_count || 0) +
    (post.sad_count || 0) +
    (post.angry_count || 0);

  const activeReactionConfig = REACTIONS_CONFIG.find(
    (r) => r.type === currentReaction
  );

  let mediaList: string[] = [];
  if (Array.isArray(post.media_files)) {
    mediaList = post.media_files;
  } else if (typeof post.media_files === "string") {
    try {
      const parsed = JSON.parse(post.media_files);
      if (Array.isArray(parsed)) mediaList = parsed;
    } catch {}
  }

  return (
    <Card className="shadow-sm border bg-card overflow-hidden flex flex-col gap-3 p-4">
      {/* Post Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={extractNullableString(post.author?.avatar)} />
            <AvatarFallback className="font-semibold bg-primary/10 text-primary">
              {post.author?.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div>
            <span className="font-semibold text-sm hover:underline cursor-pointer block">
              {post.author?.name || "User"}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{new Date(post.created_at).toLocaleDateString()}</span>
              <span>•</span>
              {post.privacy === "public" && (
                <span title="Public">
                  <Globe size={12} className="text-blue-500" />
                </span>
              )}
              {post.privacy === "friends" && (
                <span title="Friends only">
                  <Users size={12} className="text-green-500" />
                </span>
              )}
              {post.privacy === "private" && (
                <span title="Only me">
                  <Lock size={12} className="text-amber-500" />
                </span>
              )}
            </div>
          </div>
        </div>

        {isAuthor && (
          <DropdownMenu>
            <DropdownMenuTrigger className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer">
              <MoreHorizontal size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => dispatch(setEditingPostId(post.id))}
                className="cursor-pointer"
              >
                Edit post
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => deleteMutation.mutate()}
                className="text-red-500 focus:text-red-500 cursor-pointer"
              >
                <Trash2 size={14} className="mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Post Content */}
      <div
        className={`rounded-lg ${
          isCustomBg
            ? "min-h-[160px] flex items-center justify-center p-6 text-center text-white font-semibold text-lg shadow-inner"
            : "text-sm text-foreground whitespace-pre-wrap leading-relaxed"
        }`}
        style={isCustomBg ? { background: post.background_color } : {}}
      >
        <p>{post.content}</p>
      </div>

      {/* Attached Media Gallery */}
      {mediaList.length > 0 && (
        <div
          className={`grid gap-2 rounded-lg overflow-hidden ${
            mediaList.length === 1
              ? "grid-cols-1"
              : mediaList.length === 2
              ? "grid-cols-2"
              : "grid-cols-2 sm:grid-cols-3"
          }`}
        >
          {mediaList.map((url, idx) => {
            const fullUrl = uploadApi.getFullMediaUrl(url);
            const isVideo =
              url.toLowerCase().endsWith(".mp4") ||
              url.toLowerCase().endsWith(".webm") ||
              url.toLowerCase().endsWith(".mov") ||
              url.toLowerCase().endsWith(".ogg");

            if (isVideo) {
              return (
                <div
                  key={idx}
                  className="col-span-full rounded-lg overflow-hidden bg-black"
                >
                  <video
                    src={fullUrl}
                    controls
                    className="w-full max-h-[420px] object-contain"
                  />
                </div>
              );
            }

            return (
              <div
                key={idx}
                className="relative rounded-lg overflow-hidden bg-muted/40 max-h-[340px] flex items-center justify-center border"
              >
                <img
                  src={fullUrl}
                  alt={`Attachment ${idx + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                  onClick={() => window.open(fullUrl, "_blank")}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Reactions Count Breakdown Bar */}
      {totalReactions > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 px-1">
          <div className="flex items-center gap-1">
            <span className="flex -space-x-1">
              {post.like_count > 0 && <span>👍</span>}
              {post.love_count > 0 && <span>❤️</span>}
              {post.haha_count > 0 && <span>😆</span>}
              {post.wow_count > 0 && <span>😮</span>}
              {post.sad_count > 0 && <span>😢</span>}
              {post.angry_count > 0 && <span>😡</span>}
            </span>
            <span className="font-medium ml-1">{totalReactions}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="hover:underline cursor-pointer"
          >
            Comments
          </button>
        </div>
      )}

      {/* Interaction Buttons Bar */}
      <div className="border-t border-b py-1 flex items-center justify-between relative mt-1">
        {/* Hover/Click Reactions Menu */}
        {showReactionPicker && (
          <div
            onMouseLeave={() => setShowReactionPicker(false)}
            className="absolute bottom-full left-0 mb-1 flex items-center gap-2 bg-popover text-popover-foreground border shadow-xl rounded-full px-3 py-1.5 z-20 animate-in fade-in zoom-in-95 duration-150"
          >
            {REACTIONS_CONFIG.map((r) => (
              <button
                key={r.type}
                type="button"
                onClick={() => {
                  reactionMutation.mutate(r.type);
                  setShowReactionPicker(false);
                }}
                className="hover:scale-125 transition-transform text-xl px-1 cursor-pointer"
                title={r.label}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        )}

        {/* Reaction trigger button */}
        <Button
          variant="ghost"
          size="sm"
          onMouseEnter={() => setShowReactionPicker(true)}
          onClick={() => reactionMutation.mutate(currentReaction || "like")}
          className={`flex-1 flex items-center justify-center gap-2 font-medium text-xs h-9 cursor-pointer ${
            activeReactionConfig
              ? activeReactionConfig.color
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {activeReactionConfig ? (
            <>
              <span className="text-base">{activeReactionConfig.emoji}</span>
              <span>{activeReactionConfig.label}</span>
            </>
          ) : (
            <>
              <ThumbsUp size={16} />
              <span>Like</span>
            </>
          )}
        </Button>

        {/* Comment toggle button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground h-9 cursor-pointer"
        >
          <MessageSquare size={16} />
          <span>Comment</span>
        </Button>

        {/* Share button */}
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground h-9 cursor-pointer"
          onClick={() => {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(window.location.href);
              alert("Post link copied to clipboard!");
            }
          }}
        >
          <Share2 size={16} />
          <span>Share</span>
        </Button>
      </div>

      {/* Expandable Comments Section */}
      {showComments && (
        <CommentSection postId={post.id} postAuthorId={post.author_id} />
      )}
    </Card>
  );
};
