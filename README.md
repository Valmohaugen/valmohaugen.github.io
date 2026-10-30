# valmohaugen.com

Personal academic website for Valentine Mohaugen — built with Next.js 16, React 19, and TypeScript, statically exported and deployed to GitHub Pages via GitHub Actions. The structure mirrors the [Clemson Quantum Club site](https://www.github.com/ClemsonQuantum/ClemsonQuantum.github.io).

## Development

```bash
npm install
npm run dev        # dev server at http://localhost:3000
npm run build      # verify + figures, static export to out/, then a size report (scripts/measure-size.mjs vs budgets.json)
npm run verify     # the physics, QRNG, cat and timing checks (scripts/verify-*.mjs); prebuild runs them
npm run figures    # writes the SVG fallback figures to public/figures/ (gitignored; predev and prebuild run it)
npm run lint       # lint
npx next typegen   # refresh the route types in .next/ (a stale copy fails the type check)
npx tsc --noEmit   # type check
```

## Structure

- `app/` — App Router pages (home, research, publications, outreach, cv, contact and the news archive `news/`), the 404 (`not-found.tsx`), the Open Graph card (`opengraph-image.png/route.tsx`), `robots.ts` and `sitemap.ts`
- `components/` — React components (Header, Footer, ResearchEntry, SkillCard, …); `stage/` holds the figures (the homepage hero, the page-header and 404 figures, and their SVG fallback), `cats/` the cartoon cats, `qrng/` the title and link decrypts
- `lib/physics/` — exact physics as checked `.mjs` modules: Wigner functions (`wigner.mjs`, `states.mjs`), camera and contour helpers
- `lib/stage/` — the raw WebGL2 renderer (shaders, projection, mesh, adaptive quality, the scroll ratchet, and `routes.mjs`: the figure, caption and motion of each page); `lib/qrng/` — the measured bits and the streams built from them; `lib/cats/` — the cat drawings; `lib/motion/` — the spring easing (`spring.mjs`), cubic-bezier curves for JavaScript animation (`bezier.mjs`) and the scroll-effect helpers (`scroll.mjs`)
- `data/` — site content as JSON (projects, news, publications, cv, site config)
- `lib/` — content types (`types.ts`), typed site config (`site-config.ts`), nav links (`nav.ts`), profile links (`social.ts`), page metadata (`metadata.ts`), the typed publication list (`publications.ts`), a live media-query hook (`useMediaQuery.ts`) and a class-name joiner (`cn.ts`)
- `types/` holds the ambient type declarations: `react-canary.d.ts` loads the React canary types that declare `<ViewTransition>`
- `assets/css/` — the stylesheet, split into layers; `style.css` imports them in cascade order
- `assets/fonts/og/` holds the fonts of the Open Graph card (unmodified static DM Sans and Source Serif 4 TTFs under the OFL, with their licenses), read at build time and never served
- `assets/fonts/STIXTwoMath-MathBrackets.otf` holds the four math glyphs missing from the Source Serif 4 web files (⟨ ⟩ ≤ ≥): a 3.9 KB subset of STIX Two Math 2.13 (OFL, `assets/fonts/OFL-STIXTwo.txt`), loaded by `app/layout.tsx` with a unicode-range and listed first in `.math` (`assets/css/base.css`)
- `scripts/optimize-images.mjs` — `npm run images`: strips EXIF/GPS metadata from `public/images/headshot.jpg` and every JPEG or PNG in `public/images/thumbnails/` (overwriting each in place) and writes a WebP next to each (plus a smaller copy of `headshot.webp` for the homepage avatar, sized in `VARIANTS` and rebuilt whenever `headshot.webp` is newer)
- `scripts/verify-*.mjs`, `scripts/build-figures.mjs`, `scripts/measure-size.mjs`, `budgets.json` — build-time checks, the fallback figures and the size report
- `cv-src/cv.tex` — LaTeX source of the CV, kept local-only (gitignored): it contains private contact details, and both this repo and the site are public
- `public/` — favicons, images, poster files (`public/posters/`), CNAME, and redirect stubs for the old `.html` URLs

## Updating content

Most content edits only touch `data/*.json`. Add new news entries at the top of `data/news.json` (kept newest-first as a running log; write each date as `Mon YYYY`, e.g. `Oct 2026`, since `/news/` groups entries by the last four characters of the date); only the top five render in the homepage "Latest" section, which links to `/news/` (`app/news/page.tsx`, every entry grouped by year; not in the nav or sitemap, and `noindex`, so the homepage link is the only way in). The CV and outreach pages render from `data/cv.json` (outreach shows the presentations, leadership and conferences). Set `highlight: true` on a project in `data/projects.json` to list it under Research Highlights on the homepage, in the order of the file. To link a paper, set `paperUrl` on its entry in `data/publications.json` (a `doi.org` URL renders as "DOI", any other as "Paper (PDF)"); projects also accept `paperUrl` ("Paper (DOI)" for a `doi.org` URL, "Paper (arXiv)" for any other) and `posterUrl` (poster files live in `public/posters/`), and `thumbnailDark` for a dark-mode version of a thumbnail (same size; the browser loads only the one its color scheme shows). Write math in project blurbs and details and in figure captions between `$` signs (`$T_Z$`, `$G(V_{bias}, V_{gate})$`; titles, challenge names and key tools are plain text, so write Unicode there, as in `AgCrP₂Se₆`): `components/MathText.tsx` sets single letters and lowercase Greek as italic variables in the serif (words and capital Greek stay upright), `_x`/`_{…}` and `^x`/`^{…}` as sub- and superscripts, and keeps each expression on one line. Math is set in Source Serif 4 (Latin and Greek) plus the STIX Two Math subset in `assets/fonts/` for ⟨ ⟩ ≤ ≥; any other symbol (∑, ⊗, …) would fall to a platform font, so first add it to that subset (cut from STIX Two Math 2.13 with `hb-subset`) and to its unicode-range in `app/layout.tsx`. The CV itself is web-only: no PDF is served (it contains contact details that stay private), and the LaTeX source lives in `cv-src/`. After adding a JPEG or PNG thumbnail to `public/images/thumbnails/` (or replacing `public/images/headshot.jpg`), run `npm run images` to strip metadata and generate WebP; it leaves the other files in `public/images/` alone. Then point `thumbnail` in `data/projects.json` at the `.webp` and delete the JPEG or PNG, since everything in `public/` ships with the site (keep `headshot.jpg`: the Person JSON-LD links to it).

## Extending the site

Most changes are one edit in one place.

**Add a page.** Create `app/<name>/page.tsx`, export `metadata` from `pageMetadata()` in
`lib/metadata.ts` (this is what keeps the Open Graph card complete — a hand-written `openGraph`
block silently drops the image), and compose the body from `<PageHeader>` and `<Section>`. Add the
route to `NAV_LINKS` in `lib/nav.ts`; the header, footer and sitemap all follow from there.

**Add a CV or outreach section.** Add the array to `data/cv.json`, add the field to `CvData` in
`lib/types.ts`, then render `<TimelineSection heading="..." entries={cvData.yourArray} />` in
`app/cv/page.tsx` (and in `app/outreach/page.tsx` to show it there too). Both pages read the
same data, so an edit to an entry in a section both pages show updates both.

**Add a profile link.** One entry in `SOCIAL_PROFILES` (`lib/social.ts`) appears in the homepage
button row, the icons in the small-screen menu (`components/NavSocial.tsx`), the footer icons, the contact
page and the JSON-LD `sameAs` list. A new service also needs its icon in `components/icons.tsx`
and its URL in `data/site-config.json`, with the key added to `SiteConfig` in `lib/types.ts`.

**Add a color, size or timing.** Add the token to `:root` in `assets/css/tokens.css`, and its
dark-mode value to the `prefers-color-scheme` block right below. Nothing else in the stylesheets
should hold a literal color except `print.css` (black on white for paper). Three places cannot read
CSS variables and copy the token values by hand, so change them along with the tokens: `themeColor`
in `app/layout.tsx`, the Open Graph card in `app/opengraph-image.png/route.tsx`, and the icons
(`public/favicon.svg` and the PNG icons beside it).

**Add an animation.** Animate with intent: in answer to something the visitor did, or as a page's one
orchestrated moment. Scroll motion lives in one place, `components/ScrollEffects.tsx` (helpers in
`lib/motion/scroll.mjs`, checked by `scripts/verify-motion.mjs`): blocks below the fold rise into
view (add a block's selector to its
`REVEAL` list rather than writing a new observer), and the CV and outreach timeline rails draw down as
the page scrolls. Nothing on screen at load is ever hidden, and without JavaScript or under reduced
motion every block shows at once. Section headings and research titles decrypt the first time they are
fully in view (`<Decrypt as="h2" trigger="visible">`); the header condenses and a progress line under
it fills as the page scrolls (`components/Header.tsx`). Use the motion tokens in
`assets/css/tokens.css` (`--ease-measure`, `--ease-unitary`, `--ease-exit`, `--ease-spring`, `--dur-*`)
instead of literal timings; `--ease-spring` is the output of `springEasing()` in `lib/motion/spring.mjs`,
pasted in by hand: `scripts/verify-motion.mjs` checks the function against the closed-form spring
and fails if the token no longer equals what the function returns, so paste the new output after
changing the spring. The guard in
`assets/css/motion.css` stops every CSS transition, keyframe animation and page transition when the
visitor's OS asks for reduced motion. JavaScript animations must check the same media query, and
scroll-driven CSS animations belong inside `@media (prefers-reduced-motion: no-preference)`. The
figures evolve nonstop by design; the OS reduced-motion setting is the only way to stop them (there is
no pause control, a deliberate exception to WCAG 2.2.2). Everything else that moves on its own stops
within 5 s.

**Style a new component.** Add a labeled block to `assets/css/components.css`. The import order in
`style.css` is the cascade, so a file's position matters.

## Figures, cats and measured bits

The figures are exact results of quantum optics, and the decorative digits and the poses of the
homepage cat come from 3,000 bits that the SC Quantathon v1 team measured on real hardware.

- **Homepage figure.** The Wigner function of the even cat state |α⟩ + |−α⟩ (α = 2), computed in the
  vertex shader of a raw WebGL2 renderer (`lib/stage/`) from the closed form in `lib/physics/`. It is
  the hero's backdrop: the intro runs over it on a scrim (on narrow screens the figure fills the
  hero behind the whole intro), and the cat sits at its foot.
