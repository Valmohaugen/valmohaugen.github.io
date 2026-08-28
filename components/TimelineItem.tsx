import type { TimelineEntry } from '@/lib/types';

/**
 * One dated entry in a CV/outreach timeline. If `subtitleHref` is given the
 * subtitle renders as an external link.
 */
export default function TimelineItem({
  entry,
  subtitleHref,
}: {
  entry: TimelineEntry;
  subtitleHref?: string;
}) {
  return (
    <div className="timeline-item">
      <div className="timeline-date">{entry.date}</div>
      <div className="timeline-title">{entry.title}</div>
      {entry.subtitle &&
        (subtitleHref ? (
          <div className="timeline-subtitle">
            <a href={subtitleHref} target="_blank" rel="noopener noreferrer">
              {entry.subtitle}
            </a>
          </div>
        ) : (
          <div className="timeline-subtitle">{entry.subtitle}</div>
        ))}
      {entry.desc && <div className="timeline-desc">{entry.desc}</div>}
    </div>
  );
}
