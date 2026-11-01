import type { Metadata, Viewport } from 'next';
import { ViewTransition } from 'react';
import { DM_Sans, Source_Serif_4 } from 'next/font/google';
import localFont from 'next/font/local';
import '../assets/css/style.css';
import Header from '@/components/Header';
import NavSocial from '@/components/NavSocial';
import Footer from '@/components/Footer';
import ScrollEffects from '@/components/ScrollEffects';
import LinkDecrypt from '@/components/qrng/LinkDecrypt';
import siteConfig from '@/lib/site-config';
import { OG_IMAGE } from '@/lib/metadata';
import { PROFILE_URLS } from '@/lib/social';

// Body text never swaps fonts mid-visit: with `optional`, the browser waits
// up to 100 ms for the preloaded file, then keeps whichever face it has.
// With `swap`, the homepage intro re-wrapped one line when DM Sans arrived
// and pushed the whole hero down (a layout shift of about 0.08).
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'optional',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-source-serif',
});

// The italic is for math variables only (components/MathText.tsx). It is not
// preloaded: the browser fetches it on the pages that set a variable.
const sourceSerifItalic = Source_Serif_4({
  weight: '400',
  style: 'italic',
  variable: '--font-math-italic',
  preload: false,
});

// The body italic is for the publication venues (app/publications/page.tsx),
// the site's only DM Sans <em>; without it the venue is a slanted roman. It
// registers as "DM Sans" italic, so no CSS change is needed. Not preloaded
// (the font budget stays at 2 files); `swap`, because the venue is one line.
const dmSansItalic = DM_Sans({
  subsets: ['latin'],
  weight: '400',
  style: 'italic',
  variable: '--font-dm-sans-italic',
  display: 'swap',
  preload: false,
});

// The four math glyphs Source Serif 4's web subset lacks (⟨ ⟩ ≤ ≥), from a
// 3.9 KB STIX Two Math subset (assets/fonts/, OFL). base.css lists it first in
// `.math`, and unicode-range limits it to those four characters. One file
// serves upright and italic at every weight, so nothing is synthesized. No
// fallback face (it would have no unicode-range and so claim every character)
// and no preload: the browser fetches it only on a page that draws one of
// the four.
const mathBrackets = localFont({
  src: [
    { path: '../assets/fonts/STIXTwoMath-MathBrackets.otf', weight: '100 900', style: 'normal' },
    { path: '../assets/fonts/STIXTwoMath-MathBrackets.otf', weight: '100 900', style: 'italic' },
  ],
  variable: '--font-math-brackets',
  declarations: [{ prop: 'unicode-range', value: 'U+27E8-27E9, U+2264-2265' }],
  preload: false,
  adjustFontFallback: false,
});

// The subscript digits in chemical formulas (AgCrP₂Se₆), U+2080–2089, which
// Source Serif 4's web files lack: a 2.7 KB STIX Two Text subset per heading
// weight (assets/fonts/, OFL), listed first in --font-heading (tokens.css) and
// limited by unicode-range, so every platform draws the inferiors macOS draws
// from its own STIX Two Text. No fallback face and no preload, as above.
const subscripts = localFont({
  src: [
    { path: '../assets/fonts/STIXTwoText-Subscripts-Regular.otf', weight: '100 500', style: 'normal' },
    { path: '../assets/fonts/STIXTwoText-Subscripts-SemiBold.otf', weight: '600', style: 'normal' },
    { path: '../assets/fonts/STIXTwoText-Subscripts-Bold.otf', weight: '700 900', style: 'normal' },
  ],
  variable: '--font-subscripts',
  declarations: [{ prop: 'unicode-range', value: 'U+2080-2089' }],
  preload: false,
  adjustFontFallback: false,
});

/**
 * Research topics, used for the keywords meta tag and the Person JSON-LD
 * `knowsAbout`. Covers the usual phrasings of quantum + AI so the site matches
 * whichever one a search uses.
 */
