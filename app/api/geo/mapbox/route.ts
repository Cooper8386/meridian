// Lookup mode — Tier 2 (Mapbox) fallback endpoint.
//
// Called by the client ONLY when the local index returns zero results (see
// app/lookup/page.tsx). Runs server-side so the secret MAPBOX_ACCESS_TOKEN
// (read from .env) is never exposed to the browser. Mapbox doesn't return
// IANA time zones, so the client fills those in from the nearest local place
// (lib/geo.ts resolveNearestZone) — this route only returns name + coords +
// country code.

import { NextResponse } from "next/server";

const FORWARD_URL = "https://api.mapbox.com/search/searchbox/v1/forward";

interface MapboxResult {
  name: string;
  country: string; // ISO-3166 alpha-2 code, best effort
  lat: number;
  lon: number;
}

interface MapboxFeature {
  properties?: {
    name?: string;
    context?: {
      country?: { country_code?: string; name?: string };
    };
    coordinates?: { latitude?: number; longitude?: number };
  };
  geometry?: { coordinates?: [number, number] };
}

export async function GET(request: Request) {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Mapbox is not configured.", results: [] },
      { status: 503 },
    );
  }

  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const url = new URL(FORWARD_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("access_token", token);
  url.searchParams.set("limit", "6");
  url.searchParams.set("types", "city,town,village,place,locality,neighborhood");

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Mapbox error (${res.status})`, results: [] },
        { status: 502 },
      );
    }
    const data = (await res.json()) as { features?: MapboxFeature[] };
    const results: MapboxResult[] = (data.features ?? [])
      .map((f): MapboxResult | null => {
        const props = f.properties ?? {};
        const lon = props.coordinates?.longitude ?? f.geometry?.coordinates?.[0];
        const lat = props.coordinates?.latitude ?? f.geometry?.coordinates?.[1];
        if (typeof lat !== "number" || typeof lon !== "number") return null;
        return {
          name: props.name ?? query,
          country: (props.context?.country?.country_code ?? "").toUpperCase(),
          lat,
          lon,
        };
      })
      .filter((r): r is MapboxResult => r !== null);

    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Mapbox request failed";
    return NextResponse.json({ error: message, results: [] }, { status: 502 });
  }
}
