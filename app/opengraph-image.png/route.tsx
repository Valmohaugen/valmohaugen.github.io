import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';

// Build-time 1200x630 social card, served at /opengraph-image.png. A plain
// route handler (not the opengraph-image.tsx file convention) so the URL has
// a real .png extension, since GitHub Pages sets Content-Type from the extension
// and extensionless files are served as application/octet-stream, which some
// social scrapers reject. The og:image/twitter:image tags in app/layout.tsx
// point here explicitly.
// Echoes the site's dark theme (#0e1117) with a few faint drifting-star specks
// and the accent blue (#6b9cf7). ImageResponse only supports a flexbox subset,
// so the stars are plain absolutely-positioned divs.
const SIZE = { width: 1200, height: 630 };

const STARS = [
  { top: 74, left: 96, r: 4, a: 0.55 },
  { top: 150, left: 1050, r: 3, a: 0.4 },
  { top: 470, left: 150, r: 3, a: 0.35 },
  { top: 540, left: 980, r: 5, a: 0.5 },
  { top: 250, left: 1120, r: 2, a: 0.3 },
  { top: 96, left: 640, r: 2, a: 0.28 },
];

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: '#0e1117',
          padding: '0 96px',
          position: 'relative',
        }}
      >
        {STARS.map((s, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: s.top,
              left: s.left,
              width: s.r * 2,
              height: s.r * 2,
              borderRadius: '50%',
              backgroundColor: `rgba(155, 188, 255, ${s.a})`,
            }}
          />
        ))}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 88,
              fontWeight: 700,
              letterSpacing: -1.5,
              lineHeight: 1.1,
              color: '#e1e7ef',
            }}
          >
            Valentine Mohaugen
          </div>
          <div style={{ fontSize: 36, color: '#6b9cf7', marginTop: 28 }}>
            Quantum ML · Cybersecurity · Cyber-Physical Systems
          </div>
          <div style={{ fontSize: 30, color: '#6b9cf7', marginTop: 14, opacity: 0.85 }}>
            Ph.D. Student · Clemson University · valmohaugen.com
          </div>
        </div>
      </div>
    ),
    { ...SIZE }
  );
}
