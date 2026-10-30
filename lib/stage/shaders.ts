// GLSL for the phase-space stage. The vertex shader evaluates the exact Wigner
// function of lib/physics/states.mjs (derivation steps 2–4 there) and its
// analytic gradient, so no float render targets or lookup textures are needed.
// Scene mapping: phase-space point (x, p) → (x, h·W(x, p), −p).

export const VERTEX_SHADER = /* glsl */ `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_xp;

uniform mat4 u_mvp;
uniform int u_kind;          // 0: superposition of coherent states; 1: squeezed vacuum
uniform int u_count;         // components in use (at most 6)
uniform vec2 u_beta[6];      // coherent amplitudes β_j (re, im), already scaled and rotated
uniform vec2 u_coef[6];      // coefficients c_j (re, im)
uniform float u_sqrtEta;     // √η, photon loss
uniform float u_invPiN;      // 1/(π𝒩)
uniform float u_squeeze;     // r, squeezed vacuum only
uniform float u_phi;         // θ of free evolution, squeezed vacuum only (superpositions are rotated on the CPU)
uniform float u_height;      // scene units per unit of W

out float v_w;
out vec3 v_normal;
out vec2 v_xp;
out float v_dist;

const float INV_PI = 0.31830988618;
const float SQRT1_2 = 0.70710678118;
const float SQRT2 = 1.41421356237;
const float TAU = 6.28318530718;

// W(x, p) and its gradient (∂W/∂x, ∂W/∂p).
void wigner(vec2 xp, out float w, out vec2 grad) {
  if (u_kind == 1) {
    // W(M⁻¹z) with M = R(θ)·S(r) (states.mjs step 5): q = R(θ)⁻¹(x, p).
    float c = cos(u_phi);
    float s = sin(u_phi);
    vec2 q = vec2(c * xp.x - s * xp.y, s * xp.x + c * xp.y);
    float a = exp(2.0 * u_squeeze);
    float b = 1.0 / a;
    float g = exp(-a * q.x * q.x - b * q.y * q.y) * INV_PI;
    w = g;
    // Chain rule through q: ∂q.x/∂(x, p) = (c, −s), ∂q.y/∂(x, p) = (s, c).
    vec2 dq = vec2(-2.0 * a * q.x, -2.0 * b * q.y) * g;
    grad = vec2(dq.x * c + dq.y * s, -dq.x * s + dq.y * c);
    return;
  }
  vec2 z = xp * SQRT1_2;  // z = (x + ip)/√2 as (re, im)
  float sum = 0.0;
  vec2 gsum = vec2(0.0);
  for (int j = 0; j < 6; j++) {
    if (j >= u_count) break;
    vec2 bj = u_beta[j];
    vec2 u = z - u_sqrtEta * bj;                       // z − √η β_j
    for (int k = 0; k < 6; k++) {
      if (k >= u_count) break;
      vec2 bk = u_beta[k];
      vec2 v = z - u_sqrtEta * bk;                     // z − √η β_k
      vec2 uv = vec2(u.x * v.x + u.y * v.y, u.y * v.x - u.x * v.y);   // u · conj(v)
      // log⟨β_k|β_j⟩ = −|β_k|²/2 − |β_j|²/2 + β_k* β_j
      vec2 ov = vec2(-0.5 * dot(bk, bk) - 0.5 * dot(bj, bj) + dot(bk, bj), bk.x * bj.y - bk.y * bj.x);
      vec2 e = ov - 2.0 * uv;                          // one combined exponent
      float phase = e.y - TAU * floor(e.y / TAU);      // range-reduced for float32
      vec2 t = exp(e.x) * vec2(cos(phase), sin(phase));
      vec2 cj = u_coef[j];
      vec2 ck = u_coef[k];
      vec2 c = vec2(cj.x * ck.x + cj.y * ck.y, cj.y * ck.x - cj.x * ck.y);   // c_j c_k*
      vec2 term = vec2(c.x * t.x - c.y * t.y, c.x * t.y + c.y * t.x);
      sum += term.x;
      // ∂E/∂x = −√2 [u + conj(v)],  ∂E/∂p = −√2 i [conj(v) − u]
      vec2 cv = vec2(v.x, -v.y);
      vec2 dEx = -SQRT2 * (u + cv);
      vec2 d = cv - u;
      vec2 dEp = -SQRT2 * vec2(-d.y, d.x);
      gsum += vec2(term.x * dEx.x - term.y * dEx.y, term.x * dEp.x - term.y * dEp.y);
    }
  }
  w = sum * u_invPiN;
  grad = gsum * u_invPiN;
}

void main() {
  float w;
  vec2 grad;
  wigner(a_xp, w, grad);
  vec3 scene = vec3(a_xp.x, u_height * w, -a_xp.y);
  gl_Position = u_mvp * vec4(scene, 1.0);
  // Surface y = h·W(x, −z): normal ∝ (−h W_x, 1, h W_p).
  v_normal = normalize(vec3(-u_height * grad.x, 1.0, u_height * grad.y));
  v_w = w;
  v_xp = a_xp;
  v_dist = gl_Position.w;  // distance in front of the camera
}
`;

