// @ts-check
/**
 * General engine: exact Wigner functions for every figure on the site.
 *
 * Conventions: ħ = 1, a = (x + ip)/√2, z = (x + ip)/√2, vacuum
 * W₀ = e^{−x²−p²}/π, ∫∫W dx dp = 1 (same as lib/physics/wigner.mjs).
 *
 * Derivation (Gerry & Knight, Introductory Quantum Optics (2005) §3.7, §7).
 * 1. Coherent overlap ⟨γ|β⟩ = exp(−|γ|²/2 − |β|²/2 + γ*β).
 * 2. The Wigner function of |a⟩⟨b| is (1/π)⟨b|a⟩ exp[−2(z − a)(z* − b*)].
 *    A superposition |ψ⟩ = Σ_j c_j|β_j⟩ has ρ = Σ_{j,k} c_j c_k* |β_j⟩⟨β_k| and
 *    norm 𝒩 = ⟨ψ|ψ⟩ = Σ_{j,k} c_j c_k* ⟨β_k|β_j⟩ (unnormalized c_j allowed), so
 *      W(z) = (1/(π𝒩)) Σ_{j,k} c_j c_k* ⟨β_k|β_j⟩ exp[−2(z − β_j)(z* − β_k*)].
 * 3. Photon loss with surviving fraction η maps |β⟩⟨γ| → ⟨γ|β⟩^{1−η}|√ηβ⟩⟨√ηγ|.
 *    Step 2's overlap for the shrunken pair is ⟨√ηβ_k|√ηβ_j⟩ = ⟨β_k|β_j⟩^η, so
 *    the product is the original overlap and only the centers move:
 *      W(z; η) = (1/(π𝒩)) Σ_{j,k} c_j c_k* ⟨β_k|β_j⟩ exp[−2(z − √ηβ_j)(z* − √ηβ_k*)].
 *    𝒩 is unchanged (the channel preserves the trace). For a single coherent
 *    state this is |√ηβ⟩: it dims and slides inward with the vacuum width.
 * 4. Gaussian unitaries act on phase space linearly: W′(x, p) = W(M⁻¹(x, p))
 *    with det M = 1 (area preserving). Free rotation e^{−iθa†a} sends
 *    β → βe^{−iθ}, i.e. M(θ) = [[cos θ, sin θ], [−sin θ, cos θ]]; squeezing
 *    x by e^{−r} is M = diag(e^{−r}, e^{r}), giving the squeezed vacuum
 *    W = (1/π) exp(−e^{2r}x² − e^{−2r}p²) with Δx·Δp = 1/2 for every r.
 * 5. Every figure evolves freely and nonstop: e^{−iθa†a} with θ = ωt rotates
 *    W rigidly about the origin, W_θ(z) = W(M(θ)⁻¹z). For a superposition this
 *    is β_j → β_j e^{−iθ} (step 4); for the squeezed vacuum the combined map is
 *    M = M(θ)·S(r), so the narrow quadrature turns with θ. Loss commutes with
 *    the rotation (both act on the amplitudes), so η and θ combine exactly.
 * Numerics: each term's overlap and Gaussian are combined into one complex
 * exponent before exponentiating, so no huge and tiny factors multiply.
 * Checks: scripts/verify-states.mjs (agreement with the closed-form cat,
 * rotation both ways, squeezed-vacuum moments, loss without squeezing, every
 * preset normalized and bounded by 1/π).
 */

/** @typedef {{ re: number, im: number }} Complex */
/** @typedef {{ c: Complex, beta: Complex }} Component */
/** @typedef {[[number, number], [number, number]]} Mat2 */
/**
 * @typedef {{ kind: 'superposition', comps: Component[] }
 *   | { kind: 'squeezedVacuum' }} Preset
 */
/** @typedef {'home' | 'research' | 'publications' | 'outreach' | 'cv' | 'contact' | 'notFound'} PresetId */

const SQRT1_2 = Math.SQRT1_2;

/** @param {number} re @param {number} [im] @returns {Complex} */
const complex = (re, im = 0) => ({ re, im });

/**
 * Coherent-state overlap ⟨γ|β⟩ (derivation step 1).
 * @param {Complex} gamma
 * @param {Complex} beta
 * @returns {Complex}
 */
