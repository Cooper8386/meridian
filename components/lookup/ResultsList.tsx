"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { GeoPlace } from "@/lib/geo";

interface ResultsListProps {
  results: GeoPlace[];
  selectedId: number | null;
  onSelect: (place: GeoPlace) => void;
}

const regionNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

function countryName(code: string): string {
  if (!code) return "";
  try {
    return regionNames?.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

export default function ResultsList({
  results,
  selectedId,
  onSelect,
}: ResultsListProps) {
  return (
    <ul className="flex flex-col gap-1">
      <AnimatePresence initial={false}>
        {results.map((place, i) => {
          const isSelected = place.id === selectedId;
          return (
            <motion.li
              key={`${place.id}-${place.name}`}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, delay: Math.min(i * 0.02, 0.12) }}
            >
              <button
                type="button"
                onClick={() => onSelect(place)}
                className={`flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition-colors ${
                  isSelected
                    ? "border-accent bg-accent/10"
                    : "border-transparent bg-surface hover:border-surface-border"
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-display text-base text-foreground">
                    {place.name}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {countryName(place.country)}
                    {place.source === "mapbox" && (
                      <span className="ml-2 rounded bg-surface-border px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-muted uppercase">
                        Mapbox
                      </span>
                    )}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-xs text-muted">
                  {place.timeZone}
                </span>
              </button>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
