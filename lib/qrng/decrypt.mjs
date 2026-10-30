// @ts-check
/**
 * Timeline of the "decrypt" (headings and text links): each glyph shows
 * measured ibm_sherbrooke digits for a moment, then its real character.
 *
 * Every glyph except whitespace and invisible format characters (word
 * joiners) flips 4–6 times, FLIP_MS apart. Glyphs start their
 * flips STAGGER_MS apart, left to right; long titles get a shorter stagger so
 * the whole effect ends within MAX_MS. Before its start a glyph holds its first
 * digit. The number of flips is set by that first digit (4 + d mod 3), so the
 * rhythm, like the digits, comes from the measurements.
 */

export const FLIP_MS = 50;
const STAGGER_MS = 24;
export const MAX_MS = 600;
const MAX_FLIPS = 6;

/**
 * @typedef {{ index: number, char: string, start: number, digits: number[] }} Glyph
 * @typedef {{ glyphs: Glyph[], total: number }} DecryptPlan
 */

/**
 * @param {string} text the title, exactly as rendered
 * @param {() => number} nextDigit the next measured digit (0–9)
 * @returns {DecryptPlan}
 */
export function decryptPlan(text, nextDigit) {
  const chars = Array.from(text);
  const positions = chars.flatMap((char, index) => (/[\s\p{Cf}]/u.test(char) ? [] : [index]));
  const spread = MAX_MS - MAX_FLIPS * FLIP_MS;
  const stagger = positions.length > 1 ? Math.min(STAGGER_MS, spread / (positions.length - 1)) : 0;
  const glyphs = positions.map((index, k) => {
    const first = nextDigit();
    const digits = [first];
    for (let i = 1; i < 4 + (first % 3); i++) digits.push(nextDigit());
    return { index, char: chars[index], start: Math.floor(k * stagger), digits };
  });
  const total = glyphs.reduce((end, g) => Math.max(end, g.start + g.digits.length * FLIP_MS), 0);
  return { glyphs, total };
}

/**
 * What a glyph shows at time t (ms since the effect began).
 * @param {Glyph} glyph
 * @param {number} t
 * @returns {string}
 */
export function glyphAt(glyph, t) {
  const flip = Math.floor((t - glyph.start) / FLIP_MS);
  if (flip >= glyph.digits.length) return glyph.char;
  return String(glyph.digits[Math.max(0, flip)]);
}
