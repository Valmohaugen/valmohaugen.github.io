// @ts-check
/**
 * Static contour maps of every route's state, shown when WebGL is
 * unavailable or lost, and in forced-colors mode. Writes
 * public/figures/<preset>.svg (generated, gitignored) from the same exact
 * engine as the WebGL figure, at each figure's resting parameters.
 *
 * Phase space x ∈ [−4.6, 4.6], p ∈ [−3.2, 3.2] maps to a 460 × 320 viewBox
 * with p up. Contours sit at W = ±0.025/π and ±k·0.15/π (k = 1…5); negative
 * levels get class c-neg and stroke-dasharray="5 4" (FigureFallback.tsx
 * re-applies the dash; CSS only colours them), so the sign never depends on
 * colour alone. Fails loudly if a Gaussian state shows negative contours
 * (W ≥ 0 for every Gaussian state), if a non-Gaussian one shows none, if a
 * contour reaches the frame (ZOOM widens that preset's window), or if a file
 * exceeds 15 KB.
 *
 * Run: node scripts/build-figures.mjs   (also npm run figures; prebuild, predev)
 */

import { mkdirSync, writeFileSync } from 'node:fs';

import { contourLines } from '../lib/physics/contours.mjs';
import { presetWigner, PRESETS } from '../lib/physics/states.mjs';
import { restParams } from '../lib/stage/routes.mjs';

const OUT_DIR = new URL('../public/figures/', import.meta.url);
const X = 4.6;
const P = 3.2;
const SCALE = 50; // SVG units per phase-space unit
const NX = 231;
const NP = 161;
const MAX_BYTES = 15 * 1024;
const TOLERANCE = 0.6; // Douglas–Peucker tolerance, SVG units (invisible at figure size)
const GAUSSIAN = new Set(['publications', 'cv', 'contact']);
const LEVELS = [0.025, ...Array.from({ length: 5 }, (_, k) => 0.15 * (k + 1))].map((l) => l / Math.PI);

/**
 * Douglas–Peucker: keep the fewest points within `tol` of the polyline.
 * @param {Array<[number, number]>} pts @param {number} tol @returns {Array<[number, number]>}
 */
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const [ax, ay] = pts[0];
  const [bx, by] = pts[pts.length - 1];
  const len = Math.hypot(bx - ax, by - ay);
  let worst = -1;
  let index = 0;
  for (let k = 1; k < pts.length - 1; k += 1) {
    const [px, py] = pts[k];
    const d = len > 0 ? Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / len : Math.hypot(px - ax, py - ay);
    if (d > worst) { worst = d; index = k; }
  }
  if (worst <= tol) return [pts[0], pts[pts.length - 1]];
  return [...simplify(pts.slice(0, index + 1), tol).slice(0, -1), ...simplify(pts.slice(index), tol)];
}

/** SVG path data with relative moves. @param {import('../lib/physics/contours.mjs').Point[]} line */
function pathData(line) {
  /** @type {Array<[number, number]>} */
  const pts = line.map(([x, p]) => [Math.round((x + X) * SCALE * 10) / 10, Math.round((P - p) * SCALE * 10) / 10]);
  const kept = simplify(pts, TOLERANCE);
  let d = `M${kept[0][0]} ${kept[0][1]}l`;
  for (let k = 1; k < kept.length; k += 1) {
    const dx = Math.round((kept[k][0] - kept[k - 1][0]) * 10) / 10;
    const dy = Math.round((kept[k][1] - kept[k - 1][1]) * 10) / 10;
    d += `${k > 1 && dx >= 0 ? ' ' : ''}${dx}${dy >= 0 ? ' ' : ''}${dy}`;
  }
  return d;
}

mkdirSync(OUT_DIR, { recursive: true });
const t0 = performance.now();
/** Window zoom per preset: the lowest contour (W = 0.025/π) of these reaches past x ∈ [−4.6, 4.6], p ∈ [−3.2, 3.2]. */
const ZOOM = /** @type {Record<string, number>} */ ({ research: 1.2, outreach: 1.3, publications: 1.06 });
for (const id of /** @type {Array<keyof typeof PRESETS>} */ (Object.keys(PRESETS))) {
  const z = ZOOM[id] ?? 1;
  const values = new Float64Array(NX * NP);
  for (let j = 0; j < NP; j += 1) for (let i = 0; i < NX; i += 1) {
    values[j * NX + i] = presetWigner(id, z * (-X + (2 * X * i) / (NX - 1)), z * (-P + (2 * P * j) / (NP - 1)), restParams(id)); // what the live figure shows at rest
  }
  const field = { values, nx: NX, np: NP, xRange: /** @type {[number, number]} */ ([-X, X]), pRange: /** @type {[number, number]} */ ([-P, P]) };
  let negative = 0;
  const paths = [];
  for (const level of LEVELS) {
    for (const [sign, cls] of /** @type {Array<[number, string]>} */ ([[1, 'c-pos'], [-1, 'c-neg']])) {
      const lines = contourLines(field, sign * level);
      // A contour that reaches the frame would be drawn cut off: zoom that preset out.
      if (lines.some((line) => line.some(([x, p]) => Math.abs(x) >= X - 1e-9 || Math.abs(p) >= P - 1e-9))) {
        throw new Error(`[figures] ${id}: the W = ${(sign * level * Math.PI).toFixed(3)}/π contour reaches the window edge (zoom ${z})`);
      }
      const d = lines.map(pathData).join('');
      if (!d) continue;
      if (sign < 0) negative += 1;
      paths.push(sign < 0 ? `<path class="${cls}" stroke-dasharray="5 4" d="${d}"/>` : `<path class="${cls}" d="${d}"/>`);
    }
  }
  if (GAUSSIAN.has(id) && negative) throw new Error(`[figures] ${id}: a Gaussian state cannot have W < 0, found ${negative} negative levels`);
  if (!GAUSSIAN.has(id) && !negative) throw new Error(`[figures] ${id}: expected negative regions (interference), found none`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.round(2 * X * SCALE)} ${Math.round(2 * P * SCALE)}" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths.join('')}</svg>\n`;
  const bytes = Buffer.byteLength(svg);
  if (bytes > MAX_BYTES) throw new Error(`[figures] ${id}.svg is ${(bytes / 1024).toFixed(1)} KB > ${MAX_BYTES / 1024} KB`);
  writeFileSync(new URL(`${id}.svg`, OUT_DIR), svg);
  console.log(`[figures] ${id}.svg ${(bytes / 1024).toFixed(1)} KB, ${paths.length} contour levels (${negative} negative)`);
}
console.log(`[done] figures: ${Object.keys(PRESETS).length} written (${(performance.now() - t0).toFixed(0)} ms)`);
