import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { StatusBar, StatusDot } from "@/components/StatusBar";
import { CurrentMeeting } from "@/components/CurrentMeeting";
import { NextMeeting } from "@/components/NextMeeting";
import { QuickBook } from "@/components/QuickBook";
import { Timeline } from "@/components/Timeline";
import { MapPin, Users, Loader2, AlertTriangle } from "lucide-react";
import { useSearchParams } from "react-router-dom";

const statusLabel: Record<string, string> = {
  available: "Szabad",
  occupied: "Foglalt",
  upcoming: "Hamarosan foglalt",
};

export default function Index() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("room") || "diamond";

  const {
    status,
    currentMeeting,
    nextMeeting,
    minutesUntilNext,
    minutesRemaining,
    allMeetings,
    now,
    room,
    loading,
    error,
  } = useCalendarEvents(roomId);

  const handleQuickBook = (minutes: number) => {
    console.log(`Quick booking for ${minutes} minutes`);
    // TODO: Google Calendar API create event
  };

  const timeStr = now.toLocaleTimeString("hu-HU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-lg">Naptár betöltése...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-destructive max-w-md text-center">
          <AlertTriangle className="h-8 w-8" />
          <p className="text-lg font-semibold">Hiba történt</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background select-none">
      <StatusBar status={status} />

      {/* Header */}
      <header className="px-8 pt-8 pb-4 flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            {room?.name || roomId}
          </h1>
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>{room?.floor || ""}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>{room?.capacity || "?"} fő</span>
            </div>
          </div>
        </div>

        <div className="text-right space-y-1">
          <p className="text-4xl md:text-5xl font-bold font-mono tracking-tight text-foreground">
            {timeStr}
          </p>
          <div className="flex items-center justify-end gap-2">
            <StatusDot status={status} />
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {statusLabel[status]}
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-8 pb-8 flex flex-col lg:flex-row gap-8">
        {/* Left: Status & Current/Available */}
        <div className="flex-1 flex flex-col justify-center space-y-8">
          {currentMeeting ? (
            <CurrentMeeting
              meeting={currentMeeting}
              minutesRemaining={minutesRemaining}
            />
          ) : (
            <div className="fade-in space-y-4">
              <p className="text-sm font-medium uppercase tracking-widest text-room-available/80">
                {status === "upcoming" ? "Még szabad" : "Szabad"}
              </p>
              <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground">
                Foglalható
              </h2>
              {minutesUntilNext !== null && (
                <p className="text-xl text-muted-foreground">
                  Még{" "}
                  <span className="text-foreground font-semibold">
                    {minutesUntilNext} percig
                  </span>{" "}
                  szabad
                </p>
              )}
            </div>
          )}

          {nextMeeting && (
            <NextMeeting
              meeting={nextMeeting}
              minutesUntilNext={currentMeeting ? minutesUntilNext : null}
            />
          )}
        </div>

        {/* Right: Quick Book & Timeline */}
        <div className="w-full lg:w-96 space-y-6 flex flex-col justify-center">
          <QuickBook
            onBook={handleQuickBook}
            disabled={status === "occupied"}
          />
          <Timeline meetings={allMeetings} now={now} />
        </div>
      </main>
    </div>
  );
}
