'use client';

import { useId, useState } from 'react';
import type { PointerEvent } from 'react';

import CatSprite from '@/components/cats/CatSprite';
import { fringeVisibility } from '@/lib/physics/wigner.mjs';
import { bitCursor, rawBits } from '@/lib/qrng/bits.mjs';
import type { Cursor } from '@/lib/qrng/bits.mjs';
import { HOME_ALPHA } from '@/lib/stage/ratchet.mjs';

type Pose = 'awake' | 'asleep';

/** One reader per visit: every prepared cat takes the next raw bit in order. */
let reader: Cursor | null = null;

/**
 * The homepage's Schrödinger cat, sitting at the foot of the hero figure.
 * Two ghost poses, awake (the right lobe) and asleep (the left), with
 * a hatch between them whose opacity is half the fringe visibility V of the
 * figure. Photon loss only fades the hatch: decoherence leaves a 50/50 mixture,
 * both poses stay. Every hover or tap is a fresh measurement: it collapses
 * the cat to one pose, picked by the next raw ibm_sherbrooke bit from a random
 * start, and a mouse moving away prepares the superposition again.
 * Decorative, like the figure it sits on.
 */
export default function HomeCat({ loss }: { loss: number }) {
  const [measured, setMeasured] = useState<Pose | null>(null);
  // Counts measurements, so an awake result flicks its tail every time.
  const [shots, setShots] = useState(0);
  const hatch = `hatch-${useId().replace(/[^\w-]/g, '')}`;
  const visibility = fringeVisibility(HOME_ALPHA, 1 - loss);

  const measure = () => {
    reader ??= bitCursor(rawBits(), { offset: 'crypto' });
    setMeasured(reader.next() === 1 ? 'awake' : 'asleep');
    setShots((n) => n + 1);
  };
  // A mouse leaving re-prepares the superposition. A finger leaves right
  // after each tap, so on touch the next tap simply measures again.
  const prepare = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') setMeasured(null);
  };

  return (
    <div
      className={`home-cat home-cat--${measured ?? 'both'}`}
      aria-hidden="true"
      onPointerEnter={measure}
      onPointerLeave={prepare}
    >
      {!measured && (
        <svg className="home-cat__hatch" viewBox="0 0 24 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <defs>
            <pattern id={hatch} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <path d="M0 0V5" />
            </pattern>
          </defs>
          <rect width="24" height="60" fill={`url(#${hatch})`} style={{ opacity: 0.5 * visibility }} />
        </svg>
      )}
      <CatSprite pose="asleep" ghost={measured !== 'asleep'} className="home-cat__asleep" />
      {/* Two identical flick animations, alternated, so a repeat result
          replays it without remounting the drawing under the pointer. */}
      <CatSprite
        pose="awake"
        ghost={measured !== 'awake'}
        className={measured === 'awake' ? `home-cat__awake ${shots % 2 ? 'cat--flick' : 'cat--flick-again'}` : 'home-cat__awake'}
      />
    </div>
  );
}
