import { useId } from 'react';

import { externalLinkProps } from '@/lib/social';
import type { TimelineEntry } from '@/lib/types';

const NBSP = '\u00a0';

/** A year or version stays with the word before it ("QCE 2026", "Quantathon v3"),
 *  the event or org name stays whole ("SC Quantathon v3", "IBM Quantum"), a
 *  placement stays whole ("3rd place", "Grand Prize Overall"), a "co-" or "self-"
 *  prefix stays with its stem, and a "·" or "&" separator stays at the end of its
 *  line instead of starting the next. */
const keep = (s: string) =>
  s
    .replace(/ (?=(?:19|20)\d{2}(?!\d)|v\d\b)/g, NBSP)
    .replace(/\b(SC|IBM) (?=Quant)/g, `$1${NBSP}`)
    .replace(/\b(\d+(?:st|nd|rd|th)) (?=(?:place|overall)\b)/gi, `$1${NBSP}`)
    .replace(/Grand Prize Overall/g, `Grand${NBSP}Prize${NBSP}Overall`)
    .replace(/Alice & Bob/g, `Alice${NBSP}&${NBSP}Bob`)
    .replace(/Google Quantum AI/g, `Google${NBSP}Quantum${NBSP}AI`)
    .replace(/\b(co|self)-(?=[a-z])/gi, `$1-\u2060`)
    .replace(/ &/g, `${NBSP}&`)
    .replace(/ ·/g, `${NBSP}·`);

/** As `keep`, plus a state or province code stays with its city ("Clemson, SC"). */
const keepPlace = (s: string) => keep(s).replace(/, (?=[A-Z]{2}\b)/g, `,${NBSP}`);

/** One dated entry in a CV/outreach timeline. The title links out when `url` is set. */
export default function TimelineItem({ entry }: { entry: TimelineEntry }) {
  // The subtitle tells same-titled links apart (the MEDA talk and poster).
  const subtitleId = useId();
  return (
    <div className="timeline-item">
      <div className="timeline-date">{entry.date}</div>
      <div className="timeline-title">
        {entry.url ? (
          <a
            href={entry.url}
            // A same-site file (a poster) downloads, as on /research/.
            {...(entry.url.startsWith('/') ? { download: true } : externalLinkProps(entry.url))}
            aria-describedby={entry.subtitle ? subtitleId : undefined}
          >
            {keep(entry.title)}
          </a>
        ) : (
          keep(entry.title)
        )}
      </div>
      {entry.subtitle && (
        <div className="timeline-subtitle" id={subtitleId}>
          {keepPlace(entry.subtitle)}
        </div>
      )}
      {entry.desc && <div className="timeline-desc">{keepPlace(entry.desc)}</div>}
    </div>
  );
}
