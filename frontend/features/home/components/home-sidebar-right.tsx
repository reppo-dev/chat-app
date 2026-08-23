"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const sidebarValue = [
  { image: "", name: "Home", id: "/" },
  { image: "", name: "Profile", id: "/profile" },
  { image: "", name: "Watch", id: "/watch" },
  {
    image: "",
    name: "Marketplace",
    id: "/marketplace",
  },
  { image: "", name: "Groups", id: "/groups" },
  { image: "", name: "Saved", id: "/saved" },
  { image: "", name: "Events", id: "/events" },
];

export function RightHomeSidebar() {
  return (
    <aside className="w-70 h-full hidden sm:flex flex-col items-start justify-start gap-1  z-0">
      {sidebarValue.map((item) => {
        return (
          <div
            key={item.name}
            className="flex items-start justify-start ml-10 gap-4 mt-4"
          >
            <Avatar>
              <AvatarImage>{item.image}</AvatarImage>
              <AvatarFallback>{item.name[1]}</AvatarFallback>
            </Avatar>
            <div>{item.name}</div>
          </div>
        );
      })}
    </aside>
  );
}
