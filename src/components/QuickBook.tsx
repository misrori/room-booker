import { useState } from "react";
import { Check } from "lucide-react";

const DURATIONS = [15, 30, 60] as const;

interface Props {
  onBook: (minutes: number, bookedBy: string) => void;
  disabled?: boolean;
  maxMinutes?: number;
}

export function QuickBook({ onBook, disabled, maxMinutes = 999 }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [booked, setBooked] = useState(false);

  const handleSelect = (d: number) => {
    if (disabled || d > maxMinutes) return;

    setSelected(d);
    onBook(d, "Ad hoc meeting");
    setBooked(true);

    setTimeout(() => {
      setBooked(false);
      setSelected(null);
    }, 2000);
  };

  let durations = [15, 30, 60];
  
  if (maxMinutes >= 1 && maxMinutes <= 15) {
    durations = [maxMinutes, 30, 60];
  } else if (maxMinutes >= 16 && maxMinutes <= 30) {
    durations = [15, maxMinutes, 60];
  } else if (maxMinutes >= 31 && maxMinutes < 60) {
    durations = [15, 30, maxMinutes];
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-6 slide-up">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
        Quick Book
      </p>

      <div className="flex gap-3 mb-4">
        {durations.map((d) => {
          const isDisabled = disabled || d > maxMinutes;
          const isSelected = selected === d;

          return (
            <button
              key={d}
              disabled={isDisabled || booked}
              onClick={() => handleSelect(d)}
              className={`flex-1 py-4 rounded-xl text-lg font-semibold transition-all duration-200 
                ${isSelected
                  ? "bg-primary text-primary-foreground scale-[1.02]"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
                }
                ${isDisabled || (booked && !isSelected) ? "opacity-40 cursor-not-allowed" : "cursor-pointer active:scale-95"}
              `}
            >
              {isSelected && booked ? (
                <Check className="h-6 w-6 mx-auto" />
              ) : (
                `${d} min`
              )}
            </button>
          );
        })}
      </div>

      {booked && (
        <div className="text-center text-sm font-medium text-primary animate-in fade-in slide-in-from-bottom-2">
          Meeting booked successfully!
        </div>
      )}
    </div>
  );
}

