import { useEffect, useRef, type RefObject } from 'react';
import { TOTAL_CARS } from '../game/logic';
import { CoinArt } from './Art';

export function CoinCounter({
  count,
  iconRef,
}: {
  count: number;
  iconRef: RefObject<HTMLSpanElement | null>;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (count === 0) return;
    wrap.current?.animate?.(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.18)', offset: 0.3 },
        { transform: 'scale(0.97)', offset: 0.65 },
        { transform: 'scale(1)' },
      ],
      { duration: 480, easing: 'cubic-bezier(.3,.7,.4,1)' },
    );
  }, [count]);

  return (
    <div
      ref={wrap}
      className="flex items-center gap-2"
      role="status"
      aria-label={`${count} of ${TOTAL_CARS} coins`}
      data-testid="coin-counter"
    >
      <span ref={iconRef} className="block h-6 w-6">
        <CoinArt className="block h-full w-full" />
      </span>
      <span className="text-[20px] font-bold tabular-nums tracking-tight">
        {count}
        <span className="mx-1 font-normal text-ink/40">/</span>
        {TOTAL_CARS}
      </span>
    </div>
  );
}
