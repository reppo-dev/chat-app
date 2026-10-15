import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

const GroupsPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-6 px-4 flex flex-col gap-6">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Users size={24} className="text-emerald-500" />
        <h1 className="text-xl font-bold">Groups & Communities</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { name: "React & Next.js Developers", members: "12,400 members", desc: "Share news, tips, and tutorials about React, Next.js, and Modern Web." },
          { name: "Golang Backend Engineers", members: "8,900 members", desc: "Discussions on Gin, Fiber, concurrency, and real-time backend systems." },
          { name: "Fullstack JavaScript / TypeScript", members: "15,200 members", desc: "Collaborate, share open-source packages, and ask coding questions." },
          { name: "UI/UX Designers & Tailwind Lovers", members: "7,800 members", desc: "Showcase design systems, component libraries, and animations." },
        ].map((group, idx) => (
          <Card key={idx} className="p-4 border bg-card flex flex-col justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-foreground">{group.name}</h3>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{group.members}</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{group.desc}</p>
            </div>
            <Button size="sm" variant="outline" className="w-full text-xs">
              Join Group
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GroupsPage;
