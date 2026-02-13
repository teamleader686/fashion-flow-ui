import { useEffect, useRef } from 'react';

/**
 * useCleanupEffect Hook
 * Enhanced useEffect with automatic cleanup tracking
 * Prevents memory leaks and stale subscriptions
 */

type CleanupFunction = () => void;
type EffectCallback = () => CleanupFunction | void;

export function useCleanupEffect(
  effect: EffectCallback,
  deps: React.DependencyList
) {
  const cleanupRef = useRef<CleanupFunction | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Run the effect
    const cleanup = effect();

    // Store cleanup function
    if (cleanup) {
      cleanupRef.current = cleanup;
    }

    // Cleanup on unmount or deps change
    return () => {
      isMountedRef.current = false;

      if (cleanupRef.current) {
        try {
          cleanupRef.current();
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
        cleanupRef.current = null;
      }
    };
  }, deps);

  return isMountedRef.current;
}

/**
 * useSubscription Hook
 * Manages Supabase or other subscriptions with automatic cleanup
 */
export function useSubscription<T>(
  subscribe: () => { unsubscribe: () => void } | (() => void),
  deps: React.DependencyList
) {
  useCleanupEffect(() => {
    const subscription = subscribe();

    // Return cleanup function
    return () => {
      if (typeof subscription === 'function') {
        subscription();
      } else if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, deps);
}
