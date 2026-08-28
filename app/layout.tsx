import type { Metadata, Viewport } from 'next';
import { DM_Sans, Source_Serif_4 } from 'next/font/google';
import '../assets/css/style.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ScrollReveal from '@/components/ScrollReveal';
import siteConfig from '@/data/site-config.json';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-source-serif',
});

export const metadata: Metadata = {
  title: {
    template: '%s · Valentine Mohaugen',
    default: 'Valentine Mohaugen',
  },
  description:
    'Valentine Mohaugen, Ph.D. student at Clemson University researching quantum machine learning, cybersecurity, and cyber-physical systems.',
  metadataBase: new URL(siteConfig.siteUrl),
  alternates: { canonical: './' },
  // Maximum-privacy posture: outbound clicks carry no referrer, so external
  // sites never learn a visit came from here. The site also makes zero
  // third-party requests (self-hosted fonts, no analytics or tracking).
  referrer: 'no-referrer',
  openGraph: {
    title: 'Valentine Mohaugen · Quantum Machine Learning, Cybersecurity, and Cyber-Physical Systems',
    description:
      'Ph.D. student at Clemson University researching quantum machine learning, cybersecurity, and cyber-physical systems.',
    url: siteConfig.siteUrl,
    siteName: siteConfig.name,
    locale: 'en_US',
    type: 'website',
    // Explicit path with a real extension: the build copies the generated
    // out/opengraph-image to opengraph-image.png so GitHub Pages serves it
    // with an image/png Content-Type (extensionless files get octet-stream,
    // which some social scrapers reject).
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Valentine Mohaugen, Ph.D. Student in Quantum Machine Learning, Cybersecurity, and Cyber-Physical Systems at Clemson University',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/opengraph-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#1a56db',
};

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: siteConfig.name,
  url: siteConfig.siteUrl,
  jobTitle: 'Ph.D. Student',
  affiliation: {
    '@type': 'Organization',
    name: 'Clemson University',
    url: 'https://www.clemson.edu',
  },
  sameAs: [
    siteConfig.githubUrl,
    siteConfig.linkedinUrl,
    siteConfig.scholarUrl,
    siteConfig.orcidUrl,
    siteConfig.researchgateUrl,
  ],
  image: `${siteConfig.siteUrl}/images/headshot.jpg`,
  email: siteConfig.email,
  knowsAbout: [
    'cyber-physical systems',
    'cybersecurity',
    'quantum machine learning',
    'variational quantum algorithms',
    'topological materials',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Content-Security-Policy is emitted only in production builds: the
            dev server needs eval for hot-reload, so a strict CSP would break it.
            GitHub Pages can't send HTTP headers, so a <meta> tag is used. Fonts
            are self-hosted via next/font, so 'self' covers img/font/connect.
            'unsafe-inline' is required for Next's inline hydration scripts and
            next/font's injected inline styles under static export. */}
        {process.env.NODE_ENV === 'production' && (
          <meta
            httpEquiv="Content-Security-Policy"
            content="default-src 'self'; base-uri 'self'; object-src 'none'; img-src 'self' data:; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; form-action 'self'; connect-src 'self'"
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </head>
      <body className={`${dmSans.variable} ${sourceSerif.variable}`}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
        <ScrollReveal />
      </body>
    </html>
  );
}
