# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Meridian — a Next.js app that teaches users the world's time zones, and
later, world geography. This is v1: Learn mode plus local progress storage
only. See README.md for setup and user-facing details.

The app is branded "Meridian" everywhere in the UI (nav wordmark, page
title, footer) — it was previously called "World Time Lab" during early
development; don't reintroduce that name.

## Commands

```bash
npm run dev     # dev server at localhost:3000 (Turbopack)
npm run build   # production build — also runs the TypeScript check
npm run lint    # eslint (flat config, eslint-config-next)
npm run start   # serve the production build
```

There is no test suite yet. There is no single-test command because there
are no tests.

## Architecture

### Progress storage is behind one module — never call localStorage directly

`lib/progress.ts` is the *only* place allowed to touch `localStorage`.
It exports `getProgress()`, `saveProgress(state)`, and `updateProgress(partial)`.
Every page/component that needs progress (currently `app/learn/page.tsx` and
`app/progress/page.tsx`) calls this module, never `window.localStorage`
directly.

This exists so a v2 Supabase-backed version of `lib/progress.ts` (reading/
writing rows keyed by user ID instead of a browser key) can replace the v1
implementation without touching any call site. `lib/supabaseClient.ts` is
already wired up for that future version — it lazily creates a client from
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, but nothing in
v1 calls it yet.

When adding new state that should persist, extend `ProgressState` in
`lib/progress.ts` rather than introducing a second storage mechanism.

### Sound playback fails silently by design

`lib/sound.ts` plays `public/sounds/next.mp3` / `prev.mp3` via the raw Web
Audio API (`AudioContext` + `decodeAudioData`, not an `<audio>` element).
Every failure path (missing file, decode error, no `AudioContext` support)
is swallowed — sound is a nice-to-have, never a blocking dependency. The
user supplies the actual `.mp3` files; they are gitignored-safe to be
absent (see `public/sounds/README.md`).

### Lesson content

`lib/timezones.ts` holds the static lesson data (`lessons: TimeZoneLesson[]`,
24 entries) plus two live-clock helpers used by the home page's world clock
strip: `getOffsetLabel(timeZone, date)` and `formatTimeInZone(timeZone, date)`.
Lesson offsets and `abbreviation` (e.g. "CST / CDT") are hand-written strings
(they describe a zone's rule); the clock-strip helpers compute the *current*
offset live via `Intl.DateTimeFormat`. Don't conflate the two. Abbreviation
strings vary a lot in length ("UTC" vs "AEST / AEDT"); `LessonCard.tsx`
sizes that display down for longer strings — keep that in mind if you add
lessons with even longer abbreviations.

### User's time zone (detection + override storage, no settings UI yet)

`lib/userTimeZone.ts` exports `detectBrowserTimeZone()` (wraps
`Intl.DateTimeFormat().resolvedOptions().timeZone`, falls back to `"UTC"`).
`ProgressState.timeZoneOverride` (in `lib/progress.ts`) stores an explicit
user choice, `null` meaning "use the detected zone." `NavBar.tsx` computes
the effective zone as `getProgress().timeZoneOverride ?? detectBrowserTimeZone()`
and shows it next to the UTC clock.
**TODO: there is no UI yet to actually set `timeZoneOverride`** — Practice
mode will need one; add it to `/progress` when that's built, per the user's
direction rather than a new `/settings` route.

### Learn mode flow

`app/learn/page.tsx` is a client component that:
1. Renders nothing until a `useEffect` reads `getProgress()` post-mount
   (avoids a server/client hydration mismatch, since localStorage doesn't
   exist during SSR).
2. Tracks `lessonIndex` + a `direction` (`1` | `-1`) used to pick the
   Framer Motion slide direction in `components/LessonCard.tsx`.
3. Calls `updateProgress({ currentLessonIndex })` on every Next/Previous
   click, and plays `playNextSound()` / `playPrevSound()` from `lib/sound.ts`.

`components/LessonCard.tsx` animates between lessons with
`AnimatePresence mode="wait"`, keyed on `lesson.id`. The card also runs its
own ticking clock (`now` state) to show "Right now" in the lesson's zone —
the one piece of live, non-static content per lesson. `ABBREVIATION_SIZE_CLASS`
/ `OFFSET_SIZE_CLASS` are single fixed sizes, not length-based — an earlier
per-string-length version made short abbreviations (e.g. "BRT") render much
larger than long ones ("EST / EDT"), which felt inconsistent flipping
between lessons. Both fixed sizes are chosen to fit the longest real
strings ("AEST / AEDT" / "NZST / NZDT" / "AKST / AKDT",
"UTC-09:00 / -08:00 (DST)") without wrapping — verified against all three.
If you add a zone with a longer abbreviation or offset than those, re-check
wrapping before assuming the fixed size still holds; don't reintroduce
length-based sizing to "fix" it.

### Nav and scope boundaries

`components/NavBar.tsx` links to `/learn`, `/practice`, `/map`, `/progress`.
`/practice` and `/map` are intentionally static "coming soon" placeholders
(`app/practice/page.tsx`, `app/map/page.tsx`) — Practice mode and Map mode
are out of v1 scope; don't build real functionality into them without
confirming scope first. `/progress` is a real (if minimal) page — it reads
`getProgress()` and renders a progress bar over `lessons.length`.

### Styling

Tailwind v4, configured via `@theme inline` in `app/globals.css` (no
`tailwind.config.*`). Design tokens (`--background`, `--surface`, `--accent`,
`--globe-*`, `--globe-glow`, etc.) live there as CSS variables and take
cues from `docs/mockup.png` — dark navy background, lime-green accent.
(An earlier version used a full-page repeating vertical-line background as
the "meridian lines" motif — removed per user feedback, don't reintroduce
it. The current fill for empty-page-feel is a `--globe-glow` radial
gradient positioned behind the hero's `Globe`, see `app/page.tsx`, plus
wider `max-w-7xl` containers and the `Footer`.)

Three-font system, all loaded via `next/font/google` in `app/layout.tsx`:
- `font-display` (Encode Sans Expanded) — headlines, city names, the big
  time zone abbreviation on lesson cards. Stands in for GT America
  Extended / Söhne Breit, which are commercial fonts not available here.
- `font-sans` (Inter Tight, the default) — body copy.
- `font-mono` (JetBrains Mono) — anything numeric or code-like: UTC
  offsets, IANA zone names, the nav clock.

The font component's own CSS variable name (e.g. `--font-display-expanded`)
is deliberately **not** the same as the semantic Tailwind token
(`--font-display`) it feeds in `globals.css`'s `@theme inline` block —
naming them the same creates a self-referencing custom property
(`--font-display: var(--font-display)`), which browsers treat as invalid.
Keep that two-step naming for any font you add.

If real GT America Extended / Söhne Breit files become available, swap them
in via `@font-face` + local files (see the "I have the license" path this
was scoped against) rather than `next/font/google`.

### Landing page globe

`components/Globe.tsx` renders a rotating orthographic-projection globe
(the "azimuthal" look from the mockup) using `d3-geo` + `topojson-client`
against `world-atlas`'s `land-110m.json` (bundled, no network fetch).
Rotation is driven by a `setInterval` nudging `lambda` (longitude) every
`TICK_INTERVAL_MS`, which re-derives the projected land path, graticule,
and city pin positions in a `useMemo`. City pin visibility (front vs. back
of the sphere) is computed with `geoDistance` against the current view
center — see the comment in that file before changing the rotation logic,
it's easy to get the visibility test inverted. Respects
`prefers-reduced-motion` (rotation is skipped, globe renders static).

`GLOBE_CITY_POOL` holds 15 well-known cities (lat/lon + IANA zone). Rather
than swapping the whole featured set on a timer, `refreshDisplayed()` runs
every `MAINTENANCE_INTERVAL_MS` and does two things: drops any displayed
city whose `visible` has gone false (rotated past the edge), then tops
back up to `TARGET_DISPLAYED_COUNT` (4) with visible pool cities that
don't overlap on screen with what's already shown — overlap is a real
pixel-distance check (`pixelDistance` vs `MIN_SEPARATION_PX`) against each
candidate's *projected* position, not a geographic one, since that's what
actually determines label collisions. Cities you're currently looking at
never disappear just because the timer fired; they only drop when
rotation genuinely carries them out of view, and only one or two change at
a time — see `refreshDisplayed()`'s comment before changing this. The
render's own `.filter(pin => pin.visible)` (recomputed every rotation
tick, not just every maintenance tick) is what makes a pin disappear the
instant it's actually off-screen, rather than up to `MAINTENANCE_INTERVAL_MS`
late. `lambdaRef` mirrors `lambda` via an effect so the maintenance
interval (which only runs every ~1s) reads the current rotation instead of
a stale closure.

