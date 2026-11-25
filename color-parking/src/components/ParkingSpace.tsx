import type { CarDef } from '../game/cars';
import type { Rect } from '../game/logic';
import { CarArt } from './Art';

const withAlpha = (hex: string, alpha: number) =>
  `${hex}${Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0')}`;

export function ParkingSpace({
  car,
  rect,
  approaching,
  filled,
  carSize,
}: {
  car: CarDef;
  rect: Rect;
  carSize: { w: number; h: number };
  approaching: boolean;
  filled: boolean;
}) {
  return (
    <div
      className="pointer-events-none absolute"
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
      data-stall={car.id}
      aria-hidden="true"
    >
      <div
        className={`stall-pad absolute inset-[9%_11%] border ${
          approaching ? 'stall-approach' : ''
        }`}
        style={{
          backgroundColor: withAlpha(car.color, filled ? 0.35 : approaching ? 0.85 : 0.55),
          borderColor: approaching ? '#111' : 'transparent',
          borderRadius: '14% / 10%',
        }}
      />
      <div
        className="absolute transition-opacity duration-300"
        style={{
          left: (rect.w - carSize.w) / 2,
          top: (rect.h - carSize.h) / 2,
          width: carSize.w,
          height: carSize.h,
          opacity: filled ? 0 : 1,
        }}
      >
        <CarArt car={car} tone="ghost" className="block h-full w-full" />
      </div>
    </div>
  );
}