- **Every figure moves, exactly.** Each state evolves freely and nonstop: e^{−iθa†a} turns its Wigner
  function rigidly about the origin, one turn every 30 s (`evolveParams` in `lib/stage/routes.mjs`).
  The publications figure also loses photons on a loop: the coherent state spirals in, then a fresh
  one is prepared. Scrolling the homepage hero away adds photon loss (it only ever rises). Figures
  draw at most 30 frames a second and only while on screen, except the entrance that grows each
  state's coherent amplitudes from zero (1.6 s on the homepage, 0.6 s elsewhere; the contact page's
  squeezed vacuum is squeezed from its first frame), which draws every display frame;
  under reduced motion each is one still frame. Page-header and 404 captions show on hover over
  the figure, keyboard focus or a tap, and a second tap or Esc hides
  them. The homepage figure has no caption. Without WebGL, after a lost
  context, or in forced-colors mode a page shows the same state as an SVG contour map built at
  compile time. `?webgl=0` forces that fallback; `?debug=stage` exposes a GPU readback hook
  (`window.__stage`) for checks.
- **Cats.** Ink drawings are data in `lib/cats/art.mjs`, rendered by `CatSprite`. The homepage cat
  is two ghost poses whose hatching fades with the figure's fringe visibility; every hover or tap is
  a fresh measurement that picks one pose from the next raw bit, and moving the mouse away prepares
  the superposition again. The footer cat walks in once per session. Both are decorative.
