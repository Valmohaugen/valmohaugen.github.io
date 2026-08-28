import type { Metadata } from 'next';
import {
  EmailIcon,
  GitHubIcon,
  LinkedInIcon,
  ScholarIcon,
  OrcidIcon,
  ResearchGateIcon,
} from '@/components/icons';
import siteConfig from '@/data/site-config.json';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact Valentine Mohaugen at Clemson University.',
  openGraph: {
    title: 'Contact · Valentine Mohaugen',
    description: 'Contact Valentine Mohaugen at Clemson University.',
    url: '/contact/',
  },
};

const CONTACT_ITEMS = [
  {
    label: 'University Email',
    value: siteConfig.email,
    href: `mailto:${siteConfig.email}`,
    Icon: EmailIcon,
    external: false,
  },
  {
    label: 'GitHub',
    value: 'github.com/valmohaugen',
    href: siteConfig.githubUrl,
    Icon: GitHubIcon,
    external: true,
  },
  {
    label: 'LinkedIn',
    value: 'linkedin.com/in/valmohaugen',
    href: siteConfig.linkedinUrl,
    Icon: LinkedInIcon,
    external: true,
  },
  {
    label: 'Google Scholar',
    value: 'Scholar Profile',
    href: siteConfig.scholarUrl,
    Icon: ScholarIcon,
    external: true,
  },
  {
    label: 'ORCID',
    value: siteConfig.orcidId,
    href: siteConfig.orcidUrl,
    Icon: OrcidIcon,
    external: true,
  },
  {
    label: 'ResearchGate',
    value: 'ResearchGate Profile',
    href: siteConfig.researchgateUrl,
    Icon: ResearchGateIcon,
    external: true,
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="page-header">
        <div className="container">
          <h1>Contact</h1>
          <p>Get in touch</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="contact-list">
            {CONTACT_ITEMS.map(({ label, value, href, Icon, external }, i) => (
              <div
                className={`contact-item reveal${i > 0 ? ` reveal-delay-${Math.min(i, 5)}` : ''}`}
                key={label}
              >
                <div className="contact-icon">
                  <Icon size={20} />
                </div>
                <div>
                  <div className="contact-label">{label}</div>
                  <div className="contact-value">
                    <a
                      href={href}
                      target={external ? '_blank' : undefined}
                      rel={external ? 'noopener noreferrer' : undefined}
                    >
                      {value}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
