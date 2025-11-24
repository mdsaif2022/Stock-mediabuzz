/**
 * Back Navigation Detector
 * 
 * Provides a reliable way to detect browser back/forward navigation
 * by tracking popstate events globally.
 */

let isBackNavigation = false;
let backNavigationTimeout: ReturnType<typeof setTimeout> | null = null;
let backNavigationStartTime = 0;

/**
 * Initialize the back navigation detector
 * Call this once in your app initialization
 */
export function setupBackNavigationDetector() {
  if (typeof window === 'undefined') return;

  const handlePopState = () => {
    // Clear any existing timeout
    if (backNavigationTimeout !== null) {
      clearTimeout(backNavigationTimeout);
      backNavigationTimeout = null;
    }

    // Set flag immediately when popstate fires
    isBackNavigation = true;
    backNavigationStartTime = Date.now();

    // Reset flag after navigation completes (React Router processes it)
    // Use a longer timeout to ensure React Router has time to handle it
    // Also ensure it stays active long enough for useEffect hooks to check it
    backNavigationTimeout = setTimeout(() => {
      isBackNavigation = false;
      backNavigationTimeout = null;
      backNavigationStartTime = 0;
    }, 1000); // Increased to 1000ms to ensure all useEffect hooks can detect it
  };

  // Listen for popstate events (browser back/forward button)
  // Use bubble phase so React Router handles it first
  window.addEventListener('popstate', handlePopState, false);

  // Return cleanup function
  return () => {
    window.removeEventListener('popstate', handlePopState, false);
    if (backNavigationTimeout !== null) {
      clearTimeout(backNavigationTimeout);
      backNavigationTimeout = null;
    }
  };
}

/**
 * Check if current navigation is from browser back/forward button
 * This is more reliable than useNavigationType which can have timing issues
 */
export function isBackNavigationActive(): boolean {
  // Check if flag is set AND it's been less than 1 second since popstate
  // This ensures we catch back navigation even if there's a delay
  if (isBackNavigation) {
    const timeSincePopState = Date.now() - backNavigationStartTime;
    return timeSincePopState < 1000; // Active for 1 second after popstate
  }
  return false;
}

/**
 * Reset the back navigation flag (useful for testing)
 */
export function resetBackNavigationFlag(): void {
  isBackNavigation = false;
  if (backNavigationTimeout !== null) {
    clearTimeout(backNavigationTimeout);
    backNavigationTimeout = null;
  }
}

