# Meridian

A web app that teaches users the world's time zones. v1 ships **Learn mode**:
a sequence of flashcard-style lessons covering major cities, their IANA time
zone, and their UTC offset.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/) for card transitions
- [Supabase](https://supabase.com) client, wired up but not yet used (see below)

## Getting started

This app only ever runs in a Docker container — see [Running with
Docker](#running-with-docker) below.

`npm install` is still needed locally for editor tooling (TypeScript,
ESLint) and to run `npm run lint`, but `npm run dev`/`build`/`start` are
not used outside the image build.

## Adding sound effects

Learn mode plays a short sound when the user clicks "Next" or "Previous".
Drop your own files at:

- `public/sounds/next.mp3` — higher-pitched, plays on "Next"
- `public/sounds/prev.mp3` — lower-pitched, plays on "Previous"

Both are optional — if a file is missing, playback is skipped silently and
nothing else in the app is affected. See `lib/sound.ts`.

## Progress storage

User progress (currently just which lesson they're on) is stored in the
browser's `localStorage`. All reads and writes go through `lib/progress.ts`
— no component talks to `localStorage` directly. This is intentional: a
future version can swap the implementation in that one file for a
Supabase-backed one, keyed by user ID, without touching any calling code.

## Supabase

A Supabase client is set up in `lib/supabaseClient.ts` but is not called
anywhere in v1. To configure it for future use:

```bash
cp .env.example .env
```

Then fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
from your Supabase project settings.

## Scope

v1 includes Learn mode and local progress storage only. Practice mode, Map
mode, and user accounts (auth) are intentionally out of scope for v1 — the
codebase leaves room for them (nav links and placeholder routes exist for
Practice and Map) but does not implement them yet.

## Running with Docker

This app only ever runs as a Docker container — it builds into a standalone
image (using Next.js's `output: "standalone"` mode), suitable for running on
a home server like Unraid.

Build and run directly:

```bash
docker build -t meridian .
docker run -d -p 3000:3000 --name meridian meridian
```

Or with Docker Compose:

```bash
docker compose up -d --build
```

Then visit `http://<server-ip>:3000`.

Supabase env vars are optional and unused in v1 — only set them if you've
copied `.env.example` to `.env` and filled them in; `docker compose` picks
up a `.env` file in the project root automatically.

**On Unraid:** if you use the Compose Manager plugin, point it at this
repo's `docker-compose.yml`. Otherwise, build the image on any machine (or
directly on the Unraid box via the terminal) and run it with `docker run`
as above, or add it as a custom container pointing at the built image.
