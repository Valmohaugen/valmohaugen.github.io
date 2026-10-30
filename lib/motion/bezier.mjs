// @ts-check
/**
 * CSS cubic-bezier(x1, y1, x2, y2) timing functions for JavaScript-driven
 * animation (the WebGL prepare animation follows the same curves as CSS).
 *
 * The curve is B(s) = 3(1−s)²s·P1 + 3(1−s)s²·P2 + s³ with P0 = (0, 0) and
 * P3 = (1, 1). For a progress x we solve B_x(s) = x for s (Newton's method,
 * with bisection as a fallback where the slope is flat), then return B_y(s).
 * Checks: scripts/verify-motion.mjs (endpoints, monotonicity, CSS ease at 0.5).
 */

/**
 * @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2
 * @returns {(x: number) => number}
 */
export function cubicBezier(x1, y1, x2, y2) {
  const bx = (/** @type {number} */ s) => ((1 - 3 * x2 + 3 * x1) * s + (3 * x2 - 6 * x1)) * s * s + 3 * x1 * s;
  const by = (/** @type {number} */ s) => ((1 - 3 * y2 + 3 * y1) * s + (3 * y2 - 6 * y1)) * s * s + 3 * y1 * s;
  const dbx = (/** @type {number} */ s) => (3 * (1 - 3 * x2 + 3 * x1) * s + 2 * (3 * x2 - 6 * x1)) * s + 3 * x1;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let s = x;
    for (let i = 0; i < 8; i += 1) {
      const err = bx(s) - x;
      if (Math.abs(err) < 1e-9) return by(s);
      const slope = dbx(s);
      if (Math.abs(slope) < 1e-6) break;
      s -= err / slope;
    }
    let lo = 0;
    let hi = 1;
    s = x;
    for (let i = 0; i < 40; i += 1) {
      const v = bx(s);
      if (Math.abs(v - x) < 1e-9) break;
      if (v < x) lo = s;
      else hi = s;
      s = (lo + hi) / 2;
    }
    return by(s);
  };
}
