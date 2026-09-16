import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import Section from '@/components/Section';
import TimelineSection from '@/components/TimelineSection';
import cv from '@/data/cv.json';
import { pageMetadata } from '@/lib/metadata';
import type { CvData } from '@/lib/types';

export const metadata: Metadata = pageMetadata({
  title: 'Outreach & Leadership',
  description:
    'Presentations, posters, conferences, and quantum computing community leadership by Valentine Mohaugen, Clemson University.',
  path: '/outreach/',
});

const cvData: CvData = cv;

export default function OutreachPage() {
  return (
    <>
      <PageHeader
        title="Outreach & Leadership"
        subtitle="Presentations, posters, conferences, and community leadership"
      />

      <Section>
        <TimelineSection heading="Presentations & Posters" entries={cvData.presentations} />
        <TimelineSection heading="Leadership & Activities" entries={cvData.leadership} />
        <TimelineSection heading="Conferences" entries={cvData.conferences} />
      </Section>
    </>
  );
}
