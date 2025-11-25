/**
 * Safe History API Utilities
 * 
 * Provides safe wrappers for history API that preserve React Router's internal state
 * and prevent breaking back/forward navigation.
 */

/**
 * Safely replace the current history entry
 * 
 * CRITICAL: Never resets React Router's internal state (idx, key, usr)
 * Only allows replaceState when:
 * 1. History is shallow (length <= 3) - only on initial page load
 * 2. Current state doesn't have idx > 0 - not in middle of navigation
 * 
 * @param state - State object (preserves React Router state if null/undefined)
 * @param title - Title (usually ignored by browsers)
 * @param url - URL to replace with
 */
export function safeReplaceState(
  state: any,
  title: string,
  url?: string | URL | null
): void {
  const current = window.history.state;
  const historyLength = window.history.length;

  // CRITICAL: Never reset state if React Router has set idx > 0
  // This preserves React Router's navigation index
  if (current && typeof current === 'object' && typeof current.idx === 'number' && current.idx > 0) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[SafeHistory] Blocked unsafe replaceState - React Router idx > 0', {
        currentIdx: current.idx,
        historyLength,
        url,
      });
    }
    return;
  }

  // Only allow replaceState on shallow history (initial page load)
  // Deep history means we're in the middle of navigation - don't interfere
  if (historyLength > 3) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[SafeHistory] Blocked replaceState - deep history', {
        historyLength,
        url,
        note: 'Only allow replaceState on initial page load (history.length <= 3)',
      });
    }
    return;
  }

  // Preserve current state if new state is null/undefined
  // This ensures React Router's state (idx, key, usr) is preserved
  const safeState = state !== null && state !== undefined ? state : current;

  // Safe to call replaceState
  window.history.replaceState(safeState, title, url);
}

/**
 * Safely push a new history entry
 * 
 * Only pushes if URL is different from current URL
 * Preserves React Router state structure
 * 
 * @param state - State object
 * @param title - Title (usually ignored by browsers)
 * @param url - URL to push
 */
export function safePushState(
  state: any,
  title: string,
  url?: string | URL | null
): void {
  const currentUrl = window.location.pathname + window.location.search + window.location.hash;
  
  // Normalize new URL
  let newUrl = currentUrl;
  if (url) {
    const urlStr = String(url);
    if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
      try {
        const urlObj = new URL(urlStr);
        newUrl = urlObj.pathname + urlObj.search + urlObj.hash;
      } catch {
        newUrl = currentUrl;
      }
    } else {
      try {
        const urlObj = new URL(urlStr, window.location.origin);
        newUrl = urlObj.pathname + urlObj.search + urlObj.hash;
      } catch {
        newUrl = urlStr.startsWith('/') ? urlStr : `/${urlStr}`;
      }
    }
  }

  // Only push if URL is different
  if (newUrl !== currentUrl) {
    window.history.pushState(state, title, url);
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[SafeHistory] Blocked pushState - same URL', {
        url: newUrl,
        note: 'Use replaceState if you need to update state without changing URL',
      });
    }
  }
}