export function overlap(gamma, beta) {
  const logRe = -(gamma.re ** 2 + gamma.im ** 2) / 2 - (beta.re ** 2 + beta.im ** 2) / 2 + (gamma.re * beta.re + gamma.im * beta.im);
  const logIm = gamma.re * beta.im - gamma.im * beta.re;
  const mag = Math.exp(logRe);
  return complex(mag * Math.cos(logIm), mag * Math.sin(logIm));
}

/**
 * Norm 𝒩 = Σ_{j,k} c_j c_k* ⟨β_k|β_j⟩ of an unnormalized superposition (step 2).
 * @param {Component[]} comps
 * @returns {number} 𝒩 > 0 for any nonzero state.
 */
export function normSuperposition(comps) {
  let sum = 0;
  for (const j of comps) for (const k of comps) {
    const o = overlap(k.beta, j.beta);
    const cRe = j.c.re * k.c.re + j.c.im * k.c.im;
    const cIm = j.c.im * k.c.re - j.c.re * k.c.im;
    sum += cRe * o.re - cIm * o.im;
  }
  return sum;
}

/**
 * Wigner function of Σ_j c_j|β_j⟩ after photon loss η (steps 2–3).
 *
 * @param {number} x Position quadrature.
 * @param {number} p Momentum quadrature.
 * @param {Component[]} comps Coefficients and coherent amplitudes (any normalization).
 * @param {number} [eta=1] Surviving fraction of the light, 0 ≤ η ≤ 1.
 * @returns {number} W(x, p; η), real, |W| ≤ 1/π, ∫∫W = 1.
 */
export function wignerSuperposition(x, p, comps, eta = 1) {
  const zRe = x * SQRT1_2;
  const zIm = p * SQRT1_2;
  const s = Math.sqrt(eta);
  let sum = 0;
  for (const j of comps) {
    const ajRe = s * j.beta.re;
    const ajIm = s * j.beta.im;
    const uRe = zRe - ajRe; // u = z − √η β_j
    const uIm = zIm - ajIm;
    const bj2 = j.beta.re ** 2 + j.beta.im ** 2;
    for (const k of comps) {
      const vRe = zRe - s * k.beta.re; // v = z − √η β_k, so (z* − √η β_k*) = conj(v)
      const vIm = zIm - s * k.beta.im;
      // u · conj(v)
      const uvRe = uRe * vRe + uIm * vIm;
      const uvIm = uIm * vRe - uRe * vIm;
      // log⟨β_k|β_j⟩ = −|β_k|²/2 − |β_j|²/2 + β_k* β_j
      const bk2 = k.beta.re ** 2 + k.beta.im ** 2;
      const ovRe = -bk2 / 2 - bj2 / 2 + (k.beta.re * j.beta.re + k.beta.im * j.beta.im);
      const ovIm = k.beta.re * j.beta.im - k.beta.im * j.beta.re;
      // One combined exponent: log overlap − 2·u·conj(v)
      const eRe = ovRe - 2 * uvRe;
      const eIm = ovIm - 2 * uvIm;
      const mag = Math.exp(eRe);
      const tRe = mag * Math.cos(eIm);
      const tIm = mag * Math.sin(eIm);
      // c_j c_k*
      const cRe = j.c.re * k.c.re + j.c.im * k.c.im;
      const cIm = j.c.im * k.c.re - j.c.re * k.c.im;
      sum += cRe * tRe - cIm * tIm;
    }
  }
  return sum / (Math.PI * normSuperposition(comps));
}

/**
 * Free evolution e^{−iθa†a}: every amplitude rotates, β → βe^{−iθ} (step 4).
 * @param {Component[]} comps
 * @param {number} theta Phase θ in radians.
 * @returns {Component[]}
 */
export function rotate(comps, theta) {
  const c = Math.cos(theta);
  const sn = Math.sin(theta);
  return comps.map(({ c: coef, beta }) => ({
    c: coef,
    beta: complex(beta.re * c + beta.im * sn, beta.im * c - beta.re * sn),
  }));
}

/**
 * Phase-space matrix of free evolution, matching rotate(): (x, p) → M(θ)(x, p).
 * @param {number} theta
 * @returns {Mat2}
 */
