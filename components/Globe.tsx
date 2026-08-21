"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
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

// A broad pool to draw from — pickSpreadCities() below picks a handful,
// spread around the globe, on each visit so the globe doesn't show the
// same four cities every time.
const GLOBE_CITY_POOL: GlobeCity[] = [
  { name: "London", lat: 51.51, lon: -0.13, timeZone: "Europe/London" },
  { name: "Reykjavik", lat: 64.15, lon: -21.94, timeZone: "Atlantic/Reykjavik" },
  { name: "Berlin", lat: 52.52, lon: 13.4, timeZone: "Europe/Berlin" },
  { name: "Cairo", lat: 30.04, lon: 31.24, timeZone: "Africa/Cairo" },
  { name: "Nairobi", lat: -1.29, lon: 36.82, timeZone: "Africa/Nairobi" },
  { name: "Moscow", lat: 55.76, lon: 37.62, timeZone: "Europe/Moscow" },
  { name: "Dubai", lat: 25.2, lon: 55.27, timeZone: "Asia/Dubai" },
  { name: "New Delhi", lat: 28.61, lon: 77.21, timeZone: "Asia/Kolkata" },
  { name: "Bangkok", lat: 13.76, lon: 100.5, timeZone: "Asia/Bangkok" },
  { name: "Shanghai", lat: 31.23, lon: 121.47, timeZone: "Asia/Shanghai" },
  { name: "Singapore", lat: 1.35, lon: 103.82, timeZone: "Asia/Singapore" },
  { name: "Tokyo", lat: 35.68, lon: 139.65, timeZone: "Asia/Tokyo" },
  { name: "Sydney", lat: -33.87, lon: 151.21, timeZone: "Australia/Sydney" },
  { name: "Auckland", lat: -36.85, lon: 174.76, timeZone: "Pacific/Auckland" },
  { name: "Honolulu", lat: 21.31, lon: -157.86, timeZone: "Pacific/Honolulu" },
  { name: "Anchorage", lat: 61.22, lon: -149.9, timeZone: "America/Anchorage" },
  { name: "Los Angeles", lat: 34.05, lon: -118.24, timeZone: "America/Los_Angeles" },
  { name: "Denver", lat: 39.74, lon: -104.99, timeZone: "America/Denver" },
  { name: "Chicago", lat: 41.88, lon: -87.63, timeZone: "America/Chicago" },
  { name: "Mexico City", lat: 19.43, lon: -99.13, timeZone: "America/Mexico_City" },
  { name: "New York", lat: 40.71, lon: -74.01, timeZone: "America/New_York" },
  { name: "Sao Paulo", lat: -23.55, lon: -46.63, timeZone: "America/Sao_Paulo" },
  { name: "Buenos Aires", lat: -34.6, lon: -58.38, timeZone: "America/Argentina/Buenos_Aires" },
];

const FEATURED_CITY_COUNT = 4;
const MIN_SEPARATION_DEGREES = 35;
const CITY_SWAP_INTERVAL_MS = 9000;

/**
 * Splits the pool into FEATURED_CITY_COUNT longitude bands and picks one
 * city per band. Evenly-spaced bands guarantee the selection is spread
 * around the globe, so at least one city is visible from any rotation
 * angle and same-band cities — the most overlap-prone pairs — never both
 * get picked. Within a band, prefers a candidate whose great-circle
 * distance from cities already picked clears MIN_SEPARATION_DEGREES, to
 * also catch near-band-boundary overlaps a pure longitude split can't.
 */
function pickSpreadCities(pool: GlobeCity[], count: number): GlobeCity[] {
  const minSeparationRad = (MIN_SEPARATION_DEGREES * Math.PI) / 180;
  const bandSize = 360 / count;
  const bands: GlobeCity[][] = Array.from({ length: count }, () => []);

  for (const city of pool) {
    const normalizedLon = (((city.lon + 180) % 360) + 360) % 360;
    const bandIndex = Math.min(count - 1, Math.floor(normalizedLon / bandSize));
    bands[bandIndex].push(city);
  }

  const selected: GlobeCity[] = [];
  for (const band of bands) {
    if (band.length === 0) continue;
    const shuffled = [...band].sort(() => Math.random() - 0.5);
    const candidate =
      shuffled.find((city) =>
        selected.every(
          (picked) =>
            geoDistance([city.lon, city.lat], [picked.lon, picked.lat]) >
            minSeparationRad,
        ),
      ) ?? shuffled[0];
    selected.push(candidate);
  }

  return selected;
}

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

export default function Globe() {
  const [featuredCities, setFeaturedCities] = useState(() =>
    pickSpreadCities(GLOBE_CITY_POOL, FEATURED_CITY_COUNT),
  );
  const [lambda, setLambda] = useState(-20);
  const [spinning] = useState(() => {
    if (typeof window === "undefined") return true;
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

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
    // Cycles which cities are on display, so the globe doesn't show the
    // same four for the whole visit — pins fade out/in (see AnimatePresence
    // below) rather than jumping.
    const interval = setInterval(() => {
      setFeaturedCities(pickSpreadCities(GLOBE_CITY_POOL, FEATURED_CITY_COUNT));
      setHoveredCity(null);
    }, CITY_SWAP_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const { landPath, graticulePath, spherePath, pins } = useMemo(() => {
    const projection = geoOrthographic()
      .scale(SIZE / 2 - 12)
      .translate([SIZE / 2, SIZE / 2])
      .rotate([lambda, TILT])
      .clipAngle(90);

    const path = geoPath(projection);
    const viewCenter: [number, number] = [-lambda, -TILT];

    const projectedPins = featuredCities.map((city) => {
      const point: [number, number] = [city.lon, city.lat];
      const visible = geoDistance(point, viewCenter) < Math.PI / 2;
      const projected = projection(point);
      return {
        ...city,
        visible,
        x: projected ? (projected[0] / SIZE) * 100 : 0,
        y: projected ? (projected[1] / SIZE) * 100 : 0,
      };
    });

    return {
      landPath: path(land) ?? "",
      graticulePath: path(graticule) ?? "",
      spherePath: path(sphere) ?? "",
      pins: projectedPins,
    };
  }, [lambda, featuredCities]);

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
