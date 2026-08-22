// Lookup mode — Tier 2 (Mapbox) client wrapper.
//
// Hits our own /api/geo/mapbox route (which holds the secret token), then
// backfills an IANA zone for each hit from the nearest local place. Called
// only after the local index returns nothing, and never in parallel with it.

import { resolveNearestZone, type GeoPlace } from "./geo";

interface MapboxApiResult {
  name: string;
  country: string;
  lat: number;
  lon: number;
}

export async function searchMapbox(query: string): Promise<GeoPlace[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  let results: MapboxApiResult[] = [];
  try {
    const res = await fetch(`/api/geo/mapbox?q=${encodeURIComponent(trimmed)}`);
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: MapboxApiResult[] };
    results = data.results ?? [];
  } catch {
    return [];
  }

  const places = await Promise.all(
    results.map(async (r, i): Promise<GeoPlace | null> => {
      const zone = await resolveNearestZone(r.lat, r.lon);
      if (!zone) return null; // no zone means no usable stats — drop it
      return {
        id: -(i + 1),
        name: r.name,
        country: r.country || zone.country,
        admin1: "",
        lat: r.lat,
        lon: r.lon,
        timeZone: zone.timeZone,
        population: 0,
        source: "mapbox",
      };
    }),
  );

  return places.filter((p): p is GeoPlace => p !== null);
}
