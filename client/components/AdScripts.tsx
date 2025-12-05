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
      return false; // Never shown
    }
    
    // If shown for the same page load ID, it's already been shown
    return shownPageLoadId === pageLoadId;
  } catch (error) {
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
  // Check if this is a page refresh by looking at navigation timing
  try {
    const navEntry = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navEntry && navEntry.type === 'reload') {
      // Page was refreshed - create new page load ID
      currentPageLoadId = `load_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(PAGE_LOAD_ID_KEY, currentPageLoadId);
      // Clear the shown flag so pop-under can show again
      sessionStorage.removeItem(POPUNDER_SESSION_KEY);
    } else {
      // Normal navigation or first load - initialize normally
      initializePageLoadId();
    }
  } catch (error) {
    // Fallback: try older API
    try {
      const nav = (window.performance as any).navigation;
      if (nav && nav.type === 1) { // TYPE_RELOAD
        currentPageLoadId = `load_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem(PAGE_LOAD_ID_KEY, currentPageLoadId);
        sessionStorage.removeItem(POPUNDER_SESSION_KEY);
      } else {
        initializePageLoadId();
      }
    } catch (e) {
      // If all else fails, just initialize normally
      initializePageLoadId();
    }
  }
}

/**
 * Load a single ad script
 */
function loadAdScript(script: AdScript): void {
  // Check if script is already loaded
  const existingScript = document.getElementById(script.id);
  if (existingScript) {
    return; // Already loaded
  }

  try {
    const scriptElement = document.createElement('script');
    scriptElement.id = script.id;
    scriptElement.type = 'text/javascript';
    scriptElement.src = script.src.startsWith('//') 
      ? `https:${script.src}` 
      : script.src;
    scriptElement.async = true;
    scriptElement.defer = true;

    // Add error handling
    scriptElement.onerror = () => {
      console.warn(`[AdScripts] Failed to load ${script.name}`);
    };

    scriptElement.onload = () => {
      if (import.meta.env.MODE === 'development') {
        console.log(`[AdScripts] Loaded ${script.name}`);
      }
      
      // Mark pop-under as shown when it loads
      // The script execution will trigger the pop-under
      if (script.type === 'popunder') {
        markPopunderAsShown();
      }
    };

    // Append to document head
    document.head.appendChild(scriptElement);
  } catch (error) {
    console.error(`[AdScripts] Error loading ${script.name}:`, error);
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
    
    if (!isHomePage) {
      return; // Don't load ads on other pages
    }

    // Only load ads in production or if explicitly enabled
    const shouldLoadAds = 
      import.meta.env.MODE === 'production' || 
      import.meta.env.VITE_ENABLE_ADS === 'true';

    if (!shouldLoadAds) {
      if (import.meta.env.MODE === 'development') {
        console.log('[AdScripts] Ads disabled in development mode');
      }
      return;
    }

    // Initialize page load ID (handles refresh detection at module level)
    initializePageLoadId();

    // Check if pop-under has already been shown in this page load session
    const popunderAlreadyShown = hasPopunderBeenShown();

    // Load all ad scripts with a small delay to avoid blocking initial page load
    const loadDelay = 1000; // 1 second delay

    const timer = setTimeout(() => {
      AD_SCRIPTS.forEach((script) => {
        // Skip pop-under if it's already been shown in this page load session
        if (script.type === 'popunder' && popunderAlreadyShown) {
          if (import.meta.env.MODE === 'development') {
            console.log('[AdScripts] Pop-under already shown in this session, skipping');
          }
          return;
        }
        
        loadAdScript(script);
      });
    }, loadDelay);

    return () => {
      clearTimeout(timer);
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

