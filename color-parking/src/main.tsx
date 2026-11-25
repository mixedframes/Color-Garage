import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// Keep the page itself perfectly still: no scrolling, rubber-banding,
// pull-to-refresh or pinch gestures moving the game around. Elements marked
// with data-scroll (the parent info sheet) may still scroll.
const allowScroll = (target: EventTarget | null) =>
  target instanceof Element && target.closest('[data-scroll]') !== null;

document.addEventListener(
  'touchmove',
  (e) => {
    if (!allowScroll(e.target)) e.preventDefault();
  },
  { passive: false },
);
for (const type of ['gesturestart', 'gesturechange'] as const) {
  document.addEventListener(type, (e) => e.preventDefault(), { passive: false });
}
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });

createRoot(document.getElementById('root')!).render(<App />);

if (!__DEV__ && 'serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      /* offline support is a bonus; the game works without it */
    });
  });
}
