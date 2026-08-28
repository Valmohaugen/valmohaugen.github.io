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
- `components/` — React components (Header, Footer, ScrollReveal, ResearchEntry, StarfieldAccent, BraidAccent, …)
- `data/` — site content as JSON (projects, news, publications, cv, site config)
- `lib/` — content type definitions (`types.ts`) and shared nav links (`nav.ts`)
- `assets/css/style.css` — global stylesheet (imported in `app/layout.tsx`)
- `scripts/optimize-images.mjs` — `npm run images`: strips EXIF/GPS metadata and emits WebP versions of `public/images/*`
- `cv-src/cv.tex` — LaTeX source of the CV, kept local-only (gitignored): it contains private contact details, and both this repo and the site are public
- `public/` — favicons, images, poster files (`public/posters/`), CNAME, and redirect stubs for the old `.html` URLs

## Updating content

Most content edits only touch `data/*.json`. Add new news entries at the top of `data/news.json` (kept newest-first as a running log); only the top five render in the homepage "Latest" section. The CV page and outreach talks render from `data/cv.json`. To link a paper, set `paperUrl` on its entry in `data/publications.json` (a `doi.org` URL renders as "DOI"); projects also accept `paperUrl`/`posterUrl` (poster files live in `public/posters/`). The CV itself is web-only: no PDF is served (it contains contact details that stay private), and the LaTeX source lives in `cv-src/`. After adding images to `public/images/`, run `npm run images` to strip metadata and generate WebP.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml` (lint → type check → build → deploy). Repo Settings → Pages → Source must be set to **GitHub Actions**.

## Relationship to the club site

The [Clemson Quantum Club site](https://github.com/ClemsonQuantum/ClemsonQuantum.github.io) is the upstream for the shared shell patterns (Header, Footer, ScrollReveal, star dividers). The two repos share no code at build time, so fixes to those pieces land there first and are ported here deliberately.
