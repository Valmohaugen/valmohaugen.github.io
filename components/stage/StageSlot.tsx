'use client';

import { useCallback, useEffect, useState } from 'react';

import FigureFallback from '@/components/stage/FigureFallback';
import StageCanvas from '@/components/stage/StageCanvas';
import type { Rect } from '@/lib/stage/projection.mjs';
import { ROUTE_FIGURES, restParams } from '@/lib/stage/routes.mjs';
import { useMediaQuery } from '@/lib/useMediaQuery';

// StageSlot itself is the lazily loaded chunk (StageMount), so the stage is a
// plain import here: a next/dynamic nested inside another next/dynamic never
// commits under `next dev` (the outer boundary stays on its empty fallback).

export type RouteFigureId = keyof typeof ROUTE_FIGURES;
type Mode = 'placeholder' | 'webgl' | 'svg';

/** Matches the em breakpoint in assets/css/stage.css. */
const DESKTOP = '(min-width: 56.25em)';
/** Camera: a little higher than the homepage's, to look into the interference patterns. */
const POSE = { yaw: -0.36, elevation: 0.62 };
const MESH_DESKTOP: [number, number] = [256, 160];
const MESH_PHONE: [number, number] = [128, 80];
const ENTRANCE_MS = 600;
const MARGIN = 6;

/**
 * The live part of a page header's figure (the figure, its placeholder and
 * caption are RouteFigure): the exact state drawn by the WebGL
 * stage once the page is idle, or the SVG contour fallback. After its entrance
 * the state evolves freely and nonstop (lib/stage/routes.mjs); reduced motion
 * gets one still frame at rest.
 */
export default function StageSlot({ figure }: { figure: RouteFigureId }) {
  const spec = ROUTE_FIGURES[figure];
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const forcedColors = useMediaQuery('(forced-colors: active)');
  const desktop = useMediaQuery(DESKTOP, true);
  const [mode, setMode] = useState<Mode>('placeholder');

  // Start once the page has loaded (or the client navigation settled) and the
  // browser is idle, so the figure never competes with the page's own content.
  useEffect(() => {
    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      const svgOnly = new URLSearchParams(window.location.search).get('webgl') === '0';
      setMode(svgOnly ? 'svg' : 'webgl');
    };
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

  const freeRect = useCallback(
    (host: DOMRect): Rect => ({
      left: MARGIN,
      top: MARGIN,
      width: Math.max(1, host.width - 2 * MARGIN),
      height: Math.max(1, host.height - 2 * MARGIN),
    }),
    [],
  );

  const effectiveMode: Mode = forcedColors && mode !== 'placeholder' ? 'svg' : mode;

  return (
    <div className="route-figure__live">
      {effectiveMode === 'webgl' && (
        <StageCanvas
          key={desktop ? 'desktop' : 'phone'}
          preset={spec.preset}
          fullMesh={desktop ? MESH_DESKTOP : MESH_PHONE}
          pose={POSE}
          freeRect={freeRect}
          animate={!reduced}
          entranceMs={ENTRANCE_MS}
          initialParams={restParams(spec.preset)}
          evolve={spec.dynamics}
          onHandle={() => {}}
          onFallback={() => setMode('svg')}
        />
      )}
      {effectiveMode === 'svg' && <FigureFallback preset={spec.preset} />}
    </div>
  );
}
