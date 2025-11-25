/**
 * Back Navigation Detector
 * 
 * Provides a reliable way to detect browser back/forward navigation
 * by tracking popstate events globally. This complements React Router's
 * useNavigationType() hook for more reliable detection, especially when
 * useNavigationType() may report PUSH instead of POP during back navigation.
 * 
 * Usage:
 * 1. Call setupBackNavigationDetector() once in main.tsx
 * 2. Use isBackNavigationActive() in components to check if back navigation is active
 * 3. Combine with useNavigationType() === 'POP' for maximum reliability
 */

let isBackNavigation = false;
let backNavigationTimeout: ReturnType<typeof setTimeout> | null = null;
let backNavigationStartTime = 0;
let lastUrl = '';
let lastPopStateTime = 0;
let hasEverDetectedBackNav = false; // CRITICAL: Persistent flag that never resets until page reload
const BACK_NAV_TIMEOUT_MS = 10000; // Extended timeout window to catch delayed detections (10 seconds)
const URL_CHANGE_THRESHOLD_MS = 100; // If URL changes within this time after popstate, it's likely back nav

/**
 * Initialize the back navigation detector
 * Call this once in your app initialization (e.g., main.tsx)
 * 
 * This sets up a global popstate listener to detect when the user
 * presses the browser back/forward button. The flag is set immediately
 * when popstate fires and cleared after a short timeout.
 */
export function setupBackNavigationDetector() {
  if (typeof window === 'undefined') return;
  
  // Set up popstate listener to detect back/forward navigation
  // This fires BEFORE React Router processes the navigation
  const handlePopState = (event: PopStateEvent) => {
    const now = Date.now();
    lastPopStateTime = now;
    
    // Mark that back navigation is active
    isBackNavigation = true;
    hasEverDetectedBackNav = true; // CRITICAL: Set persistent flag that never resets
    backNavigationStartTime = now;
    
    // Clear any existing timeout
    if (backNavigationTimeout !== null) {
      clearTimeout(backNavigationTimeout);
    }
    
    // Reset flag after timeout window
    // This ensures components can detect back navigation during the critical period
    backNavigationTimeout = setTimeout(() => {
      isBackNavigation = false;
      backNavigationTimeout = null;
      if (process.env.NODE_ENV === 'development') {
        console.log('[BackNavDetector] ⏱️ Back navigation flag cleared after timeout');
      }
    }, BACK_NAV_TIMEOUT_MS);
    
    if (process.env.NODE_ENV === 'development') {
      console.group('🔙 [BackNavDetector] Back navigation detected via popstate event');
      console.log('Event:', event);
      console.log('Previous URL:', lastUrl);
      console.log('Current URL:', window.location.href);
      console.log('URL Changed:', lastUrl !== window.location.href);
      console.log('History State:', event.state);
      console.log('History Length:', window.history.length);
      console.log('Flag set to: true (will clear in', BACK_NAV_TIMEOUT_MS, 'ms)');
      console.log('Timestamp:', new Date().toISOString());
      console.groupEnd();
    }
    
    // Update last URL
    lastUrl = window.location.href;
  };
  
  // Store initial URL
  lastUrl = window.location.href;
  
  // Also monitor URL changes to detect back navigation even if popstate doesn't fire
  // This is a fallback for cases where popstate might be blocked or delayed
  let urlCheckInterval: ReturnType<typeof setInterval> | null = null;
  
  const checkUrlChange = () => {
    const currentUrl = window.location.href;
    const now = Date.now();
    
    // If URL changed recently after a popstate event, it's likely back navigation
    if (lastUrl !== currentUrl && lastPopStateTime > 0) {
      const timeSincePopState = now - lastPopStateTime;
      if (timeSincePopState < URL_CHANGE_THRESHOLD_MS) {
        // URL changed shortly after popstate - this is back navigation
        if (!isBackNavigation) {
          isBackNavigation = true;
          backNavigationStartTime = now;
          if (process.env.NODE_ENV === 'development') {
            console.log('[BackNavDetector] 🔄 URL changed after popstate - marking as back navigation');
          }
        }
      }
    }
    
    lastUrl = currentUrl;
  };
  
  // Check URL changes periodically (fallback detection)
  urlCheckInterval = setInterval(checkUrlChange, 50);
  
  // Use capture phase to catch popstate before React Router processes it
  // This ensures our flag is set before any component effects run
  // CRITICAL: Use capture phase (true) so we catch it before React Router
  window.addEventListener('popstate', handlePopState, true);
  
  // Also listen in bubble phase as a fallback
  window.addEventListener('popstate', handlePopState, false);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[BackNavDetector] ✅ Listeners attached (capture + bubble phase)');
    console.log('[BackNavDetector] ✅ URL change monitor active');
    console.log('[BackNavDetector] ✅ Back navigation detector initialized');
  }
  
  // Return cleanup function
  return () => {
    window.removeEventListener('popstate', handlePopState, true);
    window.removeEventListener('popstate', handlePopState, false);
    if (urlCheckInterval !== null) {
      clearInterval(urlCheckInterval);
      urlCheckInterval = null;
    }
    if (backNavigationTimeout !== null) {
      clearTimeout(backNavigationTimeout);
      backNavigationTimeout = null;
    }
    isBackNavigation = false;
  };
}

