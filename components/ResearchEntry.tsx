'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Project } from '@/lib/types';
import { GitHubIcon, ExternalIcon, DownloadIcon } from '@/components/icons';

interface ResearchEntryProps {
  project: Project;
  /** Alternate thumbnail side on desktop. */
  reverse?: boolean;
  /**
   * Heading element for the entry title: h2 on the research page (whose h1 is
   * the page header), h3 where entries sit under an h2 section heading.
   */
  headingLevel?: 'h2' | 'h3';
}

export default function ResearchEntry({
  project,
  reverse = false,
  headingLevel: Heading = 'h3',
}: ResearchEntryProps) {
  const [open, setOpen] = useState(false);
  const detailsId = `${project.id}-details`;

  return (
    <article
      id={project.id}
      className={`research-entry${reverse ? ' research-entry--reverse' : ''} reveal`}
    >
      <div className="research-entry__thumbnail">
        {project.thumbnail ? (
          <Image
            src={project.thumbnail}
            alt={project.thumbnailAlt ?? project.title}
            width={680}
            height={425}
            loading="lazy"
          />
        ) : (
          <div className="research-entry__thumbnail--placeholder">
            {project.placeholderLabel ?? project.title}
          </div>
        )}
      </div>

      <div className="research-entry__content">
        <div className="research-entry__meta">
          {project.github && (
            <a
              href={project.github}
              className="link-inline"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubIcon size={14} />
              GitHub
            </a>
          )}
          {project.live && (
            <a
              href={project.live}
              className="link-inline"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalIcon size={14} />
              Live Site
            </a>
          )}
          {project.paperUrl && (
            <a
              href={project.paperUrl}
              className="link-inline"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalIcon size={14} />
              Paper (arXiv)
            </a>
          )}
          {project.posterUrl && (
            <a href={project.posterUrl} className="link-inline" download>
              <DownloadIcon size={14} />
              Poster
            </a>
          )}
          {project.challenge && (
            <span className="research-entry__year">{project.challenge}</span>
          )}
          <span className="research-entry__year">{project.year}</span>
        </div>
        <Heading className="research-entry__title">{project.title}</Heading>
        <p>{project.blurb}</p>
        <button
          type="button"
          className="research-entry__details-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={detailsId}
        >
          {open ? 'Hide details' : 'More details'}
          <span aria-hidden="true" className="research-entry__details-chevron">
            {open ? '▴' : '▾'}
          </span>
        </button>
      </div>

      <div
        className="research-entry__details-body"
        id={detailsId}
        hidden={!open}
      >
        {project.details.map((text) => (
          <p key={text.slice(0, 40)}>{text}</p>
        ))}
        <p>
          <strong>Key tools:</strong> {project.keyTools}
        </p>
      </div>
    </article>
  );
}
