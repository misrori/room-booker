import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface Props {
  onCheckIn: () => void;
  label: string;
  autoTrigger?: boolean;
}

export function CheckInButton({ onCheckIn, label, autoTrigger }: Props) {
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (autoTrigger && !triggered) {
      setTriggered(true);
      const timer = setTimeout(() => {
        onCheckIn();
      }, 3000); // 3 second delay before auto-delete
      return () => clearTimeout(timer);
    }
  }, [autoTrigger, triggered, onCheckIn]);

  if (autoTrigger) {
    return (
      <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-5 slide-up">
        <p className="text-destructive font-semibold text-lg">{label}</p>
        <p className="text-sm text-muted-foreground mt-1">
          Room will be released automatically...
        </p>
      </div>
    );
  }

  return (
    <Button
      onClick={onCheckIn}
      className="w-full h-16 text-xl font-bold rounded-2xl gap-3 bg-primary hover:bg-primary/90"
      size="lg"
    >
      <CheckCircle2 className="h-6 w-6" />
      {label}
    </Button>
  );
}