export function rotationMatrix(theta) {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return [[c, s], [-s, c]];
}

/**
 * Phase-space matrix of x-squeezing by e^{−r} (det = 1).
 * @param {number} r Squeezing parameter, r ≥ 0 narrows x.
 * @returns {Mat2}
 */
export function squeezeMatrix(r) {
  return [[Math.exp(-r), 0], [0, Math.exp(r)]];
}

/**
 * 2 × 2 matrix product A·B (apply B first, then A).
 * @param {Mat2} A
 * @param {Mat2} B
 * @returns {Mat2}
 */
function mul2(A, B) {
  return [
    [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
    [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
  ];
}

/**
 * The vacuum transformed by an area-preserving map: W₀(M⁻¹(x, p)) (step 4).
 * @param {number} x
 * @param {number} p
 * @param {Mat2} M Phase-space matrix with det M = 1.
 * @returns {number}
 * @throws {RangeError} When |det M − 1| > 1e-9 (not a Gaussian unitary).
 */
export function wignerGaussian(x, p, M) {
  const det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
  if (Math.abs(det - 1) > 1e-9) throw new RangeError(`wignerGaussian: det M = ${det}, expected 1`);
  const xi = M[1][1] * x - M[0][1] * p;
  const pi = -M[1][0] * x + M[0][0] * p;
  return Math.exp(-xi * xi - pi * pi) / Math.PI;
}

/** @param {number} alpha @param {number} parity @returns {Component[]} */
const cat = (alpha, parity) => [
  { c: complex(1), beta: complex(alpha) },
  { c: complex(parity), beta: complex(-alpha) },
];

/**
 * n coherent states evenly spaced on a circle of radius α, starting at phase φ₀.
 * @param {number} n @param {number} alpha @param {number} [phase0] @returns {Component[]}
 */
const necklace = (n, alpha, phase0 = 0) =>
  Array.from({ length: n }, (_, k) => ({
    c: complex(1),
    beta: complex(alpha * Math.cos(phase0 + (2 * Math.PI * k) / n), alpha * Math.sin(phase0 + (2 * Math.PI * k) / n)),
  }));

/**
 * One exact state per route. Every state evolves freely (θ, step 5); the
 * publications figure also loses photons (η) on a loop, and the contact
 * figure is squeezed (r). Amplitudes are chosen so every lobe stays inside
 * the drawn window x ∈ [−4.6, 4.6], p ∈ [−3.2, 3.2] (lobe centers sit at
 * √2·β): the compass is turned by π/4 (lobes at (±2, ±2)), the necklace uses
 * α = 1.9, and the rotating coherent state |β| = 1.6. For research, outreach
 * and publications the lowest contour (W = 0.025/π) still reaches past that
 * window, so their static contour maps sample a wider one (ZOOM in
 * scripts/build-figures.mjs).
 * @type {Record<PresetId, Preset>}
 */
export const PRESETS = {
  home: { kind: 'superposition', comps: cat(2, 1) },
  research: { kind: 'superposition', comps: necklace(4, 2, Math.PI / 4) }, // compass state (Zurek 2001)
  publications: { kind: 'superposition', comps: [{ c: complex(1), beta: complex(2) }] },
  outreach: { kind: 'superposition', comps: necklace(6, 1.9) },
  cv: { kind: 'superposition', comps: [{ c: complex(1), beta: complex(1.6) }] },
  contact: { kind: 'squeezedVacuum' },
  notFound: { kind: 'superposition', comps: cat(2, -1) },
};

/**
 * W(x, p) of a route's preset at the given parameter values.
 * @param {PresetId} id
 * @param {number} x
 * @param {number} p
 * @param {{ eta?: number, theta?: number, r?: number }} [params]
 * @returns {number}
 */
export function presetWigner(id, x, p, params = {}) {
  const preset = PRESETS[id];
  const theta = params.theta ?? 0;
  if (preset.kind === 'squeezedVacuum') return wignerGaussian(x, p, mul2(rotationMatrix(theta), squeezeMatrix(params.r ?? 0)));
  return wignerSuperposition(x, p, rotate(preset.comps, theta), params.eta ?? 1);
}
