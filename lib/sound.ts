/**
 * Sound playback for the Learn mode "Next" / "Previous" controls.
 *
 * Uses the Web Audio API directly. Files are optional: if a sound file is
 * missing (404) or decoding fails for any reason, playback fails silently
 * and never throws.
 */

type SoundName = "next" | "prev";

type AudioContextConstructor = typeof AudioContext;

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }

  const windowWithWebkit = window as typeof window & {
    webkitAudioContext?: AudioContextConstructor;
  };

  return window.AudioContext ?? windowWithWebkit.webkitAudioContext ?? null;
}

let sharedContext: AudioContext | null = null;
const bufferCache = new Map<SoundName, AudioBuffer | null>();

function getSharedContext(): AudioContext | null {
  if (sharedContext) {
    return sharedContext;
  }

  const AudioContextCtor = getAudioContextConstructor();
  if (!AudioContextCtor) {
    return null;
  }

  try {
    sharedContext = new AudioContextCtor();
    return sharedContext;
  } catch {
    return null;
  }
}

async function loadBuffer(
  context: AudioContext,
  name: SoundName,
): Promise<AudioBuffer | null> {
  if (bufferCache.has(name)) {
    return bufferCache.get(name) ?? null;
  }

  try {
    const response = await fetch(`/sounds/${name}.mp3`);
    if (!response.ok) {
      bufferCache.set(name, null);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(arrayBuffer);
    bufferCache.set(name, audioBuffer);
    return audioBuffer;
  } catch {
    bufferCache.set(name, null);
    return null;
  }
}

function playSound(name: SoundName): void {
  const context = getSharedContext();
  if (!context) {
    return;
  }

  loadBuffer(context, name)
    .then((buffer) => {
      if (!buffer) {
        return;
      }

      try {
        if (context.state === "suspended") {
          void context.resume();
        }

        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.start(0);
      } catch {
        // Fail silently — playback is a nice-to-have, never blocking.
      }
    })
    .catch(() => {
      // Fail silently.
    });
}

export function playNextSound(): void {
  playSound("next");
}

export function playPrevSound(): void {
  playSound("prev");
}
