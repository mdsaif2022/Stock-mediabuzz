/**
 * Ad Scripts Component
 * Loads external ad scripts (SocialBar, etc.)
 * These scripts are loaded asynchronously to avoid blocking page load
 * ONLY loads on home page (/) to prevent interference with navigation
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface AdScript {
  id: string;
  name: string;
  src: string;
  type: 'socialbar' | 'banner';
  placement?: 'header' | 'footer' | 'sidebar' | 'inline';
}

// Ad scripts configuration
// Scripts load ONLY on home page (/)
const AD_SCRIPTS: AdScript[] = [];


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
    
    scriptElement.async = true;
    scriptElement.defer = true;

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

    console.log('[AdScripts] ✅ Home page detected. Will load ads.');

    // Load all ad scripts with a delay to ensure page is ready
    const loadDelay = 1000; // 1 second delay

    const timer = setTimeout(() => {
      console.log('[AdScripts] ⏰ Timer fired, starting to load scripts...');
      console.log('[AdScripts] 📋 Scripts to load:', AD_SCRIPTS.map(s => s.name));
      
      AD_SCRIPTS.forEach((script) => {
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

// Expose debug functions to window for easy testing
if (typeof window !== 'undefined') {
  (window as any).adScriptsDebug = {
    checkStatus: () => {
      console.log('[AdScripts] 📊 Debug Info:', {
        scripts: AD_SCRIPTS.map(s => ({ id: s.id, name: s.name, type: s.type })),
        isHomePage: window.location.pathname === '/',
        mode: import.meta.env.MODE,
        shouldLoadAds: !(import.meta.env.MODE === 'development' && import.meta.env.VITE_ENABLE_ADS !== 'true')
      });
    }
  };
}

