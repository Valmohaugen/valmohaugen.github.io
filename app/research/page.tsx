import type { Metadata } from 'next';
import ResearchEntry from '@/components/ResearchEntry';
import projects from '@/data/projects.json';
import type { Project } from '@/lib/types';
import { pageMetadata } from '@/lib/metadata';

export const metadata: Metadata = pageMetadata({
  title: 'Research & Projects',
  description:
    'Quantum machine learning, cyber-physical systems, deep learning for quantum systems, and quantum computing hackathon projects by Valentine Mohaugen.',
  path: '/research/',
});

export default function ResearchPage() {
  const all = projects as Project[];

  return (
    <>
      <section className="page-header">
        <div className="container">
          <h1>Research &amp; Projects</h1>
        </div>
      </section>

      <section className="section">
        <div className="container-wide">
          {all.map((project, i) => (
            <div key={project.id}>
              {i > 0 && <hr className="research-entry__divider" />}
              <ResearchEntry project={project} reverse={i % 2 === 1} headingLevel="h2" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
