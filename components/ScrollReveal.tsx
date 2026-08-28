'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Elements carrying the `.reveal` marker get a gentle fade-and-rise entrance.
// JS adds the hiding class (`reveal-init`) only to elements below the current
// viewport, so the page is fully visible without JavaScript and nothing above
// the fold flashes on load. The huge top rootMargin makes anything at or above
// the viewport count as intersecting, so a fast scroll or anchor jump that
// skips past an element still reveals it instead of leaving it hidden forever.
export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal--visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '100000px 0px -5% 0px' }
    );

    const elements = document.querySelectorAll<HTMLElement>('.reveal');
    elements.forEach((el) => {
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.classList.add('reveal-init');
        observer.observe(el);
      }
    });

    return () => {
      observer.disconnect();
      // Never leave anything hidden across client-side navigations.
      elements.forEach((el) => el.classList.remove('reveal-init'));
    };
  }, [pathname]);

  return null;
}
