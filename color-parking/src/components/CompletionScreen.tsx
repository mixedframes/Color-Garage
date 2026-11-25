import { TOTAL_CARS } from '../game/logic';
import { CoinArt } from './Art';

export function CompletionScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="screen flex h-full flex-col px-6 pb-5 pt-5">
      <p className="label">Level 01</p>
      <div className="mt-2 h-px bg-ink" />

      <div className="flex flex-1 flex-col justify-center">
        <h1 className="headline">
          Well
          <br />
          done.
        </h1>

        <div className="mt-10 flex gap-2" aria-hidden="true">
          {Array.from({ length: TOTAL_CARS }, (_, i) => (
            <span
              key={i}
              className="coin-pop block aspect-square w-[13%] max-w-[52px]"
              style={{ animationDelay: `${250 + i * 110}ms` }}
            >
              <CoinArt className="block h-full w-full" />
            </span>
          ))}
        </div>

        <div className="mt-8 h-px bg-ink" />
        <p className="label mt-4">
          {TOTAL_CARS} / {TOTAL_CARS} coins collected
        </p>
        <p className="label mt-2 text-ink/50">Level 01 complete</p>
      </div>

      <button type="button" onClick={onNext} className="big-btn">
        <span>Next level</span>
        <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}
