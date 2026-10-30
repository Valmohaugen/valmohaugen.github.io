'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

const WALK_MS = 2400;
const SESSION_KEY = 'cat-walked';

/**
 * Walks the footer cat in once per session, the first time the footer comes
 * into view (at most 2.4 s, then it sits). Never under reduced motion; if
 * sessionStorage is blocked the cat simply sits.
 */
export default function FooterCatWalk({ children }: { children: ReactNode }) {
  const [walking, setWalking] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try {
      if (window.sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      return;
    }
    let timer = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        try {
          window.sessionStorage.setItem(SESSION_KEY, '1');
        } catch {
          return;
        }
        setWalking(true);
        timer = window.setTimeout(() => setWalking(false), WALK_MS);
      },
      { threshold: 0.6 },
    );
    observer.observe(host);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <span ref={ref} className={walking ? 'footer-cat__walker is-walking' : 'footer-cat__walker'} aria-hidden="true">
      {children}
    </span>
  );
}
