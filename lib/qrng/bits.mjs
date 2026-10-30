// @ts-check
/**
 * Streams built from the 3,000 measured ibm_sherbrooke bits (sherbrooke.mjs).
 *
 * - rawBits: the bits in file order.
 * - digits: 4-bit nibbles of the raw stream (most significant bit first),
 *   kept when the value is below 10: 501 digits.
 *
 * Reads go through cursors that keep their position in memory only. A cursor
 * starts at an offset (0, a fixed index, or one the browser draws with
 * crypto.getRandomValues), reads in order, and after one full pass replays
 * from its own start with `replaying` set.
 */

import { BITS_BASE64, BIT_COUNT } from './sherbrooke.mjs';

/** @type {Uint8Array | null} */
let raw = null;
/** @type {Uint8Array | null} */
let dig = null;

/**
 * The 3,000 measured bits, in file order (mod2, iteration, concatenation).
 * @returns {Uint8Array} values 0 or 1; shared, do not modify
 */
export function rawBits() {
  if (raw) return raw;
  const bytes = Uint8Array.from(atob(BITS_BASE64), (c) => c.charCodeAt(0));
  const bits = new Uint8Array(BIT_COUNT);
  for (let i = 0; i < BIT_COUNT; i++) bits[i] = (bytes[i >> 3] >> (7 - (i & 7))) & 1;
  raw = bits;
  return bits;
}

/**
 * Decimal digits from 4-bit nibbles of the raw stream, kept when below 10.
 * @returns {Uint8Array} 501 values 0–9; shared, do not modify
 */
export function digits() {
  if (dig) return dig;
  const bits = rawBits();
  /** @type {number[]} */
  const out = [];
  for (let i = 0; i + 3 < bits.length; i += 4) {
    const value = (bits[i] << 3) | (bits[i + 1] << 2) | (bits[i + 2] << 1) | bits[i + 3];
    if (value < 10) out.push(value);
  }
  dig = Uint8Array.from(out);
  return dig;
}

/**
 * Uniform index in [0, n) from 32-bit draws, rejecting the top 2³² mod n values
 * so every index is exactly equally likely.
 * @param {number} n positive integer below 2³²
 * @param {(array: Uint32Array) => Uint32Array} [source] crypto.getRandomValues by default
 * @returns {number}
 */
export function randomIndex(n, source = (array) => crypto.getRandomValues(array)) {
  if (!(Number.isInteger(n) && n > 0 && n < 2 ** 32)) throw new RangeError(`randomIndex: n = ${n}`);
  const limit = 2 ** 32 - (2 ** 32 % n);
  const draw = new Uint32Array(1);
  for (;;) {
    source(draw);
    if (draw[0] < limit) return draw[0] % n;
  }
}

/**
 * @typedef {object} Cursor
 * @property {() => number} next the next value (wraps after one full pass)
 * @property {number} offset index of the first value read
 * @property {number} used values read so far
 * @property {number} total length of the stream
 * @property {boolean} replaying true once a value is read a second time
 */

/**
 * In-order reader over a stream, starting at an offset.
 * @param {Uint8Array} stream
 * @param {{ offset?: number | 'crypto' }} [options] 'crypto' draws the offset
 *   with crypto.getRandomValues (disclosed in the README)
 * @returns {Cursor}
 */
export function bitCursor(stream, { offset = 0 } = {}) {
  const total = stream.length;
  const start = offset === 'crypto' ? randomIndex(total) : offset;
  if (!(Number.isInteger(start) && start >= 0 && start < total)) {
    throw new RangeError(`bitCursor: offset ${offset} outside [0, ${total})`);
  }
  const cursor = {
    offset: start,
    used: 0,
    total,
    replaying: false,
    next() {
      const value = stream[(start + cursor.used) % total];
      cursor.replaying = cursor.used >= total;
      cursor.used += 1;
      return value;
    },
  };
  return cursor;
}

/**
 * The digits in order from the first one (decorative use: the title, heading
 * and link decrypts and the 404 code). Position lives in memory only.
 * @returns {Cursor}
 */
export function digitStream() {
  return bitCursor(digits(), { offset: 0 });
}
