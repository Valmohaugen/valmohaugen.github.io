'use client';

import { useId, useState, useSyncExternalStore } from 'react';
import type { SkillCategory } from '@/lib/types';

/** Never changes: only tells the server render (false) from the browser (true). */
const subscribeNever = () => () => {};

/**
 * Expandable skill category card. The toggle is a real button inside the
 * heading (a button may only contain phrasing content, so the card wrapper
 * is a div); the collapsed panel is `hidden` so it leaves the accessibility
 * tree entirely when closed.
 */
export default function SkillCard({ title, summary, items }: SkillCategory) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  // Without JavaScript the panel shows open (app/layout.tsx noscript) and the
  // button does nothing, so the server markup claims no collapsed state.
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);

  return (
    <div className={`skill-category${expanded ? ' skill-category--open' : ''}`}>
      <h3 className="skill-category__heading">
        <button
          type="button"
          className="skill-category__toggle"
          aria-expanded={hydrated ? expanded : undefined}
          aria-controls={hydrated ? panelId : undefined}
          onClick={() => setExpanded((v) => !v)}
        >
          {title}
        </button>
      </h3>
      <p className="skill-category__summary">{summary}</p>
      <div className="skill-details" id={panelId} hidden={!expanded}>
        <ul>
          {items.map(({ label, note }) => (
            <li key={label + note}>
              <strong>{label.replace(/ (?=(?:19|20)\d{2}(?!\d)|v\d\b|&)/g, '\u00a0')}:</strong> {note}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
