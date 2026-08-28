import Image from 'next/image';
import Link from 'next/link';
import StarfieldAccent from '@/components/StarfieldAccent';
import StarDivider from '@/components/StarDivider';
import {
  EmailIcon,
  GitHubIcon,
  LinkedInIcon,
  ScholarIcon,
  OrcidIcon,
  ResearchGateIcon,
} from '@/components/icons';
import siteConfig from '@/data/site-config.json';
import news from '@/data/news.json';
import projects from '@/data/projects.json';
import type { Project } from '@/lib/types';

const HERO_LINKS = [
  { label: 'Email', href: `mailto:${siteConfig.email}`, Icon: EmailIcon },
  { label: 'GitHub', href: siteConfig.githubUrl, Icon: GitHubIcon },
  { label: 'LinkedIn', href: siteConfig.linkedinUrl, Icon: LinkedInIcon },
  { label: 'Scholar', href: siteConfig.scholarUrl, Icon: ScholarIcon },
  { label: 'ORCID', href: siteConfig.orcidUrl, Icon: OrcidIcon },
  { label: 'ResearchGate', href: siteConfig.researchgateUrl, Icon: ResearchGateIcon },
];

export default function HomePage() {
  const highlights = (projects as Project[]).filter((p) => p.highlight);

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
              I&apos;m a first-year Ph.D. student and Graduate Research
              Assistant in Civil Engineering at {siteConfig.affiliation},
              advised by {siteConfig.advisor}. My
              research is in quantum machine learning, cybersecurity, and
              cyber-physical systems, developing quantum-enhanced learning
              methods for intelligent, secure transportation and critical
              infrastructure. I earned my B.S. in Physics with a minor in
              Italian Studies at Clemson in May 2026, and I&apos;m an IBM
              Qiskit Advocate and a co-founder and President of the{' '}
              <a href={siteConfig.clubUrl} target="_blank" rel="noopener noreferrer">
                Clemson Quantum Club
              </a>.
            </p>
            <div className="hero-links">
              {HERO_LINKS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  className="btn btn-outline btn-sm"
                  target={href.startsWith('mailto:') ? undefined : '_blank'}
                  rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                >
                  <Icon size={16} />
                  {label}
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
      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <h2>Latest</h2>
          </div>
          <ul className="news-list reveal">
            {news.slice(0, 5).map(({ date, text }) => (
              <li className="news-item" key={date + text.slice(0, 24)}>
                <span className="news-date">{date}</span>
                <span className="news-text">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <StarDivider />

      {/* Research Highlights */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Research Highlights</h2>
          </div>

          {highlights.map((project, i) => (
            <div
              className={`highlight-item reveal${i > 0 ? ` reveal-delay-${i}` : ''}`}
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
        </div>
      </section>
    </>
  );
}
