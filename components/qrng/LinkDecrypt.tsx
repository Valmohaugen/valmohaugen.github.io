'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { motionAllowed, sharedDigits } from '@/components/qrng/digits';
import { decryptPlan, glyphAt } from '@/lib/qrng/decrypt.mjs';

/** Text links in the page and the footer. Buttons and the header bar keep still. */
const LINKS = 'main a[href]:not(.btn), .footer a[href]:not(.btn)';

interface Piece {
  node: Text;
  /** UTF-16 offset of the character in its text node. */
  offset: number;
  char: string;
}

/**
 * Plays the decrypt over one link's text: each character shows measured
 * digits for a moment, then itself (lib/qrng/decrypt.mjs, at most 600 ms).
 * The link and its text never change: the digits draw in an aria-hidden
 * overlay at each character's own position while the link's text is
 * see-through (its underline and icon stay). Returns a function that stops it.
 */
function play(link: HTMLElement, done: () => void): () => void {
  const pieces: Piece[] = [];
  const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node as Text;
    if (text.parentElement?.closest('svg')) continue;
    let offset = 0;
    for (const char of Array.from(text.data)) {
      pieces.push({ node: text, offset, char });
      offset += char.length;
    }
  }
  const reader = sharedDigits();
  const plan = decryptPlan(pieces.map((p) => p.char).join(''), () => reader.next());
  if (!plan.glyphs.length) {
    // Nothing to draw (an icon-only link): report done once the caller has
    // registered this run, so the link is not left marked as running.
    queueMicrotask(done);
    return () => {};
  }

  // The overlay carries the link's type, so the digits are set in it too (qrng.css).
  const computed = getComputedStyle(link);
  const layer = document.createElement('span');
  layer.className = 'link-decrypt';
  layer.setAttribute('aria-hidden', 'true');
  Object.assign(layer.style, {
    color: computed.color,
    fontFamily: computed.fontFamily,
    fontSize: computed.fontSize,
    fontStyle: computed.fontStyle,
    fontWeight: computed.fontWeight,
    letterSpacing: computed.letterSpacing,
  });
  const range = document.createRange();
  const spans = plan.glyphs.map((g) => {
    const { node, offset, char } = pieces[g.index];
    range.setStart(node, offset);
    range.setEnd(node, offset + char.length);
    const box = range.getBoundingClientRect();
    const span = document.createElement('span');
    span.className = 'decrypt__glyph decrypt__glyph--digit';
    Object.assign(span.style, {
      left: `${box.left + window.scrollX}px`,
      top: `${box.top + window.scrollY}px`,
      width: `${box.width}px`,
      height: `${box.height}px`,
    });
    span.textContent = glyphAt(g, 0);
    layer.append(span);
    return span;
  });
  // The first frame and the see-through text land in the same paint.
  document.body.append(layer);
  link.classList.add('is-decrypting');

  let frame = 0;
  const stop = () => {
    cancelAnimationFrame(frame);
    layer.remove();
    link.classList.remove('is-decrypting');
    done();
  };
  const start = performance.now();
  const step = (now: number) => {
    const t = now - start;
    if (t >= plan.total) return stop();
    // Follow the link's colour as it eases to its hover colour, so the digits
    // match the underline and icon and nothing snaps when the layer lifts.
    const color = getComputedStyle(link).color;
    if (layer.style.color !== color) layer.style.color = color;
    plan.glyphs.forEach((g, i) => {
      const text = glyphAt(g, t);
      if (spans[i].textContent !== text) {
        spans[i].textContent = text;
        spans[i].classList.toggle('decrypt__glyph--digit', text !== g.char);
      }
    });
    frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
  return stop;
}

/**
 * Text links decrypt through the measured ibm_sherbrooke digits each time a
 * mouse moves onto them. Skipped on touch, under reduced motion, in
 * forced-colors mode and while the link's block is still rising into view
 * (ScrollEffects). A click or a page change stops any decrypt at once, so
 * no digits linger over the next page. Renders nothing.
 */
export default function LinkDecrypt() {
  const pathname = usePathname();

  useEffect(() => {
    const running = new Map<Element, () => void>();
    const stopAll = () => {
      for (const stop of [...running.values()]) stop();
    };
    const onOver = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLElement>(LINKS);
      if (!link || running.has(link)) return;
      // A link in a block ScrollEffects is still hiding or lifting into view
      // keeps still: its digits are placed once and could not follow the block.
      if (link.closest('.fx-pending')) return;
      // Moving between parts of the same link is not a new hover.
      if (event.relatedTarget instanceof Node && link.contains(event.relatedTarget)) return;
      if (!motionAllowed()) return;
      running.set(link, play(link, () => running.delete(link)));
    };
    document.addEventListener('pointerover', onOver);
    document.addEventListener('click', stopAll, true);
    return () => {
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('click', stopAll, true);
      stopAll();
    };
  }, [pathname]);

  return null;
}
