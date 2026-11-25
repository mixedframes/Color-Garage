/**
 * Generates the app icons from the in-game car artwork.
 * Run: npx tsx scripts/make-icons.ts   (requires `rsvg-convert` on PATH)
 * The generated PNGs are committed in public/icons, so this is only needed
 * if you change the artwork.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CAR_VIEWBOX, carById, carSvgMarkup } from '../src/game/cars';

const out = join(import.meta.dirname, '..', 'public', 'icons');
mkdirSync(out, { recursive: true });

/** Square icon: white background, one car centred, `carHeight` as a fraction of the size. */
function iconSvg(carHeight: number): string {
  const S = 1024;
  const scale = (S * carHeight) / CAR_VIEWBOX.h;
  const w = CAR_VIEWBOX.w * scale;
  const h = CAR_VIEWBOX.h * scale;
  const car = carById('pink');
  // Thicker outline relative to the art so it stays crisp at small sizes.
  const markup = carSvgMarkup(car).replace(/stroke-width="([\d.]+)"/g, (_m, v) => `stroke-width="${Number(v) * 1.15}"`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
  <rect width="${S}" height="${S}" fill="#FFFFFF"/>
  <g transform="translate(${(S - w) / 2} ${(S - h) / 2}) scale(${scale})">${markup}</g>
</svg>`;
}

const regular = iconSvg(0.6);
const maskable = iconSvg(0.46); // stays inside the maskable safe zone
writeFileSync(join(out, 'icon.svg'), regular);
writeFileSync(join(out, 'icon-maskable.svg'), maskable);

const render = (svgFile: string, size: number, png: string) =>
  execFileSync('rsvg-convert', ['-w', String(size), '-h', String(size), '-o', join(out, png), join(out, svgFile)]);

render('icon.svg', 192, 'icon-192.png');
render('icon.svg', 512, 'icon-512.png');
render('icon.svg', 180, 'apple-touch-icon.png');
render('icon.svg', 32, 'favicon-32.png');
render('icon-maskable.svg', 512, 'icon-maskable-512.png');
console.log('Icons written to', out);
