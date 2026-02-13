import { Meeting } from "@/hooks/useCalendarEvents";
import { ArrowRight, Clock } from "lucide-react";

interface Props {
  meeting: Meeting;
  minutesUntilNext: number | null;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NextMeeting({ meeting, minutesUntilNext }: Props) {
  return (
    <div className="rounded-2xl bg-card border border-border p-5 slide-up">
      <div className="flex items-center gap-2 mb-2">
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Up Next
        </p>
      </div>

      <h3 className="text-xl font-semibold text-foreground mb-2">
        {meeting.title}
      </h3>

      <div className="flex items-center gap-4 text-muted-foreground text-sm">
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          <span className="font-mono">
            {formatTime(meeting.startTime)} – {formatTime(meeting.endTime)}
          </span>
        </div>
        {minutesUntilNext !== null && (
          <span className="text-room-upcoming font-medium">
            in {minutesUntilNext} min
          </span>
        )}
      </div>
    </div>
  );
}
