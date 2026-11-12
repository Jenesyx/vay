// The "wedding hall" runtime: one video, one audio graph, one conductor loop.
// Components talk through a tiny event bus instead of React state, so 60fps
// effects never re-render the tree.

import timings from "./timings.json";
import { cues } from "./data";

type Handler<T> = (detail: T) => void;
const bus = typeof window !== "undefined" ? new EventTarget() : null;

export function emit<T>(type: string, detail?: T) {
  bus?.dispatchEvent(new CustomEvent(type, { detail }));
}
export function on<T>(type: string, fn: Handler<T>) {
  const h = (e: Event) => fn((e as CustomEvent<T>).detail);
  bus?.addEventListener(type, h);
  return () => bus?.removeEventListener(type, h);
}

export const stage = {
  video: null as HTMLVideoElement | null,
  started: false,
  power: true,
  channel: 0, // 0 colour, 1 black & white, 2 snow (برفک)
  muted: false,
  shabash: 0, // dollars thrown by this visitor
  line: -1, // index into flatLines, -1 = none
  lineP: 0, // 0..1 how far through the current line we are
  follow: true, // page auto-scrolls with the singing (off as soon as the visitor scrolls)
  beat: 0, // 0..1, decays
  bass: 0, // 0..1 live bass level
  reduced: false,
};

type Timings = { lines: (number | null)[]; words?: ((number | null)[] | null)[] };
const starts: (number | null)[] = (timings as Timings).lines ?? [];
const wordStarts: ((number | null)[] | null)[] = (timings as Timings).words ?? [];
export const hasTimings = starts.some((s) => typeof s === "number");

/** Start time of each word span in line i (same order as rendered), if word timing exists. */
export function lineWords(i: number) {
  const w = wordStarts[i];
  return Array.isArray(w) && w.length ? w : null;
}

/** When line i stops being "the line": the next timed line, or 6 s after it started. */
export function lineEnd(i: number) {
  const s = starts[i];
  if (typeof s !== "number") return null;
  let next = Infinity;
  for (let k = i + 1; k < starts.length; k++) {
    const n = starts[k];
    if (typeof n === "number") {
      next = n;
      break;
    }
  }
  return Math.min(next, s + 6);
}

/** Line index being sung at time t (or -1). */
export function lineAt(t: number) {
  let found = -1;
  for (let i = 0; i < starts.length; i++) {
    const s = starts[i];
    if (typeof s === "number" && s <= t) found = i;
  }
  if (found < 0) return -1;
  return t < (lineEnd(found) as number) ? found : -1;
}

export function lineStart(i: number) {
  const s = starts[i];
  return typeof s === "number" ? s : null;
}

/** Has line i already been sung by time t? */
export function lineDone(i: number, t: number) {
  const e = lineEnd(i);
  return e !== null && e <= t;
}

export function setFollow(f: boolean) {
  if (stage.follow === f) return;
  stage.follow = f;
  emit("follow", f);
}

// ---------------------------------------------------------------- audio

let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let bins: Uint8Array<ArrayBuffer> | null = null;

/** Must run inside a user gesture (the loader's PLAY tap). */
export function startAudio() {
  const v = stage.video;
  if (!v || ctx) return;
  try {
    ctx = new AudioContext();
    const src = ctx.createMediaElementSource(v);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.15;
    src.connect(analyser);
    analyser.connect(ctx.destination);
    bins = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
  } catch {
    ctx = null;
    analyser = null;
  }
}

export function resumeAudio() {
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
}

export function seek(t: number) {
  const v = stage.video;
  if (!v) return;
  v.currentTime = Math.max(0, t);
  if (!stage.power) setPower(true);
  v.play().catch(() => {});
  resumeAudio();
}

export function setPower(on: boolean) {
  stage.power = on;
  const v = stage.video;
  if (v) {
    if (on) v.play().catch(() => {});
    else v.pause();
  }
  emit("tv", { power: on });
}

export function setMuted(m: boolean) {
  stage.muted = m;
  if (stage.video) stage.video.muted = m;
  emit("tv", { muted: m });
}

export function nextChannel() {
  stage.channel = (stage.channel + 1) % 3;
  emit("channel", stage.channel);
}

export function addShabash(n: number) {
  stage.shabash += n;
  emit("shabash", stage.shabash);
}

// ---------------------------------------------------------------- conductor

let running = false;
let avg = 0.2;
let lastBeat = 0;
let lastBeatVar = -1;
let cueFired = { channel: -1, shabash: -1 };

/** Starts once; reads the bass for beats and the clock for lyric sync. */
export function startConductor() {
  if (running || typeof window === "undefined") return;
  running = true;
  const root = document.documentElement;

  const tick = (now: number) => {
    const v = stage.video;

    // beat: onset in the 43–172 Hz band
    if (analyser && bins && v && !v.paused) {
      analyser.getByteFrequencyData(bins);
      let e = 0;
      for (let i = 1; i <= 4; i++) e += bins[i];
      e /= 4 * 255;
      stage.bass = e;
      avg = avg * 0.94 + e * 0.06;
      if (e > avg * 1.18 && e > 0.55 && now - lastBeat > 230) {
        lastBeat = now;
        stage.beat = 1;
        emit("beat", e);
      }
    } else {
      stage.bass *= 0.9;
    }
    stage.beat *= 0.88;
    const b = stage.reduced ? 0 : Math.round(stage.beat * 100) / 100;
    if (b !== lastBeatVar) {
      lastBeatVar = b;
      root.style.setProperty("--beat", String(b));
    }

    // lyric sync
    if (v && hasTimings) {
      const l = stage.power ? lineAt(v.currentTime) : -1;
      if (l >= 0) {
        const s = starts[l] as number;
        stage.lineP = Math.min(1, Math.max(0, (v.currentTime - s) / ((lineEnd(l) as number) - s)));
      }
      if (l !== stage.line) {
        stage.line = l;
        emit("line", l);
        if (l >= 0 && l === cues.channel && cueFired.channel !== l) {
          cueFired = { ...cueFired, channel: l };
          nextChannel();
          window.setTimeout(() => {
            stage.channel = 0;
            emit("channel", 0);
          }, 1400);
        }
        if (l >= 0 && l === cues.shabash && cueFired.shabash !== l) {
          cueFired = { ...cueFired, shabash: l };
          emit("burst", 60);
        }
        if (l !== cues.channel && l !== cues.shabash) cueFired = { channel: -1, shabash: -1 };
      }
    }

    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
