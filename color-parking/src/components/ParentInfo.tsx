const STEPS: { title: string; body: string }[] = [
  {
    title: 'Install',
    body: 'Open the game in Safari. Tap the Share button, then “Add to Home Screen”, then “Add”.',
  },
  {
    title: 'Turn on Guided Access',
    body: 'Open Settings → Accessibility → Guided Access and switch it on.',
  },
  {
    title: 'Set a passcode',
    body: 'In the same screen, tap Passcode Settings → Set Guided Access Passcode. Face ID or Touch ID can be enabled there too.',
  },
  {
    title: 'Launch',
    body: 'Open Color Parking from its Home Screen icon (not from Safari), so it runs fullscreen.',
  },
  {
    title: 'Start Guided Access',
    body: 'Triple-click the side button (or the Home button on older devices), then tap Start.',
  },
  {
    title: 'End Guided Access',
    body: 'Triple-click the side button again and enter your passcode, or double-click and use Face ID / Touch ID if enabled.',
  },
];

export function ParentInfo({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="sheet absolute inset-0 z-40 flex flex-col bg-paper px-6 pb-5 pt-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="parent-title"
    >
      <div className="flex items-center justify-between">
        <p className="label">For parents</p>
        <button type="button" onClick={onClose} className="label -mr-2 px-2 py-3" aria-label="Close">
          Close ×
        </button>
      </div>
      <div className="mt-2 h-px bg-ink" />

      <div className="scroll-area -mx-6 min-h-0 flex-1 overflow-y-auto px-6" data-scroll>
        <h2 id="parent-title" className="mt-6 text-[40px] font-bold leading-[0.9] tracking-[-0.04em]">
          Keep little
          <br />
          hands here.
        </h2>
        <p className="mt-4 max-w-[34ch] text-[15px] leading-snug text-ink/70">
          A web app can’t lock an iPhone by itself. Apple’s built-in Guided Access can keep your
          child inside Color Parking until you end it.
        </p>

        <ol className="mt-6">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4 border-t border-ink py-4">
              <span className="label w-6 shrink-0 pt-[3px]">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <p className="text-[17px] font-bold leading-tight tracking-tight">{s.title}</p>
                <p className="mt-1 text-[15px] leading-snug text-ink/70">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="h-px bg-ink" />
        <p className="label mt-4 pb-4 text-ink/50">No ads. No purchases. Works offline.</p>
      </div>
    </div>
  );
}
