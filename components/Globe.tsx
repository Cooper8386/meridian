"use client";

import { useEffect, useMemo, useState } from "react";
import { geoDistance, geoGraticule, geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import worldTopology from "world-atlas/land-110m.json";

interface GlobeCity {
  name: string;
  lat: number;
  lon: number;
}

const GLOBE_CITIES: GlobeCity[] = [
  { name: "London", lat: 51.51, lon: -0.13 },
  { name: "Chicago", lat: 41.88, lon: -87.63 },
  { name: "Tokyo", lat: 35.68, lon: 139.65 },
  { name: "Sydney", lat: -33.87, lon: 151.21 },
];

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
  const [lambda, setLambda] = useState(-20);
  const [spinning] = useState(() => {
    if (typeof window === "undefined") return true;
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (!spinning) return;
    const interval = setInterval(() => {
      setLambda((prev) => prev - ROTATION_DEGREES_PER_TICK);
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [spinning]);

  const { landPath, graticulePath, spherePath, pins } = useMemo(() => {
    const projection = geoOrthographic()
      .scale(SIZE / 2 - 12)
      .translate([SIZE / 2, SIZE / 2])
      .rotate([lambda, TILT])
      .clipAngle(90);

    const path = geoPath(projection);
    const viewCenter: [number, number] = [-lambda, -TILT];

    const projectedPins = GLOBE_CITIES.map((city) => {
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
  }, [lambda]);

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
        {pins
          .filter((pin) => pin.visible)
          .map((pin) => (
            <circle
              key={pin.name}
              cx={(pin.x / 100) * SIZE}
              cy={(pin.y / 100) * SIZE}
              r={4}
              fill="var(--accent)"
            />
          ))}
      </svg>

      {pins
        .filter((pin) => pin.visible)
        .map((pin) => (
          <span
            key={pin.name}
            className="pointer-events-none absolute rounded bg-accent px-1.5 py-0.5 font-mono text-[10px] font-semibold text-accent-foreground uppercase"
            style={{
              left: `${pin.x}%`,
              top: `${pin.y}%`,
              transform: "translate(12px, -50%)",
            }}
          >
            {pin.name}
          </span>
        ))}
    </div>
  );
}
