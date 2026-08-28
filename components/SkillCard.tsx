'use client';

import { useId, useState } from 'react';
import type { SkillCategory } from '@/lib/types';

/**
 * Expandable skill category card. The toggle is a real button inside the
 * heading (a button may only contain phrasing content, so the card wrapper
 * is a div); the collapsed panel is `hidden` so it leaves the accessibility
 * tree entirely when closed.
 */
export default function SkillCard({ title, summary, items }: SkillCategory) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  return (
    <div className={`skill-category${expanded ? ' skill-category--open' : ''}`}>
      <h3 className="skill-category__heading">
        <button
          type="button"
          className="skill-category__toggle"
          aria-expanded={expanded}
          aria-controls={panelId}
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
              <strong>{label}</strong>: {note}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
