import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Room {
  id: string;
  name: string;
  floor: string;
  capacity: number;
}

export interface Meeting {
  id: string;
  title: string;
  organizer: string;
  startTime: Date;
  endTime: Date;
  checkedIn?: boolean;
  attendees?: number;
}

export type RoomStatus = "available" | "occupied" | "upcoming";

export interface RoomState {
  status: RoomStatus;
  currentMeeting: Meeting | null;
  nextMeeting: Meeting | null;
  minutesUntilNext: number | null;
  minutesRemaining: number | null;
  allMeetings: Meeting[];
  now: Date;
  room: Room | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  updateEventOptimistically: (eventId: string, updates: Partial<Meeting>) => void;
}

const POLL_INTERVAL = 30_000; // 30s
const CLOCK_INTERVAL = 1000; // 1s

export function useCalendarEvents(roomId: string): RoomState {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, Partial<Meeting>>>({});

  const fetchEvents = useCallback(async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || anonKey;

      const res = await fetch(
        `${supabaseUrl}/functions/v1/calendar-events?room=${roomId}`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const result = await res.json();
      setRoom(result.room);
      setMeetings(
        result.events.map((e: any) => ({
          ...e,
          startTime: new Date(e.startTime),
          endTime: new Date(e.endTime),
          attendees: e.attendees,
          checkedIn: e.checkedIn,
        }))
      );
      setError(null);
      // Clear optimistic updates on successful fetch
      setOptimisticUpdates({});
    } catch (err: any) {
      console.error("Failed to fetch calendar events:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // Poll for events
  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  // Clock tick
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), CLOCK_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const updateEventOptimistically = useCallback((eventId: string, updates: Partial<Meeting>) => {
    setOptimisticUpdates(prev => ({ ...prev, [eventId]: { ...prev[eventId], ...updates } }));
  }, []);

  // Apply optimistic updates to meetings
  const actualMeetings = meetings.map(m => {
    if (optimisticUpdates[m.id]) {
      return { ...m, ...optimisticUpdates[m.id] };
    }
    return m;
  });

  // Compute status
  const sorted = [...actualMeetings].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  );

  let current = sorted.find((m) => now >= m.startTime && now < m.endTime) || null;
  const upcoming = sorted.filter((m) => m.startTime > now);
  let next = upcoming[0] || null;

  // Promotion logic: if next meeting is already checked in (early), treat it as current
  if (!current && next?.checkedIn) {
    current = next;
    next = upcoming[1] || null;
  }

  let status: RoomStatus = "available";
  let minutesRemaining: number | null = null;
  let minutesUntilNext: number | null = null;

  if (current) {
    status = "occupied";
    minutesRemaining = Math.ceil((current.endTime.getTime() - now.getTime()) / 60000);
  }

  if (next) {
    minutesUntilNext = Math.ceil((next.startTime.getTime() - now.getTime()) / 60000);
    if (!current && minutesUntilNext <= 10) {
      status = "upcoming";
    }
  }

  return {
    status,
    currentMeeting: current,
    nextMeeting: next,
    minutesUntilNext,
    minutesRemaining,
    allMeetings: sorted,
    now,
    room,
    loading,
    error,
    refetch: fetchEvents,
    updateEventOptimistically,
  };
}
