import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * NavigationContext
 * Global navigation state management
 * Ensures state updates before navigation
 */

interface NavigationState {
  isNavigating: boolean;
  previousPath: string | null;
  navigationData: Record<string, any>;
}

interface NavigationContextType {
  state: NavigationState;
  navigateTo: (
    path: string,
    options?: {
      state?: any;
      replace?: boolean;
      beforeNavigate?: () => void | Promise<void>;
    }
  ) => Promise<void>;
  setNavigationData: (key: string, value: any) => void;
  clearNavigationData: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [state, setState] = useState<NavigationState>({
    isNavigating: false,
    previousPath: null,
    navigationData: {},
  });

  /**
   * Navigate with state-first approach
   */
  const navigateTo = useCallback(
    async (
      path: string,
      options?: {
        state?: any;
        replace?: boolean;
        beforeNavigate?: () => void | Promise<void>;
      }
    ) => {
      try {
        // Set navigating flag
        setState((prev) => ({
          ...prev,
          isNavigating: true,
          previousPath: window.location.pathname,
        }));

        // Execute beforeNavigate callback if provided
        if (options?.beforeNavigate) {
          const result = options.beforeNavigate();
          if (result instanceof Promise) {
            await result;
          }
        }

        // Small delay to ensure state updates are flushed
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Perform navigation
        navigate(path, {
          replace: options?.replace,
          state: options?.state,
        });

        // Reset navigating flag after navigation
        setState((prev) => ({
          ...prev,
          isNavigating: false,
        }));
      } catch (error) {
        console.error('Navigation error:', error);
        setState((prev) => ({
          ...prev,
          isNavigating: false,
        }));
      }
    },
    [navigate]
  );

  /**
   * Store temporary navigation data
   */
  const setNavigationData = useCallback((key: string, value: any) => {
    setState((prev) => ({
      ...prev,
      navigationData: {
        ...prev.navigationData,
        [key]: value,
      },
    }));
  }, []);

  /**
   * Clear all navigation data
   */
  const clearNavigationData = useCallback(() => {
    setState((prev) => ({
      ...prev,
      navigationData: {},
    }));
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        state,
        navigateTo,
        setNavigationData,
        clearNavigationData,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

/**
 * Hook to use navigation context
 */
export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}
