/**
 * Comprehensive Back Button Diagnosis
 * 
 * Run this in browser console to diagnose back button issues
 */

export function diagnoseBackButton() {
  console.group('🔍 Comprehensive Back Button Diagnosis');
  
  // 1. Check history state
  console.group('1. History State');
  const historyInfo = {
    length: window.history.length,
    currentUrl: window.location.href,
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    state: window.history.state,
    canGoBack: window.history.length > 1,
  };
  console.table(historyInfo);
  console.groupEnd();
  
  // 2. Check if React Router is handling popstate
  console.group('2. React Router Check');
  const routerElement = document.querySelector('[data-router]') || 
                       document.querySelector('[data-reactroot]') ||
                       document.getElementById('root');
  console.log('Router element found:', !!routerElement);
  console.log('React Router should handle popstate automatically');
  console.groupEnd();
  
  // 3. Check for interfering event listeners
  console.group('3. Event Listeners Check');
  // We can't directly inspect all listeners, but we can test
  let popstateFired = false;
  const testHandler = () => {
    popstateFired = true;
    console.log('✅ PopState event fired');
  };
  
  // Add temporary listener to test
  window.addEventListener('popstate', testHandler, { once: true });
  
  // Try to go back programmatically
  const initialUrl = window.location.href;
  console.log('Testing history.back()...');
  window.history.back();
  
  setTimeout(() => {
    const newUrl = window.location.href;
    console.log('PopState fired:', popstateFired);
    console.log('URL changed:', newUrl !== initialUrl);
    console.log('New URL:', newUrl);
    
    if (!popstateFired) {
      console.warn('⚠️ PopState event did NOT fire - something may be blocking it');
    }
    if (newUrl === initialUrl) {
      console.error('❌ URL did NOT change - back button not working');
    }
    
    // Go forward to restore state
    window.history.forward();
    
    window.removeEventListener('popstate', testHandler);
    console.groupEnd();
    
    // 4. Check history guard
    console.group('4. History Guard Check');
    const pushStateOriginal = window.history.pushState.toString();
    const isOverridden = pushStateOriginal.includes('[native code]') === false;
    console.log('pushState overridden:', isOverridden);
    if (isOverridden) {
      console.warn('⚠️ History guard is active - check if it\'s interfering');
    }
    console.groupEnd();
    
    // 5. Check for duplicate history entries
    console.group('5. History Entry Analysis');
    console.log('History length:', window.history.length);
    if (window.history.length > 50) {
      console.warn('⚠️ Very large history length - may indicate duplicate entries');
    }
    console.groupEnd();
    
    // 6. Recommendations
    console.group('6. Recommendations');
    if (!popstateFired) {
      console.error('❌ PopState not firing - check for event.preventDefault() or blocking listeners');
    }
    if (newUrl === initialUrl) {
      console.error('❌ URL not changing - possible causes:');
      console.error('  - All history entries have same URL');
      console.error('  - React Router not handling popstate');
      console.error('  - Redirects interfering with navigation');
    }
    console.groupEnd();
    
    console.groupEnd();
  }, 500);
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).diagnoseBackButton = diagnoseBackButton;
  console.log('💡 Run diagnoseBackButton() in console for comprehensive diagnosis');
}

