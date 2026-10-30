import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import Section from '@/components/Section';
import SkillCard from '@/components/SkillCard';
import Decrypt from '@/components/qrng/Decrypt';
import TimelineSection from '@/components/TimelineSection';
import cv from '@/data/cv.json';
import { pageMetadata } from '@/lib/metadata';
import type { CvData } from '@/lib/types';

export const metadata: Metadata = pageMetadata({
  title: 'CV',
  description:
    'Curriculum Vitae of Valentine Mohaugen, Ph.D. student at Clemson University researching quantum ML/AI, cybersecurity, and cyber-physical systems.',
  ogDescription:
    'Education, research experience, leadership, presentations, awards, and technical skills of Valentine Mohaugen, Ph.D. student at Clemson University researching quantum ML/AI, cybersecurity, and cyber-physical systems.',
  path: '/cv/',
});

const cvData: CvData = cv;

export default function CvPage() {
  return (
    <>
      <PageHeader
        title="Curriculum Vitae"
        subtitle="Education, research experience, and skills"
        figure="cv"
      />

      <Section>
        <TimelineSection heading="Education" entries={cvData.education} />
        <TimelineSection heading="Research Experience" entries={cvData.research} />
        <TimelineSection heading="Leadership & Activities" entries={cvData.leadership} />
        <TimelineSection heading="Presentations & Posters" entries={cvData.presentations} />
        <TimelineSection heading="Conferences" entries={cvData.conferences} />

        <TimelineSection heading="Awards & Honors" entries={cvData.awards}>
          <p className="cv-societies">
            <strong>Societies:</strong> {cvData.societies}
          </p>
        </TimelineSection>

        <div className="cv-section">
          <Decrypt as="h2" trigger="visible">
            Technical Skills
          </Decrypt>
          <div className="skills-grid">
            {cvData.skills.map((skill) => (
              <SkillCard key={skill.title} {...skill} />
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
