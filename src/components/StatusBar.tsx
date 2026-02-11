import { RoomStatus } from "@/hooks/useRoomStatus";

interface StatusBarProps {
  status: RoomStatus;
}

const labels: Record<RoomStatus, string> = {
  available: "Szabad",
  occupied: "Foglalt",
  upcoming: "Hamarosan foglalt",
};

export function StatusBar({ status }: StatusBarProps) {
  const colorClass =
    status === "available"
      ? "bg-room-available"
      : status === "occupied"
      ? "bg-room-occupied"
      : "bg-room-upcoming";

  return (
    <div className={`h-1.5 w-full ${colorClass} transition-colors duration-700`} />
  );
}

export function StatusDot({ status }: StatusBarProps) {
  const colorClass =
    status === "available"
      ? "bg-room-available"
      : status === "occupied"
      ? "bg-room-occupied"
      : "bg-room-upcoming";

  return (
    <span className="relative flex h-3.5 w-3.5">
      <span
        className={`absolute inline-flex h-full w-full rounded-full ${colorClass} opacity-40 status-pulse`}
      />
      <span
        className={`relative inline-flex rounded-full h-3.5 w-3.5 ${colorClass}`}
      />
    </span>
  );
}
