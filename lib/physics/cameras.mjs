// @ts-check
/**
 * Camera for the 3D figures, kept in one place so scripts/verify-cameras.mjs
 * can check it is a proper, right-handed rotation seen from the side it
 * claims. Ported from the owner's Clemson Quantum Club site
 * (lib/physics/cameras.mjs: the convention, projectPerspective verbatim, and
 * braidView's math as landscapeView); the club's scene-specific cameras stay
 * there.
 *
 * Convention: a camera is three orthonormal row vectors in scene
 * coordinates: right (screen x), up (screen y, pointing up), and toward (out
 * of the screen, at the viewer). Right-handed means right × up = toward, or
 * det[right; up; toward] = +1. A point p lands on screen at
 * (right · p, up · p) with y up, and toward · p is its depth (larger =
 * nearer).
 *
 * Landscape coordinates: the phase-space plane is the scene's x–z plane and
 * the Wigner height runs along +y. The renderer maps (x, p, W) to the scene
 * point (x, h·W, −p), so in the top view p points up the screen, as in a
 * textbook phase-space plot.
 *
 * 1. Projection. A pinhole camera sits at distance D along +toward from the
 *    origin, looking back at it. A point p with camera coordinates
 *    (u, v, w) = (right · p, up · p, toward · p) lies D − w in front of the
 *    pinhole, so by similar triangles it shows at s(u, v) in the reference
 *    plane through the origin (w = 0), with s = D/(D − w). Points in that
 *    plane keep s = 1, nearer ones (w > 0) grow, farther ones shrink, and
 *    s → 1 for every point as D → ∞ (the orthographic view). The formula
 *    needs w < D: the point in front of the camera. Canvas y runs DOWN, so
 *    the screen offset from the projected origin is (dx, dy) = (sRu, −sRv)
 *    for R pixels per scene unit at w = 0.
 * 2. Landscape view. The view is M = Rx(e) Ry(yaw): turn the scene by `yaw`
 *    about +y (right-hand rule: counterclockwise seen from above), then tilt
 *    it by the elevation e about x, which brings +y toward the viewer, the
 *    same as raising the camera e above the x–z plane. The rows of M are
 *      right  = (cos yaw, 0, sin yaw)
 *      up     = (sin e sin yaw, cos e, −sin e cos yaw)
 *      toward = (−cos e sin yaw, sin e, cos e cos yaw).
 *    det M = det Rx(e) det Ry(yaw) = +1. Directly: right × up =
 *    (−cos e sin yaw, sin e (sin² yaw + cos² yaw), cos e cos yaw) = toward,
 *    so det[right; up; toward] = |toward|² = 1. At yaw = e = 0, M = I. Height
 *    points up the screen (up · y = cos e > 0) for |e| < π/2, and the camera
 *    is above the ground plane (toward · y = sin e > 0) for e > 0.
 */

/** Entries of a row-major 3×3 view (rows right, up, toward). */
const VIEW_ENTRIES = 9;
/** Entries of a projectPerspective result: dx, dy, depth, scale. */
const PROJECTION_ENTRIES = 4;

/**
 * @param {ArrayLike<number>} view
 * @param {string} fn caller, for the message
 */
function checkView(view, fn) {
  if (!view || view.length !== VIEW_ENTRIES) {
    throw new RangeError(`[cameras] ${fn}: view must hold ${VIEW_ENTRIES} row-major entries, got ${view ? view.length : view}`);
  }
}

/**
 * Perspective projection (header point 1): the camera sits `distance` scene
 * units along +toward from the origin, looking back at it.
 *
 * @param {ArrayLike<number>} view rows (right, up, toward), row-major, 9 entries
 * @param {number} x scene point (scene units)
 * @param {number} y
 * @param {number} z
 * @param {number} distance camera distance from the origin (scene units), finite and > 0
 * @param {number} radiusPx pixels per scene unit in the reference plane
 *   through the origin (depth 0), finite and ≥ 0
 * @param {Float64Array} [out] receives the result (4 entries); allocated if omitted
 * @returns {Float64Array} [dx, dy, depth, scale]: the screen offset from the
 *   projected origin (px, y DOWN as on a canvas), depth = toward · p (scene
 *   units, larger = nearer) and scale = distance/(distance − depth)
 * @throws {RangeError} if the point is at or behind the camera (depth ≥
 *   distance) or its depth is not finite, for a distance that is not finite
 *   and positive, a radiusPx that is negative or not finite, or a view
 *   without 9 entries
 */
export function projectPerspective(view, x, y, z, distance, radiusPx, out = new Float64Array(PROJECTION_ENTRIES)) {
  checkView(view, 'projectPerspective');
  if (!(Number.isFinite(distance) && distance > 0)) {
    throw new RangeError(`[cameras] projectPerspective: distance must be finite and > 0, got ${distance}`);
  }
  if (!(Number.isFinite(radiusPx) && radiusPx >= 0)) {
    throw new RangeError(`[cameras] projectPerspective: radiusPx must be finite and >= 0, got ${radiusPx}`);
  }
  const depth = view[6] * x + view[7] * y + view[8] * z;
  if (!(Number.isFinite(depth) && depth < distance)) {
    throw new RangeError(
      `[cameras] projectPerspective: point (${x}, ${y}, ${z}) has depth ${depth}; ` +
        `it must be in front of the camera at distance ${distance}`,
    );
  }
  const scale = distance / (distance - depth);
  const k = scale * radiusPx;
  out[0] = k * (view[0] * x + view[1] * y + view[2] * z);
  out[1] = -k * (view[3] * x + view[4] * y + view[5] * z);
  out[2] = depth;
  out[3] = scale;
  return out;
}

/**
 * Landscape camera (header point 2): the identity at yaw = elevation = 0.
 * Writes the rows (right, up, toward) into `out`, a proper rotation (det +1).
 *
 * @param {number} yaw rad: turns the scene about +y (height), counterclockwise seen from above
 * @param {number} elevation rad: raises the camera above the x–z plane (> 0:
 *   looking down on it); height points up the screen for |e| < π/2
 * @param {Float64Array} [out] 9 entries, row-major
 * @returns {Float64Array}
 * @throws {RangeError} for a non-finite angle
 */
export function landscapeView(yaw, elevation, out = new Float64Array(VIEW_ENTRIES)) {
  if (!(Number.isFinite(yaw) && Number.isFinite(elevation))) {
    throw new RangeError(`[cameras] landscapeView: yaw and elevation must be finite, got ${yaw} and ${elevation}`);
  }
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const ce = Math.cos(elevation);
  const se = Math.sin(elevation);
  out[0] = cy;
  out[1] = 0;
  out[2] = sy;
  out[3] = se * sy;
  out[4] = ce;
  out[5] = -se * cy;
  out[6] = -ce * sy;
  out[7] = se;
  out[8] = ce * cy;
  return out;
}
