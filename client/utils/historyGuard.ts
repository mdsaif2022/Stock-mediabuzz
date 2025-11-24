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
  // Auto-reset after longer delay to catch async React Router navigation
  if (value) {
    setTimeout(() => {
      isProgrammaticNavigation = false;
    }, 500); // Increased from 100ms to 500ms to catch React Router's async navigation
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
  // AGGRESSIVE: Block ANY pushState with the same URL as current (prevents duplicate history entries)
  // This fixes the issue where 9+ duplicate entries break the back button
  window.history.pushState = function(state: any, title: string, url?: string | URL | null) {
    const now = Date.now();
    const timeSinceLastPush = now - lastPushStateCallTime;
    lastPushStateCallTime = now;

    // Normalize URLs for comparison
    const currentUrlKey = getUrlKey();
    const newUrlKey = normalizeUrl(url);
    
    // CRITICAL: If URL is different, always allow (legitimate navigation)
    if (newUrlKey !== currentUrlKey) {
      lastPushedUrl = newUrlKey;
      return originalPushState.call(window.history, state, title, url);
    }
    
    // URL is the SAME as current - this creates a duplicate entry
    // Block it UNLESS it's programmatic navigation from React Router
    // (React Router might push same URL with different state, which is OK)
    if (isProgrammaticNavigation) {
      // React Router navigation - allow it (might be updating state)
      lastPushedUrl = newUrlKey;
      return originalPushState.call(window.history, state, title, url);
    }
    
    // Same URL AND not programmatic navigation - this is a duplicate!
    // Use replaceState instead to avoid creating duplicate history entry
    console.warn('[History Guard] Blocking duplicate pushState (same URL):', newUrlKey, {
      timeSinceLastPush,
      isProgrammaticNavigation,
    });
    return originalReplaceState.call(window.history, state, title, url);
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

  console.log('[History Guard] Active - aggressive mode (blocks duplicate same-URL entries)');
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

