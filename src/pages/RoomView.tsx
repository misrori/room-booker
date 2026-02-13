import { useParams, Link } from "react-router-dom";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { StatusBar, StatusDot } from "@/components/StatusBar";
import { CurrentMeeting } from "@/components/CurrentMeeting";
import { NextMeeting } from "@/components/NextMeeting";
import { QuickBook } from "@/components/QuickBook";
import { Timeline } from "@/components/Timeline";
import { CheckInButton } from "@/components/CheckInButton";
import { MapPin, Users, Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";

const statusLabel: Record<string, string> = {
  available: "Available",
  occupied: "Occupied",
  upcoming: "Starting Soon",
};

export default function RoomView() {
  const { roomId } = useParams<{ roomId: string }>();
  const id = roomId || "diamond";

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
    refetch,
  } = useCalendarEvents(id);

  const handleQuickBook = async (minutes: number, bookedBy: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await fetch(`${supabaseUrl}/functions/v1/calendar-events`, {
        method: "POST",
        headers: {
          apikey: anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create-adhoc",
          room: id,
          minutes,
          bookedBy: bookedBy || "Anonymous",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      // Refresh events
      refetch();
    } catch (err: any) {
      console.error("Booking failed:", err);
    }
  };

  const handleCheckIn = async (eventId: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await fetch(`${supabaseUrl}/functions/v1/calendar-events`, {
        method: "POST",
        headers: {
          apikey: anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "check-in",
          room: id,
          eventId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Check-in failed");
      refetch();
    } catch (err: any) {
      console.error("Check-in failed:", err);
    }
  };

  const handleAutoDelete = async (eventId: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await fetch(`${supabaseUrl}/functions/v1/calendar-events`, {
        method: "POST",
        headers: {
          apikey: anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete-event",
          room: id,
          eventId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      refetch();
    } catch (err: any) {
      console.error("Auto-delete failed:", err);
    }
  };

  const timeStr = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Calculate max bookable minutes based on next meeting
  const maxBookableMinutes = minutesUntilNext !== null && status !== "occupied"
    ? minutesUntilNext
    : status === "occupied"
    ? 0
    : 999;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-lg">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-destructive max-w-md text-center">
          <AlertTriangle className="h-8 w-8" />
          <p className="text-lg font-semibold">Error</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // Check-in logic: show check-in for current meeting if within 5 min window
  const showCheckIn = currentMeeting && !currentMeeting.checkedIn && minutesRemaining !== null;
  const checkInDeadlinePassed = currentMeeting && !currentMeeting.checkedIn && minutesRemaining !== null &&
    (() => {
      const elapsedMs = now.getTime() - currentMeeting.startTime.getTime();
      return elapsedMs > 5 * 60 * 1000;
    })();

  // Show check-in for upcoming meeting (within 5 min before start)
  const showUpcomingCheckIn = nextMeeting && !nextMeeting.checkedIn && minutesUntilNext !== null && minutesUntilNext <= 5 && !currentMeeting;

  return (
    <div className="h-screen flex flex-col bg-background select-none overflow-hidden">
      <StatusBar status={status} />

      {/* Header */}
      <header className="px-8 pt-6 pb-3 flex items-start justify-between shrink-0">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <img src={logo} alt="Logo" className="h-10 w-auto" />
          <div className="space-y-0.5">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              {room?.name || id}
            </h1>
            <div className="flex items-center gap-4 text-muted-foreground text-sm">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>{room?.floor || ""}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>{room?.capacity || "?"} people</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-right space-y-1">
          <p className="text-5xl md:text-6xl font-extrabold font-mono tracking-tight text-foreground">
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

      {/* Main content - landscape tablet layout */}
      <main className="flex-1 px-8 pb-6 flex gap-8 min-h-0">
        {/* Left side: Status + Quick Book */}
        <div className="w-[420px] shrink-0 flex flex-col justify-center space-y-6">
          {currentMeeting ? (
            <>
              <CurrentMeeting
                meeting={currentMeeting}
                minutesRemaining={minutesRemaining}
              />
              {showCheckIn && !checkInDeadlinePassed && (
                <CheckInButton
                  onCheckIn={() => handleCheckIn(currentMeeting.id)}
                  label="Check In"
                />
              )}
              {checkInDeadlinePassed && (
                <CheckInButton
                  onCheckIn={() => handleAutoDelete(currentMeeting.id)}
                  label="No check-in — releasing room..."
                  autoTrigger
                />
              )}
            </>
          ) : showUpcomingCheckIn ? (
            <>
              <div className="fade-in space-y-4">
                <p className="text-sm font-medium uppercase tracking-widest text-room-upcoming/80">
                  Starting Soon
                </p>
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                  {nextMeeting!.title}
                </h2>
              </div>
              <CheckInButton
                onCheckIn={() => handleCheckIn(nextMeeting!.id)}
                label="Check In Early"
              />
            </>
          ) : (
            <div className="fade-in space-y-4">
              <p className="text-sm font-medium uppercase tracking-widest text-room-available/80">
                {status === "upcoming" ? "Still Available" : "Available"}
              </p>
              <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground">
                Book Now
              </h2>
              {minutesUntilNext !== null && (
                <p className="text-xl text-muted-foreground">
                  Free for{" "}
                  <span className="text-foreground font-semibold">
                    {minutesUntilNext} min
                  </span>
                </p>
              )}
            </div>
          )}

          {status === "available" || status === "upcoming" ? (
            <QuickBook
              onBook={handleQuickBook}
              disabled={false}
              maxMinutes={maxBookableMinutes}
            />
          ) : null}

          {nextMeeting && currentMeeting && (
            <NextMeeting
              meeting={nextMeeting}
              minutesUntilNext={minutesUntilNext}
            />
          )}
        </div>

        {/* Right side: Timeline (prominent) */}
        <div className="flex-1 flex flex-col min-h-0">
          <Timeline meetings={allMeetings} now={now} />
        </div>
      </main>
    </div>
  );
}
