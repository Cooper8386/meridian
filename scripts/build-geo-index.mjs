// Build-time GeoNames pipeline for Lookup mode's local (Tier 1) search.
//
// Downloads the GeoNames `cities500` dataset (~185k populated places with
// population > 500, plus admin seats down to PPLA4) and `timeZones.txt`,
// then converts them into two compact static assets under public/geo/:
//
//   places.json    — the searchable place records, sorted by population desc
//   timezones.json — per-IANA-zone country code + base/DST offsets
//
// The browser (see lib/geo.ts) fetches places.json once, builds a FlexSearch
// index from it in a Web Worker, and caches the records in IndexedDB. This
// script only produces the raw asset; it never builds the FlexSearch index
// itself (that's version-coupled and belongs on the client).
//
// Runs automatically before `next build`/`next dev` via the `prebuild` /
// `predev` npm scripts. The raw downloads are cached in .geo-cache/ and the
// generated public/geo/ output is gitignored — both are regenerated rather
// than committed. Requires outbound network access to download.geonames.org
// on the first run (or after clearing .geo-cache/).

import AdmZip from "adm-zip";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CACHE_DIR = join(ROOT, ".geo-cache");
const OUT_DIR = join(ROOT, "public", "geo");

const CITIES_URL = "http://download.geonames.org/export/dump/cities500.zip";
const TIMEZONES_URL = "http://download.geonames.org/export/dump/timeZones.txt";

const CITIES_ZIP = join(CACHE_DIR, "cities500.zip");
const TIMEZONES_TXT = join(CACHE_DIR, "timeZones.txt");

const PLACES_OUT = join(OUT_DIR, "places.json");
const TIMEZONES_OUT = join(OUT_DIR, "timezones.json");
const VERSION_OUT = join(OUT_DIR, "version.json");

// Column layout of these two field lists is what lib/geo.ts / the worker
// expect. Keep them in sync with GEO_COLS in lib/geo.ts.
const PLACE_COLS = ["n", "a", "cc", "adm1", "lat", "lon", "tz", "pop"];

async function download(url, dest) {
  process.stdout.write(`  fetching ${url} ...\n`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed (${res.status} ${res.statusText}): ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return buf;
}

async function ensureDownloads() {
  await mkdir(CACHE_DIR, { recursive: true });

  const zipBuf = existsSync(CITIES_ZIP)
    ? await readFile(CITIES_ZIP)
    : await download(CITIES_URL, CITIES_ZIP);

  const tzBuf = existsSync(TIMEZONES_TXT)
    ? await readFile(TIMEZONES_TXT)
    : await download(TIMEZONES_URL, TIMEZONES_TXT);

  return { zipBuf, tzBuf };
}

function round(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(Number(value) * factor) / factor;
}

// GeoNames cities table is tab-separated with these columns:
// 0 geonameid, 1 name, 2 asciiname, 3 alternatenames, 4 lat, 5 lon,
// 6 feature class, 7 feature code, 8 country code, 9 cc2,
// 10 admin1, 11 admin2, 12 admin3, 13 admin4, 14 population,
// 15 elevation, 16 dem, 17 timezone, 18 modification date.
function parsePlaces(zipBuf) {
  const zip = new AdmZip(zipBuf);
  const entry = zip.getEntry("cities500.txt");
  if (!entry) {
    throw new Error("cities500.txt not found inside cities500.zip");
  }
  const text = zip.readAsText(entry, "utf8");

  const rows = [];
  for (const line of text.split("\n")) {
    if (!line) continue;
    const f = line.split("\t");
    const name = f[1];
    const tz = f[17];
    if (!name || !tz) continue;

    const asciiname = f[2];
    rows.push([
      name,
      // asciiname only when it differs from name (accent-folded search key);
      // an empty string means "same as name" and keeps the asset smaller.
      asciiname && asciiname !== name ? asciiname : "",
      f[8] || "", // country code (ISO-3166 alpha-2)
      f[10] || "", // admin1 code (used only to disambiguate same-name places)
      round(f[4], 4),
      round(f[5], 4),
      tz,
      Number(f[14]) || 0, // population
    ]);
  }

  // Rank by population so the most prominent match for a prefix wins.
  rows.sort((a, b) => b[7] - a[7]);
  return rows;
}

// timeZones.txt is tab-separated: CountryCode, TimeZoneId, GMT offset,
// DST offset, rawOffset. First line is a header.
function parseTimeZones(tzBuf) {
  const text = tzBuf.toString("utf8");
  const zones = {};
  const lines = text.split("\n");
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const f = line.split("\t");
    const cc = f[0];
    const id = f[1];
    if (!id) continue;
    zones[id] = { cc, gmt: Number(f[2]), dst: Number(f[3]) };
  }
  return zones;
}

async function main() {
  process.stdout.write("[build-geo-index] preparing Lookup search assets\n");
  const { zipBuf, tzBuf } = await ensureDownloads();

  const rows = parsePlaces(zipBuf);
  const zones = parseTimeZones(tzBuf);

  await mkdir(OUT_DIR, { recursive: true });

  const places = { cols: PLACE_COLS, rows };
  const placesJson = JSON.stringify(places);
  await writeFile(PLACES_OUT, placesJson);
  await writeFile(TIMEZONES_OUT, JSON.stringify(zones));

  const checksum = createHash("sha1")
    .update(placesJson)
    .digest("hex")
    .slice(0, 8);

  // The client fetches this tiny file first and refetches places.json into
  // IndexedDB only when the checksum changes (see lib/geo.ts).
  await writeFile(
    VERSION_OUT,
    JSON.stringify({ version: checksum, count: rows.length }),
  );

  const mb = (Buffer.byteLength(placesJson) / 1024 / 1024).toFixed(1);
  process.stdout.write(
    `[build-geo-index] wrote ${rows.length} places (${mb} MB, sha1:${checksum}) ` +
      `and ${Object.keys(zones).length} time zones\n`,
  );
}

main().catch((err) => {
  process.stderr.write(`[build-geo-index] ${err.stack || err}\n`);
  process.exit(1);
});
