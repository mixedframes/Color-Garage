import { CAR_VIEWBOX, shapeStyle, type ArtTone, type CarDef } from '../game/cars';

export function CarArt({
  car,
  tone = 'solid',
  className,
}: {
  car: CarDef;
  tone?: ArtTone;
  className?: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${CAR_VIEWBOX.w} ${CAR_VIEWBOX.h}`}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {car.shapes.map((s, i) => {
        const st = shapeStyle(s, car.color, tone);
        return (
          <path
            key={i}
            d={s.d}
            fill={st.fill}
            stroke={st.stroke}
            strokeWidth={st.strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

/** Minimal golden coin with a four-point star. */
export function CoinArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" focusable="false">
      <circle cx="20" cy="20" r="18" fill="#F7C948" stroke="#111" strokeWidth="2" />
      <circle cx="20" cy="20" r="13" fill="none" stroke="#111" strokeWidth="1.2" />
      <path d="M20 12 Q21 19 28 20 Q21 21 20 28 Q19 21 12 20 Q19 19 20 12 Z" fill="#111" />
    </svg>
  );
}

export function RestartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M19 12a7 7 0 1 1-2.05-4.95"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M17.5 3.5v4h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SoundIcon({ on, className }: { on: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {on ? (
        <>
          <path d="M15.5 9a4 4 0 0 1 0 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M18 6.5a7.5 7.5 0 0 1 0 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      ) : (
        <path d="M16 9.5l5 5m0-5l-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      )}
    </svg>
  );
}
