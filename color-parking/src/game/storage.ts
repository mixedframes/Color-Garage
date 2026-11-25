import { parseProgress, type Progress } from './logic';

const KEY = 'color-parking:v1';

export function loadProgress(): Progress {
  try {
    return parseProgress(window.localStorage.getItem(KEY));
  } catch {
    return parseProgress(null);
  }
}

export function saveProgress(p: Progress): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* private mode or storage full: the game still works, it just won't remember */
  }
}
