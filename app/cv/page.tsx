import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import Section from '@/components/Section';
import SkillCard from '@/components/SkillCard';
import TimelineSection from '@/components/TimelineSection';
import cv from '@/data/cv.json';
import { pageMetadata } from '@/lib/metadata';
import type { CvData } from '@/lib/types';

export const metadata: Metadata = pageMetadata({
  title: 'CV',
  description:
    'Curriculum Vitae of Valentine Mohaugen, Ph.D. student in quantum machine learning, cybersecurity, and cyber-physical systems at Clemson University.',
  ogDescription:
    'Education, research experience, leadership, presentations, awards, and technical skills of Valentine Mohaugen, Ph.D. student in quantum machine learning, cybersecurity, and cyber-physical systems at Clemson University.',
  path: '/cv/',
});

const cvData: CvData = cv;

export default function CvPage() {
  return (
    <>
      <PageHeader
        title="Curriculum Vitae"
        subtitle="Education, research experience, and skills"
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

        <div className="cv-section reveal">
          <h2>Technical Skills</h2>
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
