// @ts-check
/**
 * Camera checks for the 3D figures (lib/physics/cameras.mjs). Ported from the
 * owner's Clemson Quantum Club site (scripts/verify-cameras.mjs, checks 6 and
 * 8); the club's scene-specific cameras stay there.
 *
 * 1. landscapeView: a proper rotation (orthonormal rows, det +1) equal to
 *    Rx(e) Ry(yaw), the identity at rest, height up the screen, the camera
 *    above the ground plane for e > 0, positive yaw counterclockwise as seen
 *    from above; RangeError for non-finite angles.
 * 2. projectPerspective: scale 1 at depth 0, screen y down, the orthographic
 *    limit, nearer points larger by exactly D/(D − h), and RangeError at or
 *    behind the camera or for invalid inputs.
 * Random cases come from a seeded PRNG (mulberry32); the seed is printed.
 */

import assert from 'node:assert/strict';

import { landscapeView, projectPerspective } from '../lib/physics/cameras.mjs';

const TOL = 1e-12;
const SEED = 20261006;
const TRIALS = 200;
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

/** mulberry32: small seedable PRNG in [0, 1) (test inputs only). @param {number} seed */
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
console.log(`[setup] cameras: seed ${SEED}, ${TRIALS} random cases per check`);

/** @typedef {[number, number, number]} V3 */
/** @param {V3} a @param {V3} b */
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
/** @param {V3} a @param {V3} b @returns {V3} */
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/** @param {ArrayLike<number>} m @param {number} r @returns {V3} */
const viewRow = (m, r) => [m[3 * r], m[3 * r + 1], m[3 * r + 2]];
/** @param {V3} p @param {number} s @param {V3} v @returns {V3} */
const axpy = (p, s, v) => [p[0] + s * v[0], p[1] + s * v[1], p[2] + s * v[2]];
/** @param {number} r @returns {V3} */
const randomInBall = (r) => {
  for (;;) {
    /** @type {V3} */
    const p = [2 * rand() - 1, 2 * rand() - 1, 2 * rand() - 1];
    if (dot(p, p) <= 1) return [r * p[0], r * p[1], r * p[2]];
  }
};
/** @param {number[][]} A @param {number[][]} B */
const matMul = (A, B) => A.map((row) => [0, 1, 2].map((j) => row[0] * B[0][j] + row[1] * B[1][j] + row[2] * B[2][j]));
/** @param {number} e */
const rotX = (e) => [[1, 0, 0], [0, Math.cos(e), -Math.sin(e)], [0, Math.sin(e), Math.cos(e)]];
/** @param {number} y */
const rotY = (y) => [[Math.cos(y), 0, Math.sin(y)], [0, 1, 0], [-Math.sin(y), 0, Math.cos(y)]];

check('landscapeView: proper rotation = Rx(e)Ry(yaw), identity at rest, height up, camera above, yaw counterclockwise', () => {
  const identity = landscapeView(0, 0);
  for (let i = 0; i < 9; i += 1) assert.ok(identity[i] === (i % 4 === 0 ? 1 : 0), `landscapeView(0, 0) entry ${i} = ${identity[i]}`);
  for (let trial = 0; trial < TRIALS; trial += 1) {
    const yaw = (2 * rand() - 1) * Math.PI;
    const elevation = (2 * rand() - 1) * (Math.PI / 2 - 0.01);
    const m = landscapeView(yaw, elevation);
    const [right, up, toward] = [viewRow(m, 0), viewRow(m, 1), viewRow(m, 2)];
    for (const v of [right, up, toward]) assert.ok(Math.abs(dot(v, v) - 1) < TOL, 'rows must be unit length');
    assert.ok(Math.abs(dot(right, up)) < TOL && Math.abs(dot(right, toward)) < TOL && Math.abs(dot(up, toward)) < TOL, 'rows must be orthogonal');
    assert.ok(Math.abs(dot(cross(right, up), toward) - 1) < TOL, 'det must be +1 (a mirror if −1)');
    const ref = matMul(rotX(elevation), rotY(yaw));
    for (let i = 0; i < 9; i += 1) assert.ok(Math.abs(m[i] - ref[Math.floor(i / 3)][i % 3]) < TOL, `≠ Rx(e)Ry(yaw) at entry ${i}`);
    assert.ok(up[1] > 0, 'height must point up the screen');
    if (elevation > 0) assert.ok(toward[1] > 0, 'the camera must be above the ground plane');
    const top = landscapeView(yaw, Math.PI / 2);
    const angle = Math.atan2(dot(viewRow(top, 1), [1, 0, 0]), dot(viewRow(top, 0), [1, 0, 0]));
    assert.ok(Math.abs(angle - yaw) < TOL, `seen from above, +x at ${angle} rad, expected ${yaw}`);
  }
  for (const [y, e] of [[Number.NaN, 0], [0, Infinity]]) assert.throws(() => landscapeView(y, e), RangeError);
});

