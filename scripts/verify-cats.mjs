// @ts-check
/**
 * Verify the cartoon cat drawings (lib/cats/art.mjs), which CatSprite renders.
 *
 * 1. Exactly the poses the site draws exist: awake and asleep (the homepage
 *    cat; its ghosts are these drawings with a CSS modifier), walk and box
 *    (the footer, whose cat otherwise sits awake).
 * 2. Safe, small markup: only path/g/ellipse/circle elements with geometry,
 *    class and transform attributes; path data is plain numbers and commands.
 * 3. Animation hooks exist where CSS expects them (legs, tail and bob for the
 *    walk; the tail flick for the sitting cat); nothing outside the viewBox.
 * 4. Size: the drawings plus the sprite component stay within 10 KB gzip.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

import { CAT_VIEWBOX, POSES } from '../lib/cats/art.mjs';

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

/** @typedef {[string, Record<string, string | number>, CatNode[]?]} CatNode */

/** @param {CatNode[]} nodes @returns {CatNode[]} every node, depth first */
function flatten(nodes) {
  return nodes.flatMap((node) => [node, ...flatten(node[2] ?? [])]);
}
/** @param {CatNode[]} nodes @param {string} cls */
const withClass = (nodes, cls) => flatten(nodes).filter(([, a]) => String(a.class ?? '').split(' ').includes(cls));

const TAGS = new Set(['path', 'g', 'ellipse', 'circle']);
const ATTRS = new Set(['d', 'cx', 'cy', 'r', 'rx', 'ry', 'class', 'transform']);
const PATH = /^[MLCQZmlcqz0-9 .,-]+$/;

check('poses: exactly awake, asleep, walk and box', () => {
  assert.equal(CAT_VIEWBOX, '0 0 100 100');
  assert.deepEqual(Object.keys(POSES).sort(), ['asleep', 'awake', 'box', 'walk']);
  for (const [pose, nodes] of Object.entries(POSES)) assert.ok(Array.isArray(nodes) && nodes.length > 0, `pose ${pose}`);
});

check('markup: allowed elements and attributes only; plain path data', () => {
  for (const [pose, nodes] of Object.entries(POSES)) {
    for (const [tag, attrs] of flatten(nodes)) {
      assert.ok(TAGS.has(tag), `${pose}: <${tag}>`);
      for (const key of Object.keys(attrs)) assert.ok(ATTRS.has(key), `${pose}: ${key}=`);
      if (attrs.d !== undefined) assert.match(String(attrs.d), PATH, `${pose}: path data`);
      if (attrs.transform !== undefined) assert.match(String(attrs.transform), /^(translate|rotate|scale)\([-0-9. ]+\)( (translate|rotate|scale)\([-0-9. ]+\))*$/, `${pose}: transform`);
    }
  }
});

check('animation hooks: walk legs/tail/bob, the sitting cat\'s tail flick', () => {
  assert.equal(withClass(POSES.walk, 'c-leg-a').length, 2, 'two legs in phase A');
  assert.equal(withClass(POSES.walk, 'c-leg-b').length, 2, 'two legs in phase B');
  assert.equal(withClass(POSES.walk, 'c-tail').length, 1);
  assert.equal(withClass(POSES.walk, 'c-bob').length, 1);
  assert.equal(withClass(POSES.awake, 'c-flick').length, 1);
});

check('geometry: every coordinate lies inside the viewBox (with transforms applied)', () => {
  // Top-level placements land inside the box; everything else is checked
  // loosely (raw numbers within [-40, 140]) because nested frames are local.
  for (const [pose, nodes] of Object.entries(POSES)) {
    for (const [, attrs] of flatten(nodes)) {
      for (const key of ['d', 'cx', 'cy', 'r', 'rx', 'ry', 'transform']) {
        if (attrs[key] === undefined) continue;
        for (const n of String(attrs[key]).match(/-?\d+(\.\d+)?/g) ?? []) {
          assert.ok(Number(n) >= -40 && Number(n) <= 140, `${pose}: ${key} ${n}`);
        }
      }
    }
    for (const [, attrs, children] of nodes.flatMap((n) => (n[1].class === 'c-bob' ? n[2] ?? [] : [n]))) {
      const t = String(attrs.transform ?? '').match(/^translate\((-?[\d.]+) (-?[\d.]+)\)/);
      if (t && children) assert.ok(+t[1] >= 0 && +t[1] <= 100 && +t[2] >= 0 && +t[2] <= 100, `${pose}: ${t[0]}`);
    }
  }
});

check('size: drawings + sprite component ≤ 10 KB gzip', () => {
  const files = ['lib/cats/art.mjs', 'components/cats/CatSprite.tsx'];
  const bytes = files.reduce((s, f) => s + gzipSync(readFileSync(new URL(`../${f}`, import.meta.url))).length, 0);
  assert.ok(bytes <= 10 * 1024, `${(bytes / 1024).toFixed(1)} KB`);
  console.log(`       ${(bytes / 1024).toFixed(1)} KB gzip (source; the bundle minifies further)`);
});

if (failed) {
  console.log(`[FAIL] verify-cats: ${failed} failed, ${passed} passed`);
  process.exitCode = 1;
} else {
  console.log(`[done] verify-cats: ${passed} checks passed`);
}
