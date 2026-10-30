import type { Metadata } from 'next';
import {
  ExternalIcon,
  GitHubIcon,
  ScholarIcon,
  OrcidIcon,
  ResearchGateIcon,
} from '@/components/icons';
import PageHeader from '@/components/PageHeader';
import Section from '@/components/Section';
import publications from '@/lib/publications';
import siteConfig from '@/lib/site-config';
import type { Publication } from '@/lib/types';
import { pageMetadata } from '@/lib/metadata';

export const metadata: Metadata = pageMetadata({
  title:
    'Publications',
  description:
    'Peer-reviewed publications by Valentine Mohaugen, Clemson University.',
  path:
    '/publications/',
});

function PubEntry({ pub }: { pub: Publication }) {
  // Titles are unique; the slug ties the DOI link to its paper for screen readers.
  const titleId = `pub-${pub.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;
  return (
    <div className="pub-entry">
      <div className="pub-year">{pub.year}</div>
      <div>
        {/* A level-2 heading for screen readers (like /research/), without the h2 styles. */}
        <p className="pub-title" id={titleId} role="heading" aria-level={2}>
          {pub.title}
        </p>
        <p className="pub-authors">
          {pub.authors.split(", ").map((name, i) => (
            <span key={name}>
              {i > 0 && ", "}
              {name === siteConfig.authorShort ? (
                <strong>{name.replace(/ /g, "\u00a0")}</strong>
              ) : (
                name.replace(/ /g, "\u00a0")
              )}
            </span>
          ))}
        </p>
        <p className="pub-venue">
          <em>{pub.venue}</em>
        </p>
        <div className="pub-links">
          {pub.paperUrl && (
            <a
              href={pub.paperUrl}
              className="link-inline"
              target="_blank"
              rel="noopener noreferrer"
              aria-describedby={titleId}
            >
              <ExternalIcon size={14} />
              {pub.paperUrl.includes("doi.org") ? "DOI" : "Paper (PDF)"}
            </a>
          )}
          {pub.github && (
            <a
              href={pub.github}
              className="link-inline"
              target="_blank"
              rel="noopener noreferrer"
              aria-describedby={titleId}
            >
              <GitHubIcon size={14} />
              GitHub
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// No-break spaces and word joiners in the data are for the screen only.
const plain = (s: string) => s.replace(/\u2060/g, "").replace(/\u00a0/g, " ");

const scholarlyJsonLd = publications.publications.map((pub) => ({
  "@context": "https://schema.org",
  "@type": "ScholarlyArticle",
  headline: plain(pub.title),
  author: pub.authors.split(", ").map((name) => ({ "@type": "Person", name })),
  datePublished: pub.year,
  isPartOf:
    pub.venueType === "journal"
      ? { "@type": "Periodical", name: plain(pub.venue).replace(/\s*\(\d{4}\)$/, "") }
      : { "@type": "CreativeWork", name: plain(pub.venue) },
  ...(pub.paperUrl ? { url: pub.paperUrl } : {}),
}));

export default function PublicationsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(scholarlyJsonLd).replace(/</g, "\\u003c") }}
      />
      <PageHeader title="Publications" subtitle="Peer-reviewed papers" figure="publications" />

      <Section>
        <div className="pub-section">
          {publications.publications.map((pub) => (
            <PubEntry pub={pub} key={pub.title} />
          ))}
        </div>

        <div className="pub-profiles">
          <p>For the most up-&#8288;to-&#8288;date list of publications and citations:</p>
          <div className="pub-profiles__links">
            <a
              href={siteConfig.scholarUrl}
              className="link-inline"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ScholarIcon size={14} />
              Google Scholar
            </a>
            <a
              href={siteConfig.orcidUrl}
              className="link-inline"
              target="_blank"
              rel="noopener noreferrer"
            >
              <OrcidIcon size={14} />
              ORCID
            </a>
            <a
              href={siteConfig.researchgateUrl}
              className="link-inline"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ResearchGateIcon size={14} />
              ResearchGate
            </a>
          </div>
        </div>
      </Section>
    </>
  );
}
