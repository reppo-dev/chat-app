"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CheckCheck,
  Image as ImageIcon,
  Loader2,
  Minimize2,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import conversationApi from "@/lib/api/conversation.api";
import messageApi from "@/lib/api/message.api";
import uploadApi from "@/lib/api/upload.api";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import { closeChat } from "@/lib/redux/slices/chatSlice";
import { useWebSocket } from "@/lib/websocket/WebSocketProvider";
import { Message, User } from "@/lib/types";
import { extractNullableString, getApiErrorMessage } from "@/lib/utils";

interface ChatWindowProps {
  conversationId: number;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId }) => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { sendTyping } = useWebSocket();
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const onlineUserIds = useAppSelector((state) => state.realtime.onlineUserIds);
  const typingUsers =
    useAppSelector((state) => state.realtime.typingUsers[conversationId]) || [];

  const [text, setText] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch conversation details
  const { data: convData } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => conversationApi.getConversationByID(conversationId),
  });

  // Fetch conversation members
  const { data: membersData } = useQuery({
    queryKey: ["conversation_members", conversationId],
    queryFn: () => conversationApi.getConversationMembers(conversationId),
  });

  // Fetch messages
  const { data: messagesData, isLoading: loadingMessages } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => messageApi.getConversationMessages(conversationId, 50),
    refetchInterval: 5000,
  });

  const conversation = convData?.data?.data?.conversation;
  const members: User[] = membersData?.data?.data?.members || [];
  const otherMembers = members.filter((m) => m.id !== currentUser?.id);
  const otherMember = otherMembers[0];

  const groupName = extractNullableString(conversation?.group_name);
  const otherMemberName = extractNullableString(otherMember?.name);

  const convTitle =
    groupName ||
    otherMemberName ||
    `Chat #${conversationId}`;

  const isOtherOnline = otherMember ? onlineUserIds.includes(otherMember.id) : false;

  // Backend returns messages in DESC order (newest first).
  // Chronologically sort (ASC) so older messages appear at top and newest at bottom.
  const messages: Message[] = useMemo(() => {
    const raw: Message[] = messagesData?.data?.data?.messages || [];
    return [...raw].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [messagesData]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark latest message as seen
  useEffect(() => {
    if (messages.length > 0) {
      const latestMsg = messages[messages.length - 1];
      if (latestMsg && latestMsg.sender_id !== currentUser?.id) {
        messageApi.markMessageSeen(latestMsg.id).catch(() => {});
      }
    }
  }, [messages, currentUser?.id]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (payload: { text?: string; media_files?: string[] }) =>
      messageApi.sendMessage(conversationId, payload),
    onSuccess: () => {
      setText("");
      setSelectedFile(null);
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
        setFilePreview(null);
      }
      setIsUploading(false);
      sendTyping(conversationId, false);
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err: unknown) => {
      setIsUploading(false);
      alert(getApiErrorMessage(err, "Failed to send message"));
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);

    // Typing throttle
    sendTyping(conversationId, true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(conversationId, false);
    }, 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !selectedFile) return;

    try {
      let mediaUrls: string[] = [];
      if (selectedFile) {
        setIsUploading(true);
        const uploadRes = await uploadApi.uploadFile(selectedFile);
        if (uploadRes.data?.url) {
          mediaUrls.push(uploadRes.data.url);
        }
      }

      sendMutation.mutate({
        text: text.trim() || undefined,
        media_files: mediaUrls.length > 0 ? mediaUrls : undefined,
      });
    } catch (err: unknown) {
      setIsUploading(false);
      alert("Upload failed: " + getApiErrorMessage(err));
    }
  };

  const othersTyping = typingUsers.filter((u) => u.userId !== currentUser?.id);

  return (
    <Card className="w-80 shadow-2xl border bg-card flex flex-col overflow-hidden rounded-t-xl z-40 animate-in slide-in-from-bottom-2">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative">
            <Avatar className="h-7 w-7">
              <AvatarImage src={extractNullableString(conversation?.group_avatar || otherMember?.avatar)} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {convTitle[0]?.toUpperCase() || "C"}
              </AvatarFallback>
            </Avatar>
            {isOtherOnline && (
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-400 ring-1 ring-primary" />
            )}
          </div>

          <div className="truncate">
            <p className="text-xs font-semibold leading-none truncate">
              {convTitle}
            </p>
            <span className="text-[10px] text-primary-foreground/70">
              {isOtherOnline ? "Active now" : "Offline"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/10 rounded cursor-pointer transition-colors"
          >
            <Minimize2 size={13} />
          </button>
          <button
            type="button"
            onClick={() => dispatch(closeChat(conversationId))}
            className="p-1 hover:bg-white/10 rounded cursor-pointer transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Body & Messages */}
      {!isMinimized && (
        <>
          <div className="h-72 overflow-y-auto p-3 flex flex-col gap-2 bg-muted/10 text-xs">
            {loadingMessages ? (
              <p className="text-center text-muted-foreground my-auto">
                Loading messages...
              </p>
            ) : messages.length === 0 ? (
              <p className="text-center text-muted-foreground my-auto text-[11px]">
                Say hello to start the conversation!
              </p>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === currentUser?.id;

                let mediaArr: string[] = [];
                if (Array.isArray(msg.media_files)) {
                  mediaArr = msg.media_files;
                } else if (typeof msg.media_files === "string") {
                  try {
                    const parsed = JSON.parse(msg.media_files);
                    if (Array.isArray(parsed)) mediaArr = parsed;
                  } catch {}
                }

                const messageText = extractNullableString(msg.text);

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isMe ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-1.5 shadow-xs ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-xs"
                          : "bg-muted text-foreground rounded-bl-xs"
                      }`}
                    >
                      {messageText && (
                        <p className="whitespace-pre-wrap break-words">
                          {messageText}
                        </p>
                      )}

                      {/* Media attachments */}
                      {mediaArr.length > 0 && (
                        <div className="flex flex-col gap-1 mt-1">
                          {mediaArr.map((url, i) => {
                            const full = uploadApi.getFullMediaUrl(url);
                            const isVid =
                              url.toLowerCase().endsWith(".mp4") ||
                              url.toLowerCase().endsWith(".webm") ||
                              url.toLowerCase().endsWith(".mov");

                            if (isVid) {
                              return (
                                <video
                                  key={i}
                                  src={full}
                                  controls
                                  className="max-h-44 rounded-lg bg-black"
                                />
                              );
                            }

                            return (
                              <img
                                key={i}
                                src={full}
                                alt="attachment"
                                className="max-h-44 rounded-lg object-cover cursor-pointer hover:opacity-95"
                                onClick={() => window.open(full, "_blank")}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground mt-0.5 px-1">
                      <span>
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isMe && (
                        <CheckCheck size={11} className="text-primary" />
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing status indicator */}
            {othersTyping.length > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground italic py-1">
                <div className="flex gap-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>
                  {othersTyping.map((u) => u.userName).join(", ")} is typing...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Selected File Preview Box */}
          {filePreview && (
            <div className="p-2 border-t bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                {selectedFile?.type.startsWith("video/") ? (
                  <video src={filePreview} className="h-10 w-10 rounded object-cover" />
                ) : (
                  <img src={filePreview} alt="preview" className="h-10 w-10 rounded object-cover" />
                )}
                <span className="text-[11px] truncate max-w-[160px] text-muted-foreground">
                  {selectedFile?.name}
                </span>
              </div>
              <button
                type="button"
                onClick={removeSelectedFile}
                className="p-1 hover:bg-muted rounded text-muted-foreground"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Input form */}
          <form
            onSubmit={handleSubmit}
            className="p-2 border-t flex items-center gap-1.5 bg-card"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*"
              className="hidden"
            />

            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Attach photo or video"
            >
              <Paperclip size={15} />
            </Button>

            <Input
              value={text}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="h-8 text-xs bg-muted/30 focus-visible:ring-1 flex-1"
            />

            <Button
              type="submit"
              size="icon"
              disabled={(!text.trim() && !selectedFile) || sendMutation.isPending || isUploading}
              className="h-8 w-8 shrink-0 cursor-pointer"
            >
              {sendMutation.isPending || isUploading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Send size={13} />
              )}
            </Button>
          </form>
        </>
      )}
    </Card>
  );
};
