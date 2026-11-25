import { SoundIcon } from './Art';

export function SoundToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      aria-label={on ? 'Sound on' : 'Sound off'}
      className="icon-btn"
    >
      <SoundIcon on={on} className="h-6 w-6" />
    </button>
  );
}
