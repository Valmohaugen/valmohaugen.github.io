import Link from 'next/link';
import siteConfig from '@/lib/site-config';
import StarDivider from '@/components/StarDivider';
import FooterCat from '@/components/cats/FooterCat';
import { NAV_LINKS } from '@/lib/nav';
import NavSocial from '@/components/NavSocial';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Link href="/" className="footer-name">
            {siteConfig.name}
          </Link>
          <p className="footer-descriptor">
            Quantum ML/AI, cybersecurity&nbsp;&amp; cyber-physical systems
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
          <NavSocial />
        </div>
      </div>

      <StarDivider wide />

      {/* The cat walks in to its box beside the copyright line. */}
      <div className="footer-bottom">
        <FooterCat />
        <p className="footer-copy">
          &copy; {new Date().getFullYear()} {siteConfig.name}
        </p>
      </div>
    </footer>
  );
}
