import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Ensures every route navigation starts at the top of the page.
 * Also handles in-page hash navigation so anchor links still work.
 * Enhanced for mobile browser compatibility.
 * IMPORTANT: Does NOT scroll to top on back navigation to browse pages to preserve scroll position.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();
  const prevPathname = useRef(pathname);
  const isNavigatingBackRef = useRef(false);

  // Set up popstate listener outside useEffect to catch events before React Router processes them
  useEffect(() => {
    // Track timeout to clean it up on unmount or new popstate event
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    // Detect if this is a back/forward navigation by checking if popstate was fired
    // This helps ensure proper behavior on mobile browsers
    const handlePopState = () => {
      // Clear any existing timeout to prevent accumulation
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      isNavigatingBackRef.current = true;
      // Reset flag after a longer delay to ensure BrowseMedia can restore scroll first
      timeoutId = setTimeout(() => {
        isNavigatingBackRef.current = false;
        timeoutId = null;
      }, 500);
    };

    // Use bubble phase (not capture) to avoid interfering with React Router
    // React Router needs to handle popstate first for back button to work
    window.addEventListener('popstate', handlePopState, false);

    return () => {
      // Clean up event listener - MUST match the phase used in addEventListener
      window.removeEventListener('popstate', handlePopState, false);
      // Clean up any pending timeout to prevent resource leaks
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
  }, []); // Only set up listener once

  useEffect(() => {
    // Only scroll if pathname actually changed (not just a re-render)
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;

      // Check if this is a back/forward navigation using multiple indicators
      // Use a longer delay to ensure BrowseMedia has time to restore scroll position
      setTimeout(() => {
        const isBackNavigation = 
          navigationType === 'POP' || // React Router's navigation type
          isNavigatingBackRef.current; // Popstate detected
        
        // Don't scroll to top on back navigation to BrowseMedia pages
        // This includes both /browse and /browse/:category (but not /browse/:category/:id)
        // Let BrowseMedia handle its own scroll restoration
        const isBrowsePage = pathname.startsWith('/browse') && !pathname.match(/\/browse\/[^/]+\/[^/]+$/);
        
        if (isBackNavigation && isBrowsePage) {
          // Skip scrolling - BrowseMedia will restore scroll position
          if (process.env.NODE_ENV === 'development') {
            console.log('[ScrollToTop] Back navigation to browse page detected - skipping scroll to top');
          }
          return;
        }
        
        const delay = isBackNavigation ? (hash ? 150 : 50) : 0;

        if (hash) {
          // Small delay to ensure DOM is ready, especially on mobile
          setTimeout(() => {
            const targetId = hash.replace("#", "");
            const element = document.getElementById(targetId);
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "start" });
              return;
            }
          }, delay);
        } else {
          // Scroll to top for forward navigation or non-browse pages
          // Use a small delay on mobile to ensure layout is complete
          setTimeout(() => {
            window.scrollTo({
              top: 0,
              left: 0,
              behavior: "instant" in window ? ("instant" as ScrollBehavior) : "auto",
            });
          }, delay);
        }
      }, 100); // Give BrowseMedia time to restore scroll position first
    }
  }, [pathname, hash, navigationType]);

  return null;
}

