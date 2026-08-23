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
    <aside className="w-60 h-full hidden sm:flex flex-col justify-start gap-1 z-0">
      {sidebarValue.map((item) => {
        const isActive = pathname === item.url;

        return (
          <Link
            href={item.url}
            key={item.name}
            className={`
              flex items-center justify-start ml-10 gap-4 mt-4
             
            `}
          >
            <div
              className={` ${isActive ? "text-blue-500 font-bold" : "text-gray-600 dark:text-gray-400"}`}
            >
              {item.icon}
            </div>
            <div
              className={` text-sm ${isActive ? " font-bold" : "text-gray-600 dark:text-gray-400"}`}
            >
              {item.name}
            </div>
          </Link>
        );
      })}
    </aside>
  );
}
