// @ts-check
/**
 * The phase-space grid the stage draws: nx × np vertices carrying (x, p);
 * the vertex shader turns each into the surface point (x, h·W(x, p), −p).
 */

/**
 * @param {number} nx vertices along x (≥ 2)
 * @param {number} np vertices along p (≥ 2)
 * @param {[number, number]} xRange
 * @param {[number, number]} pRange
 * @returns {{ positions: Float32Array, indices: Uint32Array }} (x, p) pairs,
 *   p-major; two triangles per cell
 */
export function gridMesh(nx, np, xRange, pRange) {
  if (!(Number.isInteger(nx) && Number.isInteger(np) && nx >= 2 && np >= 2)) {
    throw new RangeError(`gridMesh: need integer nx, np ≥ 2, got ${nx}, ${np}`);
  }
  const positions = new Float32Array(2 * nx * np);
  for (let j = 0; j < np; j += 1) {
    const p = pRange[0] + ((pRange[1] - pRange[0]) * j) / (np - 1);
    for (let i = 0; i < nx; i += 1) {
      const k = 2 * (j * nx + i);
      positions[k] = xRange[0] + ((xRange[1] - xRange[0]) * i) / (nx - 1);
      positions[k + 1] = p;
    }
  }
  const indices = new Uint32Array(6 * (nx - 1) * (np - 1));
  let n = 0;
  for (let j = 0; j < np - 1; j += 1) {
    for (let i = 0; i < nx - 1; i += 1) {
      const a = j * nx + i;
      const b = a + 1;
      const c = a + nx;
      const d = c + 1;
      indices.set([a, b, c, b, d, c], n);
      n += 6;
    }
  }
  return { positions, indices };
}
