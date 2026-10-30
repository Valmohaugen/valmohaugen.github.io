// @ts-check
/**
 * The 3,000 bits our SC Quantathon v1 team measured on IBM's ibm_sherbrooke
 * processor (2024). Each file is 1,000 bits from Hadamard-gate circuits (H on
 * every qubit, then measure), extracted with one of the team's three methods:
 * mod-2 XOR, iteration, and concatenation. Source: the team repository
 * www.github.com/valmohaugen/SC-Quantathon-v1-2024, files
 * SC-Quantathon-2024/renamed-datasets/{mod2,iteration,concatenation}_sherbrooke_1k.txt,
 * concatenated in that order. They are the only hardware bits the site uses;
 * Stage4/quantum_bits.txt in the same repository is simulator output.
 *
 * Measured, not idealized: 1,422 of the 3,000 bits are ones (z = −2.85 against
 * a fair coin). lib/qrng/bits.mjs offers the raw stream and decimal digits
 * from it; neither is presented as anything more than these measurements.
 *
 * Encoding: bits packed eight per byte, most significant bit first, base64.
 * SHA256 is the digest of the 3,000-character 0/1 string, so anyone can check
 * it against the files:
 *   cat mod2_sherbrooke_1k.txt iteration_sherbrooke_1k.txt \
 *       concatenation_sherbrooke_1k.txt | tr -d '\n' | shasum -a 256
 * scripts/verify-qrng.mjs checks it (and the counts) at every build.
 */

/** Number of measured bits. */
export const BIT_COUNT = 3000;

/** sha256 of the bits as a 0/1 string, in file order. */
export const SHA256 = '5dfb2a067659ec180083d1dd3db02df688aea33750eb34aa0a641d9e2e460df5';

/** The bits, packed MSB first (375 bytes), base64. */
export const BITS_BASE64 =
  'ZzUXwj0lKnh3/1KdUYGK4cF3KClpuVTR9hYPfBmNy4a+iOYkRAsXIPJLWS6wJ6Ut5ZqKVtqO7UqQwpmL0EwDUA+3c3Rfr+vysGzO' +
  'ukXF36AIhVpBpfmFSqwA1PZq9A1MfK8ViXqjYvJOL/Hi+8Tk53hnXYgLEeQtBLJSwLjFBEbwQwLASD1idSY+UIB0SBGiBXeOBbk4' +
  'v6NEL0Z9D/RAzdVxXH3sQelIDeIwlinK4C1o5wtz/DgkaK0IcGTeznNqQHMp2xdwDjPacZomjpNEGGKFIXdajN3PSdUSx3hlvwAz' +
  '9XOv+vHxcwWFaNeGCOCtIlfQwJ6iPdSZP5Oe7okgCjBqmcdh3Paenb/C45FqYFcZMx6TbORBewGsqxT1dsBbRt71AJZnYNYq1qPk' +
  '1KmGgLD5EVEmfOr2dgkEP3GUvElYzcXXbHK+mkcEXRbZb10u5PQCKRKIFs+kfFJMFBb+VI1eUxzCz4INABn4AMRCgOEzwBG+QfCU';
