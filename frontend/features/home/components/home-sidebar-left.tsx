"use client";

import {
  Bookmark,
  CalendarDays,
  Home,
  ShoppingBag,
  User,
  Users,
  Video,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sidebarValue = [
  { icon: <Home size={20} />, name: "Home", url: "/" },
  { icon: <User size={20} />, name: "Profile", url: "/profile" },
  { icon: <Video size={20} />, name: "Watch", url: "/watch" },
  { icon: <ShoppingBag size={20} />, name: "Marketplace", url: "/marketplace" },
  { icon: <Users size={20} />, name: "Groups", url: "/groups" },
  { icon: <Bookmark size={20} />, name: "Saved", url: "/saved" },
  { icon: <CalendarDays size={20} />, name: "Events", url: "/events" },
];

export function LefttHomeSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 bg-card border-r h-[calc(100vh-4rem)] sticky top-16 hidden md:flex flex-col justify-start p-3 gap-1 z-0">
      {sidebarValue.map((item) => {
        const isActive = pathname === item.url;

        return (
          <Link
            href={item.url}
            key={item.name}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-xs font-semibold ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <div>{item.icon}</div>
            <div>{item.name}</div>
          </Link>
        );
      })}
    </aside>
  );
}
