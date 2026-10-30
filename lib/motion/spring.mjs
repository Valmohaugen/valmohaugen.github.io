// @ts-check
/**
 * Spring easing for the site's motion tokens: the step response of an
 * underdamped harmonic oscillator, sampled into a CSS `linear()` function so
 * settling motion overshoots and rings down like a real damped spring.
 *
 * Derivation. A unit-mass oscillator with natural angular frequency ω₀ and
 * damping ratio ζ obeys  x'' + 2ζω₀ x' + ω₀² x = ω₀²  (a unit step input).
 * With x(0) = 0 and x'(0) = 0, the characteristic roots are
 * −ζω₀ ± iω_d with ω_d = ω₀√(1 − ζ²) (underdamped: 0 < ζ < 1), giving
 *
 *   x(t) = 1 − e^{−ζω₀t} [cos(ω_d t) + (ζω₀/ω_d) sin(ω_d t)],   ω₀ = 2π f₀.
 *
 * Check: x(0) = 1 − [1 + 0] = 0, and x(t) → 1 as t → ∞. The first peak is at
 * t_p = π/ω_d with x(t_p) = 1 + exp(−ζπ/√(1 − ζ²)).
 * Reference: Ogata, Modern Control Engineering, 5th ed., §5-3.
 *
 * Sampling. Evaluate x at t_k = (k / samples) · (durationMs / 1000) for
 * k = 0 … samples, print each value with 4 decimals, and force the final value
 * to exactly 1 so the animation ends on its target (the spring has not fully
 * settled at t = durationMs). CSS spaces the values evenly in time.
 *
 * Verified by scripts/verify-motion.mjs (closed form at every sample, the
 * analytic overshoot, the ζ → 1⁻ limit, invalid input, and the token in
 * assets/css/tokens.css).
 *
 * @param {number} zeta Damping ratio ζ, 0 < ζ < 1 (underdamped).
 * @param {number} f0 Natural frequency f₀ in Hz, > 0.
 * @param {number} durationMs Animation length in milliseconds, > 0.
 * @param {number} [samples=48] Number of intervals, ≥ 2; the result has samples + 1 values.
 * @returns {string} CSS `linear(v0, v1, …, vN)` with v0 = 0 and vN = 1 exactly.
 * @throws {RangeError} When any parameter is outside the ranges above.
 */
export function springEasing(zeta, f0, durationMs, samples = 48) {
  if (!(zeta > 0 && zeta < 1)) throw new RangeError(`springEasing: damping ratio ζ = ${zeta}; need 0 < ζ < 1`);
  if (!(f0 > 0)) throw new RangeError(`springEasing: f0 = ${f0} Hz; need f0 > 0`);
  if (!(durationMs > 0)) throw new RangeError(`springEasing: duration = ${durationMs} ms; need > 0`);
  if (!(Number.isInteger(samples) && samples >= 2)) throw new RangeError(`springEasing: samples = ${samples}; need an integer ≥ 2`);
  const w0 = 2 * Math.PI * f0;
  const wd = w0 * Math.sqrt(1 - zeta * zeta);
  const values = [];
  for (let k = 0; k < samples; k += 1) {
    const t = (k / samples) * (durationMs / 1000);
    const x = 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
    values.push(Number(x.toFixed(4))); // Number() drops trailing zeros and −0
  }
  values.push(1); // land exactly on the target
  return `linear(${values.join(', ')})`;
}
