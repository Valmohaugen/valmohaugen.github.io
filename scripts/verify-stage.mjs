// @ts-check
/**
 * Verify the WebGL stage's pure math (lib/stage/*.mjs).
 *
 * 1. viewProjection: the 4×4 clip-space matrix reproduces projectPerspective
 *    (lib/physics/cameras.mjs) on screen, maps the depth range onto [−1, 1]
 *    and keeps nearer points at smaller depth (depth test GL_LESS).
 * 2. fitCamera: every corner of the scene box lands inside the free
 *    rectangle with the requested margin, and the fit is tight on one axis.
 * 3. gridMesh: vertex and index counts, corner positions, valid indices.
 * 4. Quality (quality.mjs): the 90th percentile, the ladder and its
 *    settings, and the level after an entrance (too few frames or a steady
 *    cadence keep it; jank steps down).
 * 5. Scroll ratchet (ratchet.mjs): loss never falls, starts at its baseline
 *    and caps at MAX_LOSS (30%).
 * 6. Route figures (routes.mjs): presets, dynamics and the exact captions,
 *    and the homepage figure keeps negative fringes at the loss cap.
 * 7. Time evolution: free rotation turns once per period; the publications
 *    loss loop is continuous and closes.
 * Random cases use a seeded PRNG (mulberry32), printed in [setup].
 */

import assert from 'node:assert/strict';

import { landscapeView, projectPerspective } from '../lib/physics/cameras.mjs';
import { viewProjection, fitCamera, depthRange } from '../lib/stage/projection.mjs';
import { gridMesh } from '../lib/stage/mesh.mjs';
import { percentile, nextQuality, qualitySettings, qualityAfterEntrance, MIN_FRAME_SAMPLES } from '../lib/stage/quality.mjs';
import { nextLoss, MAX_LOSS } from '../lib/stage/ratchet.mjs';
import { ROUTE_FIGURES, EVOLVE_PERIOD_MS, SPIRAL, evolveParams, restParams } from '../lib/stage/routes.mjs';
import { catWigner } from '../lib/physics/wigner.mjs';

