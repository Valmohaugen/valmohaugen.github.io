// Minimal WebGL2 program helpers: shader programs that fail loudly, and
// compiling in the background with KHR_parallel_shader_compile.
// Ported from the owner's Clemson Quantum Club site (lib/webgl.ts,
// startProgram). Its float-texture helpers are not ported: this site
// evaluates the Wigner function in the vertex shader, so it needs no float
// render targets or lookup textures.

// A program compiling in the background. poll() returns null while the
// driver is still working, the linked program once done, and throws (with
// the compile and link logs) on failure.
export interface PendingProgram {
  poll(): WebGLProgram | null;
  cancel(): void;
}

// Start compiling and linking without waiting for the result. With
// KHR_parallel_shader_compile the driver works off the main thread and
// COMPLETION_STATUS_KHR says when a status query will no longer block;
// without it, the first poll blocks until the link is done. A large shader can
// take tens to hundreds of milliseconds to link on some drivers.
export function startProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
): PendingProgram {
  const parallel = gl.getExtension('KHR_parallel_shader_compile');
  const vs = gl.createShader(gl.VERTEX_SHADER);
  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!vs || !fs || !program) throw new Error('[webgl] could not allocate a shader program');
  gl.shaderSource(vs, vertexSource);
  gl.shaderSource(fs, fragmentSource);
  gl.compileShader(vs);
  gl.compileShader(fs);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  let state: 'pending' | 'ready' | 'closed' = 'pending';
  const release = () => {
    gl.deleteShader(vs);
    gl.deleteShader(fs);
  };
  return {
    poll() {
      if (state !== 'pending') return state === 'ready' ? program : null;
      if (parallel && !gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR)) return null;
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const logs = [
          gl.getShaderParameter(vs, gl.COMPILE_STATUS) ? '' : `vertex: ${gl.getShaderInfoLog(vs) ?? ''}`,
          gl.getShaderParameter(fs, gl.COMPILE_STATUS) ? '' : `fragment: ${gl.getShaderInfoLog(fs) ?? ''}`,
          gl.getProgramInfoLog(program) ?? '',
        ].filter(Boolean);
        state = 'closed';
        release();
        gl.deleteProgram(program);
        throw new Error(`[webgl] program failed to compile or link:\n${logs.join('\n')}`);
      }
      state = 'ready';
      release();
      return program;
    },
    cancel() {
      if (state !== 'pending') return;
      state = 'closed';
      release();
      gl.deleteProgram(program);
    },
  };
}
