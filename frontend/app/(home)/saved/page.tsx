import React from "react";
import { Card } from "@/components/ui/card";
import { Bookmark } from "lucide-react";

const SavedPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-6 px-4 flex flex-col gap-6">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Bookmark size={24} className="text-purple-500" />
        <h1 className="text-xl font-bold">Saved Items</h1>
      </div>

      <Card className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2 bg-card">
        <Bookmark size={32} className="opacity-30" />
        <p className="font-semibold text-foreground text-sm">No saved items yet</p>
        <p>Posts, articles, and media you save will appear here for easy access.</p>
      </Card>
    </div>
  );
};

export default SavedPage;
