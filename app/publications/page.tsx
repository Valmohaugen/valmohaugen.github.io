import type { Metadata } from 'next';
import {
  GitHubIcon,
  ScholarIcon,
  OrcidIcon,
  ResearchGateIcon,
} from '@/components/icons';
import PageHeader from '@/components/PageHeader';
import Section from '@/components/Section';
import publications from '@/data/publications.json';
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
  return (
    <div className="pub-entry">
      <div className="pub-year">{pub.year}</div>
      <div>
        <p className="pub-title">{pub.title}</p>
        <p className="pub-authors">
          {pub.authors.split(", ").map((name, i) => (
            <span key={name}>
              {i > 0 && ", "}
              {name === siteConfig.authorShort ? <strong>{name}</strong> : name}
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
            >
              {pub.paperUrl.includes("doi.org") ? "DOI" : "Paper (PDF)"}
            </a>
          )}
          {pub.github && (
            <a
              href={pub.github}
              className="link-inline"
              target="_blank"
              rel="noopener noreferrer"
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

const scholarlyJsonLd = publications.publications.map((pub) => ({
  "@context": "https://schema.org",
  "@type": "ScholarlyArticle",
  headline: pub.title,
  author: pub.authors.split(", ").map((name) => ({ "@type": "Person", name })),
  datePublished: pub.year,
  isPartOf: { "@type": "Periodical", name: pub.venue },
  ...(pub.paperUrl ? { url: pub.paperUrl } : {}),
}));

export default function PublicationsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(scholarlyJsonLd) }}
      />
      <PageHeader title="Publications" subtitle="Peer-reviewed papers" />

      <Section>
        <div className="pub-section reveal">
          {publications.publications.map((pub) => (
            <PubEntry pub={pub} key={pub.title} />
          ))}
        </div>

        <div className="pub-profiles reveal">
          <p>For the most up-to-date list of publications and citations:</p>
          <div className="pub-profiles__links">
            <a
              href={siteConfig.scholarUrl}
              className="link-inline"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ScholarIcon size={16} />
              Google Scholar
            </a>
            <a
              href={siteConfig.orcidUrl}
              className="link-inline"
              target="_blank"
              rel="noopener noreferrer"
            >
              <OrcidIcon size={16} />
              ORCID
            </a>
            <a
              href={siteConfig.researchgateUrl}
              className="link-inline"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ResearchGateIcon size={16} />
              ResearchGate
            </a>
          </div>
        </div>
      </Section>
    </>
  );
}
