"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { LogOut, User, UserPlus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import { logout } from "@/lib/redux/slices/authSlice";
import { setFriendRequestsOpen } from "@/lib/redux/slices/uiSlice";
import authApi from "@/lib/api/auth.api";
import { extractNullableString } from "@/lib/utils";

const ProfileAvatar = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    dispatch(logout());
    router.push("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer">
        <Avatar className="h-9 w-9 border">
          <AvatarImage src={extractNullableString(user?.avatar)} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => router.push("/profile")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <User size={14} />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => dispatch(setFriendRequestsOpen(true))}
            className="flex items-center gap-2 cursor-pointer"
          >
            <UserPlus size={14} />
            <span>Friend Requests</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-600 focus:text-red-600 cursor-pointer flex items-center gap-2"
        >
          <LogOut size={14} />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileAvatar;
