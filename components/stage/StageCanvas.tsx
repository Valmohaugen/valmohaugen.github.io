'use client';

import { useEffect, useRef } from 'react';

import { cubicBezier } from '@/lib/motion/bezier.mjs';
import type { PresetId } from '@/lib/physics/states.mjs';
import { readStageColors } from '@/lib/stage/colors';
import type { Rect } from '@/lib/stage/projection.mjs';
import { qualityAfterEntrance, qualitySettings } from '@/lib/stage/quality.mjs';
import { createStage, liveStageContexts } from '@/lib/stage/renderer';
import type { CameraPose, Stage, StageParams } from '@/lib/stage/renderer';
import { evolveParams } from '@/lib/stage/routes.mjs';
import type { Dynamics } from '@/lib/stage/routes.mjs';

/** What the page can do with a running figure. */
export interface StageHandle {
  /** Photon loss, 0..1 (η = 1 − loss). */
  setLoss(loss: number): void;
}

interface Props {
  preset: PresetId;
  /** Vertices along (x, p) at full quality. */
  fullMesh: [number, number];
  /** Camera pose: yaw and elevation in radians. */
  pose: CameraPose;
  /** The part of the canvas the figure may use, in canvas CSS px. */
  freeRect: (host: DOMRect) => Rect;
  /** Run the prepare animation (false under reduced motion). */
  animate: boolean;
  /** Length of the prepare animation in ms (1.6 s on the homepage, 0.6 s in page headers). */
  entranceMs?: number;
  /** Figure parameters at mount (η, θ or r). */
  initialParams?: Omit<StageParams, 'amp'>;
  /** Nonstop free evolution after the entrance (lib/stage/routes.mjs); runs only with `animate`. */
  evolve?: Dynamics;
  onHandle: (handle: StageHandle | null) => void;
  /** WebGL is unavailable, its shaders fail to compile or link, or the context was lost. */
  onFallback: () => void;
}

const PREPARE_MS = 1600; // --dur-prepare (homepage)
const PREPARE_EASE = cubicBezier(0.16, 1, 0.3, 1);
/** The evolving figure draws at most 30 frames a second. */
const EVOLVE_FRAME_MS = 1000 / 30;
/** A longer gap between ticks (a stalled tab) adds no more than this much motion. */
const MAX_TICK_MS = 100;

declare global {
  interface Window {
    __stage?: {
      sample: Stage['sample'];
      set: Stage['setParams'];
      live: () => number;
      frames: () => number;
      level: () => number;
    };
  }
}

