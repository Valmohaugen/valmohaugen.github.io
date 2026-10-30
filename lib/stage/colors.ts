// Figure colours come from the CSS tokens (assets/css/tokens.css), read
// through a hidden probe element so the GPU always matches the theme, and are
// converted to OKLab so blends pass through the background perceptually.

export type Lab = [number, number, number];

export interface StageColors {
  pos: Lab;
  neg: Lab;
  bg: Lab;
  ink: Lab;
  /** Background as sRGB in [0, 1], for gl.clearColor. */
  bgRgb: [number, number, number];
}

const TOKENS = { pos: '--w-pos', neg: '--w-neg', bg: '--color-bg', ink: '--color-text' } as const;

function toLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** sRGB in [0, 1] → OKLab (Ottosson 2020). */
function srgbToOklab([r, g, b]: [number, number, number]): Lab {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function parseRgb(css: string): [number, number, number] {
  const parts = css.match(/[\d.]+/g);
  if (!parts || parts.length < 3) throw new Error(`[stage] cannot parse colour "${css}"`);
  return [Number(parts[0]) / 255, Number(parts[1]) / 255, Number(parts[2]) / 255];
}

/** Read the figure colours as computed for `host` (light or dark theme). */
export function readStageColors(host: HTMLElement): StageColors {
  const probe = document.createElement('span');
  probe.style.display = 'none';
  host.appendChild(probe);
  const read = (token: string): [number, number, number] => {
    probe.style.color = `var(${token})`;
    return parseRgb(getComputedStyle(probe).color);
  };
  try {
    const bgRgb = read(TOKENS.bg);
    return {
      pos: srgbToOklab(read(TOKENS.pos)),
      neg: srgbToOklab(read(TOKENS.neg)),
      bg: srgbToOklab(bgRgb),
      ink: srgbToOklab(read(TOKENS.ink)),
      bgRgb,
    };
  } finally {
    probe.remove();
  }
}
