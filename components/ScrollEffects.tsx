'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { drawFraction, penLine, revealDelay } from '@/lib/motion/scroll.mjs';

/** Blocks that rise into view as the page scrolls: one per row, card or entry. */
const REVEAL = [
  '.news-item',
  '.highlight-item',
  '.highlight-more',
  '.research-entry',
  '.pub-entry',
  '.pub-profiles',
  '.timeline-item',
  '.skill-category',
  '.cv-societies',
  '.contact-item',
]
  .map((selector) => `main ${selector}`)
  .join(', ');

/** Matches --dur-morph in tokens.css (the reveal's length), plus a frame of slack. */
const REVEAL_MS = 600 + 50;

/**
 * Scroll effects for every page (assets/css/motion.css):
 * - blocks below the fold rise and fade in as they enter the viewport, a few
 *   at a time; anything already on screen, or above it, is never hidden;
 * - timeline rails (CV, outreach) draw down in the primary colour as the page
 *   scrolls past a pen line 70% down the viewport, which glides to the bottom
 *   edge as the page ends so every rail finishes (lib/motion/scroll.mjs).
 *
 * Without JavaScript, or under reduced motion, nothing is hidden and the rails
 * stay as drawn borders. Section headings decrypt on their own
 * (components/qrng/Decrypt.tsx, `trigger="visible"`).
 */
export default function ScrollEffects() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = document.documentElement;
    const timers = new Set<number>();
    let observer: IntersectionObserver | null = null;
    let drawFrame = 0;
    let rails: HTMLElement[] = [];

    const draw = () => {
      drawFrame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const line = penLine(window.innerHeight, window.scrollY, max);
      for (const rail of rails) {
        const r = rail.getBoundingClientRect();
        const value = drawFraction(r.top, r.height, line).toFixed(3);
        if (rail.style.getPropertyValue('--draw') !== value) rail.style.setProperty('--draw', value);
      }
    };
    const onScroll = () => {
      if (!drawFrame) drawFrame = requestAnimationFrame(draw);
    };

    // One frame in, so a client navigation's scroll (to the top or to a
    // #fragment) has happened before anything is measured.
    const setup = requestAnimationFrame(() => {
      root.classList.add('has-scroll-fx');

      rails = [...document.querySelectorAll<HTMLElement>('main .timeline-item')];
      if (rails.length) {
        draw();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
      }

      const fold = window.innerHeight;
      const below = [...document.querySelectorAll<HTMLElement>(REVEAL)].filter(
        (el) => el.getBoundingClientRect().top > fold,
      );
      if (!below.length) return;
      for (const el of below) el.classList.add('fx-pending');
      observer = new IntersectionObserver(
        (entries) => {
          const arriving = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          arriving.forEach((entry, i) => {
            const el = entry.target as HTMLElement;
            observer?.unobserve(el);
            const delay = revealDelay(i);
            el.style.setProperty('--fx-delay', `${delay}ms`);
            el.classList.add('fx-in');
            // Once settled, the block goes back to its plain styles (no
            // lingering transform, transition or delay).
            const timer = window.setTimeout(() => {
              timers.delete(timer);
              el.classList.remove('fx-pending', 'fx-in');
              el.style.removeProperty('--fx-delay');
            }, delay + REVEAL_MS);
            timers.add(timer);
          });
        },
        { rootMargin: '0px 0px -8% 0px' },
      );
      for (const el of below) observer.observe(el);
    });

    // Keyboard focus can land on a link in a block that is on screen but still
    // inside the observer's bottom 8% (the browser does not scroll an element
    // that is already fully visible): show that block at once, so focus never
    // sits on a transparent control.
    const onFocusIn = (event: FocusEvent) => {
      const el = event.target instanceof Element ? event.target.closest<HTMLElement>('.fx-pending') : null;
      if (!el) return;
      observer?.unobserve(el);
      el.classList.remove('fx-pending', 'fx-in');
      el.style.removeProperty('--fx-delay');
    };
    document.addEventListener('focusin', onFocusIn);

    return () => {
      cancelAnimationFrame(setup);
      cancelAnimationFrame(drawFrame);
      observer?.disconnect();
      document.removeEventListener('focusin', onFocusIn);
      for (const timer of timers) window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      root.classList.remove('has-scroll-fx');
      for (const el of document.querySelectorAll<HTMLElement>('.fx-pending, .fx-in')) {
        el.classList.remove('fx-pending', 'fx-in');
        el.style.removeProperty('--fx-delay');
      }
    };
  }, [pathname]);

  return null;
}
