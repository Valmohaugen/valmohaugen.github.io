import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import ResearchEntry from '@/components/ResearchEntry';
import Section from '@/components/Section';
import projects from '@/data/projects.json';
import type { Project } from '@/lib/types';
import { pageMetadata } from '@/lib/metadata';

export const metadata: Metadata = pageMetadata({
  title:
    'Research & Projects',
  description:
    'Quantum machine learning, cyber-physical systems, deep learning for quantum systems, and quantum computing hackathon projects by Valentine Mohaugen.',
  path:
    '/research/',
});

export default function ResearchPage() {
  const all: Project[] = projects;

  return (
    <>
      <PageHeader title="Research & Projects" />

      <Section wide>
        {all.map((project, i) => (
          <div key={project.id}>
            {i > 0 && <hr className="research-entry__divider" />}
            <ResearchEntry
              project={project}
              reverse={i % 2 === 1}
              headingLevel="h2"
            />
          </div>
        ))}
      </Section>
    </>
  );
}
