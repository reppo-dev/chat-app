"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CornerDownRight, Send, Trash2, X } from "lucide-react";
import commentApi from "@/lib/api/comment.api";
import { useAppSelector } from "@/lib/redux/store";
import { Comment } from "@/lib/types";
import { extractNullableString } from "@/lib/utils";

interface CommentSectionProps {
  postId: number;
  postAuthorId: number;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  postAuthorId,
}) => {
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);

  const [text, setText] = useState("");
  const [replyTarget, setReplyTarget] = useState<{
    commentId: number;
    userId: number;
    userName: string;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => commentApi.getPostComments(postId),
  });

  const comments: Comment[] = data?.data?.data?.comments || [];

  const createMutation = useMutation({
    mutationFn: () =>
      commentApi.createComment(postId, {
        content: text.trim(),
        parent_id: replyTarget?.commentId || null,
        reply_to_user_id: replyTarget?.userId || null,
      }),
    onSuccess: () => {
      setText("");
      setReplyTarget(null);
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: number) => commentApi.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    createMutation.mutate();
  };

  return (
    <div className="border-t pt-3 flex flex-col gap-3">
      {/* Input area */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
        {replyTarget && (
          <div className="flex items-center justify-between bg-muted/60 px-3 py-1 rounded text-xs text-muted-foreground">
            <span>
              Replying to <b className="text-foreground">@{replyTarget.userName}</b>
            </span>
            <button
              type="button"
              onClick={() => setReplyTarget(null)}
              className="hover:text-foreground"
            >
              <X size={13} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={extractNullableString(user?.avatar)} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 flex items-center gap-2 relative">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment..."
              className="h-9 text-xs pr-9 bg-muted/30 focus-visible:ring-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!text.trim() || createMutation.isPending}
              className="h-7 w-7 absolute right-1 top-1 text-primary hover:bg-transparent"
              variant="ghost"
            >
              <Send size={14} />
            </Button>
          </div>
        </div>
      </form>

      {/* Comments listing */}
      {isLoading ? (
        <div className="flex justify-center py-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-2">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
          {comments.map((comment) => {
            const isAuthor = comment.user_id === user?.id;
            const canDelete = isAuthor || postAuthorId === user?.id;
            const isReply = !!comment.parent_id;

            return (
              <div
                key={comment.id}
                className={`flex gap-2.5 items-start text-xs ${
                  isReply ? "ml-6 border-l-2 border-muted pl-2.5" : ""
                }`}
              >
                <Avatar className="h-7 w-7 mt-0.5">
                  <AvatarImage src={extractNullableString(comment.user?.avatar)} />
                  <AvatarFallback className="text-[10px] bg-muted">
                    {comment.user?.name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="bg-muted/40 dark:bg-muted/20 rounded-xl px-3 py-2 inline-block max-w-full">
                    <span className="font-semibold block text-foreground">
                      {comment.user?.name || "User"}
                    </span>
                    <p className="text-muted-foreground mt-0.5 whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mt-1 ml-1 text-[11px] text-muted-foreground">
                    <span>
                      {new Date(comment.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setReplyTarget({
                          commentId: comment.id,
                          userId: comment.user_id,
                          userName: comment.user?.name || "User",
                        })
                      }
                      className="hover:text-foreground font-medium flex items-center gap-1"
                    >
                      <CornerDownRight size={11} /> Reply
                    </button>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(comment.id)}
                        className="hover:text-red-500 transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
