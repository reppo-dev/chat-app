"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, MessageSquare, Search } from "lucide-react";
import { SidebarTrigger } from "../../../components/ui/sidebar";
import ProfileAvatar from "../../../components/avatar";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import notificationApi from "@/lib/api/notification.api";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import { setSearchOpen } from "@/lib/redux/slices/uiSlice";
import { setNewConversationOpen } from "@/lib/redux/slices/chatSlice";
import { Notification } from "@/lib/types";

const Header = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const unreadCounts = useAppSelector((state) => state.chat.unreadCounts);

  const totalUnreadMessages = Object.values(unreadCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.getNotifications(30),
  });

  const notifications: Notification[] =
    notifData?.data?.data?.notifications || [];
  const unreadNotifsCount = notifications.filter((n) => !n.is_read).length;

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markSingleReadMutation = useMutation({
    mutationFn: (id: number) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return (
    <header className="h-16 bg-card border-b sticky top-0 w-full flex justify-center items-center z-30 shadow-xs">
      <div className="mx-4 sm:mx-8 w-full flex justify-between items-center">
        {/* Left branding and search */}
        <div className="flex items-center gap-3">
          <div className="block sm:hidden">
            <SidebarTrigger />
          </div>

          <Link href="/" className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              EchoNet
            </span>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch(setSearchOpen(true))}
            className="hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 h-9 px-3 rounded-full border hover:bg-muted"
          >
            <Search size={14} />
            <span>Search users, friends...</span>
          </Button>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* New message / chat trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => dispatch(setNewConversationOpen(true))}
            className="h-9 w-9 rounded-full relative text-muted-foreground hover:text-foreground cursor-pointer"
            title="Messages"
          >
            <MessageSquare size={18} />
            {totalUnreadMessages > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {totalUnreadMessages}
              </span>
            )}
          </Button>

          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="h-9 w-9 rounded-full relative text-muted-foreground hover:text-foreground flex items-center justify-center hover:bg-muted transition-colors cursor-pointer">
              <Bell size={18} />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadNotifsCount}
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-2">
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="font-bold text-sm">
                  Notifications
                </span>
                {unreadNotifsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllReadMutation.mutate()}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>
              <DropdownMenuSeparator />

              <div className="max-h-80 overflow-y-auto flex flex-col gap-1 py-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-center py-6 text-muted-foreground">
                    No notifications yet.
                  </p>
                ) : (
                  notifications.map((notif) => (
                    <DropdownMenuItem
                      key={notif.id}
                      onClick={() => {
                        if (!notif.is_read) {
                          markSingleReadMutation.mutate(notif.id);
                        }
                      }}
                      className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer ${
                        !notif.is_read
                          ? "bg-primary/5 font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      <div
                        className="h-2 w-2 rounded-full mt-1.5 shrink-0 bg-primary opacity-0 data-[unread=true]:opacity-100"
                        data-unread={!notif.is_read}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-snug break-words text-foreground">
                          {notif.content}
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(notif.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dark/Light mode toggle */}
          <ModeToggle />

          {/* Profile Avatar */}
          <ProfileAvatar />
        </div>
      </div>
    </header>
  );
};

export default Header;
