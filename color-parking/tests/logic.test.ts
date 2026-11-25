import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CARS, PALETTE, type ColorId } from '../src/game/cars';
import {
  center,
  clampToArea,
  computeLayout,
  contains,
  INITIAL_PROGRESS,
  isApproaching,
  park,
  parseProgress,
  resetLevel,
  resolveDrop,
  STALL_ORDER,
  START_ORDER,
  TOTAL_CARS,
} from '../src/game/logic';

const SIZES: [number, number][] = [
  [320, 430], // iPhone SE-ish game area
  [375, 560],
  [390, 620], // iPhone 13/14/15
  [430, 700], // Pro Max
  [720, 900], // iPad portrait
  [1200, 700], // desktop window
];

const overlap = (a: { x: number; y: number; w: number; h: number }, b: typeof a) =>
  a.x < b.x + b.w - 0.01 && b.x < a.x + a.w - 0.01 && a.y < b.y + b.h - 0.01 && b.y < a.y + a.h - 0.01;

test('six cars with six distinct, exact palette colors', () => {
  assert.equal(CARS.length, TOTAL_CARS);
  assert.deepEqual(new Set(CARS.map((c) => c.color)).size, 6);
  assert.deepEqual(
    CARS.map((c) => c.color).sort(),
    ['#FF8FAB', '#78C8F8', '#FFD966', '#75D9B0', '#B9A0F5', '#FF9B75'].sort(),
  );
  for (const c of CARS) assert.equal(c.color, PALETTE[c.id]);
  assert.equal(new Set(STALL_ORDER).size, 6);
  assert.equal(new Set(START_ORDER).size, 6);
});

for (const [w, h] of SIZES) {
  test(`layout fits without scrolling at ${w}x${h}`, () => {
    const L = computeLayout(w, h);
    const ids = Object.keys(L.stalls) as ColorId[];
    for (const id of ids) {
      const s = L.stalls[id];
      assert.ok(s.x >= 0 && s.y >= 0 && s.x + s.w <= w + 0.01 && s.y + s.h <= h + 0.01, `stall ${id} inside`);
      const home = L.homes[id];
      assert.ok(home.x - L.car.w / 2 >= 0 && home.x + L.car.w / 2 <= w + 0.01, `car ${id} x inside`);
      assert.ok(home.y - L.car.h / 2 >= 0 && home.y + L.car.h / 2 <= h + 0.01, `car ${id} y inside`);
      // cars start away from every stall
      for (const other of ids) assert.ok(!contains(L.stalls[other], home), `${id} not starting in a stall`);
    }
    for (const a of ids) for (const b of ids) if (a !== b) assert.ok(!overlap(L.stalls[a], L.stalls[b]));
    // a car fits inside its stall
    assert.ok(L.car.w < L.stall.w && L.car.h < L.stall.h);
  });
}

test('cars are large enough to touch on a small phone', () => {
  const L = computeLayout(320, 430);
  assert.ok(L.car.w >= 40, `car width ${L.car.w}`);
  assert.ok(L.car.h >= 70, `car height ${L.car.h}`);
});

test('no car starts directly below its own stall', () => {
  const L = computeLayout(390, 620);
  for (const id of STALL_ORDER) {
    assert.notEqual(Math.round(L.homes[id].x), Math.round(center(L.stalls[id]).x), id);
  }
});

test('correct drop snaps, wrong drop returns home', () => {
  const L = computeLayout(390, 620);
  for (const id of STALL_ORDER) {
    assert.equal(resolveDrop(id, center(L.stalls[id]), L, []), id, `${id} into its own stall`);
    for (const other of STALL_ORDER) {
      if (other === id) continue;
      assert.equal(resolveDrop(id, center(L.stalls[other]), L, []), null, `${id} into ${other}`);
    }
    assert.equal(resolveDrop(id, L.homes[id], L, []), null, `${id} dropped at home`);
  }
});

test('drop is forgiving just outside the matching stall (open side)', () => {
  const L = computeLayout(390, 620);
  const s = L.stalls.mint; // bottom-left stall, opening towards the lane
  const justBelow = { x: s.x + s.w / 2, y: s.y + s.h + L.stall.w * 0.2 };
  assert.equal(resolveDrop('mint', justBelow, L, []), 'mint');
  const farBelow = { x: s.x + s.w / 2, y: s.y + s.h + L.stall.w * 0.6 };
  assert.equal(resolveDrop('mint', farBelow, L, []), null);
});

test('an already parked car cannot be parked again', () => {
  const L = computeLayout(390, 620);
  assert.equal(resolveDrop('pink', center(L.stalls.pink), L, ['pink']), null);
  assert.equal(isApproaching('pink', center(L.stalls.pink), L, ['pink']), false);
});

test('approach highlight only near the matching stall', () => {
  const L = computeLayout(390, 620);
  assert.equal(isApproaching('blue', center(L.stalls.blue), L, []), true);
  assert.equal(isApproaching('blue', center(L.stalls.coral), L, []), false);
});

test('dragged cars are kept inside the play area', () => {
  const L = computeLayout(390, 620);
  const p = clampToArea({ x: -100, y: 9999 }, L);
  assert.equal(p.x, L.car.w / 2);
  assert.equal(p.y, L.height - L.car.h / 2);
});

test('coins: one per parked car, completion at six, no double counting', () => {
  let p = { ...INITIAL_PROGRESS };
  for (const [i, id] of STALL_ORDER.entries()) {
    p = park(p, id);
    p = park(p, id); // repeat is ignored
    assert.equal(p.parked.length, i + 1);
    assert.equal(p.levelComplete, i + 1 === TOTAL_CARS);
  }
  const fresh = resetLevel(p);
  assert.equal(fresh.parked.length, 0);
  assert.equal(fresh.levelComplete, true, 'completion is remembered after replay');
});

test('stored progress is parsed defensively', () => {
  assert.deepEqual(parseProgress(null), INITIAL_PROGRESS);
  assert.deepEqual(parseProgress('not json'), INITIAL_PROGRESS);
  assert.deepEqual(parseProgress('{"parked":["pink","pink","nope",3],"sound":false}'), {
    parked: ['pink'],
    levelComplete: false,
    sound: false,
  });
  const all = JSON.stringify({ parked: STALL_ORDER });
  assert.equal(parseProgress(all).levelComplete, true);
});
