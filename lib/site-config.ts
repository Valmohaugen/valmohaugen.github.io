/** The typed site config. Import this rather than the JSON directly. */

import config from '@/data/site-config.json';
import type { SiteConfig } from '@/lib/types';

const siteConfig: SiteConfig = config;

export default siteConfig;
