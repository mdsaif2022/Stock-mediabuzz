/**
 * Ad Scripts Component
 * Loads external ad scripts (Popunder, SocialBar, etc.)
 * These scripts are loaded asynchronously to avoid blocking page load
 * ONLY loads on home page (/) to prevent interference with navigation
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
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AdScripts] Loaded ${script.name}`);
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
      process.env.NODE_ENV === 'production' || 
      process.env.VITE_ENABLE_ADS === 'true';

    if (!shouldLoadAds) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AdScripts] Ads disabled in development mode');
      }
      return;
    }

    // Load all ad scripts with a small delay to avoid blocking initial page load
    const loadDelay = 1000; // 1 second delay

    const timer = setTimeout(() => {
      AD_SCRIPTS.forEach((script) => {
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

