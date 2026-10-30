import type { Metadata } from 'next';
import Link from 'next/link';

import Decrypt from '@/components/qrng/Decrypt';
import RouteFigure from '@/components/stage/RouteFigure';
import { OG_IMAGE } from '@/lib/metadata';
import siteConfig from '@/lib/site-config';

const DESCRIPTION =
  'There’s no page at this address. It may have moved, or the link may contain a typo.';

// The layout's template makes this "Page not found · Valentine Mohaugen"; the
// inherited canonical './' would point at Next's internal /_not-found/ route.
// Its own Open Graph block (with no og:url) keeps a shared broken link from
// previewing as the homepage. Next replaces the root block wholesale, so it
// repeats the image, site name, locale and type (see lib/metadata.ts).
export const metadata: Metadata = {
  title: 'Page not found',
  description: DESCRIPTION,
  alternates: { canonical: null },
  openGraph: {
    title: `Page not found · ${siteConfig.name}`,
    description: DESCRIPTION,
    siteName: siteConfig.name,
    locale: 'en_US',
    type: 'website',
    images: [OG_IMAGE],
  },
};

export default function NotFound() {
  return (
    <section className="section not-found">
      <div className="container not-found__grid">
        <div className="not-found__body">
          <Decrypt as="p" className="not-found__code" trigger="load">
            404
          </Decrypt>
          <h1>Page not found</h1>
          <p className="not-found__text">
            There&rsquo;s no page at this address. It may have moved, or the link may contain a typo.
          </p>
          <div className="not-found__links">
            <Link href="/" className="link-inline">
              Back to home
            </Link>
            <Link href="/research/" className="link-inline">
              Browse research
            </Link>
          </div>
        </div>
        <RouteFigure figure="notFound" />
      </div>
    </section>
  );
}
