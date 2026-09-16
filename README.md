# valmohaugen.com

Personal academic website for Valentine Mohaugen — built with Next.js 15, React 19, and TypeScript, statically exported and deployed to GitHub Pages via GitHub Actions. The structure mirrors the [Clemson Quantum Club site](https://github.com/ClemsonQuantum/ClemsonQuantum.github.io).

## Development

```bash
npm install
npm run dev        # dev server at http://localhost:3000
npm run build      # static export to out/
npx eslint .       # lint
npx tsc --noEmit   # type check
```

## Structure

- `app/` — App Router pages (home, research, publications, outreach, cv, contact)
- `components/` — React components (Header, Footer, ScrollReveal, ResearchEntry, StarfieldAccent, …)
- `data/` — site content as JSON (projects, news, publications, cv, site config)
- `lib/` — content types (`types.ts`), typed site config (`site-config.ts`), nav links (`nav.ts`), profile links (`social.ts`), page metadata (`metadata.ts`)
- `assets/css/` — the stylesheet, split into layers; `style.css` imports them in cascade order
- `scripts/optimize-images.mjs` — `npm run images`: strips EXIF/GPS metadata and emits WebP versions of `public/images/*`
- `cv-src/cv.tex` — LaTeX source of the CV, kept local-only (gitignored): it contains private contact details, and both this repo and the site are public
- `public/` — favicons, images, poster files (`public/posters/`), CNAME, and redirect stubs for the old `.html` URLs

## Updating content

Most content edits only touch `data/*.json`. Add new news entries at the top of `data/news.json` (kept newest-first as a running log); only the top five render in the homepage "Latest" section. The CV page and outreach talks render from `data/cv.json`. To link a paper, set `paperUrl` on its entry in `data/publications.json` (a `doi.org` URL renders as "DOI"); projects also accept `paperUrl`/`posterUrl` (poster files live in `public/posters/`). The CV itself is web-only: no PDF is served (it contains contact details that stay private), and the LaTeX source lives in `cv-src/`. After adding images to `public/images/`, run `npm run images` to strip metadata and generate WebP.

## Extending the site

Most changes are one edit in one place.

**Add a page.** Create `app/<name>/page.tsx`, export `metadata` from `pageMetadata()` in
`lib/metadata.ts` (this is what keeps the Open Graph card complete — a hand-written `openGraph`
block silently drops the image), and compose the body from `<PageHeader>` and `<Section>`. Add the
route to `NAV_LINKS` in `lib/nav.ts`; the header, footer and sitemap all follow from there.

**Add a CV or outreach section.** Add the array to `data/cv.json`, add the field to `CvData` in
`lib/types.ts`, then render `<TimelineSection heading="..." entries={cvData.yourArray} />`. Both
pages read the same data, so one edit updates both.

**Add a profile link.** One entry in `SOCIAL_PROFILES` (`lib/social.ts`) appears in the homepage
button row, the footer icons, the contact page and the JSON-LD `sameAs` list.

**Add a color, size or timing.** Add the token to `:root` in `assets/css/tokens.css`, and its
dark-mode value to the `prefers-color-scheme` block right below. Nothing outside that file should
hold a literal color.

**Add an animation.** Put `reveal` on the element; it fades and rises as it scrolls into view. For
a different entrance, add a variant class (`reveal--left`, `reveal--right`, `reveal--scale`), or
define your own in `assets/css/motion.css` by setting `--reveal-from` to any transform. To stagger
a group, set `--reveal-index` to the item's index (`style={{ '--reveal-index': i }}`); there is no
upper bound, and `--reveal-stagger` on a container tunes the spacing. The reduced-motion guard in
`motion.css` uses a universal selector, so anything you animate anywhere is covered automatically —
keep it that way.

**Style a new component.** Add a labeled block to `assets/css/components.css`. The import order in
`style.css` is the cascade, so a file's position matters.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml` (lint → type check → build → deploy). Repo Settings → Pages → Source must be set to **GitHub Actions**.

## Relationship to the club site

The [Clemson Quantum Club site](https://github.com/ClemsonQuantum/ClemsonQuantum.github.io) is the upstream for the shared shell patterns (Header, Footer, ScrollReveal, star dividers). The two repos share no code at build time, so fixes to those pieces land there first and are ported here deliberately.
