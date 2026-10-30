/** The typed publication list. Import this rather than the JSON directly. */

import data from '@/data/publications.json';
import type { PublicationsData } from '@/lib/types';

const VENUE_TYPES: readonly string[] = ['journal', 'conference'];

// JSON imports widen venueType to string, so check it once at build time.
for (const pub of data.publications) {
  if (!VENUE_TYPES.includes(pub.venueType)) {
    throw new Error(
      `data/publications.json: "${pub.title}" has venueType "${pub.venueType}"; expected "journal" or "conference".`,
    );
  }
}

const publications = data as PublicationsData;

export default publications;
