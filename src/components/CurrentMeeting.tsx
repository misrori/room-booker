import { Meeting } from "@/lib/mockData";
import { Clock, User } from "lucide-react";

interface Props {
  meeting: Meeting;
  minutesRemaining: number | null;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("hu-HU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CurrentMeeting({ meeting, minutesRemaining }: Props) {
  return (
    <div className="fade-in space-y-6">
      <div className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-widest text-room-occupied/80">
          Most zajlik
        </p>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          {meeting.title}
        </h2>
      </div>

      <div className="flex items-center gap-6 text-muted-foreground">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <span className="text-lg">{meeting.organizer}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <span className="text-lg font-mono">
            {formatTime(meeting.startTime)} – {formatTime(meeting.endTime)}
          </span>
        </div>
      </div>

      {minutesRemaining !== null && (
        <div className="inline-flex items-center gap-2 rounded-xl bg-room-occupied/10 px-5 py-3 border border-room-occupied/20">
          <span className="text-room-occupied text-lg font-semibold">
            {minutesRemaining} perc van hátra
          </span>
        </div>
      )}
    </div>
  );
}
