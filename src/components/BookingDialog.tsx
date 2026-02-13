import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, UserX } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  minutes: number;
}

export function BookingDialog({ open, onClose, onConfirm, minutes }: Props) {
  const [name, setName] = useState("");

  const handleConfirm = () => {
    onConfirm(name.trim() || "Anonymous");
    setName("");
  };

  const handleAnonymous = () => {
    onConfirm("Anonymous");
    setName("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Book {minutes} min meeting
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Who's booking?
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              className="h-14 text-lg bg-secondary border-border"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleAnonymous}
              variant="secondary"
              className="flex-1 h-14 text-base gap-2"
            >
              <UserX className="h-5 w-5" />
              Anonymous
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 h-14 text-base gap-2"
            >
              <User className="h-5 w-5" />
              {name.trim() ? `Book as ${name.trim()}` : "Book"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
