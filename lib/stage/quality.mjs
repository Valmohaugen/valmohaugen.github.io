// @ts-check
/**
 * Adaptive quality for the WebGL stage. StageCanvas measures
 * frame times during a figure's entrance; if they are both over budget and
 * uneven (the 90th percentile above the budget and above 1.5 times the
 * median), it steps down one level and never climbs back during the visit.
 * StageCanvas measures one entrance per mount, so in practice a figure steps
 * down at most once (0 → 1); level 2 needs a second measurement at level 1.
 * A steady cadence is the display's or the power mode's rate (30 Hz in iOS
 * Low Power Mode), not a struggling GPU, so it keeps full quality, unless
 * its median frame is slower than any such cap (SLOW_MEDIAN_MS):
 *   0  full mesh, device pixel ratio up to 1.5
 *   1  half mesh in each direction, DPR 1
 *   2  frozen: the current frame stays, nothing animates
 */

/** Frame budget in ms: a 90th percentile above this can step quality down. */
const FRAME_BUDGET_MS = 20;
/** How far the 90th percentile must exceed the median to count as jank. */
const JANK_RATIO = 1.5;
/**
 * A median frame slower than this (ms, 25 fps) steps down even when steady:
 * no display or power-mode cap is that slow (a 30 Hz cap is 33.3 ms).
 */
const SLOW_MEDIAN_MS = 40;
/** Highest device pixel ratio the stage renders at. */
const MAX_DPR = 1.5;
const FROZEN = 2;

/**
 * Nearest-rank percentile.
 * @param {number[]} samples non-empty
 * @param {number} q in (0, 1]
 * @returns {number}
 */
export function percentile(samples, q) {
  if (!samples.length) throw new RangeError('percentile: no samples');
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1)];
}

/**
 * @param {number} level current level (0, 1 or 2)
 * @param {number} p90Ms 90th-percentile frame time of the last measurement
 * @returns {number} the next level: one step down if over budget, never up
 */
export function nextQuality(level, p90Ms) {
  return p90Ms > FRAME_BUDGET_MS ? Math.min(level + 1, FROZEN) : level;
}

/**
 * Fewest frame intervals that count as a measurement. An entrance that ends
 * in one or two frames (the tab was in the background, so the first frame
 * arrived after the animation's end time) says nothing about the device.
 */
export const MIN_FRAME_SAMPLES = 8;

/**
 * Quality level after an entrance animation.
 * @param {number} level current level
 * @param {number[]} deltas frame intervals in ms, in order; the first one
 *   includes setup work and is ignored
 * @returns {number} the next level; unchanged when there are fewer than
 *   MIN_FRAME_SAMPLES usable intervals
 */
export function qualityAfterEntrance(level, deltas) {
  const samples = deltas.slice(1);
  if (samples.length < MIN_FRAME_SAMPLES) return level;
  const p90 = percentile(samples, 0.9);
  const median = percentile(samples, 0.5);
  if (median <= SLOW_MEDIAN_MS && p90 <= JANK_RATIO * median) return level;
  return nextQuality(level, p90);
}

/**
 * @param {number} level
 * @param {[number, number]} fullMesh vertices along (x, p) at level 0
 * @param {number} devicePixelRatio
 * @returns {{ mesh: [number, number], dpr: number, animate: boolean }}
 */
export function qualitySettings(level, fullMesh, devicePixelRatio) {
  const dpr = Math.min(devicePixelRatio, MAX_DPR);
  if (level === 0) return { mesh: fullMesh, dpr, animate: true };
  const half = /** @type {[number, number]} */ (fullMesh.map((n) => Math.max(2, Math.round(n / 2))));
  return { mesh: half, dpr: Math.min(1, dpr), animate: level < FROZEN };
}