const RESEARCH_TOPICS = [
  'quantum AI',
  'quantum ML/AI',
  'quantum artificial intelligence',
  'quantum machine learning',
  'quantum-enhanced AI',
  'quantum-enhanced machine learning',
  'AI for quantum computing',
  'machine learning for quantum systems',
  'quantum computing',
  'cybersecurity',
  'cyber-physical systems',
  'variational quantum algorithms',
  'topological materials',
];

export const metadata: Metadata = {
  title: {
    template: '%s · Valentine Mohaugen',
    default: 'Valentine Mohaugen',
  },
  description:
    'Valentine Mohaugen, Ph.D. student at Clemson University researching quantum ML/AI, cybersecurity, and cyber-physical systems.',
  keywords: RESEARCH_TOPICS,
  metadataBase: new URL(siteConfig.siteUrl),
  alternates: { canonical: './' },
  // Maximum-privacy posture: outbound clicks carry no referrer, so external
  // sites never learn a visit came from here. The site also makes zero
  // third-party requests (self-hosted fonts, no analytics or tracking).
  referrer: 'no-referrer',
  openGraph: {
    title: 'Valentine Mohaugen · Quantum ML/AI, Cybersecurity, and Cyber-Physical Systems',
    description:
      'Ph.D. student at Clemson University researching quantum ML/AI, cybersecurity, and cyber-physical systems.',
    url: siteConfig.siteUrl,
    siteName: siteConfig.name,
    locale: 'en_US',
    type: 'website',
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    images: [OG_IMAGE],
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
  url: `${siteConfig.siteUrl}/`,
  jobTitle: 'Ph.D. Student',
  affiliation: {
    '@type': 'Organization',
    name: 'Clemson University',
    url: 'https://www.clemson.edu',
  },
  sameAs: PROFILE_URLS,
  image: `${siteConfig.siteUrl}/images/headshot.jpg`,
  email: siteConfig.email,
  knowsAbout: RESEARCH_TOPICS,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${dmSansItalic.variable} ${sourceSerif.variable} ${sourceSerifItalic.variable} ${mathBrackets.variable} ${subscripts.variable}`}
      // Keeps CSS smooth scrolling for in-page links while letting Next 16
      // jump instantly to the top on navigation.
      data-scroll-behavior="smooth"
    >
      <head>
        {/* Content-Security-Policy is emitted only in production builds: the
            dev server needs eval for hot-reload, so a strict CSP would break it.
            GitHub Pages can't send HTTP headers, so a <meta> tag is used. Fonts
            are self-hosted via next/font, so 'self' covers img/font/connect.
            'unsafe-inline' is required in script-src for Next's inline
            bootstrap and flight scripts (self.__next_f), and in style-src for
            the <noscript> <style> below and the style attributes React renders
            (e.g. the menu rows' --i, next/image's color:transparent, the icons'
            vertical-align); next/font's @font-face rules ship in the external
            CSS. */}
        {process.env.NODE_ENV === 'production' && (
          <meta
            httpEquiv="Content-Security-Policy"
            content="default-src 'self'; base-uri 'self'; object-src 'none'; img-src 'self'; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; form-action 'self'; connect-src 'self'"
          />
        )}
        {/* Scripts off: the research details and CV skill panels show open (only
            React can open them), and the controls that need React (the details
            toggle, the menu button, the skill chevrons) hide; the footer nav
            links every page. */}
        <noscript>
          <style>{'.research-entry__details-body[hidden],.skill-details[hidden]{display:block}.research-entry__details-toggle,.nav-toggle,.skill-category__toggle::after{display:none}.skill-category__toggle{cursor:auto}'}</style>
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd).replace(/</g, '\\u003c') }}
        />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Header social={<NavSocial />} />
        {/* Client navigations crossfade the content (assets/css/motion.css);
            the header is named separately and stays put. */}
        <ViewTransition>
          <main id="main-content">{children}</main>
        </ViewTransition>
        <Footer />
        {/* Reveals and timeline rails as the page scrolls, and text links that
            decrypt on hover (both render nothing). */}
        <ScrollEffects />
        <LinkDecrypt />
      </body>
    </html>
  );
}
