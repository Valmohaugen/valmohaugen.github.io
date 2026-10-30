// The phase-space stage: one WebGL2 context per mounted figure, rendering an
// exact Wigner function as a lit landscape (see shaders.ts). It draws only
// when asked (render on demand), never re-parents its canvas, and releases
// the context on dispose (Safari limits live contexts and loses them when a
// canvas is detached).

import { landscapeView } from '@/lib/physics/cameras.mjs';
import { PRESETS, normSuperposition, rotate } from '@/lib/physics/states.mjs';
import type { Component, PresetId } from '@/lib/physics/states.mjs';

import type { StageColors } from './colors';
import { gridMesh } from './mesh.mjs';
import { depthRange, fitCamera, viewProjection } from './projection.mjs';
import type { Rect } from './projection.mjs';
import { FRAGMENT_SHADER, READBACK_FRAGMENT_SHADER, VERTEX_SHADER } from './shaders';
import { startProgram } from './webgl';
import type { PendingProgram } from './webgl';

/** Scene units of height per unit of W. */
const HEIGHT_SCALE = 4;
/** Half-widths of the phase-space window drawn: x ∈ [−X, X], p ∈ [−P, P]. */
const X_EXTENT = 4.6;
const P_EXTENT = 3.2;
/** Camera distance from the origin, scene units. */
const DISTANCE = 18;
/** Light direction in scene space (upper left, toward the viewer). */
const LIGHT = normalize([-0.45, 0.8, 0.4]);
const MAX_COMPONENTS = 6;
const BOX = {
  x: [-X_EXTENT, X_EXTENT] as [number, number],
  y: [-HEIGHT_SCALE / Math.PI, HEIGHT_SCALE / Math.PI] as [number, number],
  z: [-P_EXTENT, P_EXTENT] as [number, number],
};

export interface StageParams {
  /** Scales every coherent amplitude β_j, 0..1 (the "prepare" animation grows them from zero; the squeezed vacuum ignores it). */
  amp?: number;
  /** Surviving fraction of the light, 0..1. */
  eta?: number;
  /** Free-rotation phase, rad. */
  theta?: number;
  /** Squeezing, squeezed vacuum only. */
  r?: number;
}

export interface CameraPose {
  yaw: number;
  elevation: number;
}

export interface Stage {
  setParams(params: StageParams): void;
  setCamera(pose: CameraPose): void;
  setColors(colors: StageColors): void;
  /** Canvas size in CSS px, the free rectangle the figure may use, and the DPR. */
  setViewport(size: { width: number; height: number }, free: Rect, dpr: number): void;
  setMesh(mesh: [number, number]): void;
  /** Draws one frame. False until whenReady() has resolved or after context loss. */
  render(): boolean;
  /** Resolves once the shaders are compiled; rejects with the compile log on failure. */
  whenReady(): Promise<void>;
  /**
   * GPU readback of W at phase-space points (transform feedback), for the
   * README's manual shader check under ?debug=stage.
   */
  sample(points: ReadonlyArray<readonly [number, number]>): Float32Array;
  dispose(): void;
}

let liveContexts = 0;
/** Live WebGL contexts held by stages (window.__stage.live under ?debug=stage). */
export function liveStageContexts(): number {
  return liveContexts;
}

function normalize(v: number[]): [number, number, number] {
  const n = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / n, v[1] / n, v[2] / n];
}

function uniformValues(preset: PresetId, params: Required<StageParams>) {
  const spec = PRESETS[preset];
  if (spec.kind === 'squeezedVacuum') {
    return { kind: 1, count: 0, beta: new Float32Array(12), coef: new Float32Array(12), invPiN: 0, squeeze: params.r, phi: params.theta };
  }
  let comps: Component[] = spec.comps.map(({ c, beta }) => ({
    c,
    beta: { re: beta.re * params.amp, im: beta.im * params.amp },
  }));
  // Free evolution (states.mjs step 5): every figure turns with θ.
  comps = rotate(comps, params.theta);
  if (comps.length > MAX_COMPONENTS) throw new Error(`[stage] ${preset}: ${comps.length} components > ${MAX_COMPONENTS}`);
  const beta = new Float32Array(12);
  const coef = new Float32Array(12);
  comps.forEach(({ c, beta: b }, i) => {
    beta.set([b.re, b.im], 2 * i);
    coef.set([c.re, c.im], 2 * i);
  });
  return { kind: 0, count: comps.length, beta, coef, invPiN: 1 / (Math.PI * normSuperposition(comps)), squeeze: 0, phi: 0 };
}

