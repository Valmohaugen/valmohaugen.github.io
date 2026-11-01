'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Project } from '@/lib/types';
import { GitHubIcon, ExternalIcon, DownloadIcon } from '@/components/icons';
import Decrypt from '@/components/qrng/Decrypt';
import MathText from '@/components/MathText';

/** The thumbnail's rendered width: the 320px column, or the full column when entries stack below 48em. */
const THUMBNAIL_SIZES = '(max-width: 48em) calc(100vw - 3rem), 320px';

interface ResearchEntryProps {
  project: Project;
  /** Alternate thumbnail side on desktop. */
  reverse?: boolean;
  /** Load the thumbnail eagerly at high priority (the entry is above the fold). */
  priority?: boolean;
}

export default function ResearchEntry({
  project,
  reverse = false,
  priority = false,
}: ResearchEntryProps) {
  const [open, setOpen] = useState(false);
  const detailsId = `${project.id}-details`;
  // Names the article and describes its links and toggle by the project title.
  const titleId = `${project.id}-title`;

  return (
    <article
      id={project.id}
      className={`research-entry${reverse ? ' research-entry--reverse' : ''}`}
      aria-labelledby={titleId}
    >
      <div className="research-entry__thumbnail">
        {project.thumbnail ? (
          // With a dark-mode version, the browser downloads only the one its
          // color scheme shows.
          <picture>
            {project.thumbnailDark && (
              <source
                srcSet={project.thumbnailDarkSrcSet ?? project.thumbnailDark}
                sizes={project.thumbnailDarkSrcSet ? THUMBNAIL_SIZES : undefined}
                media="(prefers-color-scheme: dark)"
              />
            )}
            {/* Larger copies for 2x and 3x screens; stacked below 48em, the thumbnail spans the column. */}
            {project.thumbnailSrcSet && <source srcSet={project.thumbnailSrcSet} sizes={THUMBNAIL_SIZES} />}
            <Image
              src={project.thumbnail}
              alt={project.thumbnailAlt ?? project.title}
              width={680}
              height={425}
              {...(priority ? { loading: 'eager' as const, fetchPriority: 'high' as const } : { loading: 'lazy' as const })}
            />
          </picture>
        ) : (
          <div className="research-entry__thumbnail--placeholder" aria-hidden="true">
            {project.title}
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
              aria-describedby={titleId}
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
              aria-describedby={titleId}
            >
              <ExternalIcon size={14} />
              Live site
            </a>
          )}
          {project.paperUrl && (
            <a
              href={project.paperUrl}
              className="link-inline"
              target="_blank"
              rel="noopener noreferrer"
              aria-describedby={titleId}
            >
              <ExternalIcon size={14} />
              {project.paperUrl.includes('doi.org') ? 'Paper (DOI)' : 'Paper (arXiv)'}
            </a>
          )}
          {project.posterUrl && (
            <a href={project.posterUrl} className="link-inline" download aria-describedby={titleId}>
              <DownloadIcon size={14} />
              Poster
            </a>
          )}
          {project.challenge && (
            <span className="research-entry__year">{project.challenge}</span>
          )}
          <span className="research-entry__year">{project.year}</span>
        </div>
        {/* The title decrypts the first time it is fully in view. */}
        <Decrypt as="h2" id={titleId} className="research-entry__title" trigger="visible">
          {project.title}
        </Decrypt>
        <p>
          <MathText text={project.blurb} />
        </p>
        <button
          type="button"
          className="research-entry__details-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={detailsId}
          aria-describedby={titleId}
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
          <p key={text.slice(0, 40)}>
            {/* The owner's name is bold in an in-text byline, as on /publications/. */}
            {text.split(/(V\.\u00a0Mohaugen)/).map((part, i) =>
              i % 2 ? <strong key={i}>{part}</strong> : <MathText key={i} text={part} />,
            )}
          </p>
        ))}
        <p>
          <strong>Key tools:</strong>{' '}
          {/* A one-word last tool shares a line with the tool before it (no lone
              last word); a two-word last tool stays whole but may start its own
              line, so the join never cuts the tool before it. */}
          {project.keyTools.replace(
            /, ([^,]+)$/,
            (_, last: string) => {
              const words = last.split(' ').length;
              if (words === 1) return `,\u00a0${last}`;
              return words === 2 ? `, ${last.replace(' ', '\u00a0')}` : `, ${last}`;
            },
          )}
        </p>
      </div>
    </article>
  );
}
