import type { Metadata } from 'next';
import TimelineItem from '@/components/TimelineItem';
import cv from '@/data/cv.json';
import siteConfig from '@/data/site-config.json';
import type { CvData } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Outreach',
  description:
    'Talks, presentations, outreach activities, and community engagement by Valentine Mohaugen.',
  openGraph: {
    title: 'Outreach · Valentine Mohaugen',
    description:
      'Talks, posters, workshops, and quantum computing community engagement by Valentine Mohaugen.',
    url: '/outreach/',
  },
};

const cvData = cv as CvData;

export default function OutreachPage() {
  return (
    <>
      <section className="page-header">
        <div className="container">
          <h1>Outreach</h1>
          <p>Talks, education, and community engagement</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cv-section reveal">
            <h2>Talks, Posters &amp; Workshops</h2>
            {cvData.presentations.map((entry) => (
              <TimelineItem entry={entry} key={entry.title} />
            ))}
          </div>

          <div className="cv-section reveal">
            <h2>Education &amp; Outreach</h2>
            <div className="timeline-item">
              <div className="timeline-date">Aug 2024 &ndash; Present</div>
              <div className="timeline-title">
                Co-founder &amp; President, Clemson Quantum Club
              </div>
              <div className="timeline-desc">
                Lead the{' '}
                <a href={siteConfig.clubUrl} target="_blank" rel="noopener noreferrer">
                  Clemson Quantum Club
                </a>
                , organizing workshops, hackathon teams, and outreach that make
                quantum computing accessible to students of all backgrounds. Designed
                and maintain the club website (Next.js, React, TypeScript).
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-date">Dec 2025 &ndash; Present</div>
              <div className="timeline-title">IBM Qiskit Advocate</div>
              <div className="timeline-desc">
                Contribute to community education, workshops, and Qiskit ecosystem
                resources; hosted and co-organized IBM Qiskit Fall Fest at Clemson
                (2024, 2025).
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
