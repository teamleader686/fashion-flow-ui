import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * usePageLifecycle Hook
 * Manages page lifecycle with proper cleanup and state management
 * 
 * Features:
 * - Automatic cleanup on unmount
 * - State-first navigation
 * - Memory leak prevention
 * - Subscription management
 */

interface PageLifecycleOptions {
  onMount?: () => void | Promise<void>;
  onUnmount?: () => void | Promise<void>;
  cleanupSubscriptions?: () => void;
  resetState?: () => void;
}

export function usePageLifecycle(options: PageLifecycleOptions = {}) {
  const {
    onMount,
    onUnmount,
    cleanupSubscriptions,
    resetState,
  } = options;

  const navigate = useNavigate();
  const isMountedRef = useRef(true);
  const subscriptionsRef = useRef<Array<() => void>>([]);

  // Track if component is mounted
  useEffect(() => {
    isMountedRef.current = true;

    // Call onMount callback
    if (onMount) {
      const result = onMount();
      if (result instanceof Promise) {
        result.catch((error) => {
          console.error('Error in onMount:', error);
        });
      }
    }

    return () => {
      isMountedRef.current = false;

      // Cleanup subscriptions
      if (cleanupSubscriptions) {
        cleanupSubscriptions();
      }

      // Cleanup all registered subscriptions
      subscriptionsRef.current.forEach((cleanup) => {
        try {
          cleanup();
        } catch (error) {
          console.error('Error cleaning up subscription:', error);
        }
      });
      subscriptionsRef.current = [];

      // Reset state
      if (resetState) {
        resetState();
      }

      // Call onUnmount callback
      if (onUnmount) {
        const result = onUnmount();
        if (result instanceof Promise) {
          result.catch((error) => {
            console.error('Error in onUnmount:', error);
          });
        }
      }
    };
  }, [onMount, onUnmount, cleanupSubscriptions, resetState]);

  /**
   * Register a subscription for automatic cleanup
   */
  const registerSubscription = useCallback((cleanup: () => void) => {
    subscriptionsRef.current.push(cleanup);
  }, []);

  /**
   * Navigate with state update first
   * Ensures state is updated before navigation
   */
  const navigateWithState = useCallback(
    async (
      path: string,
      stateUpdater?: () => void | Promise<void>,
      options?: { replace?: boolean; state?: any }
    ) => {
      try {
        // Update state first if provided
        if (stateUpdater) {
          const result = stateUpdater();
          if (result instanceof Promise) {
            await result;
          }
        }

        // Small delay to ensure state updates are processed
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Then navigate
        if (isMountedRef.current) {
          navigate(path, options);
        }
      } catch (error) {
        console.error('Error during navigation:', error);
      }
    },
    [navigate]
  );

  /**
   * Safe state setter that only updates if component is mounted
   */
  const safeSetState = useCallback(
    <T,>(setter: (prev: T) => T, currentState: T): T => {
      if (isMountedRef.current) {
        return setter(currentState);
      }
      return currentState;
    },
    []
  );

  return {
    isMounted: isMountedRef.current,
    navigateWithState,
    registerSubscription,
    safeSetState,
  };
}
