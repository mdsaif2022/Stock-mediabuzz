/**
 * Ad Scripts Component
 * Loads external ad scripts (Popunder, SocialBar, etc.)
 * These scripts are loaded asynchronously to avoid blocking page load
 * ONLY loads on home page (/) to prevent interference with navigation
 * Pop-under ad loads only once per session (until refresh or close/reopen)
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface AdScript {
  id: string;
  name: string;
  src: string;
  type: 'popunder' | 'socialbar' | 'banner';
  placement?: 'header' | 'footer' | 'sidebar' | 'inline';
}

// Ad scripts configuration
// Both scripts load ONLY on home page (/)
// Popunder loads once per session (until browser refresh)
const AD_SCRIPTS: AdScript[] = [
  {
    id: 'popunder-1',
    name: 'Popunder_1',
    src: '//pl28193083.effectivegatecpm.com/5a/d9/06/5ad90679f4bb6bea2b8bb5c4c380e5d3.js',
    type: 'popunder',
  },
  {
    id: 'socialbar-1',
    name: 'SocialBar_1',
    src: '//pl28193228.effectivegatecpm.com/c1/0f/08/c10f08941b95749f2ae7f71e2c79bf32.js',
    type: 'socialbar',
    placement: 'sidebar',
  },
];

// Session storage keys for tracking pop-under ad display
const POPUNDER_SESSION_KEY = 'popunder_ad_shown';
const PAGE_LOAD_ID_KEY = 'page_load_id';

// Store the initial page load ID when the module loads
// This will be the same for the entire page session until refresh
let currentPageLoadId: string | null = null;

/**
 * Initialize or get the current page load ID
 * This ID persists for the entire page session (until refresh or close)
 */
function initializePageLoadId(): string {
  if (currentPageLoadId) {
    return currentPageLoadId;
  }
  
  try {
    // Try to get existing ID from sessionStorage
    const stored = sessionStorage.getItem(PAGE_LOAD_ID_KEY);
    if (stored) {
      currentPageLoadId = stored;
      return stored;
    }
    
    // Create new ID for this page load
    currentPageLoadId = `load_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(PAGE_LOAD_ID_KEY, currentPageLoadId);
    return currentPageLoadId;
  } catch (error) {
    // sessionStorage not available, generate temporary ID
    currentPageLoadId = `load_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return currentPageLoadId;
  }
}

/**
 * Check if pop-under has been shown in the current page load session
 */
function hasPopunderBeenShown(): boolean {
  try {
    const pageLoadId = initializePageLoadId();
    const shownPageLoadId = sessionStorage.getItem(POPUNDER_SESSION_KEY);
    
    if (!shownPageLoadId) {
      // Never shown - allow it to show
      return false;
    }
    
    // If shown for the same page load ID, it's already been shown
    const alreadyShown = shownPageLoadId === pageLoadId;
    
    // Always log for debugging
    console.log('[AdScripts] Pop-under check:', {
      pageLoadId,
      shownPageLoadId,
      alreadyShown
    });
    
    return alreadyShown;
  } catch (error) {
    console.warn('[AdScripts] Error checking pop-under status:', error);
    return false; // If we can't check, allow it to show
  }
}

/**
 * Mark pop-under as shown for the current page load session
 */
function markPopunderAsShown(): void {
  try {
    const pageLoadId = initializePageLoadId();
    sessionStorage.setItem(POPUNDER_SESSION_KEY, pageLoadId);
  } catch (error) {
    // sessionStorage might not be available
    console.warn('[AdScripts] Could not save pop-under session state');
  }
}

