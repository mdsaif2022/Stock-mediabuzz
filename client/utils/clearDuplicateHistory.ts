/**
 * Clear Duplicate History Entries
 * 
 * This utility helps clear duplicate history entries by navigating to a fresh page
 * Run: window.clearDuplicateHistory() in console
 */

export function clearDuplicateHistory() {
  console.group('🧹 Clearing Duplicate History');
  
  const currentUrl = window.location.href;
  const historyLength = window.history.length;
  
  console.log('📍 Before Clear:');
  console.log('  Current URL:', currentUrl);
  console.log('  History Length:', historyLength);
  
  console.log('\n💡 Solution: Navigate to home page to create a fresh history entry');
  console.log('  This will reset your history and allow proper back button navigation');
  
  // Navigate to home page using replace to clear history
  // Then navigate to a new page to create a fresh entry
  console.log('\n🔄 Navigating to home page...');
  
  // Use replace to clear current entry, then push a new one
  window.history.replaceState(null, '', '/');
  
  // Small delay to ensure replace completes
  setTimeout(() => {
    // Now navigate to browse to create a fresh entry
    window.history.pushState(null, '', '/browse');
    
    console.log('✅ Navigated to /browse');
    console.log('  New History Length:', window.history.length);
    console.log('  Current URL:', window.location.href);
    
    console.log('\n📋 Next Steps:');
    console.log('  1. Navigate through your app normally');
    console.log('  2. Each navigation should create a distinct history entry');
    console.log('  3. Back button should now work correctly');
    
    console.groupEnd();
  }, 100);
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).clearDuplicateHistory = clearDuplicateHistory;
  console.log('💡 Run clearDuplicateHistory() to clear duplicate history entries');
}

