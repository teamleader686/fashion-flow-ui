import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * Automatically scrolls to top when route changes
 * Works on Desktop, Mobile, and Bottom Navigation
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top immediately on route change
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant', // Use 'instant' for immediate scroll, 'smooth' for animated
    });

    // Fallback for older browsers
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
}
