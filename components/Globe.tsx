"use client";

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

// A broad pool to draw from — a handful are picked at random each visit
// so the globe doesn't show the same four cities every time.
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

function pickRandomCities(pool: GlobeCity[], count: number): GlobeCity[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
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
  const [featuredCities] = useState(() =>
    pickRandomCities(GLOBE_CITY_POOL, FEATURED_CITY_COUNT),
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
    // Independent of rotation so the hover tooltip stays accurate even
    // when spinning is skipped for prefers-reduced-motion.
    const interval = setInterval(() => setNow(new Date()), 1000);
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

      {pins
        .filter((pin) => pin.visible)
        .map((pin) => (
          <div
            key={pin.name}
            className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            onMouseEnter={() => setHoveredCity(pin.name)}
            onMouseLeave={() => setHoveredCity(null)}
          >
            <div className="h-2 w-2 rounded-full bg-accent" />

            <span className="pointer-events-none absolute top-1/2 left-full ml-1.5 -translate-y-1/2 rounded bg-accent px-1.5 py-0.5 font-mono text-[10px] font-semibold whitespace-nowrap text-accent-foreground uppercase">
              {pin.name}
            </span>

            {hoveredCity === pin.name && (
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded border border-surface-border bg-surface px-2 py-1 font-mono text-xs whitespace-nowrap text-foreground shadow-lg">
                {formatTimeInZone(pin.timeZone, now)} ·{" "}
                {getOffsetLabel(pin.timeZone, now)}
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
