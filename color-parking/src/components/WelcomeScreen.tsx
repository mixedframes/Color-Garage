import { carById } from '../game/cars';
import { CarArt } from './Art';

export function WelcomeScreen({
  onStart,
  onParents,
}: {
  onStart: () => void;
  onParents: () => void;
}) {
  return (
    <div className="screen flex h-full flex-col px-6 pb-5 pt-5">
      <div className="flex items-center justify-between">
        <p className="label">N° 01</p>
        <button type="button" onClick={onParents} className="label -mr-2 px-2 py-3 underline-offset-4 hover:underline">
          For parents
        </button>
      </div>
      <div className="mt-2 h-px bg-ink" />

      <h1 className="headline mt-6">
        Color
        <br />
        Parking.
      </h1>
      <p className="label mt-4">A little game about colors.</p>

      <div className="relative my-4 flex min-h-0 flex-1 items-center justify-center">
        <HeroCars />
      </div>

      <button type="button" onClick={onStart} className="big-btn">
        <span>Start playing</span>
        <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}

/** Three cars in a geometric composition, inside a thin circle. */
function HeroCars() {
  const cars = [
    { car: carById('blue'), x: 22, y: 56, delay: 160 },
    { car: carById('pink'), x: 50, y: 44, delay: 0 },
    { car: carById('yellow'), x: 78, y: 56, delay: 320 },
  ];
  return (
    <div className="relative aspect-square h-full max-h-[340px] max-w-full">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <circle cx="50" cy="50" r="47" fill="none" stroke="#111" strokeWidth="0.5" className="hero-ring" pathLength={1} transform="rotate(-90 50 50)" />
        <path d="M14 80 H86" stroke="#111" strokeWidth="0.5" className="hero-line" pathLength={1} />
      </svg>
      {cars.map(({ car, x, y, delay }) => (
        <div
          key={car.id}
          className="hero-car absolute"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: '19%',
            height: '33%',
            animationDelay: `${300 + delay}ms`,
          }}
        >
          <CarArt car={car} className="block h-full w-full" />
        </div>
      ))}
    </div>
  );
}
