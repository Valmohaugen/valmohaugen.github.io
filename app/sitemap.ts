import type { MetadataRoute } from 'next';
import { NAV_LINKS } from '@/lib/nav';
import siteConfig from '@/lib/site-config';

export const dynamic = 'force-static';

/** Routes not listed here fall back to 0.8. */
const PRIORITY: Record<string, number> = {
  '/': 1.0,
  '/research/': 0.9,
  '/contact/': 0.7,
};

export default function sitemap(): MetadataRoute.Sitemap {
  // Build date: honest lastModified for a fully static export.
  const lastModified = new Date();
  // Derived from NAV_LINKS so adding a page means editing one file.
  return NAV_LINKS.map(({ href }) => ({
    url: `${siteConfig.siteUrl}${href}`,
    priority: PRIORITY[href] ?? 0.8,
    lastModified,
  }));
}
