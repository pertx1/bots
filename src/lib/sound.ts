import type { SoundKind } from "./types";

/**
 * Sonidos de fondo generados con Web Audio API (sin archivos).
 * En iOS hay que llamar a start() dentro de un toque del usuario.
 */
let ctx: AudioContext | null = null;
let nodes: AudioNode[] = [];
let sources: AudioScheduledSourceNode[] = [];
let dropTimer: ReturnType<typeof setInterval> | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

function noiseBuffer(c: AudioContext, kind: "white" | "brown" | "pink"): AudioBuffer {
  const len = c.sampleRate * 4;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === "white") data[i] = w * 0.35;
    else if (kind === "brown") {
      last = (last + 0.02 * w) / 1.02;
      data[i] = last * 3.2;
    } else {
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.963 * b1 + w * 0.2965164;
      b2 = 0.57 * b2 + w * 1.0526913;
      data[i] = (b0 + b1 + b2 + w * 0.1848) * 0.08;
    }
  }
  return buf;
}

export function stopSound() {
  sources.forEach((s) => {
    try {
      s.stop();
    } catch {}
  });
  nodes.forEach((n) => n.disconnect());
  sources = [];
  nodes = [];
  if (dropTimer) clearInterval(dropTimer);
  dropTimer = null;
}

export function startSound(kind: SoundKind, volume = 0.5) {
  stopSound();
  if (kind === "none") return;
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume();

  const master = c.createGain();
  master.gain.value = 0;
  master.gain.linearRampToValueAtTime(volume, c.currentTime + 1.2);
  master.connect(c.destination);
  nodes.push(master);

  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, kind === "white" ? "white" : kind === "brown" ? "brown" : "pink");
  src.loop = true;

  if (kind === "rain") {
    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 400;
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 6000;
    src.connect(hp).connect(lp).connect(master);
    nodes.push(hp, lp);
    // Gotitas sueltas
    dropTimer = setInterval(() => {
      if (!ctx) return;
      for (let i = 0; i < 3; i++) {
        const t = ctx.currentTime + Math.random() * 0.25;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(1800 + Math.random() * 2500, t);
        o.frequency.exponentialRampToValueAtTime(500, t + 0.04);
        g.gain.setValueAtTime(0.025 * Math.random(), t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        o.connect(g).connect(master);
        o.start(t);
        o.stop(t + 0.06);
      }
    }, 120);
  } else {
    src.connect(master);
  }
  src.start();
  sources.push(src);
}

/** Pitidito suave al acabar un bloque. */
export function chime() {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  [660, 880, 1320].forEach((f, i) => {
    const t = c.currentTime + i * 0.18;
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + 0.55);
  });
}

/** Desbloquea el audio en iOS (llamar dentro de un toque). */
export function unlockAudio() {
  const c = getCtx();
  if (c && c.state === "suspended") void c.resume();
}

export const SOUND_LABELS: Record<SoundKind, string> = {
  none: "Silencio",
  white: "Ruido blanco",
  brown: "Ruido marrón",
  rain: "Lluvia",
};