export default function StageCanvas({
  preset,
  fullMesh,
  pose,
  freeRect,
  animate,
  entranceMs = PREPARE_MS,
  initialParams,
  evolve,
  onHandle,
  onFallback,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  // Props read inside the long-lived effect below, kept current after each render.
  const live = useRef({ freeRect, animate, evolve, onHandle, onFallback });
  useEffect(() => {
    live.current = { freeRect, animate, evolve, onHandle, onFallback };
  });
  // Restarts the clock when motion is allowed again (set by the effect below).
  const wake = useRef<() => void>(() => {});
  useEffect(() => {
    wake.current();
  }, [animate, evolve]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    // A fresh canvas for every run of this effect: React's StrictMode (on in
    // development) runs it twice, and a canvas whose context was lost in the
    // first cleanup would hand the second run that same lost context.
    const canvas = document.createElement('canvas');
    canvas.className = 'stage-canvas';
    host.append(canvas);
    const stage = (() => {
      try {
        return createStage(canvas, { preset, mesh: fullMesh, onLost: () => live.current.onFallback() });
      } catch {
        return null;
      }
    })();
    if (!stage) {
      canvas.remove();
      live.current.onFallback();
      return;
    }

    let level = 0;
    let visible = true;
    let pending = false;
    let frame = 0;
    let frames = 0;
    let disposed = false;
    let animating = false;

    const render = () => {
      frame = 0;
      if (!visible) {
        pending = true;
        return;
      }
      pending = false;
      if (stage.render()) frames += 1;
    };
    const requestRender = () => {
      if (frame === 0 && !animating) frame = requestAnimationFrame(render);
    };

    const applyViewport = () => {
      const settings = qualitySettings(level, fullMesh, window.devicePixelRatio || 1);
      const size = { width: host.clientWidth, height: host.clientHeight };
      stage.setViewport(size, live.current.freeRect(host.getBoundingClientRect()), settings.dpr);
    };

    const applyColors = () => {
      stage.setColors(readStageColors(host));
      requestRender();
    };

    stage.setCamera(pose);
    stage.setParams({ amp: live.current.animate ? 0 : 1, ...initialParams });
    applyColors();
    applyViewport();

    const resize = new ResizeObserver(() => {
      applyViewport();
      // Resizing the canvas clears it to black (the context has no alpha):
      // draw again before this frame paints, not on the next one.
      cancelAnimationFrame(frame);
      render();
    });
    // device-pixel-content-box also reports a new device pixel ratio at the
    // same CSS size (browser zoom, a move to another screen); an engine
    // without it throws on the option and keeps the CSS-size observation.
    try {
      resize.observe(host, { box: 'device-pixel-content-box' });
    } catch {
      resize.observe(host);
    }

    // Drawn only while on screen AND in a visible tab, tracked apart, so
    // showing the tab again never restarts a figure scrolled out of view.
    let onScreen = true;
    const updateVisible = () => {
      visible = onScreen && document.visibilityState === 'visible';
      if (visible && pending) requestRender();
      if (visible) wake.current();
    };
    const intersection = new IntersectionObserver((entries) => {
      onScreen = entries[entries.length - 1].isIntersecting;
      updateVisible();
    });
    intersection.observe(host);
    const onVisibility = updateVisible;
    document.addEventListener('visibilitychange', onVisibility);

    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    scheme.addEventListener('change', applyColors);

    // Grow the state's coherent amplitudes from zero: every frame is the exact
    // state with each β scaled by amp (the squeezed vacuum has none, so it is
    // drawn at rest throughout). Frame times decide the quality level for the visit.
    // One entrance at a time: starting one cancels any running one, so two
    // loops never fight over amp or the frame sample.
    let entrance = 0;
    const prepare = () => {
      cancelAnimationFrame(entrance);
      entrance = 0;
      if (!live.current.animate || level === 2) {
        animating = false;
        stage.setParams({ amp: 1 });
        requestRender();
        evolving = true;
        startClock();
        return;
      }
      animating = true;
      const start = performance.now();
      let previous = start;
      const deltas: number[] = [];
      const step = (now: number) => {
        if (disposed) return;
        deltas.push(now - previous);
        previous = now;
        // Reduced motion switched on mid-entrance: finish it at once.
        const t = live.current.animate ? Math.min(1, (now - start) / entranceMs) : 1;
        stage.setParams({ amp: PREPARE_EASE(t) });
        if (stage.render()) frames += 1;
        if (t < 1) {
          entrance = requestAnimationFrame(step);
          return;
        }
        entrance = 0;
        animating = false;
        const next = qualityAfterEntrance(level, deltas);
        if (next !== level) {
          level = next;
          stage.setMesh(qualitySettings(level, fullMesh, window.devicePixelRatio || 1).mesh);
          // The new size clears the canvas: draw again in this frame.
          applyViewport();
          render();
        }
        evolving = true;
        startClock();
      };
      entrance = requestAnimationFrame(step);
    };

    // Free evolution, nonstop (states.mjs step 5): only while the figure is on
    // screen, the tab is visible and motion is allowed; paused time does not
    // count, so the figure resumes where it stopped instead of jumping.
    let clock = 0;
    let motionMs = 0;
    let lastTick = 0;
    let lastDraw = 0;
    let evolving = false;
    const tick = (now: number) => {
      clock = 0;
      if (disposed) return;
      const kind = live.current.evolve;
      if (!kind || !live.current.animate || level === 2 || !visible || animating) {
        lastTick = 0;
        if (kind && !live.current.animate) {
          // Reduced motion: the still frame is the state at rest.
          motionMs = 0;
          stage.setParams(evolveParams(kind, 0));
          requestRender();
        }
        return;
      }
      if (lastTick) motionMs += Math.min(now - lastTick, MAX_TICK_MS);
      lastTick = now;
      if (now - lastDraw >= EVOLVE_FRAME_MS - 1) {
        lastDraw = now;
        stage.setParams(evolveParams(kind, motionMs));
        if (stage.render()) frames += 1;
      }
      clock = requestAnimationFrame(tick);
    };
    const startClock = () => {
      if (!evolving || clock || disposed) return;
      clock = requestAnimationFrame(tick);
    };
    wake.current = startClock;

    stage
      .whenReady()
      .then(() => {
        if (disposed) return;
        render();
        canvas.classList.add('is-ready');
        prepare();
        live.current.onHandle({
          setLoss(loss) {
            stage.setParams({ eta: 1 - loss });
            // A running clock draws the new loss on its next 30 fps frame.
            if (!clock) requestRender();
          },
        });
        if (new URLSearchParams(window.location.search).get('debug') === 'stage') {
          window.__stage = {
            sample: stage.sample,
            set(next) {
              stage.setParams(next);
              requestRender();
            },
            live: liveStageContexts,
            frames: () => frames,
            level: () => level,
          };
        }
      })
      // A rejection after cleanup (unmounted while compiling) is not a failure.
      .catch(() => {
        if (!disposed) live.current.onFallback();
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(entrance);
      cancelAnimationFrame(clock);
      wake.current = () => {};
      resize.disconnect();
      intersection.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      scheme.removeEventListener('change', applyColors);
      live.current.onHandle(null);
      stage.dispose();
      canvas.remove();
    };
    // The stage is created once per mount; later prop changes flow through `live`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={hostRef} className="stage-canvas-host" />;
}
