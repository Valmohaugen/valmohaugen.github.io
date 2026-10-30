import { digitStream } from '@/lib/qrng/bits.mjs';
import type { Cursor } from '@/lib/qrng/bits.mjs';

/** The site's one decorative read position in the digit stream; memory only. */
let digits: Cursor | null = null;

/**
 * The measured ibm_sherbrooke digits every decrypt reads from (headings in
 * Decrypt.tsx, links in LinkDecrypt.tsx), so the digits run on in order across
 * them instead of each effect replaying the same start.
 */
export function sharedDigits(): Cursor {
  digits ??= digitStream();
  return digits;
}

/** Decrypts are skipped under reduced motion and in forced-colors mode. */
export function motionAllowed(): boolean {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !window.matchMedia('(forced-colors: active)').matches;
}
