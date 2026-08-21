# Sound files

Drop two files in this directory:

- `next.mp3` — a short, higher-pitched sound. Plays when the user clicks "Next" in Learn mode.
- `prev.mp3` — a short, lower-pitched sound. Plays when the user clicks "Previous" in Learn mode.

Both are optional. If either file is missing, playback fails silently and
the app continues to work normally (see `lib/sound.ts`).
