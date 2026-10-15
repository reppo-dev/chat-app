"use client";

import React, { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Globe,
  Image as ImageIcon,
  Loader2,
  Lock,
  Palette,
  Send,
  Users,
  Video,
  X,
} from "lucide-react";
import postApi, { CreatePostDto } from "@/lib/api/post.api";
import uploadApi from "@/lib/api/upload.api";
import { useAppSelector } from "@/lib/redux/store";
import { PostPrivacy } from "@/lib/types";
import { extractNullableString, getApiErrorMessage } from "@/lib/utils";

const COLOR_PRESETS = [
  { label: "Default", value: "#ffffff", className: "bg-background text-foreground" },
  { label: "Sunset", value: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", className: "bg-gradient-to-r from-pink-500 to-rose-500 text-white" },
  { label: "Ocean", value: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", className: "bg-gradient-to-r from-blue-500 to-cyan-400 text-white" },
  { label: "Neon", value: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", className: "bg-gradient-to-r from-emerald-400 to-teal-500 text-white" },
  { label: "Purple", value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", className: "bg-gradient-to-r from-indigo-500 to-purple-600 text-white" },
  { label: "Dark Night", value: "linear-gradient(135deg, #232526 0%, #414345 100%)", className: "bg-gradient-to-r from-zinc-800 to-zinc-950 text-white" },
];

interface SelectedFile {
  file: File;
  previewUrl: string;
  isVideo: boolean;
}

export const CreatePostCard: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);

  const [content, setContent] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [privacy, setPrivacy] = useState<PostPrivacy>("public");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: (dto: CreatePostDto) => postApi.createPost(dto),
    onSuccess: () => {
      setContent("");
      setBackgroundColor("#ffffff");
      setShowColorPicker(false);
      setSelectedFiles([]);
      setIsUploading(false);
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (err: unknown) => {
      setIsUploading(false);
      alert(getApiErrorMessage(err, "Failed to create post"));
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    const newSelected: SelectedFile[] = filesArray.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      isVideo: file.type.startsWith("video/"),
    }));

    setSelectedFiles((prev) => [...prev, ...newSelected]);
    // Reset custom background if user uploads photos/videos for better layout
    if (newSelected.length > 0) {
      setBackgroundColor("#ffffff");
      setShowColorPicker(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      const target = prev[index];
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && selectedFiles.length === 0) return;

    try {
      setIsUploading(true);
      let mediaUrls: string[] = [];

      // If files were selected, upload them first
      if (selectedFiles.length > 0) {
        const filesToUpload = selectedFiles.map((sf) => sf.file);
        const uploadRes = await uploadApi.uploadMultipleFiles(filesToUpload);
        if (uploadRes.data?.files) {
          mediaUrls = uploadRes.data.files.map((f) => f.url);
        }
      }

      mutation.mutate({
        content: content.trim(),
        background_color: backgroundColor,
        privacy,
        media_files: mediaUrls.length > 0 ? mediaUrls : null,
      });
    } catch (err: unknown) {
      setIsUploading(false);
      alert("Error uploading media files: " + getApiErrorMessage(err));
    }
  };

  const isCustomBg = backgroundColor !== "#ffffff";
  const selectedBgObj = COLOR_PRESETS.find((c) => c.value === backgroundColor);

  return (
    <Card className="p-4 shadow-sm border bg-card">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Author Header & Privacy Selection */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={extractNullableString(user?.avatar)} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-1">
            <span className="font-semibold text-xs text-foreground">
              {user?.name || "User"}
            </span>

            <div className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-md text-[11px] text-muted-foreground w-fit">
              {privacy === "public" && <Globe size={11} />}
              {privacy === "friends" && <Users size={11} />}
              {privacy === "private" && <Lock size={11} />}
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value as PostPrivacy)}
                className="bg-transparent border-none focus:outline-none cursor-pointer text-[11px]"
              >
                <option value="public">Public</option>
                <option value="friends">Friends</option>
                <option value="private">Only me</option>
              </select>
            </div>
          </div>
        </div>

        {/* Textarea / Custom Theme Canvas */}
        <div
          className={`rounded-lg transition-all duration-200 ${
            isCustomBg
              ? "min-h-[160px] flex items-center justify-center p-6 text-center text-white font-semibold text-lg shadow-inner"
              : "border bg-muted/20 focus-within:ring-1 focus-within:ring-primary p-2"
          }`}
          style={isCustomBg ? { background: backgroundColor } : {}}
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              selectedFiles.length > 0
                ? "Say something about these photos/videos..."
                : `What's on your mind, ${user?.name || "there"}?`
            }
            className={`w-full resize-none bg-transparent text-xs focus:outline-none placeholder:text-muted-foreground ${
              isCustomBg
                ? "text-center text-white placeholder:text-white/70 min-h-[140px]"
                : "min-h-[70px] text-foreground"
            }`}
          />
        </div>

        {/* Media Preview Gallery */}
        {selectedFiles.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2 border rounded-lg bg-muted/20">
            {selectedFiles.map((sf, idx) => (
              <div
                key={idx}
                className="relative rounded-md overflow-hidden border bg-background group h-28 flex items-center justify-center"
              >
                {sf.isVideo ? (
                  <video
                    src={sf.previewUrl}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={sf.previewUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                )}

                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white p-1 rounded-full cursor-pointer transition-colors shadow-md"
                  title="Remove"
                >
                  <X size={12} />
                </button>

                {sf.isVideo && (
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Video size={10} /> Video
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="image/*,video/*"
          className="hidden"
        />

        {/* Color Presets Picker */}
        {showColorPicker && (
          <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setBackgroundColor(preset.value);
                  if (preset.value !== "#ffffff") {
                    setSelectedFiles([]); // Gradient cards don't overlap with media
                  }
                }}
                className={`h-7 w-7 rounded-full shrink-0 border-2 transition-transform hover:scale-110 cursor-pointer ${
                  preset.className
                } ${
                  backgroundColor === preset.value
                    ? "ring-2 ring-primary ring-offset-1"
                    : "border-muted"
                }`}
                title={preset.label}
              />
            ))}
          </div>
        )}

        {/* Action Controls Footer */}
        <div className="flex items-center justify-between pt-1 border-t">
          <div className="flex items-center gap-1">
            {/* Photo / Video trigger */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 h-8 px-2 flex items-center gap-1.5 cursor-pointer"
            >
              <ImageIcon size={16} className="text-emerald-500" />
              <span>Photo / Video</span>
            </Button>

            {/* Background Theme trigger */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className={`text-xs h-8 px-2 flex items-center gap-1.5 cursor-pointer ${
                isCustomBg
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Palette size={16} className="text-pink-500" />
              <span>Theme</span>
            </Button>
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={
              (!content.trim() && selectedFiles.length === 0) ||
              mutation.isPending ||
              isUploading
            }
            className="h-8 px-4 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            {mutation.isPending || isUploading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>{isUploading ? "Uploading..." : "Posting..."}</span>
              </>
            ) : (
              <>
                <Send size={13} />
                <span>Post</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};
