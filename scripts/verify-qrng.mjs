// @ts-check
/**
 * Verify the embedded ibm_sherbrooke bits and the streams built from them
 * (lib/qrng/*.mjs). Golden values were computed once from the SC Quantathon v1
 * team files (renamed-datasets/{mod2,iteration,concatenation}_sherbrooke_1k.txt)
 * with an independent Python script and are frozen here.
 *
 * 1. Integrity: sha256 of the 3,000-character 0/1 string equals the constant in
 *    sherbrooke.mjs and the golden value below (same as
 *    `cat mod2… iteration… concatenation… | tr -d '\n' | shasum -a 256`).
 * 2. Counts: 487 / 469 / 466 ones per file (1,422 of 3,000).
 * 3. Digits from 4-bit nibbles accepted below 10: 501 digits, frozen counts,
 *    χ² = 13.59 against uniform, frozen first 20.
 * 4. Cursors: in-order reads from an offset, wrap-around with a replaying flag,
 *    exact offset sampling (rejection), RangeError on bad offsets.
 * 5. Wording: the QRNG modules never say "unbiased", "true random" or "certified".
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { SHA256, BIT_COUNT } from '../lib/qrng/sherbrooke.mjs';
import { rawBits, digits, digitStream, bitCursor, randomIndex } from '../lib/qrng/bits.mjs';

const GOLDEN_SHA256 = '5dfb2a067659ec180083d1dd3db02df688aea33750eb34aa0a641d9e2e460df5';
const GOLDEN_DIGIT_COUNTS = [67, 47, 51, 35, 60, 48, 48, 53, 48, 44];
const GOLDEN_FIRST_DIGITS = [6, 7, 3, 5, 1, 7, 2, 3, 2, 5, 2, 7, 8, 7, 7, 5, 2, 9, 5, 1];

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
/** @param {Uint8Array} values @returns {number} */
const ones = (values) => values.reduce((s, v) => s + v, 0);

check('integrity: sha256 of the 3,000 bits matches the embedded constant and the golden value', () => {
  const bits = rawBits();
  assert.equal(bits.length, 3000);
  assert.equal(BIT_COUNT, 3000);
  const digest = createHash('sha256').update(Array.from(bits).join('')).digest('hex');
  assert.equal(SHA256, GOLDEN_SHA256, 'constant changed');
  assert.equal(digest, GOLDEN_SHA256, 'embedded bits changed');
});

check('counts: 487 / 469 / 466 ones in the three 1,000-bit files (1,422 total)', () => {
  const bits = rawBits();
  assert.deepEqual([0, 1, 2].map((k) => ones(bits.subarray(1000 * k, 1000 * (k + 1)))), [487, 469, 466]);
  assert.equal(ones(bits), 1422);
  assert.equal(bits[0], 0, 'the first raw bit is 0 (why visible measurements need an offset)');
  assert.ok(bits.every((b) => b === 0 || b === 1));
});

check('digits: 501 from nibbles below 10, frozen counts, χ² = 13.59, frozen first 20', () => {
  const d = digits();
  assert.equal(d.length, 501);
  const counts = Array.from({ length: 10 }, (_, k) => d.filter((x) => x === k).length);
  assert.deepEqual(counts, GOLDEN_DIGIT_COUNTS);
  const expected = d.length / 10;
  const chi2 = counts.reduce((s, c) => s + (c - expected) ** 2 / expected, 0);
  assert.ok(Math.abs(chi2 - 13.59) < 0.01, `χ² = ${chi2}`);
  assert.deepEqual(Array.from(d.subarray(0, 20)), GOLDEN_FIRST_DIGITS);
});

check('digit stream: reads in order, then replays from its start with a flag', () => {
  const stream = digitStream();
  const first = Array.from({ length: 20 }, () => stream.next());
  assert.deepEqual(first, GOLDEN_FIRST_DIGITS);
  for (let i = 20; i < 501; i++) stream.next();
  assert.equal(stream.replaying, false, 'not replaying after exactly one pass');
  assert.equal(stream.next(), GOLDEN_FIRST_DIGITS[0]);
  assert.equal(stream.replaying, true);
});

check('bit cursor: numeric offset reads in order, wraps, counts used of total', () => {
  const raw = rawBits();
  const cursor = bitCursor(raw, { offset: 2992 });
  assert.equal(cursor.total, 3000);
  const got = Array.from({ length: 10 }, () => cursor.next());
  assert.deepEqual(got, [...raw.subarray(2992, 3000), raw[0], raw[1]]);
  assert.equal(cursor.used, 10);
  for (let i = 10; i < 3000; i++) cursor.next();
  assert.equal(cursor.used, 3000);
  assert.equal(cursor.replaying, false);
  assert.equal(cursor.next(), raw[2992], 'replays from its own starting point');
  assert.equal(cursor.replaying, true);
  for (const bad of [-1, 3000, 1.5, Number.NaN]) assert.throws(() => bitCursor(raw, { offset: bad }), RangeError);
});

check('offsets: crypto offset is in range; randomIndex rejects the biased tail exactly', () => {
  const raw = rawBits();
  for (let i = 0; i < 50; i++) {
    const cursor = bitCursor(raw, { offset: 'crypto' });
    assert.ok(cursor.offset >= 0 && cursor.offset < 3000 && Number.isInteger(cursor.offset));
  }
  // 2^32 = 5,819,738 · 738 + 652, so draws ≥ 4,294,966,644 are rejected.
  const draws = [4294967295, 4294966644, 4294966643, 1000];
  /** @param {Uint32Array} out */
  const source = (out) => {
    out[0] = /** @type {number} */ (draws.shift());
    return out;
  };
  assert.equal(randomIndex(738, source), 4294966643 % 738);
  assert.equal(randomIndex(738, source), 1000 % 738);
  assert.throws(() => randomIndex(0), RangeError);
});

check('wording: no "unbiased", "true random" or "certified" in the QRNG modules', () => {
  for (const file of ['lib/qrng/sherbrooke.mjs', 'lib/qrng/bits.mjs', 'lib/qrng/decrypt.mjs']) {
    const text = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8').toLowerCase();
    for (const banned of ['unbiased', 'true random', 'truly random', 'certified']) {
      assert.ok(!text.includes(banned), `${file} says "${banned}"`);
    }
  }
});

if (failed) {
  console.log(`[FAIL] verify-qrng: ${failed} failed, ${passed} passed`);
  process.exitCode = 1;
} else {
  console.log(`[done] verify-qrng: ${passed} checks passed`);
}
