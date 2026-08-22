// Lookup mode — Tier 1 local search worker.
//
// Owns everything expensive so the main thread stays free for animation:
//   1. fetch public/geo/version.json (tiny) to learn the current dataset id
//   2. reuse the IndexedDB-cached rows if the id matches, else fetch the
//      ~15 MB places.json and cache it
//   3. build a FlexSearch document index (prefix + accent/typo tolerant)
//   4. answer search requests with population-ranked GeoPlace objects
//
// Message protocol matches lib/geo.ts (the main-thread bridge).
//
// The project's tsconfig loads the DOM lib (not webworker), so `self` is
// typed as a Window here. That's fine for the browser APIs we use (fetch,
// indexedDB, MessageEvent); only postMessage needs a cast, via emit() below.

import { Charset, Document } from "flexsearch";
import type { GeoPlace } from "./geo";

/** Post a message to the main thread (worker-scope postMessage, one arg). */
const emit = (message: unknown) =>
  (self.postMessage as (m: unknown) => void)(message);

// Column indices within a place row (see GEO_COLS in lib/geo.ts).
const N = 0;
const A = 1;
const CC = 2;
const ADM1 = 3;
const LAT = 4;
const LON = 5;
const TZ = 6;
const POP = 7;

type Row = [string, string, string, string, number, number, string, number];

const VERSION_URL = "/geo/version.json";
const PLACES_URL = "/geo/places.json";

const DB_NAME = "meridian-geo";
const DB_VERSION = 1;
const STORE = "dataset";
const DATA_KEY = "cities500";

interface CachedPayload {
  version: string;
  rows: Row[];
}

let rows: Row[] = [];
// FlexSearch's own generics are noisy here; the runtime shape is all we use.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let index: any = null;

/* ---------- IndexedDB (tiny promise wrapper) ---------- */

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

async function readCache(): Promise<CachedPayload | null> {
  try {
    const db = await openDb();
    return await new Promise<CachedPayload | null>((resolve, reject) => {
      const req = db.transaction(STORE, "readonly")
        .objectStore(STORE)
        .get(DATA_KEY);
      req.onsuccess = () => resolve((req.result as CachedPayload) ?? null);
      req.onerror = () => reject(req.error ?? new Error("IndexedDB read failed"));
    });
  } catch {
    // Private-mode / blocked IndexedDB — fall back to a network fetch.
    return null;
  }
}

async function writeCache(payload: CachedPayload): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(payload, DATA_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB write failed"));
    });
  } catch {
    // Caching is best-effort; a failure just means we refetch next time.
  }
}

/* ---------- Data load ---------- */

async function fetchCurrentVersion(): Promise<string | null> {
  try {
    const res = await fetch(VERSION_URL, { cache: "no-cache" });
    if (!res.ok) return null;
    const meta = (await res.json()) as { version?: string };
    return meta.version ?? null;
  } catch {
    return null;
  }
}

async function loadRows(): Promise<Row[]> {
  const currentVersion = await fetchCurrentVersion();
  const cached = await readCache();

  // Use the cache when it matches the current build, or when we couldn't
  // reach version.json but have *something* cached to fall back on.
  if (cached && (cached.version === currentVersion || currentVersion === null)) {
    return cached.rows;
  }

  const res = await fetch(PLACES_URL);
  if (!res.ok) {
    if (cached) return cached.rows; // stale is better than nothing
    throw new Error(`Failed to load place index (${res.status})`);
  }
  const payload = (await res.json()) as { rows: Row[] };
  const version = currentVersion ?? "unknown";
  await writeCache({ version, rows: payload.rows });
  return payload.rows;
}

function buildIndex() {
  index = new Document({
    tokenize: "forward", // prefix matching
    encoder: Charset.LatinBalance, // fold accents + tolerate minor variants
    document: { id: "id", index: ["n", "a"] },
  });

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    index.add({ id: i, n: r[N], a: r[A] });
  }
}

async function init() {
  rows = await loadRows();
  buildIndex();
  emit({ type: "ready", count: rows.length });
}

/* ---------- Search ---------- */

function toPlace(id: number): GeoPlace {
  const r = rows[id];
  return {
    id,
    name: r[N],
    country: r[CC],
    admin1: r[ADM1],
    lat: r[LAT],
    lon: r[LON],
    timeZone: r[TZ],
    population: r[POP],
    source: "local",
  };
}

function search(query: string, limit: number): GeoPlace[] {
  if (!index) return [];
  // Pull a wider candidate pool than we'll show so the population sort below
  // can surface the most prominent match even if it ranked past `limit`
  // within a single field.
  const pool = Math.min(limit * 6, 100);
  const groups = index.search(query, { limit: pool, suggest: true }) as Array<{
    field: string;
    result: number[];
  }>;

  // Merge the per-field id lists. Rows are pre-sorted by population, so a
  // lower id is a more prominent place.
  const seen = new Set<number>();
  const ids: number[] = [];
  for (const group of groups) {
    for (const id of group.result) {
      if (!seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
  }
  ids.sort((a, b) => a - b); // population rank
  return ids.slice(0, limit).map(toPlace);
}

/** Nearest place to a coordinate by squared great-circle-ish distance. */
function nearest(lat: number, lon: number): { timeZone: string; country: string } | null {
  let best = -1;
  let bestDist = Infinity;
  const latRad = (lat * Math.PI) / 180;
  const cosLat = Math.cos(latRad);
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const dLat = r[LAT] - lat;
    // Scale longitude by cos(lat) so degrees are comparable near the point.
    const dLon = (r[LON] - lon) * cosLat;
    const dist = dLat * dLat + dLon * dLon;
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  if (best < 0) return null;
  return { timeZone: rows[best][TZ], country: rows[best][CC] };
}

/* ---------- Message loop ---------- */

self.onmessage = async (event: MessageEvent) => {
  const msg = event.data as
    | { type: "init" }
    | { type: "search"; id: number; query: string; limit: number }
    | { type: "nearest"; id: number; lat: number; lon: number };

  if (msg.type === "init") {
    try {
      await init();
    } catch (err) {
      emit({
        type: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
    return;
  }

  if (msg.type === "search") {
    emit({
      type: "result",
      id: msg.id,
      places: search(msg.query, msg.limit),
    });
    return;
  }

  if (msg.type === "nearest") {
    emit({
      type: "nearest",
      id: msg.id,
      zone: nearest(msg.lat, msg.lon),
    });
  }
};
