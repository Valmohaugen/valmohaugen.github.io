// @ts-check
/**
 * Scroll effects (components/ScrollEffects.tsx): blocks that rise into view
 * and a timeline rail that draws itself down as the page scrolls.
 *
 * Draw fraction. A rail segment spans [top, top + height] in viewport
 * coordinates; a horizontal "pen" line sits at `line` px from the top of the
 * viewport. The drawn fraction is the part of the segment above the pen:
 *
 *   f = clamp((line − top) / height, 0, 1).
 *
 * Limits: a segment wholly below the pen (top ≥ line) draws 0; wholly above it
 * (top + height ≤ line) draws 1; f is continuous and non-decreasing as the
 * page scrolls down (top decreases). A zero-height segment is drawn exactly
 * when its top has passed the pen. Checks: scripts/verify-motion.mjs.
 *
 * Pen line. The pen rests at DRAW_LINE·h (h = viewport height). Near the end
 * of the page a rail may never reach it, so over the last g = (1 − DRAW_LINE)·h
 * of scroll it glides to the viewport's bottom edge:
 *
 *   line = DRAW_LINE·h + g·clamp(1 − (max − y)/g, 0, 1),
 *
 * with y the scroll offset and max the largest one. Limits: max − y ≥ g gives
 * DRAW_LINE·h; y = max gives h, so at the end every rail on screen is drawn;
 * a page that cannot scroll (max = 0) draws everything on screen. The line is
 * continuous and non-decreasing in y.
 */

/** The pen sits this far down the viewport (fraction of its height). */
export const DRAW_LINE = 0.7;

/** Blocks revealed in the same frame start this far apart (ms). */
export const REVEAL_STAGGER_MS = 60;

/** At most this many steps of stagger, so a long batch never waits long. */
export const REVEAL_MAX_STEPS = 4;

/**
 * @param {number} top Segment top, px from the top of the viewport.
 * @param {number} height Segment height, px (≥ 0).
 * @param {number} line Pen position, px from the top of the viewport.
 * @returns {number} Drawn fraction in [0, 1].
 */
export function drawFraction(top, height, line) {
  if (!(height > 0)) return top <= line ? 1 : 0;
  return Math.min(1, Math.max(0, (line - top) / height));
}

/**
 * @param {number} viewportH Viewport height h, px (> 0).
 * @param {number} scrollY Scroll offset y, px.
 * @param {number} maxScroll Largest scroll offset, px (≥ 0).
 * @returns {number} Pen position, px from the top of the viewport, in [DRAW_LINE·h, h].
 */
export function penLine(viewportH, scrollY, maxScroll) {
  const glide = viewportH * (1 - DRAW_LINE);
  const left = Math.max(0, maxScroll - scrollY);
  const t = glide > 0 ? Math.min(1, Math.max(0, 1 - left / glide)) : 1;
  return viewportH * DRAW_LINE + glide * t;
}

/**
 * Delay for the i-th block revealed in one batch (top to bottom).
 *
 * @param {number} i Index within the batch, ≥ 0.
 * @returns {number} Delay in ms: i · REVEAL_STAGGER_MS, capped at REVEAL_MAX_STEPS steps.
 */
export function revealDelay(i) {
  return Math.min(Math.max(0, i), REVEAL_MAX_STEPS) * REVEAL_STAGGER_MS;
}
