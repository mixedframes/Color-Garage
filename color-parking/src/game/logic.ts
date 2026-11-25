/**
 * Pure, framework-free game logic for Level 1: layout, drop detection and
 * progress. Everything here is covered by tests/logic.test.ts.
 */
import type { ColorId } from './cars';

export const TOTAL_CARS = 6;

/** Which color owns which stall (2 rows x 3 columns, top-left first). */
export const STALL_ORDER: ColorId[] = ['pink', 'blue', 'yellow', 'mint', 'purple', 'coral'];

/**
 * Where each car waits before it is parked (2 rows x 3 columns below the
 * lane). Deliberately mixed so no car starts directly under its own stall.
 */
export const START_ORDER: ColorId[] = ['purple', 'coral', 'pink', 'yellow', 'mint', 'blue'];

export interface Point {
  x: number;
  y: number;
}
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Layout {
  width: number;
  height: number;
  /** Stall rectangles, keyed by color. */
  stalls: Record<ColorId, Rect>;
  /** Centre point where each car waits. */
  homes: Record<ColorId, Point>;
  car: { w: number; h: number };
  stall: { w: number; h: number };
  /** The full stall block (for drawing the lot lines). */
  block: Rect;
  /** Y position of the dashed lane line. */
  laneY: number;
}

export const center = (r: Rect): Point => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

export const contains = (r: Rect, p: Point, pad = 0): boolean =>
  p.x >= r.x - pad && p.x <= r.x + r.w + pad && p.y >= r.y - pad && p.y <= r.y + r.h + pad;

/**
 * Computes a layout that fits entirely inside the given box.
 * Stall width is the single unit everything else scales from.
 */
export function computeLayout(width: number, height: number): Layout {
  const sidePad = Math.max(12, width * 0.04);
  // Total height needed ≈ 5.9 stall widths (2 stall rows, lane, 2 waiting rows).
  const sw = Math.max(40, Math.min((width - sidePad * 2) / 3, height / 5.9, 172));
  const sh = sw * 1.42;
  const carW = sw * 0.6;
  const carH = carW * 1.75;
  const laneGap = sw * 0.5;
  const waitRow = carH + sw * 0.2;

  const total = sh * 2 + laneGap + waitRow * 2;
  const top = Math.max(0, (height - total) / 2);
  const left = (width - sw * 3) / 2;

  const stalls = {} as Record<ColorId, Rect>;
  STALL_ORDER.forEach((id, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    stalls[id] = { x: left + col * sw, y: top + row * sh, w: sw, h: sh };
  });

  const waitTop = top + sh * 2 + laneGap;
  const homes = {} as Record<ColorId, Point>;
  START_ORDER.forEach((id, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    homes[id] = { x: left + (col + 0.5) * sw, y: waitTop + (row + 0.5) * waitRow };
  });

  return {
    width,
    height,
    stalls,
    homes,
    car: { w: carW, h: carH },
    stall: { w: sw, h: sh },
    block: { x: left, y: top, w: sw * 3, h: sh * 2 },
    laneY: top + sh * 2 + laneGap / 2,
  };
}

/**
 * Decides where a released car goes.
 *
 * Returns the car's own color when it should snap into its stall, or null when
 * it should glide home. Generous for small fingers: the car's centre may land
 * a little outside the matching stall, but never inside a different stall.
 */
export function resolveDrop(
  carId: ColorId,
  carCenter: Point,
  layout: Layout,
  parked: readonly ColorId[],
): ColorId | null {
  if (parked.includes(carId)) return null;
  for (const id of STALL_ORDER) {
    if (id !== carId && contains(layout.stalls[id], carCenter)) return null;
  }
  const tolerance = layout.stall.w * 0.3;
  return contains(layout.stalls[carId], carCenter, tolerance) ? carId : null;
}

/** True while a dragged car is close to its own (empty) stall. */
export function isApproaching(
  carId: ColorId,
  carCenter: Point,
  layout: Layout,
  parked: readonly ColorId[],
): boolean {
  if (parked.includes(carId)) return false;
  return contains(layout.stalls[carId], carCenter, layout.stall.w * 0.45);
}

/** Keeps a dragged car's centre inside the play area. */
export function clampToArea(p: Point, layout: Layout): Point {
  const hw = layout.car.w / 2;
  const hh = layout.car.h / 2;
  return {
    x: Math.min(Math.max(p.x, hw), layout.width - hw),
    y: Math.min(Math.max(p.y, hh), layout.height - hh),
  };
}

// progress -------------------------------------------------------------------

export interface Progress {
  parked: ColorId[];
  levelComplete: boolean;
  sound: boolean;
}

export const INITIAL_PROGRESS: Progress = { parked: [], levelComplete: false, sound: true };

export const coinsFor = (p: Progress): number => p.parked.length;

export function park(p: Progress, id: ColorId): Progress {
  if (p.parked.includes(id)) return p;
  const parked = [...p.parked, id];
  return { ...p, parked, levelComplete: p.levelComplete || parked.length === TOTAL_CARS };
}

export const resetLevel = (p: Progress): Progress => ({ ...p, parked: [] });

const isColor = (v: unknown): v is ColorId =>
  typeof v === 'string' && (STALL_ORDER as string[]).includes(v);

/** Parses stored progress defensively; anything odd falls back to defaults. */
export function parseProgress(raw: string | null): Progress {
  if (!raw) return { ...INITIAL_PROGRESS };
  try {
    const data = JSON.parse(raw) as Partial<Progress>;
    const parked = Array.isArray(data.parked)
      ? [...new Set(data.parked.filter(isColor))]
      : [];
    return {
      parked,
      levelComplete: data.levelComplete === true || parked.length === TOTAL_CARS,
      sound: data.sound !== false,
    };
  } catch {
    return { ...INITIAL_PROGRESS };
  }
}
