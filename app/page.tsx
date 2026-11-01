import Image from 'next/image';
import Link from 'next/link';
import StarDivider from '@/components/StarDivider';
import Section from '@/components/Section';
import HeroScene from '@/components/stage/HeroScene';
import MathText from '@/components/MathText';
import Decrypt from '@/components/qrng/Decrypt';
import { ArrowRightIcon } from '@/components/icons';
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
      {/* Hero: the intro panel is server-rendered (it holds the LCP text);
          HeroScene adds the WebGL figure behind it and the cat after it, so
          the name and intro come first in reading and focus order. */}
      <section className="hero hero--stage" aria-labelledby="hero-name">
        <HeroScene>
          <div className="container hero-layout">
            <div className="hero-panel">
              <div className="hero-id">
                <Image
                  className="hero-avatar"
                  src="/images/headshot-240.webp"
                  alt="Portrait photo of Valentine Mohaugen"
                  width={96}
                  height={96}
                  preload
                />
                <div>
                  <h1 className="hero-name" id="hero-name">
                    Valentine Mohaugen
                  </h1>
                  <p className="hero-title">{siteConfig.title}</p>
                </div>
              </div>
              <p className="hero-tagline">
                I&rsquo;m a first-year Ph.D.&nbsp;student in Civil Engineering at {siteConfig.affiliation}{' '}
                and a Graduate Research Assistant at the National Center for
                Transportation Cybersecurity and Resiliency (TraCR), advised by {siteConfig.advisor}.
                My
                research is in quantum ML/AI, cybersecurity, and
                cyber-&#8288;physical systems, with applications to securing critical
                infrastructure and transportation. I earned my B.S.&nbsp;in&nbsp;Physics with a minor in
                Italian Studies at Clemson in May&nbsp;2026, and I&rsquo;m an IBM
                Qiskit Advocate, a co-&#8288;founder and President of the{' '}
                <a href={siteConfig.clubUrl} target="_blank" rel="noopener noreferrer">
                  Clemson&nbsp;Quantum&nbsp;Club
                </a>, and Director&nbsp;of SC&nbsp;Quantathon.
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
          </div>
        </HeroScene>
      </section>

      {/* News */}
      <Section alt>
          <div className="section-header">
            <Decrypt as="h2" trigger="visible">
              Latest
            </Decrypt>
          </div>
          <ul className="news-list">
            {newsItems.slice(0, 5).map(({ date, text }) => (
              <li className="news-item" key={date + text.slice(0, 24)}>
                <span className="news-date">{date}</span>
                <span className="news-text">{text}</span>
              </li>
            ))}
          </ul>

          <p className="highlight-more">
            <Link href="/news/">
              View all news <ArrowRightIcon size={14} />
            </Link>
          </p>
      </Section>

      <StarDivider />

      {/* Research Highlights */}
      <Section>
          <div className="section-header">
            <Decrypt as="h2" trigger="visible">
              Research Highlights
            </Decrypt>
          </div>

          {highlights.map((project) => (
            <div className="highlight-item" key={project.id}>
              <div className="highlight-summary">
                <h3>
                  <Link href={`/research/#${project.id}`}>{project.title}</Link>
                </h3>
                <p>
                  <MathText text={project.blurb} />
                </p>
              </div>
            </div>
          ))}

          <p className="highlight-more">
            <Link href="/research/">
              View all projects <ArrowRightIcon size={14} />
            </Link>
          </p>
      </Section>
    </>
  );
}
