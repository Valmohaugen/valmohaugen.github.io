'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import HomeCat from '@/components/cats/HomeCat';
import FigureFallback from '@/components/stage/FigureFallback';
import type { StageHandle } from '@/components/stage/StageCanvas';
import type { Rect } from '@/lib/stage/projection.mjs';
import { nextLoss } from '@/lib/stage/ratchet.mjs';
import { useMediaQuery } from '@/lib/useMediaQuery';

// The WebGL stage is its own lazily loaded chunk; nothing of it is in the HTML.
const StageCanvas = dynamic(() => import('@/components/stage/StageCanvas'), { ssr: false });

type Mode = 'placeholder' | 'webgl' | 'svg';

/** Matches the em breakpoint in assets/css/stage.css (900 px at the default text size). */
const DESKTOP = '(min-width: 56.25em)';
/** Camera: azimuth −24°, elevation 28° (34° on phones, where the figure is shorter). */
const POSE_DESKTOP = { yaw: -0.42, elevation: 0.49 };
const POSE_PHONE = { yaw: -0.42, elevation: 0.59 };
const MESH_DESKTOP: [number, number] = [384, 224];
const MESH_PHONE: [number, number] = [192, 112];
/** Where the figure's frame starts on desktop, as a share of the hero's width:
    a backdrop rising from behind the intro, its peaks past the text's end. */
const FRAME_LEFT = 0.3;
const EDGE = 24;

/**
 * The homepage's full-screen figure: the WebGL landscape of a
 * Schrödinger cat state as the hero's backdrop, evolving freely and nonstop,
 * with the cat sitting at its foot. The intro (`children`) is server-rendered
 * by app/page.tsx (it holds the LCP text) and sits over the figure on a scrim
 * (assets/css/stage.css); on narrow screens the figure fills the whole hero
 * behind it. Scrolling the hero away adds photon loss. The figure has no
 * caption (owner's choice); it is decorative and hidden from screen readers.
 */
export default function HeroScene({ children }: { children: ReactNode }) {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const forcedColors = useMediaQuery('(forced-colors: active)');
  const desktop = useMediaQuery(DESKTOP, true);
  const [mode, setMode] = useState<Mode>('placeholder');
  const [loss, setLoss] = useState(0);
  const lossRef = useRef(0);
  const handle = useRef<StageHandle | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  // Start the figure once the page has loaded and the browser is idle, so it
  // never competes with the intro text for the first paint.
  useEffect(() => {
    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      const svgOnly = new URLSearchParams(window.location.search).get('webgl') === '0';
      setMode(svgOnly ? 'svg' : 'webgl');
    };
    // Safari has no requestIdleCallback (its DOM types claim otherwise).
    const idle = (window as { requestIdleCallback?: Window['requestIdleCallback'] }).requestIdleCallback;
    const whenIdle = () => {
      if (idle) idle.call(window, start, { timeout: 1500 });
      else window.setTimeout(start, 200);
    };
    if (document.readyState === 'complete') whenIdle();
    else window.addEventListener('load', whenIdle, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener('load', whenIdle);
    };
  }, []);

  const applyLoss = useCallback((next: number) => {
    lossRef.current = next;
    setLoss(next);
    handle.current?.setLoss(next);
  }, []);

  // Scrolling the hero away adds photon loss and never removes it
  // (decoherence is irreversible). Off under reduced motion, and for the
  // static contour map (no WebGL, forced colors), which is drawn without loss.
  const staticMap = mode === 'svg' || forcedColors;
  useEffect(() => {
    if (reduced || staticMap) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const host = hostRef.current;
        if (!host) return;
        const next = nextLoss(lossRef.current, window.scrollY, 0, host.offsetHeight);
        if (next !== lossRef.current) applyLoss(next);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    // A page restored part-way down (a reload, Back) may have had its scroll
    // event before this listener existed: start from the loss the position
    // has earned, so the first scroll never jumps.
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [reduced, staticMap, applyLoss]);

  // Desktop: a frame from FRAME_LEFT to 4vw short of the hero's right edge,
  // EDGE px in from its top and bottom (the fallback's frame in stage.css), so
  // the figure reaches in behind the intro. Narrow screens: the whole hero, 8px in.
  const freeRect = useCallback((host: DOMRect): Rect => {
    if (!window.matchMedia(DESKTOP).matches) {
      return { left: 8, top: 8, width: Math.max(1, host.width - 16), height: Math.max(1, host.height - 16) };
    }
    const left = FRAME_LEFT * host.width;
    const right = host.width - 0.04 * window.innerWidth;
    return { left, top: EDGE, width: Math.max(1, right - left), height: Math.max(1, host.height - 2 * EDGE) };
  }, []);

  const effectiveMode: Mode = forcedColors && mode !== 'placeholder' ? 'svg' : mode;

  return (
    <>
      <div
        className="hero-stage"
        ref={hostRef}
        aria-hidden="true"
      >
        <div className="hero-stage__placeholder" />
        {effectiveMode === 'webgl' && (
          <StageCanvas
            key={desktop ? 'desktop' : 'phone'}
            preset="home"
            fullMesh={desktop ? MESH_DESKTOP : MESH_PHONE}
            pose={desktop ? POSE_DESKTOP : POSE_PHONE}
            freeRect={freeRect}
            animate={!reduced}
            initialParams={{ eta: 1 - loss }}
            evolve="rotate"
            onHandle={(next) => {
              handle.current = next;
              // Loss changed while the shaders compiled: bring the figure up to date.
              next?.setLoss(lossRef.current);
            }}
            onFallback={() => setMode('svg')}
          />
        )}
        {effectiveMode === 'svg' && <FigureFallback preset="home" />}
      </div>
      {children}
      {/* The cat sits at the figure's foot, above the stage so the pointer reaches it. */}
      <div className="hero-cat">
        {/* The static map is drawn without loss, so the hatch follows V = 1 there. */}
        <HomeCat loss={staticMap ? 0 : loss} />
      </div>
    </>
  );
}
