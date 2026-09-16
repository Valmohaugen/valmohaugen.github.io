import type { Metadata } from 'next';
import TimelineItem from '@/components/TimelineItem';
import cv from '@/data/cv.json';
import type { CvData } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Outreach & Leadership',
  description:
    'Presentations, posters, and quantum computing community leadership by Valentine Mohaugen, Clemson University.',
  openGraph: {
    title: 'Outreach & Leadership · Valentine Mohaugen',
    description:
      'Presentations, posters, and quantum computing community leadership by Valentine Mohaugen, Clemson University.',
    url: '/outreach/',
  },
};

const cvData = cv as CvData;

export default function OutreachPage() {
  return (
    <>
      <section className="page-header">
        <div className="container">
          <h1>Outreach &amp; Leadership</h1>
          <p>Presentations, posters, and community leadership</p>
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

          <div className="cv-section reveal">
            <h2>Conferences</h2>
            {cvData.conferences.map((entry) => (
              <TimelineItem entry={entry} key={entry.title + entry.date} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
