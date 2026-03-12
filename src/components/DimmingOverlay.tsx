import { useEffect, useState } from "react";

export function DimmingOverlay() {
  const [isNight, setIsNight] = useState(false);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const hours = now.getHours();
      
      // Night is 19:00 to 07:00
      const night = hours >= 19 || hours < 7;
      setIsNight(night);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  if (!isNight) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 pointer-events-none z-[9999] transition-opacity duration-1000 animate-in fade-in" 
      aria-hidden="true"
    />
  );
}
