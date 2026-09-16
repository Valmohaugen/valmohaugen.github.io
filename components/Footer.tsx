import Link from 'next/link';
import siteConfig from '@/data/site-config.json';
import StarDivider from '@/components/StarDivider';
import { NAV_LINKS } from '@/lib/nav';
import { SOCIAL_PROFILES, externalLinkProps } from '@/lib/social';

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
          {SOCIAL_PROFILES.map(({ key, label, href, Icon }) => (
            <a key={key} href={href} {...externalLinkProps(href)} aria-label={label} title={label}>
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
