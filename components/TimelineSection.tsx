import TimelineItem from '@/components/TimelineItem';
import Decrypt from '@/components/qrng/Decrypt';
import { cn } from '@/lib/cn';
import type { TimelineEntry } from '@/lib/types';

/**
 * A headed list of dated timeline entries, as used across the CV and outreach
 * pages. The heading decrypts the first time it is fully in view.
 *
 * Keys combine title, date, and subtitle. The same work can appear twice in
 * one month at different venues under one title (the MEDA talk and poster,
 * Sep 2026), so title + date alone can collide; the `|` separator keeps
 * "Intern" + "2024" from colliding with "Intern2" + "024".
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
    <div className={cn('cv-section', className)}>
      {/* An "&" stays with the word before it: a line never starts with one. */}
      <Decrypt as="h2" trigger="visible">
        {heading.replace(/ &/g, '\u00a0&')}
      </Decrypt>
      {entries.map((entry) => (
        <TimelineItem entry={entry} key={`${entry.title}|${entry.date}|${entry.subtitle ?? ''}`} />
      ))}
      {children}
    </div>
  );
}
