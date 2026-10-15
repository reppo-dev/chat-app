import React from "react";
import { Card } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

const EventsPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-6 px-4 flex flex-col gap-6">
      <div className="flex items-center gap-2 pb-2 border-b">
        <CalendarDays size={24} className="text-red-500" />
        <h1 className="text-xl font-bold">Upcoming Events</h1>
      </div>

      <div className="flex flex-col gap-3">
        {[
          { title: "Next.js Conf 2026", date: "Oct 24, 2026", time: "10:00 AM PST", location: "Online Conference", attendees: "4.2K interested" },
          { title: "Golang Meetup & Networking", date: "Nov 02, 2026", time: "6:30 PM", location: "Tech Innovation Hub", attendees: "180 going" },
          { title: "React Ecosystem & AI Integration Hackathon", date: "Nov 15, 2026", time: "All Day", location: "Global Virtual", attendees: "950 hackers" },
        ].map((event, idx) => (
          <Card key={idx} className="p-4 border bg-card flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex flex-col items-center justify-center font-bold text-xs">
                <span>{event.date.split(" ")[0]}</span>
                <span className="text-sm">{event.date.split(" ")[1].replace(",", "")}</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">{event.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {event.time} • {event.location}
                </p>
                <span className="text-[10px] text-muted-foreground">{event.attendees}</span>
              </div>
            </div>

            <button
              type="button"
              className="text-xs font-semibold px-3 py-1.5 rounded-md border hover:bg-muted transition-colors cursor-pointer"
            >
              Interested
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EventsPage;
