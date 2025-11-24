/**
 * History Guard - Prevents duplicate URL entries in browser history
 * 
 * This utility prevents the issue where multiple history entries are created
 * with the same URL, making the back button ineffective, especially on mobile devices.
 * 
 * Features:
 * - Blocks rapid duplicate pushState calls from ad scripts
 * - Never interferes with React Router navigation
 * - Tracks programmatic navigation to distinguish from user back button
 * - Works on both mobile and desktop browsers
 * 
 * Usage: Import and call `setupHistoryGuard()` in main.tsx
 */

let lastUrl: string | null = null;
let isGuarding = false;
let isProgrammaticNavigation = false;

/**
 * Get a unique identifier for the current URL
 */
function getUrlKey(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

/**
 * Normalize URL for comparison (handles relative/absolute URLs)
 * Always returns pathname+search+hash format for consistent comparison
 */
function normalizeUrl(url: string | URL | null | undefined, baseUrl: string = window.location.origin): string {
  // If url is null/undefined, use current location but normalize to pathname+search+hash format
  if (!url) {
    return getUrlKey(); // Use getUrlKey() for consistency
  }
  
  const urlString = String(url);
  
  // If it's already a full URL, extract pathname+search+hash
  if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
    try {
      const urlObj = new URL(urlString);
      return `${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
    } catch {
      // If URL parsing fails, try to extract pathname manually
      const match = urlString.match(/^https?:\/\/[^/]+(\/.*)$/);
      return match ? match[1] : urlString;
    }
  }
  
  // If it's a relative URL, resolve it against the current location
  try {
    const urlObj = new URL(urlString, baseUrl);
    return `${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
  } catch {
    // If URL parsing fails, treat as relative path
    // Remove leading slash if present to handle both /path and path
    const cleanPath = urlString.startsWith('/') ? urlString : `/${urlString}`;
    return cleanPath;
  }
}

/**
 * Set flag to indicate programmatic navigation (from React Router)
 * This helps distinguish between user back button and programmatic navigation
 */
export function setProgrammaticNavigation(value: boolean): void {
  isProgrammaticNavigation = value;
  // Auto-reset after short delay
  if (value) {
    setTimeout(() => {
      isProgrammaticNavigation = false;
    }, 100);
  }
}

/**
 * Monitor history API to detect duplicate entries
 * Very conservative - only blocks obvious spam, never interferes with React Router
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
  let lastPushStateCallTime = 0;
  let pushStateCallStack: string[] = []; // Track recent pushState calls for spam detection

  // Override pushState to prevent duplicate entries
  // EXTREMELY CONSERVATIVE: Only block obvious spam (< 10ms rapid duplicates)
  // This ensures we NEVER interfere with React Router or legitimate navigation
  window.history.pushState = function(state: any, title: string, url?: string | URL | null) {
    const now = Date.now();
    const timeSinceLastPush = now - lastPushStateCallTime;
    lastPushStateCallTime = now;

    // Normalize URLs for comparison
    const currentUrlKey = getUrlKey();
    const newUrlKey = normalizeUrl(url);
    
    // If this is programmatic navigation from React Router, always allow it
    if (isProgrammaticNavigation) {
      lastPushedUrl = newUrlKey;
      return originalPushState.call(window.history, state, title, url);
    }
    
    // EXTREMELY STRICT: Only block if:
    // 1. It's the EXACT same URL as current (including query/hash)
    // 2. AND it's the same as the last pushed URL
    // 3. AND it happened within 10ms (extremely rapid - definitely spam, not user action)
    // This is so strict that it will NEVER block legitimate React Router navigation
    const isExtremelyRapidDuplicate = 
      newUrlKey === currentUrlKey && 
      lastPushedUrl === newUrlKey && 
      timeSinceLastPush < 10; // Only catch obvious spam (< 10ms)
    
    if (isExtremelyRapidDuplicate) {
      // This is definitely spam - use replaceState instead
      console.warn('[History Guard] Blocking extremely rapid duplicate:', newUrlKey, {
        timeSinceLastPush,
      });
      return originalReplaceState.call(window.history, state, title, url);
    }
    
    // Update tracking for next comparison
    lastPushedUrl = newUrlKey;
    
    // Allow ALL other pushState calls (including React Router navigation)
    return originalPushState.call(window.history, state, title, url);
  };

  // Also protect replaceState from being abused
  window.history.replaceState = function(state: any, title: string, url?: string | URL | null) {
    // Always allow replaceState (it's used for redirects and is safe)
    return originalReplaceState.call(window.history, state, title, url);
  };

  // Monitor popstate events ONLY for tracking (don't interfere with React Router)
  // Use bubble phase and ensure we don't prevent default or stop propagation
  // React Router MUST handle popstate events for back button to work
  window.addEventListener('popstate', (event) => {
    // Just track URL changes for internal state - don't interfere with event
    // React Router will handle the actual navigation
    const newUrl = getUrlKey();
    if (lastUrl !== newUrl) {
      lastUrl = newUrl;
      lastPushedUrl = null; // Reset on navigation
      lastPushStateCallTime = 0; // Reset timing
      pushStateCallStack = []; // Clear spam detection stack
    }
    // DO NOT call preventDefault() or stopPropagation() - let React Router handle it
  }, false); // Use bubble phase (default) - React Router handles it first

  console.log('[History Guard] Active - very conservative mode (mobile & desktop optimized)');
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

