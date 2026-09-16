import type { Metadata } from 'next';
import { GitHubIcon, ScholarIcon, OrcidIcon } from '@/components/icons';
import publications from '@/data/publications.json';
import siteConfig from '@/data/site-config.json';
import type { Publication } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Publications',
  description:
    'Peer-reviewed publications by Valentine Mohaugen, Clemson University.',
  openGraph: {
    title: 'Publications · Valentine Mohaugen',
    description:
      'Peer-reviewed publications by Valentine Mohaugen, Clemson University.',
    url: '/publications/',
  },
};

function PubEntry({ pub }: { pub: Publication }) {
  return (
    <div className="pub-entry">
      <div className="pub-year">{pub.year}</div>
      <div>
        <p className="pub-title">{pub.title}</p>
        <p className="pub-authors">{pub.authors}</p>
        <p className="pub-venue">
          <em>{pub.venue}</em>
        </p>
        <div className="pub-links">
          {pub.paperUrl && (
            <a href={pub.paperUrl} className="link-inline" target="_blank" rel="noopener noreferrer">
              {pub.paperUrl.includes('doi.org') ? 'DOI' : 'Paper (PDF)'}
            </a>
          )}
          {pub.github && (
            <a href={pub.github} className="link-inline" target="_blank" rel="noopener noreferrer">
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
  '@context': 'https://schema.org',
  '@type': 'ScholarlyArticle',
  headline: pub.title,
  author: pub.authors.split(', ').map((name) => ({ '@type': 'Person', name })),
  datePublished: pub.year,
  publication: pub.venue,
  ...(pub.paperUrl ? { url: pub.paperUrl } : {}),
}));

export default function PublicationsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(scholarlyJsonLd) }}
      />
      <section className="page-header">
        <div className="container">
          <h1>Publications</h1>
          <p>Peer-reviewed papers</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="pub-section reveal">
            {publications.publications.map((pub) => (
              <PubEntry pub={pub} key={pub.title} />
            ))}
          </div>

          <div className="pub-profiles reveal">
            <p>For the most up-to-date list of publications and citations:</p>
            <div className="pub-profiles__links">
              <a href={siteConfig.scholarUrl} className="link-inline" target="_blank" rel="noopener noreferrer">
                <ScholarIcon size={16} />
                Google Scholar
              </a>
              <a href={siteConfig.orcidUrl} className="link-inline" target="_blank" rel="noopener noreferrer">
                <OrcidIcon size={16} />
                ORCID
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
