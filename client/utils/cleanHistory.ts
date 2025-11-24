/**
 * History Cleanup Utility
 * 
 * Helps clean up duplicate history entries
 * Run: window.cleanHistory() in console
 */

export function cleanHistory() {
  console.group('🧹 History Cleanup');
  
  const initialLength = window.history.length;
  const currentUrl = window.location.href;
  
  console.log('📍 Before Cleanup:');
  console.log('  History Length:', initialLength);
  console.log('  Current URL:', currentUrl);
  
  // Unfortunately, we can't directly remove history entries
  // But we can navigate to a clean state and replace the current entry
  console.log('\n💡 Note: Cannot directly remove history entries');
  console.log('  But we can ensure future navigation creates proper entries');
  
  // Check if we can go back
  if (initialLength > 1) {
    console.log('\n🧪 Testing if back button works:');
    const urlBefore = window.location.href;
    
    // Try going back once
    window.history.back();
    
    setTimeout(() => {
      const urlAfter = window.location.href;
      if (urlBefore === urlAfter) {
        console.error('❌ Back button not working - likely duplicate entries');
        console.log('  Recommendation: Navigate to a new page to create fresh history');
      } else {
        console.log('✅ Back button works');
        // Go forward to restore
        window.history.forward();
      }
    }, 200);
  }
  
  console.log('\n📋 Recommendations:');
  console.log('  1. Navigate to home page: navigate("/")');
  console.log('  2. Then navigate to your desired page');
  console.log('  3. This creates a fresh history entry');
  console.log('  4. Future navigation should work correctly');
  
  console.groupEnd();
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).cleanHistory = cleanHistory;
  console.log('💡 Run cleanHistory() in console to check history state');
}

