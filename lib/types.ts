/** Shared content types for the data/*.json files. */

export interface Project {
  /** Stable slug used as the anchor id on the research page. */
  id: string;
  title: string;
  /** Display label, e.g. "2024 — 2026" or "Apr 2026". */
  year: string;
  /** One-paragraph summary shown in the entry card. */
  blurb: string;
  /** Expanded paragraphs behind the "More details" toggle. */
  details: string[];
  /** Comma-separated key tools line shown at the end of details. */
  keyTools: string;
  /** Hackathon challenge name, shown in the entry meta row. */
  challenge?: string;
  github?: string;
  /** Live-site link, if the project is deployed. */
  live?: string;
  /** Published paper link (arXiv or DOI). */
  paperUrl?: string;
  /** Poster file served from /posters/. */
  posterUrl?: string;
  /** Path under /images/thumbnails/, if a thumbnail exists. */
  thumbnail?: string;
  thumbnailAlt?: string;
  /** Fallback label rendered in the placeholder thumbnail. */
  placeholderLabel?: string;
  /** Shown in the homepage Research Highlights section. */
  highlight?: boolean;
}

/**
 * A homepage news entry. Entries are kept newest-first as a permanent running
 * log; the homepage renders only the first three (see app/page.tsx).
 */
export interface NewsItem {
  /** Display date, e.g. "Apr 2026". */
  date: string;
  text: string;
}

export interface Publication {
  year: string;
  title: string;
  authors: string;
  venue: string;
  github?: string;
  /**
   * Paper link — either a DOI URL (rendered as "DOI") or a local PDF under
   * /papers/ (rendered as "Paper (PDF)").
   */
  paperUrl?: string;
}

export interface PublicationsData {
  publications: Publication[];
}

/** One dated entry in a CV/outreach timeline section. */
export interface TimelineEntry {
  /** Display date or range, e.g. "Aug 2026 — Present". */
  date: string;
  title: string;
  /** Institution / venue line under the title. */
  subtitle?: string;
  desc?: string;
}

/** An expandable category in the CV skills grid (see SkillCard). */
export interface SkillCategory {
  title: string;
  /** Comma-separated headline list shown when collapsed. */
  summary: string;
  /** Project/context mappings shown when expanded. */
  items: { label: string; note: string }[];
}

export interface CvData {
  education: TimelineEntry[];
  research: TimelineEntry[];
  leadership: TimelineEntry[];
  presentations: TimelineEntry[];
  awards: TimelineEntry[];
  /** Professional & honor societies, dot-separated display string. */
  societies: string;
  skills: SkillCategory[];
}
