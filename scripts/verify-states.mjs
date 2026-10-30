// @ts-check
/**
 * Verify lib/physics/states.mjs, the general engine behind every figure
 * (derivation steps 1–5 in its header).
 *
 *   |ψ⟩ = Σ_j c_j |β_j⟩,   𝒩 = Σ_{j,k} c_j c_k* ⟨β_k|β_j⟩
 *   W(z; η) = (1/(π𝒩)) Σ_{j,k} c_j c_k* ⟨β_k|β_j⟩ exp[−2(z − √η β_j)(z* − √η β_k*)]
 *   Gaussian unitaries: W′(x, p) = W(M⁻¹(x, p)), det M = 1.
 *
 * Checks: overlaps; agreement with the closed-form cat (lib/physics/wigner.mjs);
 * rotation of β equals rotation of phase space; squeezed vacuum is a
 * minimum-uncertainty state; loss slides a coherent state without squeezing
 * it; every preset is normalized, bounded and well conditioned.
 */

import assert from 'node:assert/strict';

import { catWigner } from '../lib/physics/wigner.mjs';
import {
  overlap,
  normSuperposition,
  wignerSuperposition,
  wignerGaussian,
  rotate,
  rotationMatrix,
  squeezeMatrix,
  PRESETS,
  presetWigner,
} from '../lib/physics/states.mjs';

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

/** Trapezoid rule on [−L, L]² (spectrally accurate for these integrands). */
function integrate(/** @type {(x: number, p: number) => number} */ f, L = 8, h = 0.05) {
  const n = Math.round((2 * L) / h);
  let sum = 0;
  for (let i = 0; i <= n; i += 1) {
    const x = -L + i * h;
    const wx = i === 0 || i === n ? 0.5 : 1;
    for (let j = 0; j <= n; j += 1) {
      const p = -L + j * h;
      sum += wx * (j === 0 || j === n ? 0.5 : 1) * f(x, p);
    }
  }
  return sum * h * h;
}

/** Max |f| and max |f − g| over a grid on [−5, 5]². */
function gridMax(/** @type {(x: number, p: number) => number} */ f, /** @type {(x: number, p: number) => number} */ g = () => 0) {
  let m = 0;
  for (let x = -5; x <= 5; x += 0.2) for (let p = -5; p <= 5; p += 0.2) m = Math.max(m, Math.abs(f(x, p) - g(x, p)));
  return m;
}

const C = (/** @type {number} */ re, im = 0) => ({ re, im });
const cat = (/** @type {number} */ a, /** @type {number} */ s) => [{ c: C(1), beta: C(a) }, { c: C(s), beta: C(-a) }];

check('overlap: ⟨β|β⟩ = 1 and |⟨γ|β⟩|² = exp(−|γ − β|²)', () => {
  const pairs = [[C(0.3, -1.2), C(-0.7, 0.4)], [C(2, 0), C(-2, 0)], [C(1.1, 2.2), C(1.1, 2.2)]];
  for (const [g, b] of pairs) {
    const o = overlap(g, b);
    const d2 = (g.re - b.re) ** 2 + (g.im - b.im) ** 2;
    assert.ok(Math.abs(o.re * o.re + o.im * o.im - Math.exp(-d2)) < 1e-14, JSON.stringify([g, b]));
  }
  const self = overlap(C(0.8, -0.3), C(0.8, -0.3));
  assert.ok(Math.abs(self.re - 1) < 1e-15 && Math.abs(self.im) < 1e-15);
});

check('general engine equals the closed-form cat (both parities, η = 1, 0.8) to 1e-12', () => {
  for (const s of [1, -1]) for (const eta of [1, 0.8]) {
    const d = gridMax((x, p) => wignerSuperposition(x, p, cat(2, s), eta), (x, p) => catWigner(x, p, 2, eta, s));
    assert.ok(d < 1e-12, `s=${s} η=${eta}: max diff ${d}`);
  }
});

check('rotating β by e^{−iθ} equals rotating phase space by M(θ)', () => {
  const comps = [{ c: C(1), beta: C(1.5, 0.5) }, { c: C(0.5, -0.3), beta: C(-1, 1) }];
  for (const theta of [0.4, 1.7, Math.PI]) {
    const M = rotationMatrix(theta);
    const det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
    const inv = [[M[1][1] / det, -M[0][1] / det], [-M[1][0] / det, M[0][0] / det]];
    const d = gridMax(
      (x, p) => wignerSuperposition(x, p, rotate(comps, theta)),
      (x, p) => wignerSuperposition(inv[0][0] * x + inv[0][1] * p, inv[1][0] * x + inv[1][1] * p, comps),
    );
    assert.ok(d < 1e-12, `θ=${theta}: ${d}`);
  }
});

check('Gaussian maps have det M = 1; wignerGaussian rejects others', () => {
  for (const M of [squeezeMatrix(0.5), rotationMatrix(0.9)]) {
    assert.ok(Math.abs(M[0][0] * M[1][1] - M[0][1] * M[1][0] - 1) < 1e-15);
  }
  assert.throws(() => wignerGaussian(0, 0, [[2, 0], [0, 1]]), RangeError);
});

