import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { MapPin, Users, ArrowRight, Sparkles, Loader2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";


const ROOMS = [
  { id: "diamond", name: "Diamond", floor: "1st Floor", capacity: 10 },
  { id: "gold", name: "Gold", floor: "1st Floor", capacity: 10 },
  { id: "silver", name: "Silver", floor: "1st Floor", capacity: 10 },
];

export default function Home() {
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleGenerateTestData = async () => {
    setGenerating(true);
    setGenResult(null);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || anonKey;

      const res = await fetch(
        `${supabaseUrl}/functions/v1/calendar-events`,
        {
          method: "POST",
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "generate-test-data" }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setGenResult(`Created ${data.created} test events across all rooms`);
    } catch (err: any) {
      setGenResult(`Error: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="absolute top-8 right-8 gap-2 text-muted-foreground hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
      <div className="mb-10 flex flex-col items-center gap-4">
        <img src={`${import.meta.env.BASE_URL}pao_logo.png`} alt="Logo" className="h-24 w-auto" />
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Meeting Rooms
        </h1>
        <p className="text-muted-foreground text-lg">Select a room to view its schedule</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-10">
        {ROOMS.map((room) => (
          <Link
            key={room.id}
            to={`/room/${room.id}`}
            className="group rounded-2xl bg-card border border-border p-8 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] slide-up"
          >
            <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
              {room.name}
            </h2>
            <div className="flex flex-col gap-2 text-muted-foreground text-sm mb-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{room.floor}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{room.capacity} people</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-primary text-sm font-medium">
              <span>Open</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button
          onClick={handleGenerateTestData}
          disabled={generating}
          variant="secondary"
          className="gap-2"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate Test Events for Today
        </Button>
        {genResult && (
          <p className="text-sm text-muted-foreground">{genResult}</p>
        )}
      </div>
    </div>
  );
}
