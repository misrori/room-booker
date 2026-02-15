import { Meeting } from "@/hooks/useCalendarEvents";
import { User } from "lucide-react";

interface Props {
  meetings: Meeting[];
  now: Date;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Timeline({ meetings, now }: Props) {
  const upcomingMeetings = meetings.filter((m) => now < m.endTime);

  if (upcomingMeetings.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground text-2xl font-bold">No more meetings today</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <p className="text-lg font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 shrink-0">
        Today's Schedule
      </p>

      <div className="space-y-4 overflow-y-auto flex-1 pr-4 custom-scrollbar">
        {upcomingMeetings.map((m) => {
          const isCurrent = now >= m.startTime && now < m.endTime;

          return (
            <div
              key={m.id}
              className={`flex items-center gap-8 rounded-3xl px-8 py-6 transition-all duration-300
                ${isCurrent ? "bg-room-occupied/15 border-2 border-room-occupied/30 shadow-lg shadow-room-occupied/10" : "bg-card/50 border border-border/50"}
              `}
            >
              <div className={`font-mono text-2xl font-black w-48 shrink-0 ${isCurrent ? "text-room-occupied" : "text-muted-foreground text-opacity-70"}`}>
                {formatTime(m.startTime)} – {formatTime(m.endTime)}
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className={`text-3xl md:text-4xl font-black truncate block tracking-tight ${isCurrent ? "text-foreground" : "text-secondary-foreground"
                    }`}
                >
                  {m.title}
                </span>
              </div>
              {isCurrent && (
                <span className="text-lg font-black text-room-occupied uppercase tracking-[0.2em] shrink-0 animate-pulse">
                  Now
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
