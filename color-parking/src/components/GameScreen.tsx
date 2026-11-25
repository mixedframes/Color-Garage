import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import type { ColorId } from '../game/cars';
import { coinsFor, park, resetLevel, TOTAL_CARS, type Point, type Progress } from '../game/logic';
import { sounds } from '../game/sound';
import { CoinArt, RestartIcon } from './Art';
import { CoinCounter } from './CoinCounter';
import { ParkingLot } from './ParkingLot';
import { SoundToggle } from './SoundToggle';

interface GameScreenProps {
  progress: Progress;
  onProgress: (update: (p: Progress) => Progress) => void;
  onToggleSound: () => void;
  onComplete: () => void;
}

interface Flying {
  key: number;
  from: Point;
}

export function GameScreen({ progress, onProgress, onToggleSound, onComplete }: GameScreenProps) {
  const counterIcon = useRef<HTMLSpanElement>(null);
  // Coins shown in the counter lag behind real progress until each coin lands.
  const [shown, setShown] = useState(() => coinsFor(progress));
  const [flying, setFlying] = useState<Flying[]>([]);
  const [celebrate, setCelebrate] = useState(0);
  const nextKey = useRef(1);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const handlePark = useCallback(
    (id: ColorId, at: Point) => {
      onProgress((p) => park(p, id));
      sounds.park();
      later(() => {
        setFlying((f) => [...f, { key: nextKey.current++, from: at }]);
      }, 260);
    },
    [onProgress],
  );

  const shownRef = useRef(shown);
  const handleArrive = useCallback(
    (key: number) => {
      setFlying((f) => f.filter((c) => c.key !== key));
      sounds.coin();
      const before = shownRef.current;
      const next = Math.min(TOTAL_CARS, before + 1);
      shownRef.current = next;
      setShown(next);
      if (next === TOTAL_CARS && before < TOTAL_CARS) {
        later(() => {
          setCelebrate((c) => c + 1);
          sounds.complete();
        }, 250);
        later(onComplete, 1700);
      }
    },
    [onComplete],
  );

  const restart = () => {
    clearTimers();
    setFlying([]);
    setShown(0);
    shownRef.current = 0;
    onProgress(resetLevel);
    sounds.tap();
  };

  return (
    <div className="screen flex h-full flex-col">
      <header className="flex items-end justify-between px-6 pb-4 pt-5">
        <p className="label pb-1">Level 01</p>
        <CoinCounter count={shown} iconRef={counterIcon} />
      </header>
      <div className="mx-6 h-px bg-ink" />

      <main className="relative min-h-0 flex-1 px-2 py-3">
        <ParkingLot
          parked={progress.parked}
          celebrate={celebrate}
          onPickup={sounds.pickup}
          onPark={handlePark}
        />
      </main>

      <div className="mx-6 h-px bg-ink" />
      <footer className="flex items-center justify-between px-6 pb-3 pt-2">
        <p className="label">Match the colors.</p>
        <div className="-mr-3 flex items-center">
          <button type="button" onClick={restart} aria-label="Restart level" className="icon-btn">
            <RestartIcon className="h-6 w-6" />
          </button>
          <SoundToggle on={progress.sound} onToggle={onToggleSound} />
        </div>
      </footer>

      {/* Portalled to <body> so fixed positioning is relative to the viewport. */}
      {createPortal(
        flying.map((c) => (
          <FlyingCoin key={c.key} id={c.key} from={c.from} target={counterIcon} onArrive={handleArrive} />
        )),
        document.body,
      )}
    </div>
  );
}

const COIN = 40;

function FlyingCoin({
  id,
  from,
  target,
  onArrive,
}: {
  id: number;
  from: Point;
  target: RefObject<HTMLSpanElement | null>;
  onArrive: (id: number) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const done = useRef(onArrive);
  done.current = onArrive;

  useLayoutEffect(() => {
    const node = el.current;
    const t = target.current?.getBoundingClientRect();
    if (!node || !t || !node.animate) {
      done.current(id);
      return;
    }
    const dx = t.left + t.width / 2 - from.x;
    const dy = t.top + t.height / 2 - from.y;
    const endScale = t.width / COIN;
    const anim = node.animate(
      [
        { transform: 'translate(0,0) scale(0.2)', opacity: 0, easing: 'cubic-bezier(.2,.9,.3,1.3)' },
        { transform: 'translate(0,-40px) scale(1.15)', opacity: 1, offset: 0.2 },
        { transform: 'translate(0,-56px) scale(1)', opacity: 1, offset: 0.42, easing: 'cubic-bezier(.55,0,.3,1)' },
        { transform: `translate(${dx}px,${dy}px) scale(${endScale})`, opacity: 1 },
      ],
      { duration: 1150, fill: 'forwards' },
    );
    anim.onfinish = () => done.current(id);
    return () => anim.cancel();
  }, [id, from.x, from.y, target]);

  return (
    <div
      ref={el}
      className="pointer-events-none fixed z-50"
      style={{ left: from.x - COIN / 2, top: from.y - COIN / 2, width: COIN, height: COIN, opacity: 0 }}
      aria-hidden="true"
    >
      <CoinArt className="block h-full w-full" />
    </div>
  );
}
