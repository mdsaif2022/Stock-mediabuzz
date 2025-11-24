/**
 * History Guard - Prevents duplicate URL entries in browser history
 * 
 * This utility prevents the issue where multiple history entries are created
 * with the same URL, making the back button ineffective, especially on mobile devices.
 * 
 * Usage: Import and call `setupHistoryGuard()` in main.tsx
 */

let lastUrl: string | null = null;
let isGuarding = false;
let lastPushStateTime = 0;
let consecutiveSameUrlCount = 0;

/**
 * Get a unique identifier for the current URL
 */
function getUrlKey(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

/**
 * Normalize URL for comparison (handles relative/absolute URLs)
 */
function normalizeUrl(url: string | URL | null | undefined, baseUrl: string = window.location.origin): string {
  if (!url) return window.location.href;
  
  const urlString = String(url);
  
  // If it's already a full URL, return it
  if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
    try {
      const urlObj = new URL(urlString);
      return `${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
    } catch {
      return urlString;
    }
  }
  
  // If it's a relative URL, resolve it against the current location
  try {
    const urlObj = new URL(urlString, baseUrl);
    return `${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
  } catch {
    return urlString;
  }
}

/**
 * Check if URL actually changed
 */
function hasUrlChanged(): boolean {
  const currentUrl = getUrlKey();
  if (lastUrl === null) {
    lastUrl = currentUrl;
    return true; // First load
  }
  const changed = lastUrl !== currentUrl;
  lastUrl = currentUrl;
  return changed;
}

/**
 * Monitor history API to detect duplicate entries
 * Mobile-optimized version that doesn't interfere with React Router
 */
export function setupHistoryGuard() {
  if (typeof window === 'undefined' || isGuarding) {
    return;
  }

  isGuarding = true;
  lastUrl = getUrlKey();

  // Store original methods
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  // Track the last URL that was pushed (not replaced)
  let lastPushedUrl: string | null = null;

  // Override pushState to prevent duplicate entries
  // Only intercept if it's clearly a duplicate from a third-party script
  window.history.pushState = function(state: any, title: string, url?: string | URL | null) {
    const now = Date.now();
    const timeSinceLastPush = now - lastPushStateTime;
    lastPushStateTime = now;

    // Normalize URLs for comparison
    const currentUrlKey = getUrlKey();
    const newUrlKey = normalizeUrl(url);
    
    // Check if this is the exact same URL as current (including query/hash)
    const isExactDuplicate = newUrlKey === currentUrlKey;
    
    // Check if this is the same as the last pushed URL (rapid duplicate pushes)
    const isRapidDuplicate = lastPushedUrl === newUrlKey && timeSinceLastPush < 100;
    
    // Only prevent if:
    // 1. It's an exact duplicate of current URL AND
    // 2. It happened very quickly (likely from ad scripts) OR
    // 3. We've seen multiple consecutive duplicates
    if (isExactDuplicate) {
      consecutiveSameUrlCount++;
      
      // If we see multiple rapid duplicates, it's likely ad scripts
      // Only convert to replaceState if it's clearly spam
      if (isRapidDuplicate || consecutiveSameUrlCount > 2) {
        console.warn('[History Guard] Preventing duplicate history entry:', newUrlKey);
        consecutiveSameUrlCount = 0; // Reset counter
        // Use replaceState instead to avoid duplicate entry
        return originalReplaceState.call(window.history, state, title, url);
      }
    } else {
      // URL changed, reset counter
      consecutiveSameUrlCount = 0;
      lastPushedUrl = newUrlKey;
    }
    
    // URL is different or legitimate navigation - allow pushState
    return originalPushState.call(window.history, state, title, url);
  };

  // Monitor popstate events to track URL changes (for mobile browser back button)
  // Use capture phase to ensure we track before React Router handles it
  window.addEventListener('popstate', (event) => {
    const newUrl = getUrlKey();
    if (lastUrl !== newUrl) {
      lastUrl = newUrl;
      lastPushedUrl = null; // Reset on navigation
      consecutiveSameUrlCount = 0; // Reset counter
    }
  }, true); // Use capture phase

  // Monitor location changes (for mobile browsers that might not fire popstate correctly)
  let lastLocation = window.location.href;
  let locationCheckInterval: ReturnType<typeof setInterval> | null = null;
  
  const checkLocation = () => {
    const currentLocation = window.location.href;
    if (currentLocation !== lastLocation) {
      const newUrl = getUrlKey();
      if (lastUrl !== newUrl) {
        lastUrl = newUrl;
        lastPushedUrl = null; // Reset on navigation
        consecutiveSameUrlCount = 0; // Reset counter
      }
      lastLocation = currentLocation;
    }
  };

  // Check location periodically (fallback for mobile browsers)
  // Use a longer interval to avoid performance issues
  locationCheckInterval = setInterval(checkLocation, 500);

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    if (locationCheckInterval) {
      clearInterval(locationCheckInterval);
    }
  });

  console.log('[History Guard] Active - preventing duplicate history entries (mobile-optimized)');
}

/**
 * Reset the guard (useful for testing)
 */
export function resetHistoryGuard() {
  lastUrl = null;
}

/**
 * Get current history state for debugging
 */
export function getHistoryState() {
  return {
    currentUrl: window.location.href,
    urlKey: getUrlKey(),
    historyLength: window.history.length,
    lastTrackedUrl: lastUrl,
  };
}

