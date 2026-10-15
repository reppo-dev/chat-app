"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Globe, Lock, Users, X } from "lucide-react";
import postApi from "@/lib/api/post.api";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import { setEditingPostId } from "@/lib/redux/slices/uiSlice";
import { PostPrivacy } from "@/lib/types";

export const EditPostDialog: React.FC = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const editingPostId = useAppSelector((state) => state.ui.editingPostId);

  const [content, setContent] = useState("");
  const [privacy, setPrivacy] = useState<PostPrivacy>("public");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");

  const { data } = useQuery({
    queryKey: ["post", editingPostId],
    queryFn: () => postApi.getPost(editingPostId!),
    enabled: !!editingPostId,
  });

  useEffect(() => {
    if (data?.data?.data?.post) {
      const p = data.data.data.post;
      setContent(p.content);
      setPrivacy(p.privacy);
      setBackgroundColor(p.background_color || "#ffffff");
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: () =>
      postApi.updatePost(editingPostId!, {
        content,
        privacy,
        background_color: backgroundColor,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["post", editingPostId] });
      dispatch(setEditingPostId(null));
    },
  });

  if (!editingPostId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg bg-card p-5 border shadow-xl relative animate-in fade-in zoom-in-95">
        <button
          type="button"
          onClick={() => dispatch(setEditingPostId(null))}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-bold mb-4">Edit Post</h2>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-muted-foreground font-medium">Privacy:</span>
          <div className="flex items-center gap-1 bg-muted rounded-md px-2 py-1 text-xs border">
            {privacy === "public" && <Globe size={12} className="text-blue-500" />}
            {privacy === "friends" && <Users size={12} className="text-green-500" />}
            {privacy === "private" && <Lock size={12} className="text-amber-500" />}
            <select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value as PostPrivacy)}
              className="bg-transparent text-xs focus:outline-none cursor-pointer"
            >
              <option value="public">Public</option>
              <option value="friends">Friends</option>
              <option value="private">Only Me</option>
            </select>
          </div>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full min-h-[120px] rounded-md border bg-muted/20 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary mb-4"
        />

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch(setEditingPostId(null))}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!content.trim() || updateMutation.isPending}
            onClick={() => updateMutation.mutate()}
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Card>
    </div>
  );
};
