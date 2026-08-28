import Link from 'next/link';
import siteConfig from '@/data/site-config.json';
import StarDivider from '@/components/StarDivider';
import {
  EmailIcon,
  GitHubIcon,
  LinkedInIcon,
  ScholarIcon,
  OrcidIcon,
  ResearchGateIcon,
} from '@/components/icons';

import { NAV_LINKS } from '@/lib/nav';

const SOCIAL_LINKS = [
  { label: 'Email', href: `mailto:${siteConfig.email}`, Icon: EmailIcon },
  { label: 'GitHub', href: siteConfig.githubUrl, Icon: GitHubIcon },
  { label: 'LinkedIn', href: siteConfig.linkedinUrl, Icon: LinkedInIcon },
  { label: 'Google Scholar', href: siteConfig.scholarUrl, Icon: ScholarIcon },
  { label: 'ORCID', href: siteConfig.orcidUrl, Icon: OrcidIcon },
  { label: 'ResearchGate', href: siteConfig.researchgateUrl, Icon: ResearchGateIcon },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Link href="/" className="footer-name">
            {siteConfig.name}
          </Link>
          <p className="footer-descriptor">
            Quantum machine learning, cybersecurity &amp; cyber-physical systems
            researcher at Clemson University.
          </p>
        </div>

        <nav className="footer-nav" aria-label="Footer">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="footer-social">
          {SOCIAL_LINKS.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('mailto:') ? undefined : '_blank'}
              rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
              aria-label={label}
              title={label}
            >
              <Icon size={18} />
            </a>
          ))}
        </div>
      </div>

      <StarDivider wide />

      <p className="footer-copy">
        &copy; {new Date().getFullYear()} {siteConfig.name}
      </p>
    </footer>
  );
}
