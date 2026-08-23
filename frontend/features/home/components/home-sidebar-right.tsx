"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

const sidebarValue = [
  { image: "", name: "Home", url: "/" },
  { image: "", name: "Profile", url: "/profile" },
  { image: "", name: "Watch", url: "/watch" },
  {
    image: "",
    name: "Marketplace",
    url: "/marketplace",
  },
  { image: "", name: "Groups", url: "/groups" },
  { image: "", name: "Saved", url: "/saved" },
  { image: "", name: "Events", url: "/events" },
];

export function RightHomeSidebar() {
  return (
    <aside className="w-70 h-full hidden sm:flex flex-col items-start justify-start gap-1 bg-white z-0">
      {sidebarValue.map((item) => {
        return (
          <Link
            href={item.url}
            key={item.name}
            className="flex items-start justify-start ml-10 gap-4 mt-4"
          >
            <Avatar>
              <AvatarImage>{item.image}</AvatarImage>
              <AvatarFallback>{item.name[1]}</AvatarFallback>
            </Avatar>
            <div>{item.name}</div>
          </Link>
        );
      })}
    </aside>
  );
}
