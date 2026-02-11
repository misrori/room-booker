import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const DURATIONS = [15, 30, 60] as const;

interface Props {
  onBook: (minutes: number) => void;
  disabled?: boolean;
}

export function QuickBook({ onBook, disabled }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [booked, setBooked] = useState(false);

  const handleBook = () => {
    if (selected === null) return;
    onBook(selected);
    setBooked(true);
    setTimeout(() => {
      setBooked(false);
      setSelected(null);
    }, 2000);
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-6 slide-up">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
        Gyors foglalás
      </p>

      <div className="flex gap-3 mb-4">
        {DURATIONS.map((d) => (
          <button
            key={d}
            disabled={disabled}
            onClick={() => setSelected(d === selected ? null : d)}
            className={`flex-1 py-4 rounded-xl text-lg font-semibold transition-all duration-200 
              ${
                selected === d
                  ? "bg-primary text-primary-foreground scale-[1.02]"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }
              ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer active:scale-95"}
            `}
          >
            {d} perc
          </button>
        ))}
      </div>

      <Button
        onClick={handleBook}
        disabled={selected === null || disabled || booked}
        className="w-full h-14 text-lg font-semibold rounded-xl gap-2"
        variant={booked ? "secondary" : "default"}
      >
        {booked ? (
          <>
            <Check className="h-5 w-5" />
            Foglalva!
          </>
        ) : (
          <>
            <Plus className="h-5 w-5" />
            Foglalás most
          </>
        )}
      </Button>
    </div>
  );
}
