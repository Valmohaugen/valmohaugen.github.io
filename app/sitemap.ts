import type { MetadataRoute } from 'next';
import siteConfig from '@/data/site-config.json';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  // Build date: honest lastModified for a fully static export.
  const lastModified = new Date();
  return [
    { url: `${siteConfig.siteUrl}/`, priority: 1.0, lastModified },
    { url: `${siteConfig.siteUrl}/research/`, priority: 0.9, lastModified },
    { url: `${siteConfig.siteUrl}/publications/`, priority: 0.8, lastModified },
    { url: `${siteConfig.siteUrl}/outreach/`, priority: 0.8, lastModified },
    { url: `${siteConfig.siteUrl}/cv/`, priority: 0.8, lastModified },
    { url: `${siteConfig.siteUrl}/contact/`, priority: 0.7, lastModified },
  ];
}
