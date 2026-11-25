/**
 * Car definitions and their top-down vector artwork.
 *
 * Artwork is stored as plain data so the same shapes can be rendered by
 * React (in game) and by the icon generator script (for the app icons).
 * Every car lives in the same 64 x 112 viewBox, front of the car at the top.
 */

export type ColorId = 'pink' | 'blue' | 'yellow' | 'mint' | 'purple' | 'coral';

export const PALETTE: Record<ColorId, string> = {
  pink: '#FF8FAB',
  blue: '#78C8F8',
  yellow: '#FFD966',
  mint: '#75D9B0',
  purple: '#B9A0F5',
  coral: '#FF9B75',
};

/** What each shape is painted with. */
export type Paint =
  | 'body' // the car's color
  | 'glass' // dark windows
  | 'wheel' // black tyres
  | 'ink' // solid black details (spoiler, bumpers)
  | 'shine' // soft white accents
  | 'none'; // outline only

export interface Shape {
  /** SVG path data. */
  d: string;
  paint: Paint;
  /** Draw a black outline (default true for body, false otherwise). */
  stroke?: boolean;
  strokeWidth?: number;
  /** Use a white outline (e.g. a steering wheel on a dark interior). */
  lightStroke?: boolean;
}

export interface CarDef {
  id: ColorId;
  color: string;
  /** Spoken / accessible name. */
  name: string;
  shapes: Shape[];
}

export const CAR_VIEWBOX = { w: 64, h: 112 };

// helpers ---------------------------------------------------------------
const rect = (x: number, y: number, w: number, h: number, r = 0): string => {
  const rr = Math.min(r, w / 2, h / 2);
  return [
    `M${x + rr} ${y}`,
    `H${x + w - rr}`,
    rr ? `Q${x + w} ${y} ${x + w} ${y + rr}` : '',
    `V${y + h - rr}`,
    rr ? `Q${x + w} ${y + h} ${x + w - rr} ${y + h}` : '',
    `H${x + rr}`,
    rr ? `Q${x} ${y + h} ${x} ${y + h - rr}` : '',
    `V${y + rr}`,
    rr ? `Q${x} ${y} ${x + rr} ${y}` : '',
    'Z',
  ].join(' ');
};

const circle = (cx: number, cy: number, r: number): string =>
  `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0 Z`;

/** Four tyres, peeking out from under the body. */
const wheels = (left: number, right: number, front: number, rear: number, w = 7, h = 16): Shape[] =>
  [
    [left, front],
    [right, front],
    [left, rear],
    [right, rear],
  ].map(([x, y]) => ({ d: rect(x, y, w, h, 2.5), paint: 'wheel' as Paint }));

// the six cars --------------------------------------------------------------

const sports: CarDef = {
  id: 'pink',
  color: PALETTE.pink,
  name: 'Pink sports car',
  shapes: [
    ...wheels(6, 51, 18, 80),
    {
      // "Coke bottle" body: wide front and rear wings, narrow waist.
      d: 'M21 5 Q32 2 43 5 Q53 8 54 20 Q55 32 51 42 L51 68 Q55 78 55 92 Q54 106 43 107 L21 107 Q10 106 9 92 Q9 78 13 68 L13 42 Q9 32 10 20 Q11 8 21 5 Z',
      paint: 'body',
    },
    { d: rect(26, 7, 3, 28, 1.5), paint: 'shine' },
    { d: rect(35, 7, 3, 28, 1.5), paint: 'shine' },
    { d: 'M15 44 Q32 37 49 44 L46 56 L18 56 Z', paint: 'glass' },
    { d: rect(19, 56, 26, 14, 4), paint: 'body', stroke: true, strokeWidth: 1.5 },
    { d: 'M19 70 L45 70 L42 80 L22 80 Z', paint: 'glass' },
    { d: rect(11, 98, 42, 5, 2.5), paint: 'ink' },
  ],
};

const suv: CarDef = {
  id: 'blue',
  color: PALETTE.blue,
  name: 'Blue SUV',
  shapes: [
    ...wheels(4, 52, 16, 78, 8, 18),
    { d: rect(8, 7, 48, 98, 9), paint: 'body' },
    { d: 'M12 29 L52 29 L50 40 L14 40 Z', paint: 'glass' },
    { d: rect(13, 40, 38, 50, 3), paint: 'body', stroke: true, strokeWidth: 1.5 },
    { d: 'M19 45 V85', paint: 'none', stroke: true, strokeWidth: 1.5 },
    { d: 'M45 45 V85', paint: 'none', stroke: true, strokeWidth: 1.5 },
    { d: 'M14 91 L50 91 L49 98 L15 98 Z', paint: 'glass' },
  ],
};

