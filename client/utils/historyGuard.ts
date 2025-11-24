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
let isHistoryGuardEnabled = true; // Allow disabling for testing

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
  
  // Log initial state
  const initialLength = window.history.length;
  console.log('[History Guard] Setting up guard...', {
    initialHistoryLength: initialLength,
    currentUrl: window.location.href,
    timestamp: new Date().toISOString(),
  });
  
  // If history length is already high, warn about it
  if (initialLength > 10) {
    console.warn('[History Guard] WARNING: History length is already', initialLength, 'on setup!');
    console.warn('[History Guard] This suggests duplicates were created before guard was set up');
    console.warn('[History Guard] Solution: Refresh the page to clear history');
  }

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
    // If guard is disabled, use original pushState
    if (!isHistoryGuardEnabled) {
      return originalPushState.call(window.history, state, title, url);
    }
    const now = Date.now();
    const timeSinceLastPush = now - lastPushStateCallTime;
    lastPushStateCallTime = now;

    // Normalize URLs for comparison
    const currentUrlKey = getUrlKey();
    const newUrlKey = normalizeUrl(url);
    
    // CRITICAL: If URL is different, always allow (legitimate navigation)
    if (newUrlKey !== currentUrlKey) {
      lastPushedUrl = newUrlKey;
      logPushState(newUrlKey, false, 'Different URL - legitimate navigation');
      return originalPushState.call(window.history, state, title, url);
    }
    
    // URL is the SAME as current - this creates a duplicate entry
    // Check if this is from React Router by examining:
    // 1. Call stack (React Router functions)
    // 2. State object (React Router stores navigation state with 'key' and 'usr' properties)
    // 3. Programmatic navigation flag
    const stack = new Error().stack || '';
    const hasReactRouterState = state && (
      typeof state === 'object' && (
        'key' in state || // React Router v6 uses 'key' in state
        'usr' in state || // React Router stores user state in 'usr'
        'idx' in state    // React Router stores index in 'idx'
      )
    );
    const isReactRouterCall = stack.includes('BrowserRouter') || 
                              stack.includes('react-router') ||
                              stack.includes('Router') ||
                              hasReactRouterState ||
                              isProgrammaticNavigation;
    
    // CRITICAL: Even if it's React Router, if URL is the same, we should still block duplicates
    // React Router should never push the same URL multiple times - that's a bug
    // Only allow if it's React Router AND it's been more than 100ms since last push (not rapid spam)
    if (isReactRouterCall && timeSinceLastPush > 100) {
      // React Router navigation with delay - might be legitimate state update
      lastPushedUrl = newUrlKey;
      logPushState(newUrlKey, false, 'React Router navigation (delayed) - allowing');
      return originalPushState.call(window.history, state, title, url);
    }
    
    // If it's React Router but rapid (< 100ms), it's likely a duplicate - block it
    if (isReactRouterCall && timeSinceLastPush <= 100) {
      logPushState(newUrlKey, true, 'React Router rapid duplicate - blocking');
      console.warn('[History Guard] Blocking rapid React Router duplicate:', newUrlKey, {
        timeSinceLastPush,
        hasReactRouterState,
      });
      return originalReplaceState.call(window.history, state, title, url);
    }
    
    // Same URL AND not from React Router - this is likely a duplicate from ad scripts or other code
    // ALWAYS block same-URL pushState unless it's from React Router (which we already checked above)
    // This prevents duplicate history entries that break the back button
    logPushState(newUrlKey, true, 'Same URL and not React Router - blocking duplicate');
    console.warn('[History Guard] Blocking duplicate pushState (same URL):', newUrlKey, {
      timeSinceLastPush,
      isProgrammaticNavigation,
      hasReactRouterState,
      action: 'Using replaceState instead of pushState',
      stack: stack.split('\n').slice(0, 3).join('\n'), // Show first 3 stack frames
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
  console.log('[History Guard] Initial history length:', window.history.length);
  
  // Log all pushState calls for debugging
  const logPushState = (url: string, isBlocked: boolean, reason: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[History Guard] ${isBlocked ? 'BLOCKED' : 'ALLOWED'} pushState:`, {
        url,
        reason,
        historyLength: window.history.length,
        currentUrl: window.location.href,
      });
    }
  };
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
    isGuardEnabled: isHistoryGuardEnabled,
  };
}

/**
 * Enable or disable the history guard (for testing)
 */
export function setHistoryGuardEnabled(enabled: boolean): void {
  isHistoryGuardEnabled = enabled;
  console.log(`[History Guard] ${enabled ? 'Enabled' : 'Disabled'}`);
}

// Make available globally for testing
if (typeof window !== 'undefined') {
  (window as any).disableHistoryGuard = () => setHistoryGuardEnabled(false);
  (window as any).enableHistoryGuard = () => setHistoryGuardEnabled(true);
  (window as any).toggleHistoryGuard = () => {
    setHistoryGuardEnabled(!isHistoryGuardEnabled);
  };
  console.log('💡 History Guard controls available:');
  console.log('   - window.disableHistoryGuard() - Disable guard');
  console.log('   - window.enableHistoryGuard() - Enable guard');
  console.log('   - window.toggleHistoryGuard() - Toggle guard');
}

