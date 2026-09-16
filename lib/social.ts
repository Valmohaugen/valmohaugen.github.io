/** The one definition of my profile links, shared by every place that lists them. */

import {
  EmailIcon,
  GitHubIcon,
  LinkedInIcon,
  ScholarIcon,
  OrcidIcon,
  ResearchGateIcon,
} from '@/components/icons';
import siteConfig from '@/data/site-config.json';

export interface SocialProfile {
  /** Stable key, also used as the React key. */
  key: string;
  /** Service name. Used as the accessible name for icon-only footer links. */
  label: string;
  /** Abbreviated name, for the space-constrained hero button row. */
  shortLabel: string;
  /** Contact-page row label, where there is room to disambiguate. */
  contactLabel: string;
  href: string;
  /** What the contact page prints as the link text. */
  displayValue: string;
  Icon: (props: { size?: number; className?: string }) => React.JSX.Element;
}

export const SOCIAL_PROFILES: SocialProfile[] = [
  {
    key: 'email',
    label: 'Email',
    shortLabel: 'Email',
    contactLabel: 'University Email',
    href: `mailto:${siteConfig.email}`,
    displayValue: siteConfig.email,
    Icon: EmailIcon,
  },
  {
    key: 'github',
    label: 'GitHub',
    shortLabel: 'GitHub',
    contactLabel: 'GitHub',
    href: siteConfig.githubUrl,
    displayValue: 'github.com/valmohaugen',
    Icon: GitHubIcon,
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    shortLabel: 'LinkedIn',
    contactLabel: 'LinkedIn',
    href: siteConfig.linkedinUrl,
    displayValue: 'linkedin.com/in/valmohaugen',
    Icon: LinkedInIcon,
  },
  {
    key: 'scholar',
    label: 'Google Scholar',
    shortLabel: 'Scholar',
    contactLabel: 'Google Scholar',
    href: siteConfig.scholarUrl,
    displayValue: 'Scholar Profile',
    Icon: ScholarIcon,
  },
  {
    key: 'orcid',
    label: 'ORCID',
    shortLabel: 'ORCID',
    contactLabel: 'ORCID',
    href: siteConfig.orcidUrl,
    displayValue: siteConfig.orcidId,
    Icon: OrcidIcon,
  },
  {
    key: 'researchgate',
    label: 'ResearchGate',
    shortLabel: 'ResearchGate',
    contactLabel: 'ResearchGate',
    href: siteConfig.researchgateUrl,
    displayValue: 'ResearchGate Profile',
    Icon: ResearchGateIcon,
  },
];

/**
 * Anchor props for a link that may be a `mailto:`.
 *
 * External links open in a new tab with `noopener noreferrer`; `mailto:` links
 * get neither, since there is no tab to isolate.
 */
export function externalLinkProps(href: string) {
  return href.startsWith('mailto:')
    ? {}
    : { target: '_blank', rel: 'noopener noreferrer' };
}

/** Profile URLs for the JSON-LD `sameAs` list. Excludes the mailto: link. */
export const PROFILE_URLS = SOCIAL_PROFILES.filter(
  (p) => !p.href.startsWith('mailto:'),
).map((p) => p.href);
