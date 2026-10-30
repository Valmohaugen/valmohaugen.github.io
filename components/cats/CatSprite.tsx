import { createElement } from 'react';
import type { ReactNode } from 'react';

import { CAT_VIEWBOX, POSES } from '@/lib/cats/art.mjs';

type CatPose = 'awake' | 'asleep' | 'walk' | 'box';

type CatNode = [string, Record<string, string | number>, CatNode[]?];

interface Props {
  pose: CatPose;
  /** Width and height in CSS px. */
  size?: number;
  /** Draw an amplitude instead of a cat: dashed outline, faint teal tint. */
  ghost?: boolean;
  /** Run the pose's animation. CSS skips it under reduced motion. */
  play?: boolean;
  className?: string;
}

function render([tag, { class: className, ...attrs }, children]: CatNode, key: number): ReactNode {
  return createElement(tag, { key, className, ...attrs }, children?.map(render));
}

/**
 * A lab-notebook ink cat (drawings in lib/cats/art.mjs, styles and the
 * transform-only animations in assets/css/cats.css).
 */
export default function CatSprite({ pose, size = 72, ghost = false, play = false, className }: Props) {
  const classes = ['cat', `cat--${pose}`];
  if (ghost) classes.push('cat--ghost');
  if (play) classes.push('cat--play');
  if (className) classes.push(className);
  const nodes = POSES[pose] as CatNode[];
  return (
    <svg
      className={classes.join(' ')}
      viewBox={CAT_VIEWBOX}
      width={size}
      height={size}
      focusable="false"
      aria-hidden="true"
    >
      {nodes.map(render)}
    </svg>
  );
}
