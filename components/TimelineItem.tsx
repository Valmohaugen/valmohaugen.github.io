import type { TimelineEntry } from '@/lib/types';

/** One dated entry in a CV/outreach timeline. */
export default function TimelineItem({ entry }: { entry: TimelineEntry }) {
  return (
    <div className="timeline-item">
      <div className="timeline-date">{entry.date}</div>
      <div className="timeline-title">{entry.title}</div>
      {entry.subtitle && <div className="timeline-subtitle">{entry.subtitle}</div>}
      {entry.desc && <div className="timeline-desc">{entry.desc}</div>}
    </div>
  );
}
