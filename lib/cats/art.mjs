// @ts-check
/**
 * Cartoon Schrödinger's cats as data: lab-notebook ink drawings,
 * rendered by components/cats/CatSprite.tsx and styled by assets/css/cats.css.
 * Four poses: awake and asleep (the homepage cat); walk, awake and box (the footer).
 *
 * Every pose is a list of nodes [tag, attributes, children?] in a 100 × 100
 * box with the floor at y = 92. Classes carry all styling:
 *   cf  filled shape (page background) with an ink outline
 *   cl  ink line, no fill
 *   ci  ink fill (eyes, nose)       cw  background fill (eye shine)
 *   c-shadow  the floor shadow
 * and the groups CSS animates with transforms only:
 *   c-bob, c-leg-a, c-leg-b, c-tail (walk), c-flick (the sitting cat's tail).
 * Animated groups sit inside a translated parent, so their own transform
 * (rotate or scale about 0 0) never fights a placement transform.
 *
 * The head is shared: front-facing, drawn around (0, 0), ears to y = −27,
 * chin at y = 16, whiskers to x = ±23.
 */

/** @typedef {[string, Record<string, string | number>, CatNode[]?]} CatNode */

export const CAT_VIEWBOX = '0 0 100 100';

/** @param {string} d @param {string} [cls] @returns {CatNode} */
const path = (d, cls = 'cf') => ['path', { d, class: cls }];
/** @param {string} cls @param {CatNode[]} children @param {string} [transform] @returns {CatNode} */
const group = (cls, children, transform) => ['g', transform ? { class: cls, transform } : { class: cls }, children];
/** @param {string} transform @param {CatNode[]} children @returns {CatNode} */
const place = (transform, children) => ['g', { transform }, children];

/** @type {Record<string, CatNode[]>} */
const EYES = {
  open: [
    ['ellipse', { cx: -7, cy: 0, rx: 2.6, ry: 3.6, class: 'ci' }],
    ['ellipse', { cx: 7, cy: 0, rx: 2.6, ry: 3.6, class: 'ci' }],
    ['circle', { cx: -6.1, cy: -1.3, r: 0.9, class: 'cw' }],
    ['circle', { cx: 7.9, cy: -1.3, r: 0.9, class: 'cw' }],
  ],
  closed: [path('M-10 1Q-7 3.8-4 1M4 1Q7 3.8 10 1', 'cl')],
};

const MOUTH = 'M0 6C0 8.5-3 9-4 7.5M0 6C0 8.5 3 9 4 7.5';

/**
 * @param {string} transform placement of the head's (0, 0)
 * @param {{ eyes?: keyof EYES }} [options]
 * @returns {CatNode}
 */
function head(transform, { eyes = 'open' } = {}) {
  return place(transform, [
    path('M-18 4C-19-4-17-10-14-13L-16-27-5-18C-2-19 2-19 5-18L16-27 14-13C17-10 19-4 18 4C16 12 8 16 0 16C-8 16-16 12-18 4Z'),
    path('M-12.5-16.5L-14-23M12.5-16.5L14-23', 'cl'),
    place('translate(0 -2)', EYES[eyes]),
    path('M-1.6 4L1.6 4 0 6Z', 'ci'),
    path(MOUTH, 'cl'),
    path('M-10 6L-23 3.5M-10 8.5L-23 10M10 6L23 3.5M10 8.5L23 10', 'cl'),
  ]);
}

const SHADOW_SIT = /** @type {CatNode} */ (['ellipse', { cx: 50, cy: 93, rx: 25, ry: 2, class: 'c-shadow' }]);
const TAIL_SIT = path('M70 88C82 90 90 82 88 70C87.5 66 83 66 83.5 70C85 79 79 84 70.5 83Z');
const BODY_SIT = path('M37 46C31 56 28 70 29 82C29.5 89 34 92 41 92L59 92C66 92 70.5 89 71 82C72 70 69 56 63 46');
const HIND_PAWS = path('M39.5 92C40 88.5 48 88.5 48.5 92M51.5 92C52 88.5 60 88.5 60.5 92', 'cl');

/**
 * The sitting cat, facing the viewer.
 * @returns {CatNode[]}
 */
function sitting() {
  return [
    SHADOW_SIT,
    group('c-flick', [TAIL_SIT]),
    BODY_SIT,
    path('M44 70L44 89M56 70L56 89', 'cl'),
    HIND_PAWS,
    head('translate(50 36)'),
  ];
}

/** Leg for the walk: hip or shoulder at (0, 0), paw at the floor. */
const LEG = path('M-3.5 0L-3.5 27C-3.5 30.5 3.5 30.5 3.5 27L3.5 0');
/** @param {number} x @param {number} y @param {'a' | 'b'} phase @returns {CatNode} */
const leg = (x, y, phase) => place(`translate(${x} ${y})`, [group(`c-leg-${phase}`, [LEG])]);

/** @type {Record<string, CatNode[]>} */
export const POSES = {
  awake: sitting(),

  asleep: [
    ['ellipse', { cx: 51, cy: 93, rx: 34, ry: 2, class: 'c-shadow' }],
    path('M18 92C12 80 24 63 50 63C76 63 90 76 84 92Z'),
    path('M70 92C70 82 76 76 82 80', 'cl'),
    path('M84 87C82 96 58 98 44 93C41.5 92 42.5 88.5 45 89.5C58 93.5 76 92 78.5 85Z'),
    head('translate(34 74) rotate(-14) scale(0.8)', { eyes: 'closed' }),
    ['ellipse', { cx: 27, cy: 90.5, rx: 5, ry: 2.5, class: 'cf' }],
    ['ellipse', { cx: 39, cy: 91, rx: 5, ry: 2.5, class: 'cf' }],
    path('M58 50L63 50 58 55 63 55M67 41L70.5 41 67 44.5 70.5 44.5', 'cl'),
  ],

  walk: [
    ['ellipse', { cx: 52, cy: 93, rx: 30, ry: 2, class: 'c-shadow' }],
    group('c-bob', [
      leg(66, 60, 'a'),
      leg(38, 60, 'b'),
      place('translate(28 50)', [group('c-tail', [path('M0 0C-10-2-16-10-14-22C-13.5-25-9.5-25-10-22C-11.5-12-7-6 1-5Z')])]),
      path('M26 52C26 44 34 42 50 42C64 42 74 44 76 52C78 62 70 68 50 68C32 68 26 62 26 52Z'),
      leg(32, 62, 'a'),
      leg(70, 62, 'b'),
      head('translate(76 38) scale(0.9)'),
    ]),
  ],
};

/** Schrödinger's box, closed: the footer cat sits beside it. */
POSES.box = [
  ['ellipse', { cx: 54, cy: 93, rx: 34, ry: 2, class: 'c-shadow' }],
  path('M20 54L80 54 80 92 20 92Z'),
  path('M80 54L94 42 94 80 80 92Z'),
  path('M20 54L34 42 94 42 80 54Z'),
  path('M27 48L87 48M50 54L50 70', 'cl'),
];

