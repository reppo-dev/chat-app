import React from "react";
import { Card } from "@/components/ui/card";
import { PlayCircle, Video } from "lucide-react";

const WatchPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-6 px-4 flex flex-col gap-6">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Video size={24} className="text-blue-500" />
        <h1 className="text-xl font-bold">Watch & Reels</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: "Building Full-Stack Real-time Apps", author: "DevCommunity", views: "14.2K views" },
          { title: "Next.js 16 & React 19 Best Practices", author: "Frontend Masters", views: "8.9K views" },
          { title: "Golang Microservices & WebSockets", author: "GoGophers", views: "21.5K views" },
          { title: "Modern State Management with TanStack Query", author: "TechTalks", views: "5.4K views" },
        ].map((video, idx) => (
          <Card key={idx} className="overflow-hidden border bg-card flex flex-col group cursor-pointer">
            <div className="h-44 bg-gradient-to-br from-slate-700 to-zinc-900 flex items-center justify-center relative">
              <PlayCircle size={48} className="text-white/80 group-hover:scale-110 transition-transform" />
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                {video.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {video.author} • {video.views}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WatchPage;