/**
 * Check if current navigation is from browser back/forward button
 * 
 * This function returns true if a popstate event was recently fired,
 * indicating that the user pressed the browser back/forward button.
 * 
 * IMPORTANT: This should be used IN COMBINATION with useNavigationType() === 'POP'
 * for maximum reliability, as React Router's navigation type can sometimes
 * be delayed or incorrect during rapid navigation.
 * 
 * @returns true if back/forward navigation is currently active, false otherwise
 */
export function isBackNavigationActive(): boolean {
  const now = Date.now();
  
  // Check if we're within the timeout window
  const timeSinceBackNav = now - backNavigationStartTime;
  const timeSincePopState = lastPopStateTime > 0 ? now - lastPopStateTime : Infinity;
  const isWithinWindow = timeSinceBackNav < BACK_NAV_TIMEOUT_MS || timeSincePopState < URL_CHANGE_THRESHOLD_MS;
  
  // CRITICAL: If we've EVER detected back navigation, always return true
  // This ensures redirects are blocked even after timeout expires
  // The flag persists for the entire page session (until page reload)
  const result = hasEverDetectedBackNav || (isBackNavigation && isWithinWindow);
  
  // CRITICAL: If history is polluted (length > 20) and no popstate fired,
  // this likely means back button pressed but URL didn't change due to duplicates
  // In this case, we can't reliably detect back navigation, but we should warn
  const isHistoryPolluted = window.history.length > 20;
  const noPopStateEver = lastPopStateTime === 0;
  
  if (isHistoryPolluted && noPopStateEver && process.env.NODE_ENV === 'development') {
    console.warn('[BackNavDetector] ⚠️ CRITICAL: History is polluted (length:', window.history.length, ') and NO popstate events detected!');
    console.warn('[BackNavDetector] This means pressing back button does NOT change URL (duplicate entries)');
    console.warn('[BackNavDetector] Browser does NOT fire popstate when URL stays the same');
    console.warn('[BackNavDetector] React Router then treats it as new navigation (PUSH) instead of back (POP)');
    console.warn('[BackNavDetector]');
    console.warn('[BackNavDetector] 🔧 SOLUTION: You MUST clear history first:');
    console.warn('[BackNavDetector]   1. Close ALL tabs of localhost:8080');
    console.warn('[BackNavDetector]   2. Wait 2 seconds');
    console.warn('[BackNavDetector]   3. Open NEW tab');
    console.warn('[BackNavDetector]   4. Navigate to http://localhost:8080/');
    console.warn('[BackNavDetector]   5. History length should be 1-2 (not 50)');
    console.warn('[BackNavDetector]   6. Then test back button again');
  }
  
  // Debug logging in development - log every call to help diagnose
  if (process.env.NODE_ENV === 'development') {
    console.log('[BackNavDetector] isBackNavigationActive() called:', {
      isBackNavigation,
      hasEverDetectedBackNav,
      timeSinceBackNav: timeSinceBackNav + 'ms',
      timeSincePopState: timeSincePopState !== Infinity ? timeSincePopState + 'ms' : 'never',
      isWithinWindow,
      result: result ? '✅ YES' : '❌ NO',
      currentUrl: window.location.href,
      historyLength: window.history.length,
      isHistoryPolluted,
      noPopStateEver,
    });
  }
  
  return result;
}

/**
 * Reset the back navigation flag (useful for testing or manual cleanup)
 */
export function resetBackNavigationFlag(): void {
  isBackNavigation = false;
  if (backNavigationTimeout !== null) {
    clearTimeout(backNavigationTimeout);
    backNavigationTimeout = null;
  }
}

