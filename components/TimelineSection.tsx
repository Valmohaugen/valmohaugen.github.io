import TimelineItem from '@/components/TimelineItem';
import { cn } from '@/lib/cn';
import type { TimelineEntry } from '@/lib/types';

/**
 * A headed list of dated timeline entries, as used across the CV and outreach
 * pages.
 *
 * Keys combine title and date. Several arrays already contain repeated titles
 * (two "Summer Intern" entries, two "Undergraduate Research Assistant"), so a
 * title-only key would collide; the `|` separator keeps "Intern" + "2024" from
 * colliding with "Intern2" + "024".
 *
 * @param children - Rendered after the entries, for one-off trailing content
 *   such as the societies line on the CV.
 */
export default function TimelineSection({
  heading,
  entries,
  className,
  children,
}: {
  heading: string;
  entries: TimelineEntry[];
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn('cv-section', 'reveal', className)}>
      <h2>{heading}</h2>
      {entries.map((entry) => (
        <TimelineItem entry={entry} key={`${entry.title}|${entry.date}`} />
      ))}
      {children}
    </div>
  );
}
