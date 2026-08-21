"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { geoDistance, geoGraticule, geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import worldTopology from "world-atlas/land-110m.json";
import { formatTimeInZone, getOffsetLabel } from "@/lib/timezones";

interface GlobeCity {
  name: string;
  lat: number;
  lon: number;
  timeZone: string;
}

// The 15 most globally recognizable cities the globe cycles through. As
// rotation carries one out of view, a new visible, non-overlapping one
// from this pool takes its place — see refreshDisplayed() below.
const GLOBE_CITY_POOL: GlobeCity[] = [
  { name: "London", lat: 51.51, lon: -0.13, timeZone: "Europe/London" },
  { name: "Berlin", lat: 52.52, lon: 13.4, timeZone: "Europe/Berlin" },
  { name: "Cairo", lat: 30.04, lon: 31.24, timeZone: "Africa/Cairo" },
  { name: "Moscow", lat: 55.76, lon: 37.62, timeZone: "Europe/Moscow" },
  { name: "Dubai", lat: 25.2, lon: 55.27, timeZone: "Asia/Dubai" },
  { name: "New Delhi", lat: 28.61, lon: 77.21, timeZone: "Asia/Kolkata" },
  { name: "Bangkok", lat: 13.76, lon: 100.5, timeZone: "Asia/Bangkok" },
  { name: "Shanghai", lat: 31.23, lon: 121.47, timeZone: "Asia/Shanghai" },
  { name: "Singapore", lat: 1.35, lon: 103.82, timeZone: "Asia/Singapore" },
  { name: "Tokyo", lat: 35.68, lon: 139.65, timeZone: "Asia/Tokyo" },
  { name: "Sydney", lat: -33.87, lon: 151.21, timeZone: "Australia/Sydney" },
  { name: "Los Angeles", lat: 34.05, lon: -118.24, timeZone: "America/Los_Angeles" },
  { name: "Chicago", lat: 41.88, lon: -87.63, timeZone: "America/Chicago" },
  { name: "New York", lat: 40.71, lon: -74.01, timeZone: "America/New_York" },
  { name: "Sao Paulo", lat: -23.55, lon: -46.63, timeZone: "America/Sao_Paulo" },
];

const TARGET_DISPLAYED_COUNT = 4;
const MIN_SEPARATION_PX = 100;
const MAINTENANCE_INTERVAL_MS = 1000;

const SIZE = 420;
const TILT = -18;
const ROTATION_DEGREES_PER_TICK = 0.12;
const TICK_INTERVAL_MS = 40;

const land = feature(
  worldTopology as unknown as Topology,
  worldTopology.objects.land as GeometryCollection,
);
const graticule = geoGraticule().step([20, 20])();
const sphere = { type: "Sphere" as const };

interface ProjectedCity extends GlobeCity {
  visible: boolean;
  x: number;
  y: number;
}

/** Projects the whole pool at a given rotation (raw SIZE-unit coordinates). */
function projectPool(lambda: number): ProjectedCity[] {
  const projection = geoOrthographic()
    .scale(SIZE / 2 - 12)
    .translate([SIZE / 2, SIZE / 2])
    .rotate([lambda, TILT])
    .clipAngle(90);

  const viewCenter: [number, number] = [-lambda, -TILT];

  return GLOBE_CITY_POOL.map((city) => {
    const point: [number, number] = [city.lon, city.lat];
    const visible = geoDistance(point, viewCenter) < Math.PI / 2;
    const projected = projection(point);
    return {
      ...city,
      visible,
      x: projected ? projected[0] : 0,
      y: projected ? projected[1] : 0,
    };
  });
}

function pixelDistance(a: ProjectedCity, b: ProjectedCity): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Drops names that have rotated out of view, then tops back up to
 * TARGET_DISPLAYED_COUNT with visible, non-overlapping candidates from
 * the pool. This is what makes the globe feel like it's continuously
 * revealing cities as it turns, rather than swapping the whole set on a
 * timer regardless of what's actually on screen.
 */
