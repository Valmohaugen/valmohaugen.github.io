'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { NAV_LINKS } from '@/lib/nav';

/** Scrolled this far (px), the bar condenses. */
const CONDENSE_AT = 8;
/** How long the menu's closing animation may run (--dur-settle, plus slack). */
const CLOSING_MS = 400;

/**
 * The site bar: brand, page links, and on small screens a menu button that
 * drops the links down as a panel over a dimmed page.
 *
 * @param social - The profile links shown at the foot of the small-screen
 *   menu, rendered on the server (components/NavSocial.tsx) so their icons
 *   add nothing to this component's JavaScript.
 */
export default function Header({ social }: { social?: React.ReactNode }) {
  const pathname = usePathname();
  // The menu belongs to the path it was opened on, so navigating closes it
  // without a state update inside an effect, and leaving that path forgets it
  // (adjusted during render), so Back, Forward, the brand or a footer link
  // never brings the visitor back to it open.
  const [openPath, setOpenPath] = useState<string | null>(null);
  if (openPath !== null && openPath !== pathname) setOpenPath(null);
  const open = openPath === pathname;
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const closingTimer = useRef(0);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenPath(null);
        toggleRef.current?.focus();
      }
    }
    // A click outside the bar (the backdrop included) closes the menu, and so
    // does any link in it: the brand on the homepage and the profile icons
    // change no path, so the path check alone would leave the menu open.
    function onClick(e: MouseEvent) {
      const target = e.target;
      if (!navRef.current || !(target instanceof Element)) return;
      if (!navRef.current.contains(target) || target.closest('a[href]')) setOpenPath(null);
    }
    // Tabbing out of the bar closes it too, so focus never lands on a control
    // hidden under the open panel (WCAG 2.4.11).
    function onFocusIn(e: FocusEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenPath(null);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', onClick);
    document.addEventListener('focusin', onFocusIn);
    // The page behind the open menu does not scroll (the menu exists only on
    // small screens; see responsive.css).
    const root = document.documentElement;
    window.clearTimeout(closingTimer.current);
    root.classList.remove('nav-closing');
    root.classList.add('nav-open');
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', onClick);
      document.removeEventListener('focusin', onFocusIn);
      // The closing animation runs only now, never on a resize across the
      // breakpoint (responsive.css).
      root.classList.remove('nav-open');
      root.classList.add('nav-closing');
      closingTimer.current = window.setTimeout(() => root.classList.remove('nav-closing'), CLOSING_MS);
    };
  }, [open]);

  // The bar condenses once the page scrolls (instantly under reduced motion),
  // and a thin line under it shows how far down the page is (hidden under
  // reduced motion, in CSS).
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      headerRef.current?.classList.toggle('is-condensed', y > CONDENSE_AT);
      progressRef.current?.style.setProperty('--progress', String(max > 0 ? Math.min(1, Math.max(0, y / max)) : 0));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // The page can grow or shrink without a scroll (disclosures): recompute then too.
    const resize = new ResizeObserver(onScroll);
    resize.observe(document.body);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      resize.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="site-header" ref={headerRef}>
      <nav className="nav" ref={navRef} aria-label="Main">
      <div className="container">
        <Link href="/" className="nav-brand">
          Valentine Mohaugen
        </Link>
        <button
          ref={toggleRef}
          type="button"
          className="nav-toggle"
          aria-label="Toggle navigation"
          aria-expanded={open}
          aria-controls="nav-links"
          onClick={() => setOpenPath(open ? null : pathname)}
        >
          <span />
          <span />
          <span />
        </button>
        <ul id="nav-links" className={`nav-links${open ? ' open' : ''}`}>
          {NAV_LINKS.map(({ href, label }, i) => (
            <li key={href} style={{ '--i': i } as CSSProperties}>
              <Link
                href={href}
                className={`nav-link${isActive(href) ? ' active' : ''}`}
                aria-current={isActive(href) ? 'page' : undefined}
                // A link to the page already open changes no path, so close here too.
                onClick={() => setOpenPath(null)}
              >
                {label}
              </Link>
            </li>
          ))}
          {/* Profiles at the foot of the small-screen menu (hidden on desktop). */}
          {social && (
            <li className="nav-social" style={{ '--i': NAV_LINKS.length } as CSSProperties}>
              {social}
            </li>
          )}
        </ul>
        <div className="scroll-progress" ref={progressRef} aria-hidden="true" />
      </div>
      </nav>
      <div className={`nav-backdrop${open ? ' is-open' : ''}`} aria-hidden="true" />
    </header>
  );
}
