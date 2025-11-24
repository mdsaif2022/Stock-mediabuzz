/**
 * Diagnose History Issues
 * 
 * Run this in console to diagnose history problems:
 * window.diagnoseHistory()
 */

export function diagnoseHistory() {
  console.group('🔍 History Diagnosis');
  
  const currentUrl = window.location.href;
  const historyLength = window.history.length;
  
  console.log('📍 Current State:');
  console.log('  URL:', currentUrl);
  console.log('  History Length:', historyLength);
  console.log('  Can Go Back:', historyLength > 1);
  console.log('  History State:', window.history.state);
  
  // Check if we can actually navigate back
  console.log('\n🧪 Testing Back Navigation:');
  const urlBefore = window.location.href;
  
  // Try to go back
  if (historyLength > 1) {
    console.log('  Attempting history.back()...');
    window.history.back();
    
    setTimeout(() => {
      const urlAfter = window.location.href;
      console.log('  URL Before:', urlBefore);
      console.log('  URL After:', urlAfter);
      console.log('  Changed:', urlBefore !== urlAfter);
      
      if (urlBefore === urlAfter) {
        console.error('❌ PROBLEM: Back button did not change URL!');
        console.log('  This means all history entries likely have the same URL');
        console.log('  Solution: Check for duplicate pushState calls or excessive replaceState');
      } else {
        console.log('✅ Back button works - URL changed');
        // Go forward to restore
        window.history.forward();
      }
    }, 200);
  } else {
    console.log('  Cannot test - history length is 1 (no previous page)');
  }
  
  // Check for common issues
  console.log('\n🔎 Checking for Common Issues:');
  
  // Check if history guard is active
  const historyGuardActive = (window.history.pushState as any).toString().includes('isProgrammaticNavigation');
  console.log('  History Guard Active:', historyGuardActive);
  
  // Check if there are multiple popstate listeners
  // (We can't directly count listeners, but we can check if our detector is set up)
  const backNavDetectorActive = typeof (window as any).__backNavDetector !== 'undefined';
  console.log('  Back Nav Detector Active:', backNavDetectorActive);
  
  console.log('\n💡 Recommendations:');
  if (historyLength > 20) {
    console.warn('  ⚠️ History length is very high (' + historyLength + ')');
    console.warn('  This might indicate duplicate entries or excessive navigation');
  }
  
  if (historyLength === 1) {
    console.warn('  ⚠️ History length is 1 - no previous pages to go back to');
  }
  
  console.groupEnd();
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).diagnoseHistory = diagnoseHistory;
  console.log('💡 Run diagnoseHistory() in console to diagnose history issues');
}

