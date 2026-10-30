'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

import { motionAllowed, sharedDigits } from '@/components/qrng/digits';
import { decryptPlan, glyphAt } from '@/lib/qrng/decrypt.mjs';

/**
 * When the effect plays: on a client navigation to a route not yet seen in
 * this page's lifetime (page titles), once on load (the 404 code), or the
 * first time the text is fully in view (section headings, research titles).
 */
type Trigger = 'navigation' | 'load' | 'visible';

interface Glyph {
  key: number;
  text: string;
  digit: boolean;
  box: CSSProperties;
}

/** Routes whose title has fully resolved after the effect in this page's lifetime. */
const seenRoutes = new Set<string>();

/** The path the browser loaded directly (its title appears without the effect). */
function hardLoadPath() {
  const entry = performance.getEntriesByType('navigation')[0];
  return new URL(entry?.name ?? window.location.href).pathname;
}

/**
 * Text that decrypts through measured ibm_sherbrooke digits.
 * The element and its text node are never changed: for at most 600 ms the
 * text turns transparent and an aria-hidden, unselectable overlay draws each
 * glyph's digits at the glyph's own position, ending on the real character.
 * Skipped under reduced motion and in forced-colors mode.
 */
export default function Decrypt({
  as: Tag = 'h1',
  className,
  id,
  children,
  trigger = 'navigation',
}: {
  as?: 'h1' | 'h2' | 'h3' | 'p';
  className?: string;
  id?: string;
  children: string;
  trigger?: Trigger;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLElement>(null);
  const [overlay, setOverlay] = useState<{ style: CSSProperties; glyphs: Glyph[] } | null>(null);

  // A layout effect, so the real text is hidden before the first paint of the
  // effect (no flash of the title before it scrambles).
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const el = textRef.current;
    const node = el?.firstChild;
    if (!wrap || !el || !(node instanceof Text) || !motionAllowed()) return;

    let frame = 0;
    const play = (onEnd?: () => void) => {
      const reader = sharedDigits();
      const plan = decryptPlan(children, () => reader.next());
      const origin = wrap.getBoundingClientRect();
      const range = document.createRange();
      // Code-point index → UTF-16 offset in the text node.
      const offsets: number[] = [];
      let offset = 0;
      for (const char of Array.from(children)) {
        offsets.push(offset);
        offset += char.length;
      }
      const boxes = plan.glyphs.map((g) => {
        range.setStart(node, offsets[g.index]);
        range.setEnd(node, offsets[g.index] + g.char.length);
        const r = range.getBoundingClientRect();
        return { left: r.left - origin.left, top: r.top - origin.top, width: r.width, height: r.height };
      });
      const computed = getComputedStyle(el);
      const style: CSSProperties = {
        color: computed.color,
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
        fontStyle: computed.fontStyle,
        fontWeight: computed.fontWeight,
        lineHeight: computed.lineHeight,
        letterSpacing: computed.letterSpacing,
      };
      // The element keeps its text; only its colour changes while the overlay
      // draws. The overlay's first frame mounts now, and the layout effect below
      // hides the text in that same commit, so the title is never blank.
      const first = plan.glyphs.map((g, i) => {
        const text = glyphAt(g, 0);
        return { key: g.index, text, digit: text !== g.char, box: boxes[i] };
      });
      setOverlay({ style, glyphs: first });
      const start = performance.now();
      let last = first.map((g) => g.text).join('');
      const step = (now: number) => {
        const t = now - start;
        if (t >= plan.total) {
          // The text comes back in the layout effect below, in the same
          // commit that removes the overlay (never both for a frame).
          setOverlay(null);
          onEnd?.();
          return;
        }
        const glyphs = plan.glyphs.map((g, i) => {
          const text = glyphAt(g, t);
          return { key: g.index, text, digit: text !== g.char, box: boxes[i] };
        });
        const signature = glyphs.map((g) => g.text).join('');
        if (signature !== last) {
          last = signature;
          setOverlay({ style, glyphs });
        }
        frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };

    // Cleanup (new text, a page change, or React's development-only
    // unmount/remount check) ends the effect where it stands: no frame left
    // running and no overlay left over a transparent title.
    const stop = () => {
      cancelAnimationFrame(frame);
      setOverlay(null);
      el.style.color = '';
    };
    if (trigger === 'load') {
      // Glyph boxes are measured once, so they wait for the text's own face
      // (the 404 preloads no fonts, and the serif swaps in when it arrives).
      let cancelled = false;
      const { fontStyle, fontWeight, fontSize, fontFamily } = getComputedStyle(el);
      const run = () => {
        if (!cancelled) play();
      };
      void document.fonts.load(`${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`, children).then(run, run);
      return () => {
        cancelled = true;
        stop();
      };
    }
    if (trigger === 'navigation') {
      const path = window.location.pathname;
      if (path === hardLoadPath() || seenRoutes.has(path)) return;
      // The route counts as seen only once its title has resolved, so an
      // interrupted effect plays again the next time the title mounts.
      play(() => seenRoutes.add(path));
      return stop;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        // Reduced motion or forced colors may have been switched on since mount.
        if (motionAllowed()) play();
      },
      // Fully in view below the sticky header (--nav-height), not under it.
      { threshold: 1, rootMargin: '-64px 0px 0px 0px' },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      stop();
    };
  }, [children, trigger]);

  // The real text hides when the overlay is committed and returns when it is
  // removed, each in the same paint as the overlay change.
  useLayoutEffect(() => {
    if (textRef.current) textRef.current.style.color = overlay ? 'transparent' : '';
  }, [overlay]);

  return (
    <div className="decrypt" ref={wrapRef}>
      <Tag
        ref={(node: HTMLElement | null) => {
          textRef.current = node;
        }}
        id={id}
        className={className}
      >
        {children}
      </Tag>
      {overlay && (
        <span className="decrypt__overlay" style={overlay.style} aria-hidden="true">
          {overlay.glyphs.map((g) => (
            <span key={g.key} className={g.digit ? 'decrypt__glyph decrypt__glyph--digit' : 'decrypt__glyph'} style={g.box}>
              {g.text}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}