function refreshDisplayed(
  projected: ProjectedCity[],
  currentNames: string[],
): string[] {
  const kept = currentNames
    .map((name) => projected.find((c) => c.name === name))
    .filter((c): c is ProjectedCity => !!c && c.visible);

  const chosen = [...kept];
  const candidates = projected
    .filter((c) => c.visible && !chosen.some((k) => k.name === c.name))
    .sort(() => Math.random() - 0.5);

  for (const candidate of candidates) {
    if (chosen.length >= TARGET_DISPLAYED_COUNT) break;
    const overlaps = chosen.some(
      (c) => pixelDistance(c, candidate) < MIN_SEPARATION_PX,
    );
    if (!overlaps) chosen.push(candidate);
  }

  return chosen.map((c) => c.name);
}

export default function Globe() {
  const [lambda, setLambda] = useState(-20);
  const lambdaRef = useRef(lambda);

  const [spinning] = useState(() => {
    if (typeof window === "undefined") return true;
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  const [displayedNames, setDisplayedNames] = useState<string[]>(() =>
    refreshDisplayed(projectPool(-20), []),
  );
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    lambdaRef.current = lambda;
  }, [lambda]);

  useEffect(() => {
    if (!spinning) return;
    const interval = setInterval(() => {
      setLambda((prev) => prev - ROTATION_DEGREES_PER_TICK);
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [spinning]);

  useEffect(() => {
    // Independent of rotation so the hover detail stays accurate even
    // when spinning is skipped for prefers-reduced-motion.
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!spinning) return;
    const interval = setInterval(() => {
      const projected = projectPool(lambdaRef.current);
      setDisplayedNames((current) => {
        const next = refreshDisplayed(projected, current);
        const unchanged =
          next.length === current.length &&
          next.every((name, i) => name === current[i]);
        return unchanged ? current : next;
      });
    }, MAINTENANCE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [spinning]);

  const { landPath, graticulePath, spherePath, pins } = useMemo(() => {
    const projection = geoOrthographic()
      .scale(SIZE / 2 - 12)
      .translate([SIZE / 2, SIZE / 2])
      .rotate([lambda, TILT])
      .clipAngle(90);

    const path = geoPath(projection);
    const projected = projectPool(lambda).filter((c) =>
      displayedNames.includes(c.name),
    );

    return {
      landPath: path(land) ?? "",
      graticulePath: path(graticule) ?? "",
      spherePath: path(sphere) ?? "",
      pins: projected.map((c) => ({
        ...c,
        x: (c.x / SIZE) * 100,
        y: (c.y / SIZE) * 100,
      })),
    };
  }, [lambda, displayedNames]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-full w-full"
        role="img"
        aria-label="Rotating globe showing a few of the app's featured cities"
      >
        <path d={spherePath} fill="var(--globe-sphere)" />
        <path
          d={graticulePath}
          fill="none"
          stroke="var(--globe-graticule)"
          strokeWidth={0.5}
        />
        <path
          d={landPath}
          fill="var(--globe-land)"
          stroke="var(--surface-border)"
          strokeWidth={0.6}
        />
        <path
          d={spherePath}
          fill="none"
          stroke="var(--surface-border)"
          strokeWidth={1}
        />
      </svg>

      <AnimatePresence>
        {pins
          .filter((pin) => pin.visible)
          .map((pin) => {
            const isHovered = hoveredCity === pin.name;
            return (
              <motion.div
                key={pin.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute"
                style={{
                  left: `${pin.x}%`,
                  top: `${pin.y}%`,
                  zIndex: isHovered ? 30 : 10,
                }}
              >
                <div className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />

                <div
                  onMouseEnter={() => setHoveredCity(pin.name)}
                  onMouseLeave={() => setHoveredCity(null)}
                  className="absolute top-1/2 left-2 flex -translate-y-1/2 cursor-default items-center overflow-hidden rounded bg-accent px-1.5 py-0.5 font-mono text-[10px] font-semibold whitespace-nowrap text-accent-foreground uppercase"
                >
                  <span>{pin.name}</span>
                  <motion.span
                    initial={false}
                    animate={
                      isHovered
                        ? { opacity: 1, width: "auto", marginLeft: 6 }
                        : { opacity: 0, width: 0, marginLeft: 0 }
                    }
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="normal-case"
                  >
                    {formatTimeInZone(pin.timeZone, now)} ·{" "}
                    {getOffsetLabel(pin.timeZone, now)}
                  </motion.span>
                </div>
              </motion.div>
            );
          })}
      </AnimatePresence>
    </div>
  );
}
