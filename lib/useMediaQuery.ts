import { useCallback, useSyncExternalStore } from 'react';

/**
 * Live value of a CSS media query. The server render (and hydration) uses
 * `serverValue`; the browser value takes over right after, without a state
 * update inside an effect.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}
