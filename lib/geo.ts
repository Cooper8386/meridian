// Lookup mode — Tier 1 local search orchestration (main-thread side).
//
// The heavy work (fetching the 15 MB places.json, caching it in IndexedDB,
// building the FlexSearch index, and running queries) all happens in a Web
// Worker (lib/geo.worker.ts) so keystroke-by-keystroke searching never
// blocks the main thread and the search-bar animation stays smooth. This
// module is just the typed, promise-based bridge to that worker.
//
// See scripts/build-geo-index.mjs for how the static assets under
// public/geo/ are produced at build time.

/** A place resolved by either the local index or the Mapbox fallback. */
export interface GeoPlace {
  /** Local-index row id; negative/synthetic for Mapbox results. */
  id: number;
  name: string;
  /** ISO-3166 alpha-2 country code (e.g. "AR"). */
  country: string;
  /** GeoNames admin1 code — only used to disambiguate same-named places. */
  admin1: string;
  lat: number;
  lon: number;
  /** IANA time zone id, e.g. "America/Argentina/Buenos_Aires". */
  timeZone: string;
  population: number;
  source: "local" | "mapbox";
}

/** Column order of a place row in public/geo/places.json. */
export const GEO_COLS = ["n", "a", "cc", "adm1", "lat", "lon", "tz", "pop"];

/** Nearest-place lookup, used to resolve an IANA zone for a Mapbox hit. */
export interface NearestZone {
  timeZone: string;
  country: string;
}

type WorkerRequest =
  | { type: "init" }
  | { type: "search"; id: number; query: string; limit: number }
  | { type: "nearest"; id: number; lat: number; lon: number };

type WorkerResponse =
  | { type: "ready"; count: number }
  | { type: "error"; message: string }
  | { type: "result"; id: number; places: GeoPlace[] }
  | { type: "nearest"; id: number; zone: NearestZone | null };

let worker: Worker | null = null;
let initPromise: Promise<{ count: number }> | null = null;
let nextRequestId = 1;
const pendingSearch = new Map<number, (places: GeoPlace[]) => void>();
const pendingNearest = new Map<number, (zone: NearestZone | null) => void>();

let resolveInit: ((value: { count: number }) => void) | null = null;
let rejectInit: ((err: Error) => void) | null = null;

function handleMessage(event: MessageEvent<WorkerResponse>) {
  const msg = event.data;
  if (msg.type === "ready") {
    resolveInit?.({ count: msg.count });
    resolveInit = null;
    rejectInit = null;
    return;
  }
  if (msg.type === "error") {
    // An error before "ready" fails init; otherwise it can't be tied to a
    // specific request, so surface it to init's rejection path only.
    rejectInit?.(new Error(msg.message));
    resolveInit = null;
    rejectInit = null;
    return;
  }
  if (msg.type === "result") {
    const resolve = pendingSearch.get(msg.id);
    if (resolve) {
      pendingSearch.delete(msg.id);
      resolve(msg.places);
    }
    return;
  }
  if (msg.type === "nearest") {
    const resolve = pendingNearest.get(msg.id);
    if (resolve) {
      pendingNearest.delete(msg.id);
      resolve(msg.zone);
    }
  }
}

function post(message: WorkerRequest) {
  worker?.postMessage(message);
}

/**
 * Spin up the worker and load/build the local index. Idempotent — repeated
 * calls return the same in-flight (or settled) promise, so entering Lookup
 * mode more than once never reloads the dataset.
 */
export function initGeoSearch(): Promise<{ count: number }> {
  if (initPromise) return initPromise;

  if (typeof window === "undefined") {
    return Promise.reject(new Error("Geo search is browser-only"));
  }

  worker = new Worker(new URL("./geo.worker.ts", import.meta.url), {
    type: "module",
  });
  worker.addEventListener("message", handleMessage);

  initPromise = new Promise<{ count: number }>((resolve, reject) => {
    resolveInit = resolve;
    rejectInit = reject;
    post({ type: "init" });
  });

  // If init fails, drop the cached promise so a later entry can retry.
  initPromise.catch(() => {
    initPromise = null;
  });

  return initPromise;
}

/**
 * Run a prefix + typo-tolerant query against the local index. Resolves to
 * population-ranked places (empty array when nothing matches). Rejects only
 * if the index failed to load at all — callers treat that like "no local
 * results" and fall through to the Mapbox tier.
 */
export async function searchLocalPlaces(
  query: string,
  limit = 8,
): Promise<GeoPlace[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  await initGeoSearch();

  const id = nextRequestId++;
  return new Promise<GeoPlace[]>((resolve) => {
    pendingSearch.set(id, resolve);
    post({ type: "search", id, query: trimmed, limit });
  });
}

/**
 * Resolve the IANA zone (and country code) of the local place nearest to a
 * coordinate. Used to fill in a zone for a Mapbox (Tier 2) hit, since Mapbox
 * doesn't return one. Requires the index to be loaded — callers reach this
 * only after a Tier 1 search, so it always is.
 */
export async function resolveNearestZone(
  lat: number,
  lon: number,
): Promise<NearestZone | null> {
  await initGeoSearch();
  const id = nextRequestId++;
  return new Promise<NearestZone | null>((resolve) => {
    pendingNearest.set(id, resolve);
    post({ type: "nearest", id, lat, lon });
  });
}
