import React from "react";
import { Card } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";

const MarketplacePage = () => {
  return (
    <div className="max-w-4xl mx-auto py-6 px-4 flex flex-col gap-6">
      <div className="flex items-center gap-2 pb-2 border-b">
        <ShoppingBag size={24} className="text-amber-500" />
        <h1 className="text-xl font-bold">Marketplace</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {[
          { title: "Mechanical Keyboard", price: "$85", location: "Downtown" },
          { title: "UltraWide 34\" Monitor", price: "$320", location: "Westside" },
          { title: "Ergonomic Desk Chair", price: "$150", location: "North Park" },
          { title: "Sony WH-1000XM4", price: "$190", location: "City Center" },
        ].map((item, idx) => (
          <Card key={idx} className="overflow-hidden border bg-card flex flex-col cursor-pointer group">
            <div className="h-32 bg-muted/40 flex items-center justify-center">
              <ShoppingBag size={32} className="text-muted-foreground/40 group-hover:scale-110 transition-transform" />
            </div>
            <div className="p-3">
              <span className="font-bold text-sm text-foreground block">{item.price}</span>
              <p className="text-xs font-medium text-muted-foreground truncate mt-0.5">{item.title}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{item.location}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MarketplacePage;
