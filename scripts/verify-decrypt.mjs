// @ts-check
/**
 * Verify the title decrypt timeline (lib/qrng/decrypt.mjs):
 * every glyph flips 4–6 times at 50 ms through measured digits, glyphs start
 * 24 ms apart (less for long titles), the whole effect ends within 600 ms, and
 * each glyph ends on its real character. Whitespace and invisible format
 * characters (word joiners) never scramble.
 */

import assert from 'node:assert/strict';

import { decryptPlan, glyphAt, FLIP_MS, MAX_MS } from '../lib/qrng/decrypt.mjs';

let passed = 0;
let failed = 0;
/** @param {string} name @param {() => void} fn */
function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`[ok]   ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`[FAIL] ${name}\n       ${err instanceof Error ? err.message.split('\n')[0] : err}`);
  }
}
/** Digits 0..9 in order, forever. */
function counter() {
  let k = 0;
  return () => k++ % 10;
}

check('plan: 4–6 flips per glyph, 50 ms each, whitespace and word joiners skipped', () => {
  assert.equal(FLIP_MS, 50);
  const plan = decryptPlan('Technical Skills', counter());
  assert.deepEqual(plan.glyphs.map((g) => g.index), [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15], 'the space is not a glyph');
  assert.deepEqual(decryptPlan('Reed–\u2060Muller', counter()).glyphs.map((g) => g.index), [0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11], 'the word joiner is not a glyph');
  for (const g of plan.glyphs) assert.ok(g.digits.length >= 4 && g.digits.length <= 6, `${g.char}: ${g.digits.length} flips`);
});

check('timing: 24 ms stagger for short titles; everything done within 600 ms for any length', () => {
  assert.equal(MAX_MS, 600);
  const short = decryptPlan('404', counter());
  assert.deepEqual(short.glyphs.map((g) => g.start), [0, 24, 48]);
  for (let n = 1; n <= 120; n++) {
    const plan = decryptPlan('x'.repeat(n), counter());
    assert.ok(plan.total <= MAX_MS, `${n} glyphs: ${plan.total} ms`);
    assert.ok(plan.glyphs.every((g, i) => i === 0 || g.start >= plan.glyphs[i - 1].start), 'left to right');
  }
});

check('frames: scrambles through its digits, then shows the real character', () => {
  const plan = decryptPlan('Ab', counter());
  const [a] = plan.glyphs;
  assert.equal(glyphAt(a, 0), String(a.digits[0]));
  assert.equal(glyphAt(a, FLIP_MS * 1.5), String(a.digits[1]));
  assert.equal(glyphAt(a, a.start + a.digits.length * FLIP_MS), 'A');
  for (const g of plan.glyphs) assert.equal(glyphAt(g, plan.total), g.char);
});

check('digits: read in order from the source, never invented', () => {
  /** @type {number[]} */
  const read = [];
  const source = () => {
    const d = read.length % 10;
    read.push(d);
    return d;
  };
  const plan = decryptPlan('Publications', source);
  assert.deepEqual(plan.glyphs.flatMap((g) => g.digits), read.slice(0, plan.glyphs.flatMap((g) => g.digits).length));
  assert.ok(plan.glyphs.flatMap((g) => g.digits).every((d) => Number.isInteger(d) && d >= 0 && d <= 9));
});

if (failed) {
  console.log(`[FAIL] verify-decrypt: ${failed} failed, ${passed} passed`);
  process.exitCode = 1;
} else {
  console.log(`[done] verify-decrypt: ${passed} checks passed`);
}
