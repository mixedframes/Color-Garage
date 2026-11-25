export function ComingSoonScreen({ onReplay }: { onReplay: () => void }) {
  return (
    <div className="screen flex h-full flex-col px-6 pb-5 pt-5">
      <p className="label">Level 02</p>
      <div className="mt-2 h-px bg-ink" />

      <div className="flex flex-1 flex-col justify-center">
        <h1 className="headline">
          Coming
          <br />
          soon.
        </h1>
        <p className="label mt-6">More little cars are on their way.</p>
      </div>

      <button type="button" onClick={onReplay} className="big-btn">
        <span>Play again</span>
        <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}
