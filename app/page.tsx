import Image from 'next/image';
import Link from 'next/link';
import StarfieldAccent from '@/components/StarfieldAccent';
import StarDivider from '@/components/StarDivider';
import Section from '@/components/Section';
import siteConfig from '@/lib/site-config';
import news from '@/data/news.json';
import projects from '@/data/projects.json';
import { SOCIAL_PROFILES, externalLinkProps } from '@/lib/social';
import type { NewsItem, Project } from '@/lib/types';

const allProjects: Project[] = projects;
const newsItems: NewsItem[] = news;

export default function HomePage() {
  const highlights = allProjects.filter((p) => p.highlight);

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <StarfieldAccent />
        <div className="container">
          <div className="hero-text">
            <h1 className="hero-name">Valentine Mohaugen</h1>
            <p className="hero-title">{siteConfig.title}</p>
            <p className="hero-tagline">
              I&rsquo;m a first-year Ph.D. student and Graduate Research
              Assistant in Civil Engineering at {siteConfig.affiliation},
              advised by {siteConfig.advisor}. My
              research is in quantum machine learning, cybersecurity, and
              cyber-physical systems, developing quantum-enhanced learning
              methods for intelligent, secure transportation and critical
              infrastructure. I earned my B.S. in Physics with a minor in
              Italian Studies at Clemson in May 2026, and I&rsquo;m an IBM
              Qiskit Advocate and a co-founder and President of the{' '}
              <a href={siteConfig.clubUrl} target="_blank" rel="noopener noreferrer">
                Clemson Quantum Club
              </a>.
            </p>
            <div className="hero-links">
              {SOCIAL_PROFILES.map(({ key, shortLabel, href, Icon }) => (
                <a
                  key={key}
                  href={href}
                  className="btn btn-outline btn-sm"
                  {...externalLinkProps(href)}
                >
                  <Icon size={16} />
                  {shortLabel}
                </a>
              ))}
            </div>
          </div>
          <div className="hero-photo">
            <Image
              src="/images/headshot.webp"
              alt="Portrait photo of Valentine Mohaugen"
              width={460}
              height={613}
              priority
            />
          </div>
        </div>
      </section>

      {/* News */}
      <Section alt>
          <div className="section-header">
            <h2>Latest</h2>
          </div>
          <ul className="news-list reveal">
            {newsItems.slice(0, 5).map(({ date, text }) => (
              <li className="news-item" key={date + text.slice(0, 24)}>
                <span className="news-date">{date}</span>
                <span className="news-text">{text}</span>
              </li>
            ))}
          </ul>
      </Section>

      <StarDivider />

      {/* Research Highlights */}
      <Section>
          <div className="section-header">
            <h2>Research Highlights</h2>
          </div>

          {highlights.map((project, i) => (
            <div
              className="highlight-item reveal"
              style={{ '--reveal-index': i } as React.CSSProperties}
              key={project.id}
            >
              <div className="highlight-summary">
                <h3>
                  <Link href={`/research/#${project.id}`}>{project.title}</Link>
                </h3>
                <p>{project.blurb}</p>
              </div>
            </div>
          ))}

          <p className="highlight-more reveal">
            <Link href="/research/">View all projects &rarr;</Link>
          </p>
      </Section>
    </>
  );
}
