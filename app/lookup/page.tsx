"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import SearchBar from "@/components/lookup/SearchBar";
import ResultsList from "@/components/lookup/ResultsList";
import ZoneStatsCard from "@/components/lookup/ZoneStatsCard";
import { initGeoSearch, searchLocalPlaces, type GeoPlace } from "@/lib/geo";
import { searchMapbox } from "@/lib/mapboxSearch";

// Mapbox GL touches window/WebGL, so it must not render on the server.
const LocationMap = dynamic(() => import("@/components/lookup/LocationMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[320px] rounded-2xl border border-surface-border bg-surface" />
  ),
});

// How long to wait after the last keystroke before falling back to Mapbox.
// The local index runs on every keystroke; only the network tier is debounced.
const MAPBOX_DEBOUNCE_MS = 350;

type Tier = "local" | "mapbox" | null;

export default function LookupPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoPlace[]>([]);
  const [selected, setSelected] = useState<GeoPlace | null>(null);
  const [busy, setBusy] = useState(false);
  const [tier, setTier] = useState<Tier>(null);
  const [indexError, setIndexError] = useState(false);
  const [indexReady, setIndexReady] = useState(false);

  // Monotonic sequence so out-of-order async responses can be discarded.
  const seqRef = useRef(0);
  const mapboxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Warm up the local index as soon as Lookup mode is entered.
  useEffect(() => {
    let active = true;
    initGeoSearch()
      .then(() => active && setIndexReady(true))
      .catch(() => active && setIndexError(true));
    return () => {
      active = false;
    };
  }, []);

  // Search runs from the change handler (not a query effect) — the pattern
  // React recommends for reacting to user events rather than to state.
  const handleQueryChange = (value: string) => {
    setQuery(value);

    const q = value.trim();
    if (mapboxTimer.current) {
      clearTimeout(mapboxTimer.current);
      mapboxTimer.current = null;
    }

    if (!q) {
      seqRef.current++;
      setResults([]);
      setTier(null);
      setBusy(false);
      return;
    }

    const seq = ++seqRef.current;
    setBusy(true);

    const runMapbox = () => {
      mapboxTimer.current = setTimeout(async () => {
        const remote = await searchMapbox(q);
        if (seq !== seqRef.current) return;
        setResults(remote);
        setTier(remote.length ? "mapbox" : null);
        setBusy(false);
      }, MAPBOX_DEBOUNCE_MS);
    };

    // Tier 1 runs on every keystroke (in a worker, so it's cheap); Tier 2
    // (Mapbox) is reached only when Tier 1 finds nothing, and never parallel.
    searchLocalPlaces(q)
      .then((local) => {
        if (seq !== seqRef.current) return;
        if (local.length > 0) {
          setResults(local);
          setTier("local");
          setBusy(false);
        } else {
          runMapbox();
        }
      })
      .catch(() => {
        // Index failed to load — go straight to Mapbox.
        if (seq !== seqRef.current) return;
        runMapbox();
      });
  };

  // Clear any pending Mapbox debounce on unmount.
  useEffect(
    () => () => {
      if (mapboxTimer.current) clearTimeout(mapboxTimer.current);
    },
    [],
  );

  const showEmpty = query.trim() !== "" && !busy && results.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-1">
        <p className="text-xs tracking-widest text-muted uppercase">Lookup</p>
        <h1 className="font-display text-3xl text-foreground">
          Find any place, get its time
        </h1>
        <p className="text-sm text-muted">
          Search a city, town, or village worldwide — see its time zone, the
          current local time, and where it sits on the globe.
        </p>
      </header>

      <div className="flex flex-col gap-2">
        <SearchBar value={query} onChange={handleQueryChange} busy={busy} />
        <AnimatePresence>
          {(indexError || (!indexReady && !indexError)) && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-1 text-xs text-muted"
            >
              {indexError
                ? "Local index unavailable — falling back to online search."
                : "Loading the world place index…"}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          {results.length > 0 && (
            <div className="flex items-center justify-between px-1">
              <span className="text-xs tracking-widest text-muted uppercase">
                {results.length} result{results.length === 1 ? "" : "s"}
              </span>
              {tier === "mapbox" && (
                <span className="font-mono text-[10px] tracking-wider text-muted uppercase">
                  online fallback
                </span>
              )}
            </div>
          )}

          <ResultsList
            results={results}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
          />

          {showEmpty && (
            <p className="px-1 text-sm text-muted">
              No places match “{query.trim()}”.
            </p>
          )}

          <AnimatePresence mode="wait">
            {selected && <ZoneStatsCard key={selected.id} place={selected} />}
          </AnimatePresence>
        </div>

        <div className="min-h-[360px] lg:sticky lg:top-6 lg:h-[calc(100vh-8rem)]">
          <LocationMap place={selected} />
        </div>
      </div>
    </div>
  );
}
