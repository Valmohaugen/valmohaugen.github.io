import type { Metadata } from 'next';
import SkillCard from '@/components/SkillCard';
import TimelineItem from '@/components/TimelineItem';
import cv from '@/data/cv.json';
import type { CvData } from '@/lib/types';
import { pageMetadata } from '@/lib/metadata';

export const metadata: Metadata = pageMetadata({
  title: 'CV',
  description:
    'Curriculum Vitae of Valentine Mohaugen, Ph.D. student in quantum machine learning and cyber-physical systems at Clemson University.',
  ogDescription:
    'Education, research experience, publications, and skills of Valentine Mohaugen, Ph.D. student in quantum machine learning and cyber-physical systems at Clemson University.',
  path: '/cv/',
});

const cvData = cv as CvData;

export default function CvPage() {
  return (
    <>
      <section className="page-header">
        <div className="container">
          <h1>Curriculum Vitae</h1>
          <p>Education, research experience, and skills</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cv-section reveal">
            <h2>Education</h2>
            {cvData.education.map((entry) => (
              <TimelineItem entry={entry} key={entry.title} />
            ))}
          </div>

          <div className="cv-section reveal">
            <h2>Research Experience</h2>
            {cvData.research.map((entry) => (
              <TimelineItem entry={entry} key={entry.title + entry.date} />
            ))}
          </div>

          <div className="cv-section reveal">
            <h2>Leadership &amp; Activities</h2>
            {cvData.leadership.map((entry) => (
              <TimelineItem entry={entry} key={entry.title} />
            ))}
          </div>

          <div className="cv-section reveal">
            <h2>Presentations &amp; Posters</h2>
            {cvData.presentations.map((entry) => (
              <TimelineItem entry={entry} key={entry.title} />
            ))}
          </div>

          <div className="cv-section reveal">
            <h2>Conferences</h2>
            {cvData.conferences.map((entry) => (
              <TimelineItem entry={entry} key={entry.title + entry.date} />
            ))}
          </div>

          <div className="cv-section reveal">
            <h2>Awards &amp; Honors</h2>
            {cvData.awards.map((entry) => (
              <TimelineItem entry={entry} key={entry.title} />
            ))}
            <p className="cv-societies">
              <strong>Societies:</strong> {cvData.societies}
            </p>
          </div>

          <div className="cv-section reveal">
            <h2>Technical Skills</h2>
            <div className="skills-grid">
              {cvData.skills.map((skill) => (
                <SkillCard key={skill.title} {...skill} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
