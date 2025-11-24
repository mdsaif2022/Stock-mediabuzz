/**
 * Simple Back Button Test
 * 
 * Run this in console to test if back button is working:
 * window.testBackButton()
 */

export function testBackButtonSimple() {
  console.group('🧪 Simple Back Button Test');
  
  const initialUrl = window.location.href;
  const initialHistoryLength = window.history.length;
  
  console.log('📍 Initial State:');
  console.log('  URL:', initialUrl);
  console.log('  History Length:', initialHistoryLength);
  console.log('  Can Go Back:', initialHistoryLength > 1);
  
  // Navigate forward a few times
  console.log('\n➡️ Navigating forward...');
  window.history.pushState({ test: 1 }, '', '/test-page-1');
  console.log('  Pushed: /test-page-1');
  console.log('  Current URL:', window.location.href);
  console.log('  History Length:', window.history.length);
  
  window.history.pushState({ test: 2 }, '', '/test-page-2');
  console.log('  Pushed: /test-page-2');
  console.log('  Current URL:', window.location.href);
  console.log('  History Length:', window.history.length);
  
  // Test back
  console.log('\n⬅️ Testing history.back()...');
  const urlBeforeBack = window.location.href;
  window.history.back();
  
  setTimeout(() => {
    const urlAfterBack = window.location.href;
    console.log('  URL Before Back:', urlBeforeBack);
    console.log('  URL After Back:', urlAfterBack);
    console.log('  URL Changed:', urlBeforeBack !== urlAfterBack);
    
    if (urlBeforeBack === urlAfterBack) {
      console.error('❌ BACK BUTTON NOT WORKING - URL did not change');
      console.log('  This means history.back() did not navigate');
    } else {
      console.log('✅ Back button worked - URL changed');
    }
    
    // Go forward to restore
    window.history.forward();
    
    console.groupEnd();
  }, 100);
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).testBackButton = testBackButtonSimple;
  console.log('💡 Run testBackButton() in console to test back button');
}

