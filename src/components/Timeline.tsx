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
  if (meetings.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground text-lg">No meetings scheduled today</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4 shrink-0">
        Today's Schedule
      </p>

      <div className="space-y-2 overflow-y-auto flex-1 pr-2">
        {meetings.map((m) => {
          const isPast = now >= m.endTime;
          const isCurrent = now >= m.startTime && now < m.endTime;

          return (
            <div
              key={m.id}
              className={`flex items-center gap-4 rounded-2xl px-5 py-4 transition-colors
                ${isCurrent ? "bg-room-occupied/10 border border-room-occupied/20" : "bg-card border border-border"}
                ${isPast ? "opacity-40" : ""}
              `}
            >
              <span className="font-mono text-sm text-muted-foreground w-32 shrink-0">
                {formatTime(m.startTime)} – {formatTime(m.endTime)}
              </span>
              <div className="flex-1 min-w-0">
                <span
                  className={`text-base font-semibold truncate block ${
                    isCurrent ? "text-foreground" : "text-secondary-foreground"
                  }`}
                >
                  {m.title}
                </span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <User className="h-3 w-3" />
                  <span>{m.organizer}</span>
                  {m.attendees !== undefined && (
                    <span className="ml-2">· {m.attendees} attendees</span>
                  )}
                </div>
              </div>
              {isCurrent && (
                <span className="text-xs font-semibold text-room-occupied uppercase tracking-wider shrink-0">
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
