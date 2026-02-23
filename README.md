# valmohaugen.github.io

Personal academic portfolio site for Valentine Mohaugen.

**Live at:** [www.valmohaugen.com](https://www.valmohaugen.com)

## Site Structure

```
valmohaugen.github.io/
  index.html            Home — hero, bio, research highlights
  research.html         Research interests + project list
  publications.html     Publications (placeholder + Scholar link)
  cv.html               Timeline CV, skills grid
  contact.html          Contact info list
  assets/css/style.css  All styles (single file)
  CNAME                 Custom domain config
```

## Pages

| Page | File | Nav label | Content |
|------|------|-----------|---------|
| Home | `index.html` | Home | Hero section (name, title, photo, links), About Me, Research Highlights |
| Research | `research.html` | Research | 4 research interest descriptions + 8 project rows with GitHub links |
| Publications | `publications.html` | Publications | Placeholder with Google Scholar button |
| CV | `cv.html` | CV | Education, Research, Hackathons, Teaching/Outreach, Technical Skills |
| Contact | `contact.html` | Contact | Email, location, GitHub, Scholar, Clemson Quantum links |

## Design

- **Tech:** Plain HTML/CSS, no build tools, no frameworks
- **Fonts:** Inter (body) + Source Serif 4 (headings) via Google Fonts CDN
- **Colors:** CSS custom properties in `:root` of `style.css`

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#1a56db` | Links, accents, active nav |
| `--color-primary-light` | `#e8f0fe` | Tags, photo placeholder bg |
| `--color-primary-dark` | `#0f3a8a` | Hover states |
| `--color-text` | `#1f2937` | Body text |
| `--color-text-light` | `#6b7280` | Secondary text |
| `--color-bg-alt` | `#f8fafc` | Alternating section backgrounds |
| `--color-border` | `#e5e7eb` | Dividers, borders |
| `--color-footer-bg` | `#1e293b` | Footer background |

## Layout Patterns

Each section uses a different layout — no single "card" pattern everywhere:

- **Research Highlights** (home): Left-border-accented blocks (`.highlight-item`)
- **Projects** (research): Compact list rows with dividers (`.project-row`)
- **Research Interests** (research): Heading + paragraph blocks (`.research-area`)
- **CV**: Timeline with dot markers (`.timeline-item`) + skills grid (`.skills-grid`)
- **Contact**: Simple icon + text list (`.contact-list` / `.contact-item`)
- **Publications**: Centered placeholder (`.pub-placeholder`)

## Navigation

Sticky top bar. Active page gets blue underline via `class="nav-link active"` — set manually on each page. Mobile hamburger menu toggles via inline `onclick`.

## Adding Content

### Add your photo

1. Place image at `assets/img/headshot.jpg`
2. In `index.html`, replace the placeholder div:
   ```html
   <!-- Replace: -->
   <div class="photo-placeholder">Photo</div>
   <!-- With: -->
   <img src="assets/img/headshot.jpg" alt="Valentine Mohaugen">
   ```

### Add a publication

In `publications.html`, replace the placeholder section with entries like:

```html
<div class="research-area">
  <h3>Paper Title Here</h3>
  <p><strong>V. Mohaugen</strong>, Co-Author. <em>Journal Name</em>, 2026.
    <a href="#">arXiv</a> | <a href="#">DOI</a>
  </p>
</div>
```

### Add a CV entry

In `cv.html`, add inside the relevant `.cv-section`:

```html
<div class="timeline-item">
  <div class="timeline-date">2025</div>
  <div class="timeline-title">Role or Degree</div>
  <div class="timeline-subtitle">Institution</div>
  <div class="timeline-desc">Description of work.</div>
</div>
```

### Add a project

In `research.html`, add inside `.project-list`:

```html
<div class="project-row">
  <div class="project-row-header">
    <h3><a href="https://github.com/..." target="_blank" rel="noopener">Project Name</a></h3>
    <span class="tag tag-physics">Domain</span>
  </div>
  <p>Short description of the project.</p>
  <a href="https://github.com/..." class="project-row-link" target="_blank" rel="noopener">GitHub &rarr;</a>
</div>
```

### Tag color classes

| Class | Color | Use for |
|-------|-------|---------|
| `.tag` (default) | Blue | General |
| `.tag-physics` | Purple | Quantum physics |
| `.tag-ml` | Amber | Machine learning |
| `.tag-circuit` | Green | Quantum circuits |
| `.tag-web` | Red | Web projects |
| `.tag-edu` | Indigo | Education |

## Hosting

GitHub Pages with custom domain. The `CNAME` file points to `www.valmohaugen.com`. Push to `main` to deploy.

## Responsive

- **Desktop (>768px):** Full horizontal nav, two-column hero, multi-column grids
- **Mobile (<=768px):** Hamburger menu, stacked hero, single-column layouts