check('squeezed vacuum: normalized, Δx·Δp = 1/2, peak 1/π, closed form', () => {
  for (const r of [0, 0.25, 0.5]) {
    const M = squeezeMatrix(r);
    const w = (/** @type {number} */ x, /** @type {number} */ p) => wignerGaussian(x, p, M);
    assert.ok(Math.abs(integrate(w) - 1) < 1e-9, `r=${r} norm`);
    const vx = integrate((x, p) => x * x * w(x, p));
    const vp = integrate((x, p) => p * p * w(x, p));
    assert.ok(Math.abs(vx - Math.exp(-2 * r) / 2) < 1e-9 && Math.abs(vp - Math.exp(2 * r) / 2) < 1e-9, `r=${r} variances`);
    assert.ok(Math.abs(Math.sqrt(vx * vp) - 0.5) < 1e-9, `r=${r} uncertainty`);
    assert.ok(Math.abs(w(0, 0) - 1 / Math.PI) < 1e-15);
    const closed = (/** @type {number} */ x, /** @type {number} */ p) => Math.exp(-Math.exp(2 * r) * x * x - Math.exp(-2 * r) * p * p) / Math.PI;
    assert.ok(gridMax(w, closed) < 1e-15, `r=${r} closed form`);
  }
});

check('loss slides a coherent state to √(2η)·β without squeezing it (never via M)', () => {
  const comps = [{ c: C(1), beta: C(2) }];
  for (const eta of [1, 0.85, 0.7]) {
    const w = (/** @type {number} */ x, /** @type {number} */ p) => wignerSuperposition(x, p, comps, eta);
    const mx = integrate((x, p) => x * w(x, p));
    const vx = integrate((x, p) => (x - mx) ** 2 * w(x, p));
    assert.ok(Math.abs(mx - Math.sqrt(2 * eta) * 2) < 1e-9, `η=${eta}: ⟨x⟩ = ${mx}`);
    assert.ok(Math.abs(vx - 0.5) < 1e-9, `η=${eta}: Var(x) = ${vx} (vacuum width is 1/2)`);
  }
  assert.ok(Math.abs(presetWigner('publications', 2.37, 0, { eta: 0.7 }) - wignerSuperposition(2.37, 0, comps, 0.7)) < 1e-15);
});

check('every preset: 𝒩 > 1e-3, ∫∫W = 1 ± 1e-6, |W| ≤ 1/π at both ends of its parameter', () => {
  /** @type {Record<string, Array<Record<string, number>>>} */
  const ends = {
    home: [{ eta: 1 }, { eta: 0.7 }],
    research: [{ eta: 1 }, { eta: 0.7 }],
    publications: [{ eta: 1 }, { eta: 0.7 }],
    outreach: [{ eta: 1 }, { eta: 0.7 }],
    cv: [{ theta: 0 }, { theta: 2.4 }],
    contact: [{ r: 0 }, { r: 0.5 }],
    notFound: [{ eta: 1 }],
  };
  for (const [id, preset] of Object.entries(PRESETS)) {
    if (preset.kind === 'superposition') assert.ok(normSuperposition(preset.comps) > 1e-3, `${id}: 𝒩`);
    for (const params of ends[id]) {
      const w = (/** @type {number} */ x, /** @type {number} */ p) => presetWigner(/** @type {any} */ (id), x, p, params);
      const total = integrate(w);
      assert.ok(Math.abs(total - 1) < 1e-6, `${id} ${JSON.stringify(params)}: ∫∫W = ${total}`);
      const m = gridMax(w);
      assert.ok(m <= 1 / Math.PI + 1e-12, `${id} ${JSON.stringify(params)}: max|W| = ${m}`);
    }
  }
});

check('free evolution: every preset turns rigidly, W_θ(M(θ)z) = W₀(z) to 1e-12; W(0,0) fixed; 2π is the identity', () => {
  /** @type {Record<string, Record<string, number>>} */
  const base = { home: { eta: 0.85 }, publications: { eta: 0.3 }, contact: { r: 0.25 } };
  for (const id of Object.keys(PRESETS)) {
    const b0 = base[id] ?? {};
    const w = (/** @type {number} */ x, /** @type {number} */ p, /** @type {Record<string, number>} */ q) => presetWigner(/** @type {any} */ (id), x, p, { ...b0, ...q });
    for (const theta of [0.7, Math.PI / 2, 2.9, 4.4]) {
      const M = rotationMatrix(theta);
      for (const [x, p] of [[0.3, -1.1], [1.7, 0.4], [-2.2, 1.9], [0, 0]]) {
        const rotated = w(M[0][0] * x + M[0][1] * p, M[1][0] * x + M[1][1] * p, { theta });
        assert.ok(Math.abs(rotated - w(x, p, {})) < 1e-12, `${id} θ = ${theta} at (${x}, ${p}): ${rotated} vs ${w(x, p, {})}`);
      }
    }
    assert.ok(Math.abs(w(1.1, -0.6, { theta: 2 * Math.PI }) - w(1.1, -0.6, {})) < 1e-12, `${id}: a full turn is the identity`);
  }
  // The turning squeezed vacuum stays a normalized Gaussian state with |W| ≤ 1/π.
  const sq = (/** @type {number} */ x, /** @type {number} */ p) => presetWigner('contact', x, p, { r: 0.5, theta: 1 });
  assert.ok(Math.abs(integrate(sq) - 1) < 1e-6, 'rotated squeezed vacuum: ∫∫W = 1');
  assert.ok(gridMax(sq) <= 1 / Math.PI + 1e-12, 'rotated squeezed vacuum: |W| ≤ 1/π');
});

check('404 preset is the odd cat: W(0,0) = −1/π', () => {
  assert.ok(Math.abs(presetWigner('notFound', 0, 0) + 1 / Math.PI) < 1e-12);
});

const ms = performance.now() - t0;
if (failed) {
  console.log(`[FAIL] verify-states: ${failed} failed, ${passed} passed (${ms.toFixed(0)} ms)`);
  process.exitCode = 1;
} else {
  console.log(`[done] verify-states: ${passed} checks passed (${ms.toFixed(0)} ms)`);
}
