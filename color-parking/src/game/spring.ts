/**
 * A minimal spring animator (the same idea as Framer Motion's springs, in
 * ~40 lines). Animates any set of numeric values towards a target.
 */
export interface SpringOptions {
  stiffness?: number;
  damping?: number;
  mass?: number;
}

export type Values = Record<string, number>;

export function spring<T extends Values>(
  from: T,
  to: T,
  onUpdate: (v: T) => void,
  opts: SpringOptions = {},
  onDone?: () => void,
): () => void {
  const { stiffness = 260, damping = 20, mass = 1 } = opts;
  const keys = Object.keys(to) as (keyof T)[];
  const pos = { ...from };
  const vel = Object.fromEntries(keys.map((k) => [k, 0])) as Record<keyof T, number>;
  let last = performance.now();
  let raf = 0;
  let stopped = false;

  const step = (now: number) => {
    if (stopped) return;
    // Fixed sub-steps keep the simulation stable on slow frames.
    let dt = Math.min(0.064, (now - last) / 1000);
    last = now;
    let settled = true;
    while (dt > 0) {
      const h = Math.min(dt, 1 / 240);
      dt -= h;
      for (const k of keys) {
        const x = pos[k] as number;
        const target = to[k] as number;
        const force = -stiffness * (x - target) - damping * vel[k];
        vel[k] += (force / mass) * h;
        (pos[k] as number) = x + vel[k] * h;
      }
    }
    for (const k of keys) {
      if (Math.abs(vel[k]) > 0.01 || Math.abs((pos[k] as number) - (to[k] as number)) > 0.01) {
        settled = false;
      }
    }
    if (settled) {
      onUpdate({ ...to });
      onDone?.();
      return;
    }
    onUpdate({ ...pos });
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
  };
}
