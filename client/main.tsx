import "./global.css";
import { createRoot } from "react-dom/client";
import App from "./App";
import { setupBackNavigationDetector } from "./utils/backNavigationDetector";

// Load Adsterra script (replace with actual Adsterra ID)
const loadAdsterraScript = () => {
  try {
    const script = document.createElement("script");
    script.src = "//adsterra.com/scripts/display.js";
    script.async = true;
    script.onload = () => {
      (window as any).adsterraScript?.init?.();
    };
    script.onerror = () => {
      console.warn("Failed to load Adsterra script");
    };
    document.head.appendChild(script);
  } catch (error) {
    console.warn("Error loading Adsterra script:", error);
  }
};

// Load Adsterra on app start (non-blocking)
if (typeof window !== "undefined") {
  // CRITICAL: Check history state IMMEDIATELY on page load
  const initialHistoryLength = window.history.length;
  const initialUrl = window.location.href;
  const initialState = window.history.state;
  
  // Monitor for any pushState/replaceState calls that happen during page load
  let pushStateCallCount = 0;
  let replaceStateCallCount = 0;
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;
  
  window.history.pushState = function(...args) {
    pushStateCallCount++;
    if (process.env.NODE_ENV === 'development') {
      console.warn('[History Monitor] pushState called #' + pushStateCallCount, {
        url: args[2],
        state: args[0],
        stack: new Error().stack,
      });
    }
    return originalPushState.apply(window.history, args);
  };
  
  window.history.replaceState = function(...args) {
    replaceStateCallCount++;
    if (process.env.NODE_ENV === 'development') {
      console.warn('[History Monitor] replaceState called #' + replaceStateCallCount, {
        url: args[2],
        state: args[0],
        stack: new Error().stack,
      });
    }
    return originalReplaceState.apply(window.history, args);
  };
  
  if (initialHistoryLength > 10) {
    console.group('🚨 CRITICAL: History is ALREADY polluted on page load!');
    console.error('History Length:', initialHistoryLength, '(should be 1 on fresh page load)');
    console.error('Current URL:', initialUrl);
    console.error('History State:', initialState);
    console.error('');
    console.error('This means the browser is RESTORING a previous session!');
    console.error('');
    console.error('Possible causes:');
    console.error('  1. Browser Session Restore is enabled (check browser settings)');
    console.error('  2. Service Worker is preserving state (check DevTools > Application > Service Workers)');
    console.error('  3. Browser extension is interfering');
    console.error('  4. Browser is restoring tabs from previous session');
    console.error('  5. Ad network scripts are manipulating history');
    console.error('');
    console.error('🔧 SOLUTIONS:');
    console.error('  A. Disable Session Restore:');
    console.error('     - Chrome: Settings > On startup > Open a new tab');
    console.error('     - Firefox: Settings > General > Restore previous session (uncheck)');
    console.error('  B. Clear Service Workers:');
    console.error('     - DevTools > Application > Service Workers > Unregister all');
    console.error('  C. Use Incognito/Private Mode (guarantees clean history)');
    console.error('  D. Close ALL browser windows, then reopen');
    console.error('  E. Check for ad network scripts in DevTools > Network tab');
    console.error('');
    console.error('⚠️ IMPORTANT: Until history is cleared, back button will NOT work correctly!');
    console.error('');
    console.error('📊 Monitoring: Watch console for pushState/replaceState calls during page load');
    console.groupEnd();
  } else {
    console.log('[Main] ✅ History is clean on page load:', {
      historyLength: initialHistoryLength,
      url: initialUrl,
    });
    console.log('[Main] 📊 Monitoring history changes - will log any pushState/replaceState calls');
  }
  
  // Log summary after a short delay to catch any history manipulation during initialization
  setTimeout(() => {
    if (pushStateCallCount > 0 || replaceStateCallCount > 0) {
      console.warn('[History Monitor] Summary after initialization:', {
        pushStateCalls: pushStateCallCount,
        replaceStateCalls: replaceStateCallCount,
        currentHistoryLength: window.history.length,
        note: 'If history length increased, something is creating duplicate entries!',
      });
    }
  }, 2000);
  
  // CRITICAL: Setup back navigation detector FIRST
  // This must run before React Router initializes to catch popstate events early
  setupBackNavigationDetector();
  // Suppress console warnings from ad iframes (not our code)
  // Set this up BEFORE loading Adsterra to catch early errors
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    const fullMessage = args.map(arg => String(arg)).join(' ').toLowerCase();
    
    // Ignore font preload warnings from ad networks
    if (message.includes('preload') && message.includes('was preloaded')) {
      return;
    }
    // Ignore Adsterra script warnings
    if (fullMessage.includes('adsterra') || fullMessage.includes('adsterra.com')) {
      return;
    }
    // Ignore ad network warnings
    if (fullMessage.includes('camterest.com') || fullMessage.includes('effectivegatecpm.com')) {
      return;
    }
    // Ignore autofocus blocking warnings
    if (fullMessage.includes('blocked autofocusing') || fullMessage.includes('autofocus')) {
      return;
    }
    originalWarn.apply(console, args);
  };
  
  // Suppress errors from ad networks and example URLs
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    const fullMessage = args.map(arg => String(arg)).join(' ').toLowerCase();
    
    // Ignore 403 Forbidden errors from ad networks (check for 403 and ad network domains)
    if (fullMessage.includes('403') && (
      fullMessage.includes('camterest.com') || 
      fullMessage.includes('effectivegatecpm.com') ||
      fullMessage.includes('adsterra.com') ||
      fullMessage.includes('forbidden')
    )) {
      return;
    }
    // Ignore autofocus blocking errors from ad network iframes (browser security feature)
    if (fullMessage.includes('blocked autofocusing') || 
        (fullMessage.includes('autofocus') && fullMessage.includes('cross-origin'))) {
      return;
    }
    // Ignore ERR_NAME_NOT_RESOLVED for example.com URLs (demo/placeholder data)
    if (fullMessage.includes('err_name_not_resolved') && (
      fullMessage.includes('example.com') || 
      fullMessage.includes('cloudinary.example.com')
    )) {
      return;
    }
    // Ignore network errors for cloudinary.example.com (demo media) - check multiple formats
    if (fullMessage.includes('cloudinary.example.com') || 
        message.includes('cloudinary.example.com') ||
        fullMessage.includes('net::err_name_not_resolved') && fullMessage.includes('cloudinary')) {
      return;
    }
    // Ignore Adsterra script loading errors
    if (fullMessage.includes('adsterra') || fullMessage.includes('adsterra.com')) {
      return;
    }
    // Ignore ad network errors (camterest, effectivegatecpm, etc.) - comprehensive check
    if (fullMessage.includes('camterest.com') || 
        fullMessage.includes('effectivegatecpm.com') ||
        fullMessage.includes('/api/users?token=') && fullMessage.includes('effectivegatecpm')) {
      return;
    }
    // Ignore Intervention messages about ads
    if (fullMessage.includes('[intervention]') && fullMessage.includes('ad was removed')) {
      return;
    }
    // Ignore GET request errors to ad network API endpoints
    if (fullMessage.includes('get ') && fullMessage.includes('effectivegatecpm.com/api')) {
      return;
    }
    originalError.apply(console, args);
  };
  
  // Also suppress unhandled errors from ad networks
  window.addEventListener('error', (event) => {
    const message = event.message?.toLowerCase() || '';
    const source = event.filename?.toLowerCase() || '';
    const target = (event.target as any)?.src || (event.target as any)?.href || '';
    const targetStr = String(target).toLowerCase();
    
    // Suppress errors from ad networks
    if (message.includes('blocked autofocusing') || 
        message.includes('autofocus') ||
        message.includes('err_name_not_resolved') && (
          message.includes('cloudinary.example.com') || 
          message.includes('example.com')
        ) ||
        source.includes('camterest.com') ||
        source.includes('effectivegatecpm.com') ||
        source.includes('adsterra.com') ||
        targetStr.includes('effectivegatecpm.com') ||
        targetStr.includes('cloudinary.example.com')) {
      event.preventDefault();
      return false;
    }
  }, true);
  
  // Suppress unhandled promise rejections from ad networks
  window.addEventListener('unhandledrejection', (event) => {
    const reason = String(event.reason || '').toLowerCase();
    
    // Suppress rejections from ad networks
    if (reason.includes('camterest.com') || 
        reason.includes('effectivegatecpm.com') ||
        reason.includes('adsterra.com') ||
        reason.includes('blocked autofocusing')) {
      event.preventDefault();
    }
  });
  
  // Now load Adsterra after error suppression is set up
  loadAdsterraScript();
  
  // Also suppress fetch/network errors in console
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      // Suppress 403 errors from ad networks silently
      if (!response.ok && response.status === 403) {
        const url = typeof args[0] === 'string' ? args[0] : 
                   args[0] instanceof Request ? args[0].url :
                   args[0] instanceof URL ? args[0].href : '';
        if (url.includes('effectivegatecpm.com') || 
            url.includes('camterest.com') || 
            url.includes('adsterra.com')) {
          // Return response but don't log error - ad networks often return 403
          return response;
        }
      }
      return response;
    } catch (error: any) {
      // Suppress errors for example.com URLs and ad networks
      let url = '';
      if (typeof args[0] === 'string') {
        url = args[0];
      } else if (args[0] instanceof Request) {
        url = args[0].url;
      } else if (args[0] instanceof URL) {
        url = args[0].href;
      }
      if (url.includes('example.com') || 
          url.includes('cloudinary.example.com') ||
          url.includes('effectivegatecpm.com') ||
          url.includes('camterest.com') ||
          url.includes('adsterra.com')) {
        // Return a rejected promise but don't log error
        return Promise.reject(new Error('Ad network or example URL - suppressed'));
      }
      throw error;
    }
  };
}

const root = document.getElementById("root");
if (root) {
  try {
    createRoot(root).render(<App />);
  } catch (error) {
    console.error("Failed to render app:", error);
    root.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h1>Error loading application</h1>
        <p>Please refresh the page or contact support.</p>
        <pre>${error instanceof Error ? error.message : String(error)}</pre>
      </div>
    `;
  }
} else {
  console.error("Root element not found");
}
