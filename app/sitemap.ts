import type { MetadataRoute } from 'next';
import { NAV_LINKS } from '@/lib/nav';
import siteConfig from '@/lib/site-config';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  // Derived from NAV_LINKS so adding a page means editing one file.
  // Bare URLs, as on the club site: a build-time lastModified would claim
  // every page changed on every deploy (so search engines learn to ignore
  // it), and Google ignores priority. robots.ts names this file, so search
  // engines re-read it after a deploy without a manual resubmission.
  return NAV_LINKS.map(({ href }) => ({ url: `${siteConfig.siteUrl}${href}` }));
}