export const FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;

in float v_w;
in vec3 v_normal;
in vec2 v_xp;
in float v_dist;

uniform vec3 u_posLab;   // W > 0 colour, OKLab
uniform vec3 u_negLab;   // W < 0 colour, OKLab
uniform vec3 u_bgLab;    // page background, OKLab
uniform vec3 u_inkLab;   // contour colour, OKLab
uniform vec3 u_light;    // light direction, scene space, normalized
uniform vec2 u_fog;      // (start, end) distance in front of the camera
uniform vec2 u_extent;   // grid half-widths (X, P), for the edge fade

out vec4 outColor;

const float INV_PI = 0.31830988618;
const float LEVEL = 0.05 * INV_PI;   // isoline spacing in W

vec3 oklabToSrgb(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l;
  m = m * m * m;
  s = s * s * s;
  vec3 lin = vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
  lin = clamp(lin, 0.0, 1.0);
  return mix(lin * 12.92, 1.055 * pow(lin, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, lin));
}

float bayer4(vec2 p) {
  const float m[16] = float[16](0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5.);
  ivec2 q = ivec2(mod(p, 4.0));
  return m[q.x + 4 * q.y] / 16.0;
}

void main() {
  float w = v_w;
  float strength = clamp(abs(w) / (0.6 * INV_PI), 0.0, 1.0);
  vec3 lab = mix(u_bgLab, w >= 0.0 ? u_posLab : u_negLab, strength);
  float shade = 0.72 + 0.28 * max(dot(normalize(v_normal), u_light), 0.0);
  // Shade toward the ink, not black, so the floor stands off the page in both themes.
  lab.x = mix(lab.x, u_inkLab.x, 1.0 - shade);

  // Isolines every LEVEL, the zero contour heavier, contours below zero dashed.
  // They fade out where W is flat (the floor), so the floor stays clean.
  float f = w / LEVEL;
  float fw = max(fwidth(f), 1e-4);
  float visible = smoothstep(0.02, 0.2, fwidth(w) / LEVEL);
  float line = 1.0 - clamp(abs(fract(f + 0.5) - 0.5) / fw - 0.5, 0.0, 1.0);
  float zero = 1.0 - clamp(abs(f) / fw - 0.75, 0.0, 1.0);
  if (w < 0.0) line *= step(0.5, fract((v_xp.x - v_xp.y) * 1.5));
  lab = mix(lab, u_inkLab, visible * max(line * 0.45, zero * 0.7));

  float fog = smoothstep(u_fog.x, u_fog.y, v_dist);
  vec2 edge = u_extent - abs(v_xp);
  float edgeFade = smoothstep(0.0, 0.9, min(edge.x, edge.y));
  lab = mix(u_bgLab, lab, (1.0 - fog) * edgeFade);

  vec3 rgb = oklabToSrgb(lab) + (bayer4(gl_FragCoord.xy) - 0.5) / 255.0;
  outColor = vec4(rgb, 1.0);
}
`;

// Transform-feedback readback (debug): rasterization is discarded, only v_w is kept.
export const READBACK_FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;
out vec4 outColor;
void main() { outColor = vec4(0.0); }
`;
