import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingDialog } from "@/components/BookingDialog";

const DURATIONS = [15, 30, 60] as const;

interface Props {
  onBook: (minutes: number, bookedBy: string) => void;
  disabled?: boolean;
  maxMinutes?: number;
}

export function QuickBook({ onBook, disabled, maxMinutes = 999 }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [booked, setBooked] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSelect = (d: number) => {
    if (d === selected) {
      setSelected(null);
    } else {
      setSelected(d);
      setDialogOpen(true);
    }
  };

  const handleConfirm = (name: string) => {
    if (selected === null) return;
    onBook(selected, name);
    setDialogOpen(false);
    setBooked(true);
    setTimeout(() => {
      setBooked(false);
      setSelected(null);
    }, 2000);
  };

  return (
    <>
      <div className="rounded-2xl bg-card border border-border p-6 slide-up">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
          Quick Book
        </p>

        <div className="flex gap-3 mb-4">
          {DURATIONS.map((d) => {
            const isDisabled = disabled || d > maxMinutes;
            return (
              <button
                key={d}
                disabled={isDisabled}
                onClick={() => handleSelect(d)}
                className={`flex-1 py-4 rounded-xl text-lg font-semibold transition-all duration-200 
                  ${
                    selected === d
                      ? "bg-primary text-primary-foreground scale-[1.02]"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }
                  ${isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer active:scale-95"}
                `}
              >
                {d} min
              </button>
            );
          })}
        </div>

        {booked && (
          <Button
            disabled
            className="w-full h-14 text-lg font-semibold rounded-xl gap-2"
            variant="secondary"
          >
            <Check className="h-5 w-5" />
            Booked!
          </Button>
        )}
      </div>

      <BookingDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setSelected(null); }}
        onConfirm={handleConfirm}
        minutes={selected || 0}
      />
    </>
  );
}
