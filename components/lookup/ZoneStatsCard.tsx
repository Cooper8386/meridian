"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { GeoPlace } from "@/lib/geo";
import { getZoneStats } from "@/lib/zoneStats";

interface ZoneStatsCardProps {
  place: GeoPlace;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-t border-surface-border py-3">
      <dt className="text-xs tracking-widest text-muted uppercase">{label}</dt>
      <dd className="font-mono text-sm text-foreground">{value || "—"}</dd>
    </div>
  );
}

export default function ZoneStatsCard({ place }: ZoneStatsCardProps) {
  const [now, setNow] = useState<Date>(() => new Date());

  // Independent 1s tick so the local clock stays live regardless of anything
  // else on the page.
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const stats = getZoneStats(place, now);

  return (
    <motion.div
      key={place.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="rounded-2xl border border-surface-border bg-surface p-6"
    >
      <div className="flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate font-display text-2xl text-foreground">
            {stats.city}
          </h2>
          <p className="text-sm text-muted">{stats.country}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-3xl tabular-nums text-accent">
            {stats.localTime}
          </p>
          <p className="font-mono text-xs text-muted">local time</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        <Stat label="IANA zone" value={stats.timeZone} />
        <Stat label="UTC offset" value={stats.utcOffset} />
        <Stat label="Abbreviation" value={stats.abbreviation} />
        <Stat label="Zone name" value={stats.longName} />
      </dl>
    </motion.div>
  );
}