const SEED = 20261007;
let passed = 0;
let failed = 0;
/** @param {string} name @param {() => void} fn */
function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`[ok]   ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`[FAIL] ${name}\n       ${err instanceof Error ? err.message.split('\n')[0] : err}`);
  }
}
/** @param {number} seed */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
console.log(`[setup] stage: seed ${SEED}`);

/** @param {Float32Array | Float64Array} m column-major 4×4 @param {number[]} p */
const apply = (m, p) => [0, 1, 2, 3].map((r) => m[r] * p[0] + m[4 + r] * p[1] + m[8 + r] * p[2] + m[12 + r] * p[3]);

/** @type {import('../lib/stage/projection.mjs').Box} */
const BOX = { x: [-4.6, 4.6], y: [-1.3, 1.3], z: [-3.2, 3.2] };

check('viewProjection reproduces projectPerspective and maps depth into [−1, 1] in order', () => {
  for (let trial = 0; trial < 200; trial += 1) {
    const view = landscapeView((2 * rand() - 1) * Math.PI, 0.1 + 1.2 * rand());
    const distance = 12 + 20 * rand();
    const width = 400 + 1200 * rand();
    const height = 300 + 700 * rand();
    const radiusPx = 20 + 60 * rand();
    const cx = width * rand();
    const cy = height * rand();
    const [near, far] = depthRange(view, distance, BOX);
    const m = viewProjection({ view, distance, radiusPx, cx, cy, width, height, near, far });
    const P = [(2 * rand() - 1) * 4.6, (2 * rand() - 1) * 1.3, (2 * rand() - 1) * 3.2, 1];
    const [X, Y, Z, W] = apply(m, P);
    const sx = ((X / W + 1) / 2) * width;
    const sy = ((1 - Y / W) / 2) * height;
    const ref = projectPerspective(view, P[0], P[1], P[2], distance, radiusPx);
    assert.ok(Math.abs(sx - (cx + ref[0])) < 1e-3 && Math.abs(sy - (cy + ref[1])) < 1e-3, `pixel (${sx}, ${sy}) vs (${cx + ref[0]}, ${cy + ref[1]})`);
    assert.ok(Z / W >= -1 - 1e-9 && Z / W <= 1 + 1e-9, `depth ${Z / W} outside [−1, 1]`);
    const nearer = apply(m, [P[0] + 0.01 * view[6], P[1] + 0.01 * view[7], P[2] + 0.01 * view[8], 1]);
    assert.ok(nearer[2] / nearer[3] < Z / W, 'a nearer point must have smaller depth');
  }
});

check('fitCamera fits every box corner inside the free rectangle, tight on one axis', () => {
  for (let trial = 0; trial < 200; trial += 1) {
    const view = landscapeView((2 * rand() - 1) * Math.PI, 0.1 + 1.2 * rand());
    const distance = 12 + 20 * rand();
    const free = { left: 600 * rand(), top: 100 * rand(), width: 200 + 800 * rand(), height: 150 + 500 * rand() };
    const margin = 0.06;
    const { radiusPx, cx, cy } = fitCamera(view, distance, BOX, free, margin);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const x of BOX.x) for (const y of BOX.y) for (const z of BOX.z) {
      const [dx, dy] = projectPerspective(view, x, y, z, distance, radiusPx);
      minX = Math.min(minX, cx + dx); maxX = Math.max(maxX, cx + dx);
      minY = Math.min(minY, cy + dy); maxY = Math.max(maxY, cy + dy);
    }
    const mx = margin * free.width, my = margin * free.height;
    assert.ok(minX >= free.left + mx - 1e-6 && maxX <= free.left + free.width - mx + 1e-6, 'x extents outside the free rect');
    assert.ok(minY >= free.top + my - 1e-6 && maxY <= free.top + free.height - my + 1e-6, 'y extents outside the free rect');
    const tightX = Math.abs((maxX - minX) - free.width * (1 - 2 * margin)) < 1e-6;
    const tightY = Math.abs((maxY - minY) - free.height * (1 - 2 * margin)) < 1e-6;
    assert.ok(tightX || tightY, 'the fit must touch the margin on one axis');
  }
  assert.throws(() => fitCamera(landscapeView(0, 0.5), 20, BOX, { left: 0, top: 0, width: 0, height: 100 }), RangeError);
});

check('gridMesh: counts, corners and valid indices', () => {
  const { positions, indices } = gridMesh(5, 4, [-4.6, 4.6], [-3.2, 3.2]);
  assert.equal(positions.length, 2 * 5 * 4);
  assert.equal(indices.length, 6 * 4 * 3);
  assert.deepEqual([positions[0], positions[1]], [-4.6, -3.2].map(Math.fround));
  assert.deepEqual([positions.at(-2), positions.at(-1)], [4.6, 3.2].map(Math.fround));
  assert.ok(indices.every((i) => i < 20));
  assert.throws(() => gridMesh(1, 4, [-1, 1], [-1, 1]), RangeError);
});

check('quality: p90, the ladder (full → half mesh at DPR 1 → frozen) and its settings', () => {
  assert.equal(percentile([5, 1, 3, 2, 4, 6, 7, 8, 9, 10], 0.9), 9);
  assert.equal(percentile([16], 0.9), 16);
  assert.equal(nextQuality(0, 12), 0, 'fast frames keep full quality');
  assert.equal(nextQuality(0, 25), 1, 'slow frames halve the mesh');
  assert.equal(nextQuality(1, 25), 2, 'still slow: freeze');
  assert.equal(nextQuality(2, 40), 2, 'frozen stays frozen');
  assert.equal(nextQuality(1, 10), 1, 'never climbs back mid-visit');
  const full = qualitySettings(0, [384, 224], 2);
  const half = qualitySettings(1, [384, 224], 2);
  assert.deepEqual(full, { mesh: [384, 224], dpr: 1.5, animate: true });
  assert.deepEqual(half, { mesh: [192, 112], dpr: 1, animate: true });
  assert.equal(qualitySettings(2, [384, 224], 2).animate, false);
  assert.equal(qualitySettings(0, [384, 224], 1).dpr, 1, 'DPR never exceeds the device');
});

check('quality after an entrance: too few frames (background tab, one jump frame) keep the level', () => {
  assert.equal(MIN_FRAME_SAMPLES, 8);
  assert.equal(qualityAfterEntrance(0, []), 0, 'no frames: no decision, no throw');
  assert.equal(qualityAfterEntrance(0, [3000]), 0, 'one frame after a hidden tab: keep');
  assert.equal(qualityAfterEntrance(0, [5, 40, 40, 40]), 0, 'a few slow frames are not evidence');
  const janky = [5, ...Array.from({ length: 40 }, (_, i) => (i % 10 < 7 ? 16.7 : 50))];
  assert.equal(qualityAfterEntrance(0, janky), 1, 'an uneven, over-budget entrance steps down');
  assert.equal(qualityAfterEntrance(1, janky), 2, 'still janky: freeze');
  assert.equal(qualityAfterEntrance(0, [5, ...Array(48).fill(33.3)]), 0, 'a steady 30 Hz cap (iOS Low Power Mode) is not slowness');
  assert.equal(qualityAfterEntrance(0, [5, ...Array(30).fill(40)]), 0, 'a steady cadence keeps quality (no jank to remove)');
  assert.equal(qualityAfterEntrance(0, [5, ...Array(12).fill(140)]), 1, 'a steady 7 fps entrance is a slow device, not a display cap');
  assert.equal(qualityAfterEntrance(0, [5, ...Array.from({ length: 40 }, (_, i) => (i % 2 ? 33.3 : 66.7))]), 1, 'a 30 Hz device dropping frames steps down');
  assert.equal(qualityAfterEntrance(0, [5, ...Array(90).fill(16.7)]), 0, 'a 60 Hz entrance keeps full quality');
  assert.equal(qualityAfterEntrance(0, [500, ...Array(30).fill(16)]), 0, 'the first interval (setup) is ignored');
});

check('scroll ratchet: never lowers loss, starts at its baseline, caps at 30%, smoothstep ends', () => {
  const H = 500;
  assert.equal(MAX_LOSS, 0.3);
  assert.equal(nextLoss(0, 0, 0, H), 0, 'no scroll, no loss');
  assert.equal(nextLoss(0.2, 0, 0, H), 0.2, 'scrolling back never lowers loss');
  assert.equal(nextLoss(0, 0.6 * H, 0, H), 0.3, 'full ramp reaches the cap');
  assert.equal(nextLoss(0, 10 * H, 0, H), 0.3, 'capped');
  assert.equal(nextLoss(0, 400, 400, H), 0, 'the ramp starts from its baseline');
  assert.ok(Math.abs(nextLoss(0, 0.3 * H, 0, H) - 0.15) < 1e-12, 'smoothstep(1/2) = 1/2');
  let last = 0;
  for (let y = 0; y <= 0.6 * H; y += 7) {
    const v = nextLoss(0, y, 0, H);
    assert.ok(v >= last - 1e-15, 'monotone in scroll');
    last = v;
  }
});

check('route figures: presets, dynamics and exact captions', () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(ROUTE_FIGURES).map(([k, v]) => [k, [v.preset, v.dynamics]])),
    {
      research: ['research', 'rotate'],
      publications: ['publications', 'spiral'],
      outreach: ['outreach', 'rotate'],
      cv: ['cv', 'rotate'],
      contact: ['contact', 'rotate'],
      notFound: ['notFound', 'rotate'],
    },
  );
  assert.equal(ROUTE_FIGURES.research.caption, "Compass state: four coherent states at once. The checkerboard at its center is interference finer than the vacuum’s width.");
  assert.equal(ROUTE_FIGURES.publications.caption, 'Coherent state under free evolution and photon loss: the peak spirals toward the origin but keeps its shape, then a fresh state is prepared.');
  assert.equal(ROUTE_FIGURES.outreach.caption, 'Six-component cat state: six coherent states on a circle, with interference between every pair.');
  assert.equal(ROUTE_FIGURES.cv.caption, 'Coherent state under free evolution, which rotates it in phase space. The motion is unitary, so it can always\u00a0run\u00a0backward.');
  assert.equal(ROUTE_FIGURES.contact.caption, 'Squeezed vacuum: less noise than the vacuum in one quadrature, paid for with more in the other.');
  assert.equal(ROUTE_FIGURES.notFound.caption, 'Odd cat state $|α⟩ − |−α⟩$. At the center $W = −1/π$, the most negative value a Wigner function can take.');
  for (const v of Object.values(ROUTE_FIGURES)) assert.ok(!/scroll/i.test(v.caption), 'captions never promise scroll behaviour');
  // The homepage figure keeps its coral (negative) fringes at every loss scrolling reaches (up to
  // MAX_LOSS): V = e^{−2.4} ≈ 0.091 still exceeds e^{−2ηα²}, so W < 0 somewhere on the p axis.
  let minW = Infinity;
  for (let p = 0; p <= 3; p += 0.01) minW = Math.min(minW, catWigner(0, p, 2, 1 - MAX_LOSS));
  assert.ok(minW < 0, `negative region at 30% loss: min W(0, p) = ${minW}`);
});

check('time evolution: free rotation turns once per period; the loss loop is continuous and closes', () => {
  const T = EVOLVE_PERIOD_MS;
  assert.deepEqual(evolveParams('rotate', 0), { theta: 0 }, 'rests at θ = 0');
  assert.ok(Math.abs(evolveParams('rotate', T / 4).theta - Math.PI / 2) < 1e-12, 'a quarter period is a quarter turn');
  for (const t of [0, 1234.5, T / 3, 0.99 * T]) {
    assert.ok(Math.abs(evolveParams('rotate', t + T).theta - evolveParams('rotate', t).theta) < 1e-9, 'periodic in T');
    assert.ok(evolveParams('rotate', t).theta >= 0 && evolveParams('rotate', t).theta < 2 * Math.PI);
  }
  // The spiral: coherent amplitude A = amp·√η (states.mjs step 3), continuous everywhere.
  const A = (/** @type {number} */ t) => { const q = evolveParams('spiral', t); return (q.amp ?? 1) * Math.sqrt(q.eta ?? 1); };
  const cycle = SPIRAL.decayMs + SPIRAL.prepareMs;
  assert.ok(Math.abs(A(0) - 1) < 1e-12, 'starts fully prepared');
  assert.ok(Math.abs(A(SPIRAL.decayMs - 1e-6) - A(SPIRAL.decayMs)) < 1e-6, 'same state on both sides of the switch');
  assert.ok(Math.abs(A(cycle - 1e-6) - A(cycle)) < 1e-6, 'the loop closes');
  let last = Infinity;
  for (let t = 0; t < SPIRAL.decayMs; t += 97) {
    const q = evolveParams('spiral', t);
    assert.ok((q.eta ?? 1) <= last + 1e-15 && (q.eta ?? 1) >= SPIRAL.etaEnd - 1e-12, 'loss only rises during the decay');
    last = q.eta ?? 1;
  }
  for (let t = SPIRAL.decayMs; t < cycle; t += 53) assert.equal(evolveParams('spiral', t).eta, 1, 'a fresh state has no loss');
  assert.ok(Math.abs(evolveParams('spiral', 5000).theta - evolveParams('rotate', 5000).theta) < 1e-12, 'the spiral turns at the same rate');
  assert.deepEqual(restParams('contact'), { r: 0.25 }, 'already squeezed at rest, as the caption says');
  for (const id of ['home', 'research', 'publications', 'outreach', 'cv', 'notFound']) assert.deepEqual(restParams(/** @type {any} */ (id)), {});
});

if (failed) {
  console.log(`[FAIL] verify-stage: ${failed} failed, ${passed} passed`);
  process.exitCode = 1;
} else {
  console.log(`[done] verify-stage: ${passed} checks passed`);
}
