import type { Metadata } from 'next';
import TimelineItem from '@/components/TimelineItem';
import cv from '@/data/cv.json';
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
            <h2>Presentations &amp; Posters</h2>
            {cvData.presentations.map((entry) => (
              <TimelineItem entry={entry} key={entry.title} />
            ))}
          </div>

          <div className="cv-section reveal">
            <h2>Leadership &amp; Activities</h2>
            {cvData.leadership.map((entry) => (
              <TimelineItem entry={entry} key={entry.title} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
