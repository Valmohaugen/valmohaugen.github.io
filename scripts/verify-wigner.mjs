// @ts-check
/**
 * Verify lib/physics/wigner.mjs against analytic results.
 *
 * Conventions: ħ = 1, a = (x + ip)/√2, vacuum W₀ = e^{−x²−p²}/π, ∫∫W = 1.
 * Even/odd cat N_s(|α⟩ + s|−α⟩), α > 0 real, after photon loss η:
 *   W_s = (N_s²/π)[e^{−(x−x_η)²−p²} + e^{−(x+x_η)²−p²} + 2s·V·e^{−x²−p²}cos(2x_η p)]
 *   x_η = √(2η)α,  V = exp(−2α²(1−η)),  N_s² = 1/[2(1 + s·e^{−2α²})].
 * Checks: normalization for every η; parity W_s(0,0) = s/π at η = 1; the
 * α → 0 limits (vacuum, Fock |1⟩) with their O(α²) rate; |W| ≤ 1/π; the
 * fringe factor equals fringeVisibility; golden negativity volumes.
 * References: Gerry & Knight, Introductory Quantum Optics (2005) §3.7, §7.
 */

import assert from 'node:assert/strict';

import { catWigner, fringeVisibility } from '../lib/physics/wigner.mjs';

let passed = 0;
let failed = 0;
const t0 = performance.now();
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

/** Trapezoid rule on [−L, L]²; spectrally accurate for these Gaussian integrands. */
function integrate(/** @type {(x: number, p: number) => number} */ f, L = 8, h = 0.05) {
  const n = Math.round((2 * L) / h);
  let sum = 0;
  for (let i = 0; i <= n; i += 1) {
    const x = -L + i * h;
    const wx = i === 0 || i === n ? 0.5 : 1;
    for (let j = 0; j <= n; j += 1) {
      const p = -L + j * h;
      const wp = j === 0 || j === n ? 0.5 : 1;
      sum += wx * wp * f(x, p);
    }
  }
  return sum * h * h;
}

/** Max |f − g| over a coarse grid on [−5, 5]². */
function maxDiff(/** @type {(x: number, p: number) => number} */ f, /** @type {(x: number, p: number) => number} */ g) {
  let m = 0;
  for (let x = -5; x <= 5; x += 0.25) for (let p = -5; p <= 5; p += 0.25) m = Math.max(m, Math.abs(f(x, p) - g(x, p)));
  return m;
}

const vacuum = (/** @type {number} */ x, /** @type {number} */ p) => Math.exp(-x * x - p * p) / Math.PI;
const fock1 = (/** @type {number} */ x, /** @type {number} */ p) => ((2 * (x * x + p * p) - 1) * Math.exp(-x * x - p * p)) / Math.PI;

check('fringeVisibility: V = exp(−2α²(1−η)), V(η = 1) = 1, V(α = 2, η = 0.95) = e^{−0.4}', () => {
  assert.equal(fringeVisibility(2, 1), 1);
  assert.ok(Math.abs(fringeVisibility(2, 0.95) - Math.exp(-0.4)) < 1e-15);
  assert.ok(Math.abs(fringeVisibility(0.5, 0.2) - Math.exp(-2 * 0.25 * 0.8)) < 1e-15);
});

check('normalization ∫∫W = 1 ± 1e-6 (α 0.5–3, both parities, η 1/0.85/0.7)', () => {
  for (const alpha of [0.5, 1, 2, 3]) for (const s of [1, -1]) for (const eta of [1, 0.85, 0.7]) {
    const total = integrate((x, p) => catWigner(x, p, alpha, eta, s));
    assert.ok(Math.abs(total - 1) < 1e-6, `α=${alpha} s=${s} η=${eta}: ∫∫W = ${total}`);
  }
});

check('parity at the origin: W_s(0,0) = s/π exactly, for every α (η = 1)', () => {
  for (const alpha of [0.3, 1, 2, 3]) for (const s of [1, -1]) {
    assert.ok(Math.abs(catWigner(0, 0, alpha, 1, s) - s / Math.PI) < 1e-12, `α=${alpha} s=${s}`);
  }
});

check('limit α → 0: even cat → vacuum, odd cat → Fock |1⟩, both with O(α²) corrections', () => {
  const errEven = (/** @type {number} */ a) => maxDiff((x, p) => catWigner(x, p, a, 1, 1), vacuum);
  const errOdd = (/** @type {number} */ a) => maxDiff((x, p) => catWigner(x, p, a, 1, -1), fock1);
  for (const a of [1e-2, 1e-3]) {
    assert.ok(errEven(a) <= 2 * a * a, `even α=${a}: ${errEven(a)}`);
    assert.ok(errOdd(a) <= 2 * a * a, `odd α=${a}: ${errOdd(a)}`);
  }
  const rate = errOdd(1e-2) / errOdd(1e-3);
  assert.ok(rate > 50 && rate < 200, `odd-cat error should scale as α² (ratio ≈ 100), got ${rate}`);
});

check('bounds: |W| ≤ 1/π everywhere', () => {
  for (const alpha of [0.5, 2, 3]) for (const s of [1, -1]) for (const eta of [1, 0.7]) {
    const m = maxDiff((x, p) => catWigner(x, p, alpha, eta, s), () => 0);
    assert.ok(m <= 1 / Math.PI + 1e-12, `α=${alpha} s=${s} η=${eta}: max|W| = ${m}`);
  }
});

check('the interference term at the origin carries exactly V = fringeVisibility(α, η)', () => {
  for (const [alpha, eta] of [[2, 1], [2, 0.95], [2, 0.8], [1, 0.5]]) {
    const n2 = 1 / (2 * (1 + Math.exp(-2 * alpha * alpha)));
    const xEta = Math.sqrt(2 * eta) * alpha;
    const v = ((Math.PI * catWigner(0, 0, alpha, eta, 1)) / n2 - 2 * Math.exp(-xEta * xEta)) / 2;
    assert.ok(Math.abs(v - fringeVisibility(alpha, eta)) < 1e-9, `α=${alpha} η=${eta}: ${v}`);
  }
});

check('golden negativity volume ½(∫∫|W| − 1) at α = 2: 0.2937 (η = 1), 0.0155 (η = 0.7)', () => {
  for (const [eta, golden] of [[1, 0.2937], [0.7, 0.0155]]) {
    const nv = 0.5 * (integrate((x, p) => Math.abs(catWigner(x, p, 2, eta, 1)), 8, 0.02) - 1);
    assert.ok(Math.abs(nv - golden) < 1e-3, `η=${eta}: ${nv}`);
  }
});

const ms = performance.now() - t0;
if (failed) {
  console.log(`[FAIL] verify-wigner: ${failed} failed, ${passed} passed (${ms.toFixed(0)} ms)`);
  process.exitCode = 1;
} else {
  console.log(`[done] verify-wigner: ${passed} checks passed (${ms.toFixed(0)} ms)`);
}
