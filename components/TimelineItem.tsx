import { externalLinkProps } from '@/lib/social';
import type { TimelineEntry } from '@/lib/types';

/** One dated entry in a CV/outreach timeline. The title links out when `url` is set. */
export default function TimelineItem({ entry }: { entry: TimelineEntry }) {
  return (
    <div className="timeline-item">
      <div className="timeline-date">{entry.date}</div>
      <div className="timeline-title">
        {entry.url ? (
          <a href={entry.url} {...externalLinkProps(entry.url)}>
            {entry.title}
          </a>
        ) : (
          entry.title
        )}
      </div>
      {entry.subtitle && <div className="timeline-subtitle">{entry.subtitle}</div>}
      {entry.desc && <div className="timeline-desc">{entry.desc}</div>}
    </div>
  );
}