Hovering a pin's label (not the dot — the dot is `pointer-events-none`)
smoothly expands it in place to show live local time + UTC offset, via a
single always-mounted `motion.span` whose `animate` prop toggles between
collapsed (`width: 0, opacity: 0`) and expanded based on `isHovered`.
Deliberately **not** `AnimatePresence`/mount-unmount: an earlier version
using `AnimatePresence` for the exit transition appeared to get stuck
mid-exit in testing, and needlessly complicates a case that's really just
a two-state style toggle. If you touch this, keep it that way — the
always-mounted `animate` toggle is a strictly simpler, more robust
pattern. Note: this couldn't be visually verified in-session because the
Claude-in-Chrome automated tab reports `document.hidden = true`, which
pauses `requestAnimationFrame`-driven style updates in every animation
library including Framer Motion; the DOM-event and React-state layers
were verified directly instead (`data-*` attribute probes confirmed
exclusive, correctly-toggling hover state). Live-time state (`now`) ticks
every second independent of the rotation interval, so it stays accurate
even when `prefers-reduced-motion` skips rotation entirely.

`d3-geo`, `topojson-client`, and `world-atlas` are dependencies added
specifically for this component — if it's ever removed, remove them too.

## Docker

`Dockerfile` builds a production image using Next's `output: "standalone"`
mode (set in `next.config.ts`) — a multi-stage build (`deps` → `builder` →
`runner`) that ends with just `server.js`, `.next/static`, and `public` on
top of `node:22-alpine`. `docker-compose.yml` wraps it for local/Unraid use.
If you change how the app is served (custom server, non-Node runtime,
etc.), the Dockerfile's `runner` stage needs to change too.

## Project-specific rules (from the original build prompt)

These constraints defined v1 and should hold for follow-up work unless the
user explicitly changes scope:

- **No auth in v1.** Progress lives in `localStorage` only. Don't add an
  auth provider, login/sign-up flow, or call the Supabase client, without
  asking first.
- **No new dependencies outside the approved stack** (Next.js, TypeScript,
  Tailwind, Framer Motion, Supabase, plus `d3-geo` / `topojson-client` /
  `world-atlas` for the landing page globe) without asking first.
- **Don't expand scope** (building out real Practice mode or Map mode
  functionality, deploying to Vercel, etc.) without asking first — v1 is
  intentionally narrow, with room left to add these later.
- Full-file edits are preferred over partial snippets when generating code
  for this project.