check('projectPerspective: scale 1 at depth 0, y down, orthographic limit, nearer larger, RangeError behind', () => {
  const ORTHO_DISTANCE = 1e9;
  const TOL_ORTHO = 1e-9;
  const out = new Float64Array(4);
  for (let trial = 0; trial < TRIALS; trial += 1) {
    const view = landscapeView((2 * rand() - 1) * Math.PI, 0.05 + 1.5 * rand());
    const [right, up, toward] = [viewRow(view, 0), viewRow(view, 1), viewRow(view, 2)];
    const R = 50 + 400 * rand();
    const D = 2 + 5 * rand();
    const alpha = 2 * rand() - 1;
    const beta = 2 * rand() - 1;
    const p0 = axpy(axpy([0, 0, 0], alpha, right), beta, up);
    projectPerspective(view, p0[0], p0[1], p0[2], D, R, out);
    assert.ok(Math.abs(out[3] - 1) < TOL && Math.abs(out[2]) < TOL, 'depth 0 keeps scale 1');
    assert.ok(Math.abs(out[0] - R * alpha) < TOL * R && Math.abs(out[1] + R * beta) < TOL * R, 'offset must be R(u, −v)');
    const p = randomInBall(0.5);
    projectPerspective(view, p[0], p[1], p[2], ORTHO_DISTANCE, R, out);
    const size = R * Math.hypot(p[0], p[1], p[2]);
    assert.ok(Math.abs(out[0] - R * dot(right, p)) <= TOL_ORTHO * size && Math.abs(out[1] + R * dot(up, p)) <= TOL_ORTHO * size, 'orthographic limit');
    const h = 0.9 * D * rand();
    const near = projectPerspective(view, ...axpy(p0, h, toward), D, R);
    const far = projectPerspective(view, ...axpy(p0, -h, toward), D, R);
    assert.ok(Math.abs(near[3] - D / (D - h)) < TOL * near[3] && Math.abs(far[3] - D / (D + h)) < TOL, 'scales D/(D ∓ h)');
  }
  const identity = landscapeView(0, 0);
  assert.ok(projectPerspective(identity, 0, 0, 1.999, 2, 1)[3] > 1, 'a point just in front projects');
  assert.throws(() => projectPerspective(identity, 0, 0, 2, 2, 1), RangeError);
  assert.throws(() => projectPerspective(identity, 0.3, 0.1, 3, 2, 1), RangeError);
  assert.throws(() => projectPerspective(identity, Number.NaN, 0, 0, 2, 1), RangeError);
  for (const d of [0, -1, Number.NaN, Infinity]) assert.throws(() => projectPerspective(identity, 0, 0, 0, d, 1), RangeError);
  for (const r of [-2, Number.NaN, Infinity]) assert.throws(() => projectPerspective(identity, 0, 0, 0, 2, r), RangeError);
  assert.throws(() => projectPerspective(new Float64Array(8), 0, 0, 0, 2, 1), RangeError);
});

if (failed) {
  console.log(`[FAIL] verify-cameras: ${failed} failed, ${passed} passed`);
  process.exitCode = 1;
} else {
  console.log(`[done] verify-cameras: ${passed} checks passed`);
}
