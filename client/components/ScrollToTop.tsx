import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Ensures every route navigation starts at the top of the page.
 * Also handles in-page hash navigation so anchor links still work.
 * Enhanced for mobile browser compatibility.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
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
      // Reset flag after a short delay
      timeoutId = setTimeout(() => {
        isNavigatingBackRef.current = false;
        timeoutId = null;
      }, 200);
    };

    // Use bubble phase (not capture) to avoid interfering with React Router
    // React Router needs to handle popstate first for back button to work
    window.addEventListener('popstate', handlePopState, false);

    return () => {
      // Clean up event listener
      window.removeEventListener('popstate', handlePopState, true);
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

      // Check flag asynchronously to ensure it's been set by popstate handler
      // Use a microtask to check after popstate event has been processed
      Promise.resolve().then(() => {
        const isBackNavigation = isNavigatingBackRef.current;
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
          // Scroll to top
          // Use a small delay on mobile to ensure layout is complete
          setTimeout(() => {
            window.scrollTo({
              top: 0,
              left: 0,
              behavior: "instant" in window ? ("instant" as ScrollBehavior) : "auto",
            });
          }, delay);
        }
      });
    }
  }, [pathname, hash]);

  return null;
}

