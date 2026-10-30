// @ts-check
/**
 * Report what each exported route makes a first-time visitor download, and
 * compare it with budgets.json. Next 16 no longer prints "First Load JS", and
 * the site has no analytics, so this local report is the size check.
 *
 * For every out/**\/index.html (plus 404.html; Next's identical 404/ and
 * _not-found/ copies are skipped) it collects the same-origin
 * assets the HTML references directly: <script src>, modulepreload links,
 * stylesheets and preloaded fonts. JS and CSS are measured gzipped (what
 * GitHub Pages serves); fonts are woff2, already compressed, so raw bytes.
 * Lazy chunks (the WebGL stage) are not referenced by the HTML;
 * budgets.json can name them by a marker string found in their source.
 *
 * Never fails the build: it prints a table and warnings, then exits 0.
 *
 * Usage: node scripts/measure-size.mjs [outDir]
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const OUT = process.argv[2] ?? 'out';
const BUDGETS_FILE = 'budgets.json';
const KB = 1024;

/** @param {string} dir @returns {string[]} */
function findPages(dir) {
  /** @type {string[]} */
  const pages = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    // Next also writes the 404 page as 404/index.html and _not-found/index.html,
    // byte-identical copies of 404.html, which is measured below.
    if (name === '_next' || (dir === OUT && (name === '404' || name === '_not-found'))) continue;
    if (statSync(p).isDirectory()) pages.push(...findPages(p));
    else if (name === 'index.html' || (dir === OUT && name === '404.html')) pages.push(p);
  }
  return pages;
}

/** @param {string} html */
function assetUrls(html) {
  /** @type {{ js: Set<string>, css: Set<string>, font: Set<string> }} */
  const urls = { js: new Set(), css: new Set(), font: new Set() };
  for (const m of html.matchAll(/<script[^>]*>/g)) {
    // Modern browsers skip nomodule scripts (legacy polyfills), so they cost nothing.
    if (/\snomodule/i.test(m[0])) continue;
    const src = /\ssrc="([^"]+)"/.exec(m[0])?.[1];
    if (src) urls.js.add(src);
  }
  for (const m of html.matchAll(/<link[^>]*>/g)) {
    const tag = m[0];
    const href = /\shref="([^"]+)"/.exec(tag)?.[1];
    if (!href) continue;
    if (/rel="modulepreload"/.test(tag) || (/rel="preload"/.test(tag) && /as="script"/.test(tag))) urls.js.add(href);
    else if (/rel="stylesheet"/.test(tag)) urls.css.add(href);
    else if (/rel="preload"/.test(tag) && /as="font"/.test(tag)) urls.font.add(href);
  }
  return urls;
}

/** @param {string} url @param {boolean} gzip */
function bytesOf(url, gzip) {
  if (!url.startsWith('/')) return { bytes: 0, missing: false, external: true };
  const file = join(OUT, url.split('?')[0]);
  if (!existsSync(file)) return { bytes: 0, missing: true, external: false };
  const buf = readFileSync(file);
  return { bytes: gzip ? gzipSync(buf).length : buf.length, missing: false, external: false };
}

/** @param {Set<string>} set @param {boolean} gzip */
function total(set, gzip) {
  let bytes = 0;
  const problems = [];
  for (const url of set) {
    const r = bytesOf(url, gzip);
    if (r.external) problems.push(`third-party asset: ${url}`);
    if (r.missing) problems.push(`missing file: ${url}`);
    bytes += r.bytes;
  }
  return { bytes, count: set.size, problems };
}

/**
 * Gzip size of the largest lazy chunk whose source contains `marker`, or null.
 * Any other chunk with the marker is named beside it: the same code in two
 * lazy chunks downloads twice when a visitor meets both.
 * @param {string} marker
 */
function chunkContaining(marker) {
  const dir = join(OUT, '_next', 'static', 'chunks');
  if (!existsSync(dir)) return null;
  /** @type {Array<{ name: string, bytes: number }>} */
  const found = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.js')) continue;
    const buf = readFileSync(join(dir, name));
    if (buf.includes(marker)) found.push({ name, bytes: gzipSync(buf).length });
  }
  const [best, ...others] = found.sort((a, b) => b.bytes - a.bytes);
  if (!best) return null;
  const also = others.map((c) => `${c.name} ${(c.bytes / KB).toFixed(1)} KB`).join(', ');
  return { name: also ? `${best.name}; also in ${also}` : best.name, bytes: best.bytes };
}

if (!existsSync(OUT)) {
  console.log(`[size] ${OUT}/ not found; run next build first.`);
  process.exit(0);
}

const budgets = existsSync(BUDGETS_FILE) ? JSON.parse(readFileSync(BUDGETS_FILE, 'utf8')) : {};
const rows = [];
const warnings = [];
for (const page of findPages(OUT).sort()) {
  const route = '/' + relative(OUT, page).replace(/index\.html$/, '').replace(/\\/g, '/');
  const urls = assetUrls(readFileSync(page, 'utf8'));
  const js = total(urls.js, true);
  const css = total(urls.css, true);
  const font = total(urls.font, false);
  for (const p of [...js.problems, ...css.problems, ...font.problems]) warnings.push(`${route}: ${p}`);
  rows.push({ route, js, css, font });
  if (budgets.jsKB && js.bytes / KB > budgets.jsKB) warnings.push(`${route}: JS ${(js.bytes / KB).toFixed(1)} KB > budget ${budgets.jsKB} KB`);
  if (budgets.fontKB && font.bytes / KB > budgets.fontKB) warnings.push(`${route}: fonts ${(font.bytes / KB).toFixed(1)} KB > budget ${budgets.fontKB} KB`);
  if (budgets.fontFiles && font.count > budgets.fontFiles) warnings.push(`${route}: ${font.count} preloaded fonts > budget ${budgets.fontFiles}`);
}

const pad = (/** @type {string | number} */ s, /** @type {number} */ n) => String(s).padEnd(n);
const num = (/** @type {number} */ b) => (b / KB).toFixed(1).padStart(7);
console.log('[size] first-load assets per route (JS/CSS gzipped, fonts raw)');
console.log(`  ${pad('route', 22)}${pad('JS KB', 9)}${pad('files', 7)}${pad('CSS KB', 9)}${pad('font KB', 9)}files`);
for (const r of rows) {
  console.log(`  ${pad(r.route, 22)}${num(r.js.bytes)}  ${pad(r.js.count, 5)}${num(r.css.bytes)}  ${num(r.font.bytes)}  ${r.font.count}`);
}
for (const [name, spec] of Object.entries(budgets.lazyChunks ?? {})) {
  const c = chunkContaining(spec.marker);
  if (!c) { console.log(`  lazy ${name}: not built yet (marker "${spec.marker}")`); continue; }
  console.log(`  lazy ${name}: ${(c.bytes / KB).toFixed(1)} KB gzip (${c.name})`);
  if (c.bytes / KB > spec.kB) warnings.push(`lazy ${name}: ${(c.bytes / KB).toFixed(1)} KB > budget ${spec.kB} KB`);
}
for (const w of warnings) console.log(`[warn] ${w}`);
if (!warnings.length) console.log('[size] all routes within budget');
