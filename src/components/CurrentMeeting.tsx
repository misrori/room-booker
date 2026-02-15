import { Meeting } from "@/hooks/useCalendarEvents";
import { Clock } from "lucide-react";

interface Props {
  meeting: Meeting;
  minutesRemaining: number | null;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CurrentMeeting({ meeting, minutesRemaining }: Props) {
  return (
    <div className="fade-in space-y-5">
      <div className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-widest text-room-occupied/80">
          In Progress
        </p>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          {meeting.title}
        </h2>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Clock className="h-6 w-6" />
          <span className="text-3xl font-mono font-bold text-foreground">
            {formatTime(meeting.startTime)} – {formatTime(meeting.endTime)}
          </span>
        </div>
      </div>

      {minutesRemaining !== null && (
        <div className="inline-flex items-center gap-2 rounded-xl bg-room-occupied/10 px-5 py-3 border border-room-occupied/20">
          <span className="text-room-occupied text-lg font-semibold">
            {minutesRemaining} min remaining
          </span>
        </div>
      )}
    </div>
  );
}
