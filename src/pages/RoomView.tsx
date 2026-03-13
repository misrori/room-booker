import { useParams, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { supabase } from "@/integrations/supabase/client";
import { StatusBar, StatusDot } from "@/components/StatusBar";
import { CurrentMeeting } from "@/components/CurrentMeeting";
import { QuickBook } from "@/components/QuickBook";
import { Timeline } from "@/components/Timeline";
import { CheckInButton } from "@/components/CheckInButton";
import { MapPin, Users, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWakeLock } from "@/hooks/useWakeLock";
import { DimmingOverlay } from "@/components/DimmingOverlay";


const statusLabel: Record<string, string> = {
  available: "Available",
  occupied: "Occupied",
  upcoming: "Starting Soon",
};

export default function RoomView() {
  const { roomId } = useParams<{ roomId: string }>();
   const id = roomId || "diamond";
  const navigate = useNavigate();
  useWakeLock();

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
    updateEventOptimistically,
  } = useCalendarEvents(id);

  const [isEnding, setIsEnding] = useState(false);

  // Reset isEnding when currentMeeting changes or data refetched
  useEffect(() => {
    setIsEnding(false);
  }, [currentMeeting?.id]);

  const handleQuickBook = useCallback(async (minutes: number, bookedBy: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || anonKey;

      const res = await fetch(`${supabaseUrl}/functions/v1/calendar-events`, {
        method: "POST",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${token}`,
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
  }, [id, refetch]);

  const handleCheckIn = useCallback(async (eventId: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || anonKey;

      const res = await fetch(`${supabaseUrl}/functions/v1/calendar-events`, {
        method: "POST",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${token}`,
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
  }, [id, refetch]);

  const handleCheckOut = useCallback(async (eventId: string) => {
    try {
      setIsEnding(true); // Still keep this for local component state if needed, though hook handles it now
      updateEventOptimistically(eventId, { endTime: now }); // Instant UI update using hook's 'now'
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || anonKey;

      const res = await fetch(`${supabaseUrl}/functions/v1/calendar-events`, {
        method: "POST",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "check-out",
          room: id,
          eventId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setIsEnding(false); 
        refetch(); // On error, refetch to restore correct state
        throw new Error(data.error || "Check-out failed");
      }
      refetch();
    } catch (err: any) {
      setIsEnding(false); 
      refetch(); // On error, refetch to restore correct state
      console.error("Check-out failed:", err);
    }
  }, [id, refetch, updateEventOptimistically]);


  const handleAutoDelete = useCallback(async (eventId: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || anonKey;

      const res = await fetch(`${supabaseUrl}/functions/v1/calendar-events`, {
        method: "POST",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${token}`,
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
  }, [id, refetch]);

  const timeStr = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const dateStr = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Calculate max bookable minutes based on next meeting
  const maxBookableMinutes = minutesUntilNext !== null && status !== "occupied"
    ? minutesUntilNext
    : status === "occupied"
      ? 0
      : 999;

  // Check-in logic: show check-in for current meeting if within 15 min window
  const checkInDeadlineMs = 15 * 60 * 1000;
  const elapsedMs = currentMeeting ? now.getTime() - currentMeeting.startTime.getTime() : 0;
  const remainingMs = checkInDeadlineMs - elapsedMs;
  const remainingMinutes = Math.max(0, Math.ceil(remainingMs / 60000));
  const countdownStr = `${remainingMinutes} min`;

  const showCheckIn = currentMeeting && !currentMeeting.checkedIn && minutesRemaining !== null;
  const checkInDeadlinePassed = showCheckIn && elapsedMs > checkInDeadlineMs;

  // Show check-in for upcoming meeting (within 5 min before start)
  const showUpcomingCheckIn = nextMeeting && !nextMeeting.checkedIn && minutesUntilNext !== null && minutesUntilNext <= 5 && !currentMeeting;

  // Automatically delete if deadline passed and not checked in
  useEffect(() => {
    if (checkInDeadlinePassed && currentMeeting) {
      console.log("Auto-deleting meeting due to no check-in:", currentMeeting.id);
      handleAutoDelete(currentMeeting.id);
    }
  }, [checkInDeadlinePassed, currentMeeting, handleAutoDelete]);

  const [allQuotes, setAllQuotes] = useState<{ author: string; quote: string }[]>([]);
  const [currentQuote, setCurrentQuote] = useState<{ author: string; quote: string } | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}motivation.txt`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load quotes: ${res.status}`);
        return res.text();
      })
      .then((text) => {
        const lines = text.split("\n").slice(1);
        const validQuotes = lines
          .map((line) => {
            const match = line.match(/"([^"]*)","([^"]*)"/);
            if (!match) return null;
            return { author: match[1], quote: match[2] };
          })
          .filter((q): q is { author: string; quote: string } =>
            !!q && !!q.author && q.quote.trim().length > 0
          );
        console.log(`Loaded ${validQuotes.length} valid quotes`);
        setAllQuotes(validQuotes);
      })
      .catch((err) => {
        console.error("Error loading motivation quotes:", err);
      });
  }, []);

  useEffect(() => {
    if (allQuotes.length > 0) {
      const tenMinInterval = Math.floor(now.getTime() / (10 * 60 * 1000));
      const roomOffset = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const index = (tenMinInterval + roomOffset) % allQuotes.length;
      setCurrentQuote(allQuotes[index]);
    }
  }, [allQuotes, Math.floor(now.getTime() / (10 * 60 * 1000)), id]);

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

  return (
    <div className="h-screen flex flex-col bg-background select-none overflow-hidden pb-32 relative">
      <DimmingOverlay />
      <StatusBar status={status} />

      {/* Header */}
      <header className="px-8 pt-8 pb-4 flex items-start justify-between shrink-0">
        <div className="flex items-center gap-6">
          <img src={`${import.meta.env.BASE_URL}pao_logo.png`} alt="Logo" className="h-32 w-auto" />
          <div className="space-y-1">
            <h1 className="text-7xl md:text-8xl font-black tracking-tighter text-foreground uppercase">
              {room?.name || id}
            </h1>
          </div>
        </div>

        <div className="text-right space-y-1">
          <p className="text-6xl md:text-7xl font-black font-mono tracking-tighter text-foreground">
            {timeStr}
          </p>
          <p className="text-xl font-bold uppercase tracking-widest text-muted-foreground/60">
            {dateStr}
          </p>
          <div className="flex items-center justify-end gap-3 pt-4">
            <StatusDot status={status} />
            <span className="text-lg font-bold uppercase tracking-widest text-muted-foreground">
              {statusLabel[status]}
            </span>
          </div>
        </div>
      </header>

      {/* Main content - landscape tablet layout */}
      <main className="flex-1 px-8 pb-6 flex gap-8 min-h-0">
        {/* Left side: Status + Quick Book */}
        <div className="w-[420px] shrink-0 flex flex-col justify-center space-y-6">
          {currentMeeting && !isEnding ? (
            <>
              <CurrentMeeting
                meeting={currentMeeting}
                minutesRemaining={minutesRemaining}
              />
              {showCheckIn && !checkInDeadlinePassed && (
                <CheckInButton
                  onCheckIn={() => handleCheckIn(currentMeeting.id)}
                  label={remainingMinutes <= 1 ? `Check In Now (${countdownStr} left)` : `Check In (${countdownStr} remaining)`}
                  className={remainingMinutes <= 1 ? "animate-pulse bg-destructive hover:bg-destructive/90 shadow-[0_0_20px_rgba(239,68,68,0.4)]" : ""}
                />
              )}
              {currentMeeting.checkedIn && (
                <Button
                  onClick={() => handleCheckOut(currentMeeting.id)}
                  variant="outline"
                  className="w-full h-16 text-xl font-bold rounded-2xl border-2 border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive transition-all duration-300"
                >
                  End Meeting Early
                </Button>
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
        </div>

        {/* Right side: Timeline (prominent) */}
        <div className="flex-1 flex flex-col min-h-0">
          <Timeline meetings={allMeetings} now={now} />
        </div>
      </main>

      {/* Footer Quote */}
      {currentQuote && (
        <div className="absolute bottom-6 left-0 right-0 text-center px-8 border-t border-border pt-6 mx-8">
          <p className="text-2xl font-medium italic text-muted-foreground">
            "{currentQuote.quote}"
          </p>
          <p className="text-lg font-bold text-primary mt-1">
            — {currentQuote.author}
          </p>
        </div>
      )}
    </div>
  );
}
