/**
 * Safe Navigation Hook
 * 
 * Wraps React Router's useNavigate to ensure proper history management
 * and prevent redirect loops.
 */

import { useNavigate as useReactRouterNavigate, useLocation } from 'react-router-dom';
import { setProgrammaticNavigation } from '@/utils/historyGuard';
import { useEffect, useRef } from 'react';

/**
 * Safe version of React Router's useNavigate
 * Automatically marks navigation as programmatic to prevent interference with back button
 */
export function useSafeNavigate() {
  const navigate = useReactRouterNavigate();
  const location = useLocation();
  const lastPathRef = useRef(location.pathname + location.search + location.hash);

  // Track location changes to detect programmatic navigation
  useEffect(() => {
    const currentPath = location.pathname + location.search + location.hash;
    if (currentPath !== lastPathRef.current) {
      // Path changed - this is programmatic navigation
      setProgrammaticNavigation(true);
      lastPathRef.current = currentPath;
    }
  }, [location]);

  // Wrapped navigate function that marks navigation as programmatic
  const safeNavigate = (
    to: string | number,
    options?: { replace?: boolean; state?: any }
  ) => {
    // Mark as programmatic navigation before navigating
    setProgrammaticNavigation(true);
    
    if (typeof to === 'number') {
      // For history.go(), history.back(), etc.
      navigate(to);
    } else {
      // Check if we're already on the target URL to prevent loops
      // Normalize both paths for comparison (handle relative/absolute URLs)
      const currentPath = location.pathname + location.search + location.hash;
      
      // Normalize target path - handle both absolute and relative URLs
      let targetPath = to;
      if (to.startsWith('/')) {
        // Absolute path - extract pathname, search, and hash
        try {
          const url = new URL(to, window.location.origin);
          targetPath = url.pathname + url.search + url.hash;
        } catch {
          // If URL parsing fails, use as-is but extract pathname+search+hash manually
          const [pathPart, queryPart] = to.split('?');
          const [pathOnly, hashPart] = pathPart.split('#');
          targetPath = pathOnly + (queryPart ? `?${queryPart}` : '') + (hashPart ? `#${hashPart}` : '');
        }
      } else {
        // Relative path - resolve it
        try {
          const url = new URL(to, window.location.origin + location.pathname);
          targetPath = url.pathname + url.search + url.hash;
        } catch {
          // If URL parsing fails, treat as relative to current pathname
          const basePath = location.pathname.endsWith('/') ? location.pathname : location.pathname + '/';
          const [pathPart, queryPart] = to.split('?');
          const [pathOnly, hashPart] = pathPart.split('#');
          targetPath = (basePath + pathOnly).replace(/\/+/g, '/') + (queryPart ? `?${queryPart}` : '') + (hashPart ? `#${hashPart}` : '');
        }
      }
      
      // Compare normalized paths (including search and hash)
      if (currentPath === targetPath && !options?.replace) {
        // Already on target, skip navigation
        console.warn('[SafeNavigate] Already on target URL, skipping:', to);
        return;
      }
      
      navigate(to, options);
    }
  };

  return safeNavigate;
}

