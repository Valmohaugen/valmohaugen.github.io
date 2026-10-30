'use client';

import { useEffect, useId, useState, useSyncExternalStore } from 'react';

import MathText from '@/components/MathText';
import StageMount from '@/components/stage/StageMount';
import type { RouteFigureId } from '@/components/stage/StageSlot';
import { ROUTE_FIGURES } from '@/lib/stage/routes.mjs';

/** Never changes: only tells the server render (false) from the browser (true). */
const subscribeNever = () => () => {};

/**
 * A page header's figure: the placeholder and caption are in the HTML (no
 * JavaScript needed to read them); StageMount loads the live part (WebGL or
 * the SVG fallback) as its own chunk once the page is running.
 *
 * The caption stays hidden until it is asked for: it shows while the pointer
 * is over the figure, while the figure has keyboard focus, or after a tap (the
 * transparent button over the figure toggles it). Esc hides it, also while
 * hovered (WCAG 1.4.13). Screen readers always read it as the <figcaption>.
 */
export default function RouteFigure({ figure }: { figure: RouteFigureId }) {
  const spec = ROUTE_FIGURES[figure];
  const captionId = `figure-caption-${useId().replace(/[^\w-]/g, '')}`;
  // Without JavaScript the button does nothing while keyboard focus still shows
  // the caption (stage.css), so the server markup claims no collapsed state.
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  const [open, setOpen] = useState(false);
  // Esc hides a hovered or focused caption until the pointer leaves or next enters,
  // or focus returns: an Esc pressed elsewhere (closing the phone menu, say) never
  // hides a later hover's caption.
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      setDismissed(true);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const state = open ? ' is-open' : dismissed ? ' is-dismissed' : '';
  return (
    <figure
      className={`route-figure route-figure--${spec.preset}${state}`}
      onPointerEnter={() => setDismissed(false)}
      onPointerLeave={() => setDismissed(false)}
    >
      <div className="route-figure__stage" aria-hidden="true">
        <div className="route-figure__placeholder" />
        <StageMount figure={figure} />
      </div>
      <button
        type="button"
        className="route-figure__reveal"
        aria-label="Figure caption"
        aria-expanded={hydrated ? open : undefined}
        aria-controls={hydrated ? captionId : undefined}
        onClick={() => {
          // Closing also dismisses, so a caption shown by hover or keyboard
          // focus hides too and aria-expanded always matches the screen.
          setOpen(!open);
          setDismissed(open);
        }}
        onFocus={(event) => {
          setDismissed(false);
          // Keyboard focus shows the caption (stage.css), so it opens it here too.
          if (event.currentTarget.matches(':focus-visible')) setOpen(true);
        }}
        onBlur={() => setOpen(false)}
      />
      <figcaption id={captionId} className="route-figure__caption">
        <MathText text={spec.caption} />
      </figcaption>
    </figure>
  );
}