const city: CarDef = {
  id: 'yellow',
  color: PALETTE.yellow,
  name: 'Yellow city car',
  shapes: [
    ...wheels(8, 49, 30, 70, 7, 14),
    { d: rect(12, 20, 40, 74, 17), paint: 'body' },
    { d: 'M16 41 Q32 34 48 41 L46 51 L18 51 Z', paint: 'glass' },
    { d: rect(17, 51, 30, 26, 6), paint: 'body', stroke: true, strokeWidth: 1.5 },
    { d: 'M19 77 L45 77 L43 85 L21 85 Z', paint: 'glass' },
    { d: circle(20, 27, 2.6), paint: 'shine', stroke: true, strokeWidth: 1.2 },
    { d: circle(44, 27, 2.6), paint: 'shine', stroke: true, strokeWidth: 1.2 },
  ],
};

const minivan: CarDef = {
  id: 'mint',
  color: PALETTE.mint,
  name: 'Mint green minivan',
  shapes: [
    ...wheels(6, 51, 16, 80),
    { d: rect(10, 5, 44, 102, 11), paint: 'body' },
    { d: 'M13 18 Q32 12 51 18 L50 30 L14 30 Z', paint: 'glass' },
    { d: rect(14, 30, 36, 66, 4), paint: 'body', stroke: true, strokeWidth: 1.5 },
    { d: 'M14 52 H50', paint: 'none', stroke: true, strokeWidth: 1.5 },
    { d: 'M14 74 H50', paint: 'none', stroke: true, strokeWidth: 1.5 },
    { d: 'M15 97 L49 97 L48 102 L16 102 Z', paint: 'glass' },
  ],
};

const sedan: CarDef = {
  id: 'purple',
  color: PALETTE.purple,
  name: 'Purple classic sedan',
  shapes: [
    ...wheels(6, 51, 22, 78),
    { d: rect(14, 3, 36, 5, 2.5), paint: 'ink' },
    { d: rect(14, 104, 36, 5, 2.5), paint: 'ink' },
    {
      d: 'M15 8 Q32 4 49 8 Q54 10 54 20 L54 92 Q54 104 46 106 L18 106 Q10 104 10 92 L10 20 Q10 10 15 8 Z',
      paint: 'body',
    },
    { d: circle(32, 15, 2.2), paint: 'ink' },
    { d: 'M15 38 L49 38 L46 50 L18 50 Z', paint: 'glass' },
    { d: rect(18, 50, 28, 26, 3), paint: 'body', stroke: true, strokeWidth: 1.5 },
    { d: 'M18 76 L46 76 L49 85 L15 85 Z', paint: 'glass' },
  ],
};

const convertible: CarDef = {
  id: 'coral',
  color: PALETTE.coral,
  name: 'Orange convertible',
  shapes: [
    ...wheels(6, 51, 18, 80),
    { d: rect(10, 8, 44, 98, 15), paint: 'body' },
    { d: 'M14 38 Q32 30 50 38 L49 43 Q32 36 15 43 Z', paint: 'glass' },
    { d: rect(15, 46, 34, 42, 9), paint: 'glass' },
    { d: rect(18, 55, 12, 14, 4), paint: 'body', stroke: true, strokeWidth: 1.2 },
    { d: rect(34, 55, 12, 14, 4), paint: 'body', stroke: true, strokeWidth: 1.2 },
    { d: rect(18, 74, 28, 10, 4), paint: 'body', stroke: true, strokeWidth: 1.2 },
    { d: circle(24, 50, 3), paint: 'none', stroke: true, strokeWidth: 1.4, lightStroke: true },
  ],
};

export const CARS: CarDef[] = [sports, suv, city, minivan, sedan, convertible];

export const carById = (id: ColorId): CarDef => {
  const car = CARS.find((c) => c.id === id);
  if (!car) throw new Error(`Unknown car ${id}`);
  return car;
};

export type ArtTone = 'solid' | 'ghost';

/** Resolves the fill / stroke colors for a shape in a given tone. */
export function shapeStyle(
  shape: Shape,
  color: string,
  tone: ArtTone,
): { fill: string; stroke: string; strokeWidth: number } {
  const hasStroke = shape.stroke ?? shape.paint === 'body';
  const strokeWidth = hasStroke ? shape.strokeWidth ?? 2 : 0;
  if (tone === 'ghost') {
    const fill =
      shape.paint === 'none' ? 'none' : shape.paint === 'shine' ? 'none' : 'rgba(0,0,0,0.07)';
    return { fill, stroke: hasStroke ? 'rgba(0,0,0,0.22)' : 'none', strokeWidth };
  }
  const fill = {
    body: color,
    glass: '#1B1B1B',
    wheel: '#111111',
    ink: '#111111',
    shine: '#FFFFFF',
    none: 'none',
  }[shape.paint];
  const stroke = shape.lightStroke ? '#FFFFFF' : '#111111';
  return { fill, stroke: hasStroke ? stroke : 'none', strokeWidth };
}

/** Renders a car to an SVG string (used by the icon generator). */
export function carSvgMarkup(car: CarDef, tone: ArtTone = 'solid'): string {
  return car.shapes
    .map((s) => {
      const st = shapeStyle(s, car.color, tone);
      return `<path d="${s.d}" fill="${st.fill}" stroke="${st.stroke}" stroke-width="${st.strokeWidth}" stroke-linejoin="round" stroke-linecap="round"/>`;
    })
    .join('');
}
