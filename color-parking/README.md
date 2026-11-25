# Color Parking

A little game about colors for children aged 3–5. Drag each toy car into the parking space of the same color to earn a golden coin. Collect all six to finish Level 01.

It is an installable, offline, fullscreen Progressive Web App for iPhone and iPad. It has no ads, no purchases and makes no network requests during play.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173 (no service worker in dev)
npm run build      # production build → dist/
npm run preview    # serve dist/ on http://localhost:4173 (service worker active)
npm test           # game-logic tests
npm run typecheck
```

A ready-made production build is included in `dist/`. You can deploy that folder as it is, with no install step.

## Stack

- **React 19 + TypeScript**
- **Tailwind CSS v4**, compiled by the build script through Tailwind's own `compile()` API. No PostCSS and no extra plugins.
- **esbuild** for bundling (`scripts/build.mjs`). This stands in for Vite: it gives the same instant dev server and hashed production assets, with fewer dependencies.
- **Animations**: a ~40-line spring solver (`src/game/spring.ts`) for drag, snap and return, plus the Web Animations API for coins and celebrations. This gives Framer-Motion-style springs without the dependency.
- **Sound**: synthesized with the Web Audio API (`src/game/sound.ts`). There are no audio files, so sound works offline. Audio starts only after the first touch, which follows the iOS rules.
- **PWA**: `public/manifest.webmanifest`, icons in `public/icons/`, and a service worker generated at build time. The worker precaches every file and gets a new version hash on every build.

```
src/
  App.tsx                 screen flow + persistence
  game/cars.ts            6 cars: palette + top-down vector artwork as data
  game/logic.ts           layout, drop detection, progress (pure, tested)
  game/spring.ts          spring animator
  game/sound.ts           Web Audio effects
  game/storage.ts         localStorage
  components/             WelcomeScreen, GameScreen, ParkingLot, Car, ParkingSpace,
                          CoinCounter, CompletionScreen, ComingSoonScreen,
                          SoundToggle, ParentInfo, Art (SVG art)
scripts/build.mjs         esbuild + Tailwind + index.html + sw.js
scripts/sw-template.js    service worker source
scripts/serve.mjs         static server for dist/
scripts/make-icons.ts     regenerates icons from the car artwork (needs rsvg-convert)
tests/logic.test.ts       unit tests
```

---

## 1. Deploy over HTTPS

iOS only installs PWAs and runs service workers on **HTTPS** (or `localhost`). Any static host works. The site must be served from the **domain root** (`/`), because the manifest's `start_url` and `scope` are `/`.

**Netlify (easiest, no account setup beyond sign-in):**
1. Go to app.netlify.com → *Add new site* → *Deploy manually*.
2. Drag the `dist/` folder onto the page. You get an `https://…netlify.app` URL within seconds.
   Or connect the Git repo: `netlify.toml` is included (build `npm run build`, publish `dist`).

**Vercel:** import the repo. `vercel.json` is included.

**Cloudflare Pages / GitHub Pages:** build command `npm run build`, output `dist`. For GitHub Pages use a custom domain or a `username.github.io` repo, so the app sits at the root and not at `/repo-name/`.

**Recommended headers** (already set in the Netlify and Vercel configs):
- `/sw.js` → `Cache-Control: no-cache`, so updates are picked up.
- `/assets/*` → long-lived, immutable cache.
- `.webmanifest` → `application/manifest+json`.

**Updating:** run `npm run build` and redeploy. The new service worker downloads in the background, and the next launch uses the new version.

## 2. Add it to the iPhone Home Screen

1. Open the HTTPS URL in **Safari** on the iPhone or iPad.
2. Wait for the welcome screen to load fully. This first visit caches everything for offline play.
3. Tap **Share** (square with an arrow) → **Add to Home Screen**. On recent iOS versions it may sit under *More*/⋯ first.
4. Check that the name reads **Color Parking**. If an **Open as Web App** toggle is shown, leave it on. Then tap **Add**.

## 3. Verify standalone mode

Launch Color Parking **from its Home Screen icon**, not from Safari. Check that:

- [ ] there is no Safari address bar, toolbar, tabs or back/forward buttons;
- [ ] the white status bar shows the clock and battery, and the "LEVEL 01" header sits just below it without overlapping the notch or Dynamic Island;
- [ ] the footer (restart and sound buttons) clears the home indicator;
- [ ] dragging cars never scrolls or rubber-bands the page, and there is no pull-to-refresh;
- [ ] long-pressing a car shows no callout or text-selection menu;
- [ ] the app switcher shows the Color Parking icon and name, not Safari.

**Offline check:** after one full launch, turn on Airplane Mode, force-quit Color Parking from the app switcher and open it again. It should load and play normally.

**Persistence check:** park two cars, force-quit, reopen and tap Start Playing. The two cars should still be parked, with 2 / 6 coins.

> On iOS, a Home Screen web app keeps its own storage, separate from Safari. Progress made in Safari won't appear in the installed app, and the reverse is also true.

## 4. Keep your child inside the app with Guided Access

A web app can't lock an iPhone. Apple's built-in **Guided Access** can.

**One-time setup**
1. **Settings → Accessibility → Guided Access** → switch on.
2. **Passcode Settings → Set Guided Access Passcode**. You can also turn on Face ID / Touch ID there to end sessions.
3. Optional: **Display Auto-Lock** in the same screen controls whether the screen may sleep during a session.

**Each play session**
1. Open Color Parking from the Home Screen.
2. **Triple-click the side button** (or the Home button on older models).
3. Optional: tap *Options* to turn off hardware buttons, or circle any screen areas you want disabled. The game needs none of the edges.
4. Tap **Start**.

**To end it:** triple-click the side button and enter your passcode, or double-click the side button and use Face ID / Touch ID if you enabled it. Then tap **End**.

The game opens no links, pop-ups or other apps, and needs no app switching, so it works fully under Guided Access. A short version of these steps is also inside the app, under **For parents** on the welcome screen.

---

## Notes

- Dragging uses Pointer Events with pointer capture, so it works with touch, Apple Pencil and mouse. Several fingers can drag different cars at the same time.
- Drops are forgiving. A car snaps if its centre is in (or close to) its own space. A car dropped on a different space glides back home quietly, with no penalty.
- Progress (parked cars and coins), level completion and the sound setting are saved in `localStorage`. The restart button (↻) resets Level 01.
- Respects `prefers-reduced-motion` for screen transitions.
