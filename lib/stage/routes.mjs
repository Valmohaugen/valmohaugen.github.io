// @ts-check
/**
 * The live figure in each subpage header: which exact state it draws, its
 * one-line caption (shown on hover, focus or tap), and how it evolves in time.
 *
 * Every figure evolves freely and nonstop (states.mjs step 5): θ = 2πt/T turns
 * it rigidly about the origin, which is exact for every state. The coherent
 * state on the publications page also loses photons on a loop: its amplitude
 * decays as √η(t) = e^{−γt/2} while it turns (a damped oscillator, so the peak
 * spirals in), and then a fresh state is prepared: its amplitude grows from
 * √etaEnd back to 1, with no jump at the switch. Under reduced motion every
 * figure is one still frame at rest (t = 0).
 */

/** One full turn of free evolution, ms. */
export const EVOLVE_PERIOD_MS = 30000;
/** The publications loop: photon loss until η = etaEnd, then a fresh preparation. */
export const SPIRAL = { decayMs: 14000, etaEnd: 0.02, prepareMs: 2000 };
/** The contact figure is already squeezed at rest (its caption says so); above
    r = 0.5 it would run past the drawn window (p up to 3.2). */
const REST_R = 0.25;

/**
 * @typedef {'rotate' | 'spiral'} Dynamics
 * @typedef {{ preset: import('../physics/states.mjs').PresetId, caption: string, dynamics: Dynamics }} RouteFigure
 */

/** @type {Record<'research' | 'publications' | 'outreach' | 'cv' | 'contact' | 'notFound', RouteFigure>} */
export const ROUTE_FIGURES = {
  research: {
    preset: 'research',
    caption:
      "Compass state: four coherent states at once. The checkerboard at its center is interference finer than the vacuum’s width.",
    dynamics: 'rotate',
  },
  publications: {
    preset: 'publications',
    caption:
      'Coherent state under free evolution and photon loss: the peak spirals toward the origin but keeps its shape, then a fresh state is prepared.',
    dynamics: 'spiral',
  },
  outreach: {
    preset: 'outreach',
    caption: 'Six-component cat state: six coherent states on a circle, with interference between every pair.',
    dynamics: 'rotate',
  },
  cv: {
    preset: 'cv',
    caption:
      'Coherent state under free evolution, which rotates it in phase space. The motion is unitary, so it can always\u00a0run\u00a0backward.',
    dynamics: 'rotate',
  },
  contact: {
    preset: 'contact',
    caption: 'Squeezed vacuum: less noise than the vacuum in one quadrature, paid for with more in the other.',
    dynamics: 'rotate',
  },
  notFound: {
    preset: 'notFound',
    caption: 'Odd cat state $|α⟩ − |−α⟩$. At the center $W = −1/π$, the most negative value a Wigner function can take.',
    dynamics: 'rotate',
  },
};

/**
 * The parameters a preset rests at (t = 0, and the still frame under reduced
 * motion); scripts/build-figures.mjs draws the SVG fallback with these.
 * @param {import('../physics/states.mjs').PresetId} preset
 * @returns {{ r?: number }}
 */
export function restParams(preset) {
  return preset === 'contact' ? { r: REST_R } : {};
}

/** @param {number} s @returns {number} */
const smoothstep = (s) => s * s * (3 - 2 * s);

/**
 * The figure's parameters after t ms of motion.
 *
 * rotate: θ = 2πt/T (mod 2π).
 * spiral: the same θ, and a loop of length decayMs + prepareMs. During the
 *   decay η = etaEnd^(u/decayMs) = e^{−γu} with γ = −ln(etaEnd)/decayMs, so
 *   the coherent amplitude √η·β spirals in. During the preparation η = 1 and
 *   the amplitude grows from √etaEnd to 1 (amp), so the state at the switch is
 *   the same on both sides, and the loop closes at amp = 1, η = 1.
 * @param {Dynamics} kind
 * @param {number} t elapsed motion time, ms (paused time excluded)
 * @returns {{ theta: number, eta?: number, amp?: number }}
 */
export function evolveParams(kind, t) {
  const turn = ((t % EVOLVE_PERIOD_MS) + EVOLVE_PERIOD_MS) % EVOLVE_PERIOD_MS;
  const theta = (2 * Math.PI * turn) / EVOLVE_PERIOD_MS;
  if (kind !== 'spiral') return { theta };
  const cycle = SPIRAL.decayMs + SPIRAL.prepareMs;
  const u = ((t % cycle) + cycle) % cycle;
  if (u < SPIRAL.decayMs) return { theta, eta: Math.pow(SPIRAL.etaEnd, u / SPIRAL.decayMs), amp: 1 };
  const a0 = Math.sqrt(SPIRAL.etaEnd);
  return { theta, eta: 1, amp: a0 + (1 - a0) * smoothstep((u - SPIRAL.decayMs) / SPIRAL.prepareMs) };
}
