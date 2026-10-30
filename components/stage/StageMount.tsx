'use client';

import dynamic from 'next/dynamic';

/** The live part of a header figure, loaded as its own chunk after hydration. */
const StageMount = dynamic(() => import('@/components/stage/StageSlot'), { ssr: false });

export default StageMount;
