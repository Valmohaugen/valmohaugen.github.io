import type { Metadata } from 'next';
import ResearchEntry from '@/components/ResearchEntry';
import projects from '@/data/projects.json';
import type { Project } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Research & Projects',
  description:
    'Quantum machine learning, cyber-physical systems, deep learning for quantum systems, and quantum computing hackathon projects by Valentine Mohaugen.',
  openGraph: {
    title: 'Research & Projects · Valentine Mohaugen',
    description:
      'Quantum machine learning, cyber-physical systems, deep learning for quantum systems, and quantum computing hackathon projects by Valentine Mohaugen.',
    url: '/research/',
  },
};

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