- **Measured bits.** `lib/qrng/sherbrooke.mjs` embeds the 3,000 bits the SC Quantathon v1 team
  measured on IBM's ibm_sherbrooke (files `renamed-datasets/{mod2,iteration,concatenation}_sherbrooke_1k.txt`
  of the team repo; their sha256 is checked at every build). They drive the homepage cat (raw bits,
  read from an offset the browser draws with `crypto.getRandomValues`) and the decorative digits (501 digits from 4-bit
  nibbles): page titles decrypt on client navigation, the 404 code on load, section headings and
  research titles once as they scroll into view, and text links in the page and footer each time
  the mouse moves onto them (`components/qrng/LinkDecrypt.tsx`; all of them read one shared stream). Wording rules: never call them "unbiased",
  "true random" or "certified", always credit the team, and never use `Stage4/quantum_bits.txt`
  (simulator output).
- **Page transitions.** React's `<ViewTransition>` around `<main>` crossfades content in 200 ms; the
  header stays put.

**Add a figure preset.** Add the state to `PRESETS` in `lib/physics/states.mjs` (a superposition of up to six
coherent components, or the squeezed vacuum) and its id to the `PresetId` typedef there,
give it the values its parameter moves between in the `ends` table of the every-preset check in
`scripts/verify-states.mjs`, and list it in `GAUSSIAN` in `scripts/build-figures.mjs` if its Wigner
function is never negative (a Gaussian state, such as a single coherent state or the squeezed
vacuum); then run `npm run verify` (normalization, bounds and limits are checked for every preset)
and `npm run figures`. To show
it in a page header, add an entry to
`ROUTE_FIGURES` in `lib/stage/routes.mjs` (the preset, a one-line caption that stays true at every
moment of its motion, and its `dynamics`: `rotate` or `spiral`), give it its resting parameters
in `restParams` there (the SVG fallback is drawn with them), add a
`.route-figure--<preset>` placeholder in `assets/css/stage.css`, and pass the id to
`<PageHeader figure="...">`. The id also goes in the key list of the `ROUTE_FIGURES` type in
`lib/stage/routes.mjs`, and its preset, dynamics and caption in the frozen table of the route-figures
check in `scripts/verify-stage.mjs` (the type check and `npm run verify` fail otherwise).
`npm run figures` writes its SVG fallback (it fails if a contour reaches the
frame; widen that preset's window in `ZOOM` in `scripts/build-figures.mjs`).

### Checks

`npm run verify` runs before every build and fails it on any error:

| Script | Checks |
|---|---|
| `verify-motion` | spring easing against the closed-form step response, the `--ease-spring` token against `springEasing()`, motion tokens, the cubic-bezier curves, the reduced-motion guard, the scroll helpers (rail draw fraction, pen line, reveal stagger) and their print fallbacks |
| `verify-wigner` | normalization to 1e-6, W(0,0) = s/π, \|W\| ≤ 1/π, the α → 0 limits, negativity golden values |
| `verify-states` | the general superposition engine equals the cat formula to 1e-12, Gaussian maps keep det M = 1, presets, free evolution turns every preset rigidly (1e-12) |
| `verify-cameras`, `verify-stage` | projection matrices against the reference camera (1e-3 px), mesh, quality ladder, scroll ratchet, captions, the time evolution and its loss loop |
| `verify-contours` | the marching-squares contours behind the SVG fallback |
| `verify-qrng` | sha256 of the embedded bits, counts (1,422 ones; 501 digits, χ² = 13.59), cursors, and that no QRNG module calls the bits unbiased, true random or certified |
| `verify-cats`, `verify-decrypt` | the drawings' markup and size, the decrypt timeline (done within 600 ms) |

### Size budgets

`budgets.json` sets the first-load limits every route must meet (`jsKB` for JavaScript, `fontKB` and
`fontFiles` for the preloaded fonts) and the lazy
chunks (the WebGL stage, found by a marker string). `npm run build` prints the table
and warns over budget; it never fails the build.

### Manual checklist (before a release)

Devices: iPhone Safari and the LinkedIn in-app browser, a mid-range Android Chrome, Windows Chrome
with hardware acceleration off (the SVG fallback), macOS Firefox and Safari. Check with VoiceOver
and NVDA (the figure captions), keyboard only, the small-screen menu
(Esc, a tap outside or a link closes it), print preview, 200% zoom
and a large default text size, forced colors, and the OS reduced-motion setting (nothing moves).
The shaders are the one piece of physics the build cannot check: with `?debug=stage` and reduced
motion on, compare `window.__stage.sample([[x, p], …])` with `catWigner` from
`lib/physics/wigner.mjs` (or `presetWigner` from `lib/physics/states.mjs`, with the same θ plus the
resting parameters from `restParams` in `lib/stage/routes.mjs`, e.g. `{ r: 0.25 }` on /contact/) at a few
points (after `window.__stage.set({ amp: 1 })`); they should agree to better than 1e-4.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml` (lint → type check → build → deploy). Repo Settings → Pages → Source must be set to **GitHub Actions**.

## Relationship to the club site

The [Clemson Quantum Club site](https://www.github.com/ClemsonQuantum/ClemsonQuantum.github.io) is the upstream for the shared shell patterns (Header, Footer, star dividers). The two repos share no code at build time, so fixes to those pieces land there first and are ported here deliberately. The small-screen dropdown menu, the condensing bar and its scroll progress line are this site's own.
