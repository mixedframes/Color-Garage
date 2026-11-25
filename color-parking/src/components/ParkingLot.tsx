import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { CARS, type CarDef, type ColorId } from '../game/cars';
import {
  center,
  computeLayout,
  isApproaching,
  resolveDrop,
  type Layout,
  type Point,
} from '../game/logic';
import { Car } from './Car';
import { ParkingSpace } from './ParkingSpace';

interface ParkingLotProps {
  parked: readonly ColorId[];
  celebrate: number;
  onPickup: () => void;
  /** Called when a car snaps into its stall; `at` is in viewport coordinates. */
  onPark: (id: ColorId, at: Point) => void;
}

export function ParkingLot({ parked, celebrate, onPickup, onPark }: ParkingLotProps) {
  const box = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [approaching, setApproaching] = useState<ColorId | null>(null);
  const parkedRef = useRef(parked);
  parkedRef.current = parked;

  useLayoutEffect(() => {
    const node = box.current;
    if (!node) return;
    const measure = () => {
      const { width, height } = node.getBoundingClientRect();
      if (width < 10 || height < 10) return;
      setLayout((prev) =>
        prev && Math.abs(prev.width - width) < 0.5 && Math.abs(prev.height - height) < 0.5
          ? prev
          : computeLayout(width, height),
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const handlePickup = useCallback(() => onPickup(), [onPickup]);

  const handleMove = useCallback(
    (car: CarDef, p: Point) => {
      if (!layout) return;
      const near = isApproaching(car.id, p, layout, parkedRef.current);
      setApproaching((cur) => (near ? car.id : cur === car.id ? null : cur));
    },
    [layout],
  );

  const handleRelease = useCallback(
    (car: CarDef, p: Point): boolean => {
      setApproaching((cur) => (cur === car.id ? null : cur));
      if (!layout || !box.current) return false;
      const target = resolveDrop(car.id, p, layout, parkedRef.current);
      if (!target) return false;
      const origin = box.current.getBoundingClientRect();
      const c = center(layout.stalls[target]);
      onPark(target, { x: origin.left + c.x, y: origin.top + c.y });
      return true;
    },
    [layout, onPark],
  );

  return (
    <div
      ref={box}
      className="relative h-full w-full touch-none select-none"
      data-testid="parking-lot"
    >
      {layout && (
        <>
          <LotLines layout={layout} />
          {CARS.map((car) => (
            <ParkingSpace
              key={car.id}
              car={car}
              rect={layout.stalls[car.id]}
              approaching={approaching === car.id}
              filled={parked.includes(car.id)}
              carSize={layout.car}
            />
          ))}
          {CARS.map((car, i) => (
            <Car
              key={car.id}
              car={car}
              layout={layout}
              parked={parked.includes(car.id)}
              celebrate={celebrate}
              celebrateDelay={i * 70}
              onPickup={handlePickup}
              onMove={handleMove}
              onRelease={handleRelease}
            />
          ))}
        </>
      )}
    </div>
  );
}

/** Thin black parking lines: two back-to-back rows of three stalls, plus a dashed lane. */
function LotLines({ layout }: { layout: Layout }) {
  const { block, stall, laneY, width } = layout;
  const lines: string[] = [];
  for (let i = 0; i <= 3; i++) {
    const x = block.x + i * stall.w;
    lines.push(`M${x} ${block.y} V${block.y + block.h}`);
  }
  lines.push(`M${block.x} ${block.y + stall.h} H${block.x + block.w}`);
  const laneInset = Math.max(8, (width - block.w) / 2 - stall.w * 0.15);
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      <path d={lines.join(' ')} stroke="#111" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path
        d={`M${laneInset} ${laneY} H${width - laneInset}`}
        stroke="#111"
        strokeWidth="1.5"
        strokeDasharray="10 9"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
