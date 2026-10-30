// @ts-check
/**
 * Pure camera math for the WebGL stage (tested in Node by
 * scripts/verify-stage.mjs).
 *
 * The GPU must draw exactly what projectPerspective (lib/physics/cameras.mjs)
 * computes. For a scene point P with camera coordinates u = right·P,
 * v = up·P, w = toward·P and a pinhole at distance D, the point lies
 * d = D − w in front of the camera and lands at the pixel
 *   sx = cx + R·D·u/d,   sy = cy − R·D·v/d        (y down, as on a canvas)
 * where R is pixels per scene unit at depth 0 and (cx, cy) is the projected
 * origin (an off-axis principal point). In normalized device coordinates
 * X = 2sx/W − 1 and Y = 1 − 2sy/H, so with clip w = d:
 *   clipX = (2cx/W − 1)·d + (2RD/W)·u
 *   clipY = (1 − 2cy/H)·d + (2RD/H)·v
 *   clipZ = a·d + b,  a = (n + f)/(f − n),  b = 2nf/(n − f)   (d = n → −1, d = f → +1)
 *   clipW = d = D − toward·P
 * Every row is linear in P, so one 4×4 matrix does it.
 */

/** @typedef {{ x: [number, number], y: [number, number], z: [number, number] }} Box */
/** @typedef {{ left: number, top: number, width: number, height: number }} Rect */

/**
 * Column-major 4×4 clip-space matrix for gl.uniformMatrix4fv.
 *
 * @param {{ view: ArrayLike<number>, distance: number, radiusPx: number, cx: number, cy: number,
 *   width: number, height: number, near: number, far: number }} c
 *   view rows (right, up, toward) row-major; distance D; R px per scene unit
 *   at depth 0; principal point (cx, cy) in canvas px; canvas size in px;
 *   near < far, the distances in front of the camera that map to depth −1 and +1
 * @returns {Float32Array} 16 entries, column-major
 */
export function viewProjection({ view, distance, radiusPx, cx, cy, width, height, near, far }) {
  if (!(near > 0 && far > near)) throw new RangeError(`viewProjection: need 0 < near < far, got ${near}, ${far}`);
  const kx = (2 * cx) / width - 1;
  const ky = 1 - (2 * cy) / height;
  const sx = (2 * radiusPx * distance) / width;
  const sy = (2 * radiusPx * distance) / height;
  const a = (near + far) / (far - near);
  const b = (2 * near * far) / (near - far);
  const [r0, r1, r2, u0, u1, u2, t0, t1, t2] = Array.from(view);
  const D = distance;
  // Rows (X, Y, Z, W) over (x, y, z, 1), then stored column-major.
  const rows = [
    [sx * r0 - kx * t0, sx * r1 - kx * t1, sx * r2 - kx * t2, kx * D],
    [sy * u0 - ky * t0, sy * u1 - ky * t1, sy * u2 - ky * t2, ky * D],
    [-a * t0, -a * t1, -a * t2, a * D + b],
    [-t0, -t1, -t2, D],
  ];
  const m = new Float32Array(16);
  for (let row = 0; row < 4; row += 1) for (let col = 0; col < 4; col += 1) m[col * 4 + row] = rows[row][col];
  return m;
}

/**
 * Near and far distances in front of the camera that bracket a scene box,
 * with 2% padding.
 * @param {ArrayLike<number>} view
 * @param {number} distance
 * @param {Box} box
 * @returns {[number, number]}
 */
export function depthRange(view, distance, box) {
  let wMin = Infinity;
  let wMax = -Infinity;
  for (const x of box.x) for (const y of box.y) for (const z of box.z) {
    const w = view[6] * x + view[7] * y + view[8] * z;
    wMin = Math.min(wMin, w);
    wMax = Math.max(wMax, w);
  }
  const near = (distance - wMax) * 0.98;
  const far = (distance - wMin) * 1.02;
  if (!(near > 0)) throw new RangeError(`depthRange: the box reaches the camera (distance ${distance})`);
  return [near, far];
}

/**
 * Pixel scale and principal point that fit a scene box into a free rectangle
 * of the canvas, leaving `margin` (a fraction of each side) clear.
 * Perspective keeps the box convex, so fitting its eight corners fits every
 * point inside it.
 *
 * @param {ArrayLike<number>} view rows (right, up, toward), row-major
 * @param {number} distance camera distance D
 * @param {Box} box scene-space bounds of everything drawn
 * @param {Rect} free canvas-pixel rectangle the figure may use
 * @param {number} [margin=0.06]
 * @returns {{ radiusPx: number, cx: number, cy: number }}
 * @throws {RangeError} for an empty rectangle or a box behind the camera
 */
export function fitCamera(view, distance, box, free, margin = 0.06) {
  if (!(free.width > 0 && free.height > 0)) throw new RangeError(`fitCamera: empty free rectangle ${JSON.stringify(free)}`);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const x of box.x) for (const y of box.y) for (const z of box.z) {
    const w = view[6] * x + view[7] * y + view[8] * z;
    if (!(w < distance)) throw new RangeError('fitCamera: part of the box is behind the camera');
    const s = distance / (distance - w);
    const dx = s * (view[0] * x + view[1] * y + view[2] * z);
    const dy = -s * (view[3] * x + view[4] * y + view[5] * z);
    minX = Math.min(minX, dx); maxX = Math.max(maxX, dx);
    minY = Math.min(minY, dy); maxY = Math.max(maxY, dy);
  }
  const radiusPx = Math.min((free.width * (1 - 2 * margin)) / (maxX - minX), (free.height * (1 - 2 * margin)) / (maxY - minY));
  return {
    radiusPx,
    cx: free.left + free.width / 2 - (radiusPx * (minX + maxX)) / 2,
    cy: free.top + free.height / 2 - (radiusPx * (minY + maxY)) / 2,
  };
}
