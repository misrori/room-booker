import { Meeting } from "@/hooks/useCalendarEvents";

interface Props {
  meetings: Meeting[];
  now: Date;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("hu-HU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Timeline({ meetings, now }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
        Mai program
      </p>

      <div className="space-y-1.5">
        {meetings.map((m) => {
          const isPast = now >= m.endTime;
          const isCurrent = now >= m.startTime && now < m.endTime;

          return (
            <div
              key={m.id}
              className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-colors
                ${isCurrent ? "bg-room-occupied/10 border border-room-occupied/20" : ""}
                ${isPast ? "opacity-40" : ""}
              `}
            >
              <span className="font-mono text-sm text-muted-foreground w-28 shrink-0">
                {formatTime(m.startTime)} – {formatTime(m.endTime)}
              </span>
              <span
                className={`text-sm font-medium truncate ${
                  isCurrent ? "text-foreground" : "text-secondary-foreground"
                }`}
              >
                {m.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
