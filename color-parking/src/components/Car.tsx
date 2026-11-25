import { useEffect, useLayoutEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import type { CarDef } from '../game/cars';
import { center, clampToArea, type Layout, type Point } from '../game/logic';
import { spring } from '../game/spring';
import { CarArt } from './Art';

/** Extra invisible touch area around each car, in px. */
const HIT_PAD = 10;
const LIFT_SCALE = 1.12;

interface Pose {
  x: number;
  y: number;
  s: number; // scale
  r: number; // rotation (deg)
}

interface CarProps {
  car: CarDef;
  layout: Layout;
  parked: boolean;
  /** Increment to make the car do a small celebratory hop. */
  celebrate: number;
  celebrateDelay: number;
  onPickup: (car: CarDef) => void;
  onMove: (car: CarDef, p: Point) => void;
  /** Returns true when the car snapped into its stall. */
  onRelease: (car: CarDef, p: Point) => boolean;
}

export function Car({
  car,
  layout,
  parked,
  celebrate,
  celebrateDelay,
  onPickup,
  onMove,
  onRelease,
}: CarProps) {
  const el = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const pose = useRef<Pose>({ x: 0, y: 0, s: 1, r: 0 });
  const stopAnim = useRef<() => void>(() => {});
  const drag = useRef<{
    id: number;
    origin: DOMRect;
    offset: Point;
    lastX: number;
    lastT: number;
  } | null>(null);
  const prevParked = useRef(parked);
  const latest = useRef({ layout, parked });
  latest.current = { layout, parked };

  const w = layout.car.w + HIT_PAD * 2;
  const h = layout.car.h + HIT_PAD * 2;

  const restingPoint = (): Point =>
    latest.current.parked
      ? center(latest.current.layout.stalls[car.id])
      : latest.current.layout.homes[car.id];

  const apply = () => {
    const node = el.current;
    if (!node) return;
    const { x, y, s, r } = pose.current;
    const L = latest.current.layout;
    const ow = L.car.w + HIT_PAD * 2;
    const oh = L.car.h + HIT_PAD * 2;
    node.style.transform = `translate3d(${x - ow / 2}px, ${y - oh / 2}px, 0) rotate(${r}deg) scale(${s})`;
  };

  const animateTo = (target: Pose, stiffness: number, damping: number, done?: () => void) => {
    stopAnim.current();
    stopAnim.current = spring(
      { ...pose.current },
      { ...target },
      (v) => {
        pose.current = v;
        apply();
      },
      { stiffness, damping },
      done,
    );
  };

  // Jump to the resting spot whenever the layout changes (resize/rotation).
  useLayoutEffect(() => {
    if (drag.current) return;
    stopAnim.current();
    const p = restingPoint();
    pose.current = { x: p.x, y: p.y, s: 1, r: 0 };
    apply();
    setZ(latest.current.parked ? 2 : 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  // Level restarted: glide back home.
  useEffect(() => {
    if (prevParked.current && !parked) {
      const home = latest.current.layout.homes[car.id];
      setZ(15);
      animateTo({ x: home.x, y: home.y, s: 1, r: 0 }, 140, 20, () => setZ(5));
    }
    prevParked.current = parked;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parked]);

  // Small hop when the level is complete.
  useEffect(() => {
    if (!celebrate || !inner.current?.animate) return;
    inner.current.animate(
      [
        { transform: 'translateY(0) scale(1)' },
        { transform: 'translateY(-10%) scale(1.06)', offset: 0.35 },
        { transform: 'translateY(0) scale(0.98)', offset: 0.7 },
        { transform: 'translateY(0) scale(1)' },
      ],
      { duration: 620, delay: celebrateDelay, easing: 'cubic-bezier(.3,.7,.4,1)' },
    );
  }, [celebrate, celebrateDelay]);

  useEffect(() => () => stopAnim.current(), []);

  const setZ = (z: number) => {
    if (el.current) el.current.style.zIndex = String(z);
  };
  const setLifted = (on: boolean) => {
    inner.current?.classList.toggle('car-lifted', on);
  };

  const localPoint = (e: ReactPointerEvent, origin: DOMRect): Point => ({
    x: e.clientX - origin.left,
    y: e.clientY - origin.top,
  });

  const handleDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (latest.current.parked || drag.current) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const node = el.current;
    const parent = node?.parentElement;
    if (!node || !parent) return;
    e.preventDefault();
    try {
      node.setPointerCapture(e.pointerId);
    } catch {
      /* not fatal */
    }
    const origin = parent.getBoundingClientRect();
    const p = localPoint(e, origin);
    drag.current = {
      id: e.pointerId,
      origin,
      offset: { x: p.x - pose.current.x, y: p.y - pose.current.y },
      lastX: p.x,
      lastT: performance.now(),
    };
    setZ(30);
    setLifted(true);
    animateTo({ ...pose.current, s: LIFT_SCALE, r: 0 }, 520, 26);
    onPickup(car);
  };

  const handleMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    e.preventDefault();
    stopAnim.current();
    const p = localPoint(e, d.origin);
    const next = clampToArea({ x: p.x - d.offset.x, y: p.y - d.offset.y }, latest.current.layout);
    // A gentle tilt in the direction of travel makes the car feel physical.
    const now = performance.now();
    const vx = (p.x - d.lastX) / Math.max(1, now - d.lastT);
    d.lastX = p.x;
    d.lastT = now;
    const tilt = Math.max(-9, Math.min(9, vx * 6));
    pose.current = {
      x: next.x,
      y: next.y,
      s: Math.max(pose.current.s, LIFT_SCALE),
      r: pose.current.r * 0.7 + tilt * 0.3,
    };
    apply();
    onMove(car, next);
  };

  const finish = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    setLifted(false);
    const here = { x: pose.current.x, y: pose.current.y };
    const snapped = onRelease(car, here);
    if (snapped) {
      const target = center(latest.current.layout.stalls[car.id]);
      setZ(20);
      animateTo({ x: target.x, y: target.y, s: 1, r: 0 }, 320, 17, () => setZ(2));
    } else {
      const home = latest.current.layout.homes[car.id];
      setZ(15);
      animateTo({ x: home.x, y: home.y, s: 1, r: 0 }, 150, 19, () => setZ(5));
    }
  };

  return (
    <div
      ref={el}
      role="img"
      aria-label={`${car.name}${parked ? ', parked' : ''}`}
      data-car={car.id}
      data-parked={parked ? 'true' : 'false'}
      className={`absolute left-0 top-0 touch-none select-none will-change-transform ${
        parked ? 'pointer-events-none' : 'cursor-grab active:cursor-grabbing'
      }`}
      style={{ width: w, height: h, padding: HIT_PAD }}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      onLostPointerCapture={finish}
    >
      <div ref={inner} className="car-body h-full w-full">
        <CarArt car={car} className="block h-full w-full" />
      </div>
    </div>
  );
}
