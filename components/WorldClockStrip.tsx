"use client";

import { useEffect, useState } from "react";
import { formatTimeInZone, getOffsetLabel } from "@/lib/timezones";

const STRIP_CITIES = [
  { city: "Chicago", timeZone: "America/Chicago" },
  { city: "London", timeZone: "Europe/London" },
  { city: "Kuala Lumpur", timeZone: "Asia/Kuala_Lumpur" },
  { city: "Sydney", timeZone: "Australia/Sydney" },
];

export default function WorldClockStrip() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Sets the initial clock reading post-mount to avoid a server/client
    // render mismatch, then subscribes to a ticking interval.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border-y border-surface-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-12 gap-y-4 px-6 py-6">
        <p className="text-xs tracking-widest text-muted uppercase">
          World Clock
        </p>

        {STRIP_CITIES.map(({ city, timeZone }) => (
          <div key={city}>
            <p className="text-xs text-muted">{city}</p>
            <p className="font-mono text-xl tabular-nums">
              {now ? formatTimeInZone(timeZone, now) : "--:--"}
            </p>
            <p className="text-xs text-accent">
              {now ? getOffsetLabel(timeZone, now) : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
