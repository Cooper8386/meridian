// Runs before `next dev` (predev). Builds the Lookup search assets only if
// they're missing, so day-to-day dev startup isn't slowed by re-parsing the
// dataset every time. `next build` uses build-geo-index.mjs directly
// (prebuild) so production always regenerates from the cached download.

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLACES_OUT = join(__dirname, "..", "public", "geo", "places.json");

if (existsSync(PLACES_OUT)) {
  process.stdout.write("[ensure-geo-index] search assets present, skipping\n");
  process.exit(0);
}

await import("./build-geo-index.mjs");
