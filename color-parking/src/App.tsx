import { useCallback, useEffect, useRef, useState } from 'react';
import { ComingSoonScreen } from './components/ComingSoonScreen';
import { CompletionScreen } from './components/CompletionScreen';
import { GameScreen } from './components/GameScreen';
import { ParentInfo } from './components/ParentInfo';
import { WelcomeScreen } from './components/WelcomeScreen';
import { resetLevel, TOTAL_CARS, type Progress } from './game/logic';
import { setSoundEnabled, sounds, unlockAudio } from './game/sound';
import { loadProgress, saveProgress } from './game/storage';

type Screen = 'welcome' | 'game' | 'complete' | 'soon';

const FADE_MS = 220;

export default function App() {
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [screen, setScreen] = useState<Screen>('welcome');
  const [fading, setFading] = useState(false);
  const [parents, setParents] = useState(false);
  const fadeTimer = useRef<number>(0);

  useEffect(() => {
    saveProgress(progress);
    setSoundEnabled(progress.sound);
  }, [progress]);

  // iOS only allows audio after a user gesture: unlock on the first touch.
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock, { passive: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  const go = useCallback((next: Screen) => {
    window.clearTimeout(fadeTimer.current);
    setFading(true);
    fadeTimer.current = window.setTimeout(() => {
      setScreen(next);
      setFading(false);
    }, FADE_MS);
  }, []);

  const update = useCallback((fn: (p: Progress) => Progress) => setProgress(fn), []);

  const start = () => {
    sounds.tap();
    // A finished board starts fresh so there is always something to play.
    if (progress.parked.length >= TOTAL_CARS) setProgress(resetLevel);
    go('game');
  };

  const replay = () => {
    sounds.tap();
    setProgress(resetLevel);
    go('game');
  };

  const onComplete = useCallback(() => go('complete'), [go]);

  return (
    <div className={`app-root ${fading ? 'is-fading' : ''}`}>
      {screen === 'welcome' && (
        <WelcomeScreen onStart={start} onParents={() => setParents(true)} />
      )}
      {screen === 'game' && (
        <GameScreen
          progress={progress}
          onProgress={update}
          onToggleSound={() => update((p) => ({ ...p, sound: !p.sound }))}
          onComplete={onComplete}
        />
      )}
      {screen === 'complete' && (
        <CompletionScreen
          onNext={() => {
            sounds.tap();
            go('soon');
          }}
        />
      )}
      {screen === 'soon' && <ComingSoonScreen onReplay={replay} />}
      {parents && screen === 'welcome' && <ParentInfo onClose={() => setParents(false)} />}
    </div>
  );
}
