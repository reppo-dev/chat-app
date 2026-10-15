"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Bookmark,
  CalendarDays,
  Home,
  ShoppingBag,
  User,
  User2,
  Users,
  Video,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/lib/redux/store";

const sidebarValue = [
  { icon: <Home size={20} />, name: "Home", url: "/" },
  { icon: <User size={20} />, name: "Profile", url: "/profile" },
  { icon: <Video size={20} />, name: "Watch", url: "/watch" },
  { icon: <ShoppingBag size={20} />, name: "Marketplace", url: "/marketplace" },
  { icon: <Users size={20} />, name: "Groups", url: "/groups" },
  { icon: <Bookmark size={20} />, name: "Saved", url: "/saved" },
  { icon: <CalendarDays size={20} />, name: "Events", url: "/events" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const currentUser = useAppSelector((state) => state.auth.user);

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarTrigger className="absolute right-1 mt-2" />
      <SidebarHeader className="p-4">
        <Link href="/" className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          EchoNet
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="gap-1 px-2">
          {sidebarValue.map((item) => {
            const isActive = pathname === item.url;
            return (
              <SidebarMenuItem key={item.name}>
                <Link href={item.url} className="w-full">
                  <SidebarMenuButton isActive={isActive}>
                    {item.icon}
                    <span>{item.name}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/profile" className="w-full">
              <SidebarMenuButton>
                <User2 size={16} />
                <span className="truncate">{currentUser?.name || "My Account"}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
