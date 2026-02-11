import { useState, useEffect, useMemo } from "react";
import { Meeting, MOCK_MEETINGS } from "@/lib/mockData";

export type RoomStatus = "available" | "occupied" | "upcoming";

export interface RoomState {
  status: RoomStatus;
  currentMeeting: Meeting | null;
  nextMeeting: Meeting | null;
  minutesUntilNext: number | null;
  minutesRemaining: number | null;
  allMeetings: Meeting[];
  now: Date;
}

export function useRoomStatus(): RoomState {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(interval);
  }, []);

  return useMemo(() => {
    const sorted = [...MOCK_MEETINGS].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );

    const current = sorted.find(
      (m) => now >= m.startTime && now < m.endTime
    );

    const upcoming = sorted.filter((m) => m.startTime > now);
    const next = upcoming.length > 0 ? upcoming[0] : null;

    let status: RoomStatus = "available";
    let minutesRemaining: number | null = null;
    let minutesUntilNext: number | null = null;

    if (current) {
      status = "occupied";
      minutesRemaining = Math.ceil(
        (current.endTime.getTime() - now.getTime()) / 60000
      );
    }

    if (next) {
      minutesUntilNext = Math.ceil(
        (next.startTime.getTime() - now.getTime()) / 60000
      );
      if (!current && minutesUntilNext <= 10) {
        status = "upcoming";
      }
    }

    return {
      status,
      currentMeeting: current || null,
      nextMeeting: next || null,
      minutesUntilNext,
      minutesRemaining,
      allMeetings: sorted,
      now,
    };
  }, [now]);
}
