import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface Props {
  onCheckIn: () => void;
  label: string;
  className?: string;
}

export function CheckInButton({ onCheckIn, label, className }: Props) {
  return (
    <Button
      onClick={onCheckIn}
      className={`w-full h-16 text-xl font-bold rounded-2xl gap-3 bg-primary hover:bg-primary/90 transition-all duration-300 ${className || ""}`}
      size="lg"
    >
      <CheckCircle2 className="h-6 w-6" />
      {label}
    </Button>
  );
}
