/**
 * Tiny synthesized sound effects (Web Audio). No audio files, so they work
 * offline. The AudioContext is created only after a user gesture (iOS rule).
 */
let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

/** Call from a pointer/tap handler. Safe to call repeatedly. */
export function unlockAudio(): void {
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

interface Note {
  freq: number;
  at?: number; // seconds from now
  dur?: number; // seconds
  gain?: number;
  type?: OscillatorType;
  glideTo?: number;
}

function play(notes: Note[]): void {
  if (!enabled || !ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime + 0.01;
  const master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);
  for (const n of notes) {
    const t = now + (n.at ?? 0);
    const dur = n.dur ?? 0.2;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = n.type ?? 'sine';
    osc.frequency.setValueAtTime(n.freq, t);
    if (n.glideTo) osc.frequency.exponentialRampToValueAtTime(n.glideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(n.gain ?? 0.15, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }
}

export const sounds = {
  pickup: () => play([{ freq: 900, glideTo: 620, dur: 0.07, gain: 0.08, type: 'triangle' }]),
  park: () =>
    play([
      { freq: 196, glideTo: 150, dur: 0.12, gain: 0.16, type: 'sine' },
      { freq: 523.25, at: 0.05, dur: 0.28, gain: 0.1, type: 'triangle' },
      { freq: 783.99, at: 0.1, dur: 0.32, gain: 0.08, type: 'triangle' },
    ]),
  coin: () =>
    play([
      { freq: 1318.5, dur: 0.18, gain: 0.08 },
      { freq: 1975.5, at: 0.07, dur: 0.45, gain: 0.07 },
    ]),
  complete: () =>
    play([
      { freq: 523.25, at: 0.0, dur: 0.3, gain: 0.1, type: 'triangle' },
      { freq: 659.25, at: 0.14, dur: 0.3, gain: 0.1, type: 'triangle' },
      { freq: 783.99, at: 0.28, dur: 0.3, gain: 0.1, type: 'triangle' },
      { freq: 1046.5, at: 0.42, dur: 0.8, gain: 0.1, type: 'triangle' },
      { freq: 659.25, at: 0.42, dur: 0.8, gain: 0.05, type: 'sine' },
      { freq: 783.99, at: 0.42, dur: 0.8, gain: 0.05, type: 'sine' },
    ]),
  tap: () => play([{ freq: 660, dur: 0.06, gain: 0.05, type: 'triangle' }]),
};
