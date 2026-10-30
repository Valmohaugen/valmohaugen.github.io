// @ts-check
/**
 * Marching squares: contour lines of a sampled scalar field, for the static
 * SVG figures shown when WebGL is unavailable (scripts/build-figures.mjs).
 *
 * Each grid cell's four corners are classified above/below the level c;
 * the 16 cases give 0, 1 or 2 segments whose endpoints sit on the cell edges
 * at the linear-interpolation crossing t = (c − a)/(b − a). The two saddle
 * cases are resolved by the cell-center average. Segments are then joined
 * into polylines through their shared grid edges (closed loops repeat their
 * first point at the end).
 * Checks: scripts/verify-contours.mjs (straight lines of a linear field,
 * circles of a radial field).
 */

/** @typedef {[number, number]} Point */
/**
 * @typedef {{ values: ArrayLike<number>, nx: number, np: number,
 *   xRange: [number, number], pRange: [number, number] }} Field
 *   values are p-major: values[j * nx + i] at (x_i, p_j)
 */

// Corner bits: 1 = (i, j), 2 = (i+1, j), 4 = (i+1, j+1), 8 = (i, j+1).
// Edges: 0 bottom (i,j)–(i+1,j), 1 right (i+1,j)–(i+1,j+1),
//        2 top (i,j+1)–(i+1,j+1), 3 left (i,j)–(i,j+1).
/** @type {Record<number, Array<[number, number]>>} */
const CASES = {
  1: [[3, 0]], 2: [[0, 1]], 3: [[3, 1]], 4: [[1, 2]], 6: [[0, 2]], 7: [[3, 2]],
  8: [[2, 3]], 9: [[0, 2]], 11: [[1, 2]], 12: [[1, 3]], 13: [[0, 1]], 14: [[3, 0]],
};

/**
 * @param {Field} field
 * @param {number} level
 * @returns {Point[][]} polylines in (x, p)
 */
export function contourLines(field, level) {
  const { values, nx, np, xRange, pRange } = field;
  const dx = (xRange[1] - xRange[0]) / (nx - 1);
  const dp = (pRange[1] - pRange[0]) / (np - 1);
  const v = (/** @type {number} */ i, /** @type {number} */ j) => values[j * nx + i];

  /** Grid-edge id and crossing point for edge e of cell (i, j). */
  const crossing = (/** @type {number} */ i, /** @type {number} */ j, /** @type {number} */ e) => {
    /** @type {[number, number, number, number]} */
    const [i0, j0, i1, j1] = e === 0 ? [i, j, i + 1, j] : e === 1 ? [i + 1, j, i + 1, j + 1] : e === 2 ? [i, j + 1, i + 1, j + 1] : [i, j, i, j + 1];
    const a = v(i0, j0);
    const b = v(i1, j1);
    const t = (level - a) / (b - a);
    /** @type {Point} */
    const point = [xRange[0] + (i0 + t * (i1 - i0)) * dx, pRange[0] + (j0 + t * (j1 - j0)) * dp];
    const id = j0 === j1 ? `h${i0},${j0}` : `v${i0},${j0}`;
    return { id, point };
  };

  /** @type {Array<{ a: string, b: string, pa: Point, pb: Point }>} */
  const segments = [];
  for (let j = 0; j < np - 1; j += 1) {
    for (let i = 0; i < nx - 1; i += 1) {
      const c00 = v(i, j);
      const c10 = v(i + 1, j);
      const c11 = v(i + 1, j + 1);
      const c01 = v(i, j + 1);
      const k = (c00 > level ? 1 : 0) | (c10 > level ? 2 : 0) | (c11 > level ? 4 : 0) | (c01 > level ? 8 : 0);
      if (k === 0 || k === 15) continue;
      let pairs = CASES[k];
      if (k === 5 || k === 10) {
        const center = (c00 + c10 + c11 + c01) / 4 > level;
        // Connected through the center: cut off the two corners that are not.
        if (k === 5) pairs = center ? [[0, 1], [2, 3]] : [[3, 0], [1, 2]];
        else pairs = center ? [[3, 0], [1, 2]] : [[0, 1], [2, 3]];
      }
      for (const [e1, e2] of pairs) {
        const p1 = crossing(i, j, e1);
        const p2 = crossing(i, j, e2);
        segments.push({ a: p1.id, b: p2.id, pa: p1.point, pb: p2.point });
      }
    }
  }

  /** @type {Map<string, number[]>} grid-edge id → segments touching it */
  const byEdge = new Map();
  segments.forEach((s, n) => {
    for (const id of [s.a, s.b]) {
      const list = byEdge.get(id);
      if (list) list.push(n);
      else byEdge.set(id, [n]);
    }
  });
  const used = new Uint8Array(segments.length);
  /** Walk from `edge` through the unused segments, appending points to `line`. */
  const walk = (/** @type {string} */ edge, /** @type {Point[]} */ line) => {
    for (;;) {
      const next = (byEdge.get(edge) ?? []).find((n) => !used[n]);
      if (next === undefined) return;
      used[next] = 1;
      const s = segments[next];
      const forward = s.a === edge;
      line.push(forward ? s.pb : s.pa);
      edge = forward ? s.b : s.a;
    }
  };

  /** @type {Point[][]} */
  const lines = [];
  segments.forEach((s, n) => {
    if (used[n]) return;
    used[n] = 1;
    /** @type {Point[]} */
    const tail = [s.pa, s.pb];
    walk(s.b, tail);
    /** @type {Point[]} */
    const head = [];
    walk(s.a, head);
    lines.push([...head.reverse(), ...tail]);
  });
  return lines;
}
