"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";
import type { GeoPlace } from "@/lib/geo";

interface LocationMapProps {
  place: GeoPlace | null;
}

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function LocationMap({ place }: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  // Create the map once.
  useEffect(() => {
    if (!TOKEN || !containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      projection: "globe", // clean 3D globe view
      center: [0, 20],
      zoom: 1.4,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.AttributionControl({ compact: true }));
    map.on("style.load", () => {
      // Subtle atmosphere so the globe reads as a sphere, not a flat disc.
      map.setFog({
        color: "rgb(13, 26, 34)",
        "high-color": "rgb(15, 42, 44)",
        "horizon-blend": 0.2,
        "space-color": "rgb(10, 20, 28)",
        "star-intensity": 0.15,
      });
    });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Fly to / mark the selected place.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !place) return;

    const target: [number, number] = [place.lon, place.lat];
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (!markerRef.current) {
      const el = document.createElement("div");
      el.style.width = "14px";
      el.style.height = "14px";
      el.style.borderRadius = "9999px";
      el.style.background = "var(--accent, #d8ff4b)";
      el.style.boxShadow = "0 0 0 4px rgba(216, 255, 75, 0.25)";
      markerRef.current = new mapboxgl.Marker({ element: el });
    }
    markerRef.current.setLngLat(target).addTo(map);

    if (reduceMotion) {
      map.jumpTo({ center: target, zoom: 5 });
    } else {
      map.flyTo({ center: target, zoom: 5, speed: 1.1, essential: true });
    }
  }, [place]);

  if (!TOKEN) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-surface-border bg-surface p-6 text-center">
        <p className="max-w-xs text-sm text-muted">
          Map unavailable — set{" "}
          <code className="font-mono text-xs text-foreground">
            NEXT_PUBLIC_MAPBOX_TOKEN
          </code>{" "}
          to show the location on a map.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full min-h-[320px] w-full overflow-hidden rounded-2xl border border-surface-border"
    />
  );
}
