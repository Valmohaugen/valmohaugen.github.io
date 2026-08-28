'use client';

import { useEffect, useRef } from 'react';

const MAX_DPR = 2;
const PX_PER_STAR = 22000; // parent px² per star, keeps the field sparse
const MAX_STARS = 50;

interface Star {
  x: number; // 0..1 of width
  y: number; // 0..1 of height
  r: number;
  baseAlpha: number;
  twinklePhase: number;
  twinkleSpeed: number; // rad/s
  driftX: number; // fraction of width per second
}

// Very faint drifting star specks behind the hero: a hint of night sky, not a
// theme. Stars twinkle slowly and drift sideways at a few px/min. The rAF loop
// only runs while the canvas is on screen and the tab is visible; visitors who
// prefer reduced motion get a single static frame. Star color follows the
// theme's primary color, re-read when the OS color scheme flips.
export default function StarfieldAccent() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const darkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    let stars: Star[] = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let running = false;
    let last = 0;
    let color = '26, 86, 219';

    function readColor() {
      const token = getComputedStyle(document.documentElement)
        .getPropertyValue('--starfield-rgb')
        .trim();
      color = token || (darkScheme.matches ? '155, 188, 255' : '26, 86, 219');
    }

    function seed() {
      const count = Math.min(MAX_STARS, Math.round((width * height) / PX_PER_STAR));
      stars = Array.from({ length: count }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: 0.6 + Math.random() * 1.1,
        baseAlpha: 0.04 + Math.random() * 0.1,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.3 + Math.random() * 0.5,
        driftX: (Math.random() - 0.5) * 0.004,
      }));
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      width = parent!.offsetWidth;
      height = parent!.offsetHeight;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      seed();
      if (!running) drawFrame(performance.now());
    }

    function drawFrame(now: number) {
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, width, height);
      const t = now / 1000;
      for (const s of stars) {
        const alpha = reducedMotion.matches
          ? s.baseAlpha
          : s.baseAlpha * (0.6 + 0.4 * Math.sin(s.twinklePhase + t * s.twinkleSpeed));
        ctx!.beginPath();
        ctx!.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${color}, ${Math.max(alpha, 0)})`;
        ctx!.fill();
      }
    }

    function tick(now: number) {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      for (const s of stars) {
        s.x += s.driftX * dt;
        if (s.x > 1.02) s.x = -0.02;
        if (s.x < -0.02) s.x = 1.02;
      }
      drawFrame(now);
      raf = requestAnimationFrame(tick);
    }

    function start() {
      if (running || reducedMotion.matches) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    const visibility = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !document.hidden) start();
        else stop();
      },
      { threshold: 0 }
    );

    function onVisibilityChange() {
      if (document.hidden) stop();
      else start();
    }
    function onMotionChange() {
      stop();
      drawFrame(performance.now());
      if (!reducedMotion.matches) start();
    }
    function onSchemeChange() {
      readColor();
      drawFrame(performance.now());
    }

    readColor();
    resize();
    visibility.observe(canvas);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibilityChange);
    reducedMotion.addEventListener('change', onMotionChange);
    darkScheme.addEventListener('change', onSchemeChange);

    return () => {
      stop();
      visibility.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      reducedMotion.removeEventListener('change', onMotionChange);
      darkScheme.removeEventListener('change', onSchemeChange);
    };
  }, []);

  return <canvas ref={canvasRef} className="starfield-accent" aria-hidden="true" />;
}
