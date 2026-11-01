// @ts-check
/**
 * Give the exported 404 pages the same two font preloads as every other page.
 *
 * Next 16.4 (Turbopack) keys the root layout's next/font files under
 * app/_not-found/page in the font manifest, while the 404 renders
 * app/not-found.tsx, so out/404.html gets no <link rel="preload" as="font">.
 * DM Sans is `display: optional`, so without the preload a hard load of a
 * missing URL usually keeps the Arial fallback for the whole page.
 *
 * Copies the preload links from out/index.html (the hashed names change every
 * build) into each 404 copy that has none, before its stylesheet link. Does
 * nothing once Next emits them itself.
 *
 * Usage: node scripts/preload-404-fonts.mjs [outDir]
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2] ?? 'out';
const PRELOAD = /<link rel="preload" href="[^"]+\.woff2" as="font"[^>]*>/g;
const TARGETS = ['404.html', '404/index.html', '_not-found/index.html'];

const links = readFileSync(join(OUT, 'index.html'), 'utf8').match(PRELOAD) ?? [];
if (links.length === 0) throw new Error('[404] out/index.html has no font preloads to copy');

for (const target of TARGETS) {
  const file = join(OUT, target);
  if (!existsSync(file)) continue;
  const html = readFileSync(file, 'utf8');
  if (html.includes('as="font"')) continue;
  const at = html.indexOf('<link rel="stylesheet"');
  if (at < 0) throw new Error(`[404] no stylesheet link in ${file}`);
  writeFileSync(file, html.slice(0, at) + links.join('') + html.slice(at));
  console.log(`[404] ${links.length} font preloads copied into ${file}`);
}
