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

  useEffect(() => {
    // Detect if this is a back/forward navigation by checking if popstate was fired
    // This helps ensure proper behavior on mobile browsers
    const handlePopState = () => {
      isNavigatingBackRef.current = true;
      // Reset flag after a short delay
      setTimeout(() => {
        isNavigatingBackRef.current = false;
      }, 100);
    };

    window.addEventListener('popstate', handlePopState);

    // Only scroll if pathname actually changed (not just a re-render)
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;

      if (hash) {
        // Small delay to ensure DOM is ready, especially on mobile
        const delay = isNavigatingBackRef.current ? 150 : 0;
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
        const delay = isNavigatingBackRef.current ? 50 : 0;
        setTimeout(() => {
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: "instant" in window ? ("instant" as ScrollBehavior) : "auto",
          });
        }, delay);
      }
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname, hash]);

  return null;
}

