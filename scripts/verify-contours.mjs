// @ts-check
/**
 * Verify lib/physics/contours.mjs (marching squares for the SVG fallback).
 * Exact answers: a linear field f = x has the straight contour x = c; a
 * radial field f = x² + p² has the circle of radius √c, closed; and points
 * on every traced contour satisfy f = c to interpolation accuracy.
 */

import assert from 'node:assert/strict';

import { contourLines } from '../lib/physics/contours.mjs';

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

/** Sample f on an n × n grid over [−L, L]². @param {(x: number, p: number) => number} f */
function grid(f, n = 81, L = 2) {
  const values = new Float64Array(n * n);
  for (let j = 0; j < n; j += 1) for (let i = 0; i < n; i += 1) {
    values[j * n + i] = f(-L + (2 * L * i) / (n - 1), -L + (2 * L * j) / (n - 1));
  }
  return { values, nx: n, np: n, xRange: /** @type {[number, number]} */ ([-L, L]), pRange: /** @type {[number, number]} */ ([-L, L]) };
}

check('linear field f = x: the contour at c is the straight line x = c', () => {
  const lines = contourLines(grid((x) => x), 0.37);
  assert.ok(lines.length >= 1);
  for (const line of lines) for (const [x] of line) assert.ok(Math.abs(x - 0.37) < 1e-9, `x = ${x}`);
});

check('radial field f = x² + p²: the contour at c is one closed circle of radius √c', () => {
  const lines = contourLines(grid((x, p) => x * x + p * p), 1.21);
  assert.equal(lines.length, 1, `expected one joined loop, got ${lines.length}`);
  const loop = lines[0];
  const first = loop[0];
  const last = loop[loop.length - 1];
  assert.ok(Math.hypot(first[0] - last[0], first[1] - last[1]) < 1e-9, 'the loop must close');
  for (const [x, p] of loop) assert.ok(Math.abs(Math.hypot(x, p) - 1.1) < 2e-3, `radius ${Math.hypot(x, p)}`);
});

check('levels outside the field’s range produce no contours', () => {
  assert.deepEqual(contourLines(grid((x, p) => x * x + p * p), 99), []);
});

if (failed) {
  console.log(`[FAIL] verify-contours: ${failed} failed, ${passed} passed`);
  process.exitCode = 1;
} else {
  console.log(`[done] verify-contours: ${passed} checks passed`);
}