// Initialize page load ID when module loads
// On a real page refresh, this will create a new ID
// On SPA navigation, this will reuse the existing ID
if (typeof window !== 'undefined') {
  // Use a simpler approach: check if we're on a fresh page load
  // by checking if there's a stored page load ID that's different from what we'd create
  try {
    // Check navigation type to detect refresh
    let isReload = false;
    
    // Try modern API first
    try {
      const navEntry = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navEntry && navEntry.type === 'reload') {
        isReload = true;
      }
    } catch (e) {
      // Fallback to older API
      try {
        const nav = (window.performance as any).navigation;
        if (nav && nav.type === 1) { // TYPE_RELOAD
          isReload = true;
        }
      } catch (e2) {
        // Can't determine, assume not a reload
      }
    }
    
    if (isReload) {
      // Page was refreshed - create new page load ID
      currentPageLoadId = `load_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(PAGE_LOAD_ID_KEY, currentPageLoadId);
      // Clear the shown flag so pop-under can show again
      sessionStorage.removeItem(POPUNDER_SESSION_KEY);
    } else {
      // Normal navigation or first load - initialize normally
      // This will create a new ID if none exists, or reuse existing one
      initializePageLoadId();
    }
  } catch (error) {
    // If all else fails, just initialize normally
    initializePageLoadId();
  }
}

/**
 * Load a single ad script
 * CRITICAL: Only call this when on home page (/)
 */
function loadAdScript(script: AdScript): void {
  // Double-check we're on home page before loading
  if (window.location.pathname !== '/') {
    console.log(`[AdScripts] ⚠️ Attempted to load ${script.name} but not on home page - blocking`);
    return;
  }
  
  // Check if script is already loaded
  const existingScript = document.getElementById(script.id);
  if (existingScript) {
    console.log(`[AdScripts] ⏭️ Script ${script.name} already loaded, skipping`);
    return; // Already loaded
  }

  try {
    const scriptElement = document.createElement('script');
    scriptElement.id = script.id;
    scriptElement.type = 'text/javascript';
    
    // Ensure protocol is https for // URLs
    let scriptSrc = script.src;
    if (scriptSrc.startsWith('//')) {
      scriptSrc = `https:${scriptSrc}`;
    }
    scriptElement.src = scriptSrc;
    
    // Don't use async/defer for popunder scripts - they need to execute immediately
    if (script.type !== 'popunder') {
      scriptElement.async = true;
      scriptElement.defer = true;
    }

    console.log(`[AdScripts] 🚀 Loading ${script.name} from ${scriptElement.src}...`);

    // Add error handling
    scriptElement.onerror = (error) => {
      console.error(`[AdScripts] ❌ Failed to load ${script.name} from ${scriptElement.src}`, error);
      console.error('[AdScripts] This could be due to:');
      console.error('  1. Network error or CORS issue');
      console.error('  2. Ad blocker blocking the script');
      console.error('  3. Invalid script URL');
      console.error('  4. Browser security settings');
      
      // Remove failed script element
      if (scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }
    };

    scriptElement.onload = () => {
      console.log(`[AdScripts] ✅ Successfully loaded ${script.name} from ${scriptElement.src}`);
      
      // For pop-under scripts, mark as shown after a delay
      // This gives the script time to execute and trigger the pop-under
      if (script.type === 'popunder') {
        console.log('[AdScripts] ⏳ Pop-under script loaded. Waiting for execution...');
        // Wait longer to allow pop-under script to fully execute
        setTimeout(() => {
          markPopunderAsShown();
          console.log('[AdScripts] ✅ Pop-under script executed and marked as shown.');
          console.log('[AdScripts] 💡 Pop-under should trigger on user interaction (click, scroll, etc.)');
        }, 5000); // 5 second delay to allow pop-under to fully initialize
      }
    };

    // Append to document head
    document.head.appendChild(scriptElement);
    console.log(`[AdScripts] 📝 Script element added to document head`);
  } catch (error) {
    console.error(`[AdScripts] ❌ Error loading ${script.name}:`, error);
  }
}

/**
 * Ad Scripts Loader Component
 * Loads all configured ad scripts ONLY on home page
 * Pop-under ad loads only once per session
 */
export default function AdScripts() {
  const location = useLocation();
  
  useEffect(() => {
    // CRITICAL: Only load ads on home page (/) to prevent navigation interference
    const isHomePage = location.pathname === '/';
    
    console.log('[AdScripts] Component mounted. Pathname:', location.pathname, 'Is home page:', isHomePage);
    
    // CRITICAL: Remove all ad scripts if NOT on home page
    if (!isHomePage) {
      console.log('[AdScripts] ⚠️ Not on home page - removing all ad scripts');
      
      // Remove all ad scripts from DOM
      AD_SCRIPTS.forEach((script) => {
        const scriptElement = document.getElementById(script.id);
        if (scriptElement && scriptElement.parentNode) {
          console.log(`[AdScripts] 🗑️ Removing ${script.name} from DOM`);
          scriptElement.parentNode.removeChild(scriptElement);
        }
        
        // Also check for scripts by src in head
        const scriptsBySrc = document.head.querySelectorAll(`script[src*="${script.src}"]`);
        scriptsBySrc.forEach((s) => {
          if (s.parentNode) {
            console.log(`[AdScripts] 🗑️ Removing script with src ${script.src} from head`);
            s.parentNode.removeChild(s);
          }
        });
      });
      
      return; // Don't load ads on other pages
    }

    // SIMPLIFIED: Always try to load in production, or if explicitly enabled
    // Check if we're NOT in development, or if ads are explicitly enabled
    const isDev = import.meta.env.MODE === 'development' || import.meta.env.DEV === true;
    const isDevWithAdsEnabled = import.meta.env.VITE_ENABLE_ADS === 'true' || import.meta.env.VITE_ENABLE_ADS === true;
    const shouldLoadAds = !isDev || isDevWithAdsEnabled;

    console.log('[AdScripts] Environment check:', {
      mode: import.meta.env.MODE,
      isDev,
      isDevWithAdsEnabled,
      shouldLoadAds,
      hostname: window.location.hostname
    });

    if (!shouldLoadAds) {
      console.warn('[AdScripts] ⚠️ Ads disabled in development. Add VITE_ENABLE_ADS=true to .env file to enable.');
      return;
    }

    // Initialize page load ID
    initializePageLoadId();

    // Check if pop-under has already been shown in this page load session
    const popunderAlreadyShown = hasPopunderBeenShown();

    console.log('[AdScripts] ✅ Home page detected. Will load ads. Pop-under already shown:', popunderAlreadyShown);

    // Load all ad scripts with a delay to ensure page is ready
    // Use shorter delay for popunder to load faster
    const loadDelay = 1000; // 1 second delay

    const timer = setTimeout(() => {
      console.log('[AdScripts] ⏰ Timer fired, starting to load scripts...');
      console.log('[AdScripts] 📋 Scripts to load:', AD_SCRIPTS.map(s => s.name));
      
      AD_SCRIPTS.forEach((script) => {
        // Skip pop-under if it's already been shown in this page load session
        if (script.type === 'popunder' && popunderAlreadyShown) {
          console.log('[AdScripts] ⏭️ Pop-under already shown in this session, skipping');
          return;
        }
        
        console.log(`[AdScripts] 🚀 Loading ${script.name} (type: ${script.type})...`);
        loadAdScript(script);
      });
    }, loadDelay);

    return () => {
      console.log('[AdScripts] Cleanup: clearing timer');
      clearTimeout(timer);
      
      // CRITICAL: When navigating away from home page, remove all ad scripts
      if (location.pathname === '/') {
        // Only cleanup if we're leaving the home page
        const nextPath = window.location.pathname;
        if (nextPath !== '/') {
          console.log('[AdScripts] 🗑️ Navigating away from home page - cleaning up ad scripts');
          AD_SCRIPTS.forEach((script) => {
            const scriptElement = document.getElementById(script.id);
            if (scriptElement && scriptElement.parentNode) {
              scriptElement.parentNode.removeChild(scriptElement);
            }
          });
        }
      }
    };
  }, [location.pathname]); // Re-run when route changes

  return null; // This component doesn't render anything
}

/**
 * Load a specific ad script by ID
 */
export function loadAdScriptById(scriptId: string): void {
  const script = AD_SCRIPTS.find((s) => s.id === scriptId);
  if (script) {
    loadAdScript(script);
  } else {
    console.warn(`[AdScripts] Script with ID "${scriptId}" not found`);
  }
}

/**
 * Get all configured ad scripts
 */
export function getAdScripts(): AdScript[] {
  return [...AD_SCRIPTS];
}

/**
 * Force load pop-under script (for testing/debugging)
 * Call this from browser console: window.forceLoadPopunder()
 */
export function forceLoadPopunder(): void {
  console.log('[AdScripts] Force loading pop-under script...');
  const popunderScript = AD_SCRIPTS.find(s => s.type === 'popunder');
  if (popunderScript) {
    // Clear session storage to allow loading
    try {
      sessionStorage.removeItem(POPUNDER_SESSION_KEY);
      console.log('[AdScripts] Cleared pop-under session flag');
    } catch (e) {
      console.warn('[AdScripts] Could not clear session storage');
    }
    loadAdScript(popunderScript);
  } else {
    console.error('[AdScripts] Pop-under script not found in configuration');
  }
}

// Expose force load function to window for easy testing
if (typeof window !== 'undefined') {
  (window as any).forceLoadPopunder = forceLoadPopunder;
  (window as any).adScriptsDebug = {
    clearSession: () => {
      sessionStorage.removeItem(POPUNDER_SESSION_KEY);
      sessionStorage.removeItem(PAGE_LOAD_ID_KEY);
      console.log('[AdScripts] ✅ Cleared all session storage');
      console.log('[AdScripts] 💡 Refresh the page to load popunder again');
    },
    checkStatus: () => {
      const popunderScript = AD_SCRIPTS.find(s => s.type === 'popunder');
      const scriptElement = document.getElementById(popunderScript?.id || '');
      const scriptInHead = document.head.querySelector(`script[src*="${popunderScript?.src}"]`);
      
      console.log('[AdScripts] 📊 Debug Info:', {
        pageLoadId: sessionStorage.getItem(PAGE_LOAD_ID_KEY),
        popunderShown: sessionStorage.getItem(POPUNDER_SESSION_KEY),
        scriptId: popunderScript?.id,
        scriptLoaded: !!scriptElement,
        scriptInHead: !!scriptInHead,
        scriptSrc: popunderScript?.src,
        isHomePage: window.location.pathname === '/',
        mode: import.meta.env.MODE,
        shouldLoadAds: !(import.meta.env.MODE === 'development' && import.meta.env.VITE_ENABLE_ADS !== 'true')
      });
      
      if (popunderScript) {
        console.log('[AdScripts] 🔍 Popunder Script Details:', {
          id: popunderScript.id,
          name: popunderScript.name,
          src: popunderScript.src,
          fullUrl: popunderScript.src.startsWith('//') ? `https:${popunderScript.src}` : popunderScript.src
        });
      }
    },
    testLoad: () => {
      console.log('[AdScripts] 🧪 Testing popunder load...');
      const popunderScript = AD_SCRIPTS.find(s => s.type === 'popunder');
      if (popunderScript) {
        sessionStorage.removeItem(POPUNDER_SESSION_KEY);
        loadAdScript(popunderScript);
      } else {
        console.error('[AdScripts] ❌ Popunder script not found');
      }
    }
  };
}