export function createStage(
  canvas: HTMLCanvasElement,
  opts: { preset: PresetId; mesh: [number, number]; onLost?: () => void },
): Stage | null {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: true,
    depth: true,
    powerPreference: 'low-power',
    failIfMajorPerformanceCaveat: true,
  });
  // A context lost before we start (GPU reset, or a canvas reused after
  // dispose) cannot compile shaders: report "no stage" so the page falls back.
  if (!gl || gl.isContextLost()) return null;
  liveContexts += 1;

  let lost = false;
  let disposed = false;
  const onLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    opts.onLost?.();
  };
  canvas.addEventListener('webglcontextlost', onLost);

  let pending: PendingProgram;
  try {
    pending = startProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  } catch {
    canvas.removeEventListener('webglcontextlost', onLost);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    liveContexts -= 1;
    return null;
  }
  let program: WebGLProgram | null = null;
  let readback: WebGLProgram | null = null;
  const locations = new Map<WebGLProgram, Map<string, WebGLUniformLocation | null>>();

  const vao = gl.createVertexArray();
  const positionBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();
  let indexCount = 0;

  let params: Required<StageParams> = { amp: 1, eta: 1, theta: 0, r: 0 };
  let pose: CameraPose = { yaw: -0.42, elevation: 0.49 };
  let colors: StageColors | null = null;
  let size = { width: 1, height: 1 };
  let free: Rect = { left: 0, top: 0, width: 1, height: 1 };
  let dpr = 1;

  function setMesh(mesh: [number, number]) {
    const { positions, indices } = gridMesh(mesh[0], mesh[1], [-X_EXTENT, X_EXTENT], [-P_EXTENT, P_EXTENT]);
    gl!.bindVertexArray(vao);
    gl!.bindBuffer(gl!.ARRAY_BUFFER, positionBuffer);
    gl!.bufferData(gl!.ARRAY_BUFFER, positions, gl!.STATIC_DRAW);
    gl!.enableVertexAttribArray(0);
    gl!.vertexAttribPointer(0, 2, gl!.FLOAT, false, 0, 0);
    gl!.bindBuffer(gl!.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl!.bufferData(gl!.ELEMENT_ARRAY_BUFFER, indices, gl!.STATIC_DRAW);
    gl!.bindVertexArray(null);
    indexCount = indices.length;
  }
  setMesh(opts.mesh);

  function loc(prog: WebGLProgram, name: string): WebGLUniformLocation | null {
    let table = locations.get(prog);
    if (!table) {
      table = new Map();
      locations.set(prog, table);
    }
    if (!table.has(name)) table.set(name, gl!.getUniformLocation(prog, name));
    return table.get(name) ?? null;
  }

  function camera() {
    const view = landscapeView(pose.yaw, pose.elevation);
    const fit = fitCamera(view, DISTANCE, BOX, free);
    const [near, far] = depthRange(view, DISTANCE, BOX);
    const mvp = viewProjection({ view, distance: DISTANCE, ...fit, width: size.width, height: size.height, near, far });
    return { mvp, near, far };
  }

  function applyUniforms(prog: WebGLProgram) {
    const u = uniformValues(opts.preset, params);
    const { mvp, far } = camera();
    gl!.uniformMatrix4fv(loc(prog, 'u_mvp'), false, mvp);
    gl!.uniform1i(loc(prog, 'u_kind'), u.kind);
    gl!.uniform1i(loc(prog, 'u_count'), u.count);
    gl!.uniform2fv(loc(prog, 'u_beta'), u.beta);
    gl!.uniform2fv(loc(prog, 'u_coef'), u.coef);
    gl!.uniform1f(loc(prog, 'u_sqrtEta'), Math.sqrt(params.eta));
    gl!.uniform1f(loc(prog, 'u_invPiN'), u.invPiN);
    gl!.uniform1f(loc(prog, 'u_squeeze'), u.squeeze);
    gl!.uniform1f(loc(prog, 'u_phi'), u.phi);
    gl!.uniform1f(loc(prog, 'u_height'), HEIGHT_SCALE);
    if (colors) {
      gl!.uniform3fv(loc(prog, 'u_posLab'), colors.pos);
      gl!.uniform3fv(loc(prog, 'u_negLab'), colors.neg);
      gl!.uniform3fv(loc(prog, 'u_bgLab'), colors.bg);
      gl!.uniform3fv(loc(prog, 'u_inkLab'), colors.ink);
    }
    gl!.uniform3fv(loc(prog, 'u_light'), LIGHT);
    gl!.uniform2f(loc(prog, 'u_fog'), DISTANCE + 0.25 * (far - DISTANCE), far);
    gl!.uniform2f(loc(prog, 'u_extent'), X_EXTENT, P_EXTENT);
  }

  function linkReadback(): WebGLProgram {
    if (readback) return readback;
    const compile = (type: number, source: string) => {
      const shader = gl!.createShader(type)!;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) throw new Error(`[stage] readback shader: ${gl!.getShaderInfoLog(shader)}`);
      return shader;
    };
    const prog = gl!.createProgram()!;
    const vs = compile(gl!.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl!.FRAGMENT_SHADER, READBACK_FRAGMENT_SHADER);
    gl!.attachShader(prog, vs);
    gl!.attachShader(prog, fs);
    gl!.transformFeedbackVaryings(prog, ['v_w'], gl!.SEPARATE_ATTRIBS);
    gl!.linkProgram(prog);
    gl!.deleteShader(vs);
    gl!.deleteShader(fs);
    if (!gl!.getProgramParameter(prog, gl!.LINK_STATUS)) throw new Error(`[stage] readback link: ${gl!.getProgramInfoLog(prog)}`);
    readback = prog;
    return prog;
  }

  const stage: Stage = {
    setParams(next) {
      params = { ...params, ...next };
    },
    setCamera(next) {
      pose = next;
    },
    setColors(next) {
      colors = next;
    },
    setViewport(nextSize, nextFree, nextDpr) {
      size = nextSize;
      free = nextFree;
      dpr = nextDpr;
      canvas.width = Math.max(1, Math.round(size.width * dpr));
      canvas.height = Math.max(1, Math.round(size.height * dpr));
    },
    setMesh,
    render() {
      if (lost || disposed || !colors) return false;
      // Only whenReady() polls the link: a failure seen there falls back to
      // the SVG map; one seen here would be thrown inside an animation frame.
      if (!program) return false;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.disable(gl.SCISSOR_TEST);
      gl.clearColor(colors.bgRgb[0], colors.bgRgb[1], colors.bgRgb[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(
        Math.floor(free.left * dpr),
        Math.floor((size.height - free.top - free.height) * dpr),
        Math.ceil(free.width * dpr),
        Math.ceil(free.height * dpr),
      );
      gl.enable(gl.DEPTH_TEST);
      gl.useProgram(program);
      applyUniforms(program);
      gl.bindVertexArray(vao);
      gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_INT, 0);
      gl.bindVertexArray(null);
      return true;
    },
    whenReady() {
      return new Promise((resolve, reject) => {
        const poll = () => {
          if (disposed || lost) return reject(new Error('[stage] disposed before the shaders compiled'));
          try {
            program = program ?? pending.poll();
          } catch (err) {
            return reject(err);
          }
          if (program) resolve();
          else setTimeout(poll, 16);
        };
        poll();
      });
    },
    sample(points) {
      const prog = linkReadback();
      const n = points.length;
      const data = new Float32Array(2 * n);
      points.forEach(([x, p], i) => data.set([x, p], 2 * i));
      const sampleVao = gl.createVertexArray();
      const buffer = gl.createBuffer();
      const out = gl.createBuffer();
      const feedback = gl.createTransformFeedback();
      gl.bindVertexArray(sampleVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, out);
      gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER, 4 * n, gl.STATIC_READ);
      gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);
      gl.useProgram(prog);
      applyUniforms(prog);
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, feedback);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, out);
      gl.enable(gl.RASTERIZER_DISCARD);
      gl.beginTransformFeedback(gl.POINTS);
      gl.drawArrays(gl.POINTS, 0, n);
      gl.endTransformFeedback();
      gl.disable(gl.RASTERIZER_DISCARD);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
      const result = new Float32Array(n);
      gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, out);
      gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, result);
      gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);
      gl.bindVertexArray(null);
      gl.deleteTransformFeedback(feedback);
      gl.deleteBuffer(out);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(sampleVao);
      return result;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      pending.cancel();
      canvas.removeEventListener('webglcontextlost', onLost);
      if (!lost) {
        if (program) gl.deleteProgram(program);
        if (readback) gl.deleteProgram(readback);
        gl.deleteBuffer(positionBuffer);
        gl.deleteBuffer(indexBuffer);
        gl.deleteVertexArray(vao);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
      canvas.width = 0;
      canvas.height = 0;
      liveContexts -= 1;
    },
  };
  return stage;
}
