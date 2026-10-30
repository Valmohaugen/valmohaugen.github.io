// @ts-check
/**
 * The homepage figure's photon loss. Scrolling the hero away
 * adds loss and never removes it, because decoherence is irreversible:
 *   target = MAX_LOSS · smoothstep(clamp((scrollY − y₀) / (0.6 · H)))
 *   loss   = max(loss, target)
 * where y₀ is the scroll position the ramp starts from (the top of the page)
 * and H the figure's height. smoothstep(s) = s²(3 − 2s). The cat's hatching
 * follows the resulting fringe visibility V.
 */

/** Highest photon loss the figure reaches (30%). */
export const MAX_LOSS = 0.3;
/** Cat amplitude of the homepage figure. */
export const HOME_ALPHA = 2;
/** Fraction of the figure height over which scrolling ramps the loss. */
const RAMP = 0.6;

/**
 * @param {number} current loss now, 0..MAX_LOSS
 * @param {number} scrollY current scroll position, px
 * @param {number} y0 scroll position the ramp starts from, px
 * @param {number} figureHeight px, > 0
 * @returns {number} the new loss, never below `current`
 */
export function nextLoss(current, scrollY, y0, figureHeight) {
  const s = Math.min(1, Math.max(0, (scrollY - y0) / (RAMP * figureHeight)));
  return Math.max(current, MAX_LOSS * s * s * (3 - 2 * s));
}
