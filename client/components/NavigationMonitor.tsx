/**
 * Navigation Monitor Component
 * 
 * Monitors navigation events to diagnose back button issues
 * Only active in development mode
 */

import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { isBackNavigationActive } from '@/utils/backNavigationDetector';

export default function NavigationMonitor() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // Use both detection methods for comprehensive logging
    const isPopNavigation = navigationType === 'POP';
    const isBackNavDetected = isBackNavigationActive();
    const isBackNav = isPopNavigation || isBackNavDetected;
    
    console.group('🔍 Navigation Event');
    console.log('Pathname:', location.pathname);
    console.log('Search:', location.search);
    console.log('Hash:', location.hash);
    console.log('Full URL:', window.location.href);
    console.log('History Length:', window.history.length);
    console.log('Can Go Back:', window.history.length > 1);
    console.log('History State:', window.history.state);
    console.log('Navigation Type:', navigationType, navigationType === 'POP' ? '← BACK/FORWARD' : navigationType === 'PUSH' ? '→ PROGRAMMATIC' : '🔄 REPLACE');
    console.log('Is Back Navigation (POP):', isPopNavigation ? '✅ YES' : '❌ NO');
    console.log('Is Back Navigation (Detector):', isBackNavDetected ? '✅ YES' : '❌ NO');
    console.log('Is Back Navigation:', isBackNav ? '✅ YES - Redirects should be BLOCKED' : '❌ NO');
    
    // Warn if history is polluted (many duplicate entries)
    if (window.history.length > 20) {
      console.group('⚠️ CRITICAL: History is POLLUTED');
      console.error('History length:', window.history.length, '(should be 1-5 for normal navigation)');
      console.error('This means you have', window.history.length, 'duplicate entries!');
      console.error('');
      console.error('Why this breaks the back button:');
      console.error('  1. Many history entries have the SAME URL');
      console.error('  2. Pressing back button does NOT change the URL');
      console.error('  3. Browser does NOT fire popstate event (URL must change)');
      console.error('  4. React Router treats it as new navigation (PUSH) instead of back (POP)');
      console.error('  5. Back button appears to do nothing');
      console.error('');
      console.error('🔧 SOLUTION - You MUST clear history:');
      console.error('  1. Close ALL tabs of localhost:8080 (Ctrl+W or click X)');
      console.error('  2. Wait 2 seconds');
      console.error('  3. Open a NEW tab (Ctrl+T)');
      console.error('  4. Type: http://localhost:8080/');
      console.error('  5. Press Enter');
      console.error('  6. Check history length - should be 1-2 (not 50)');
      console.error('  7. Then test back button - it should work!');
      console.error('');
      console.error('💡 ALTERNATIVE: Use Incognito Mode (Ctrl+Shift+N)');
      console.error('   This guarantees clean history');
      console.groupEnd();
    }
    
    if (isBackNav) {
      console.warn('⚠️ BACK BUTTON PRESSED - All redirects should be blocked!');
    }
    
    console.groupEnd();
  }, [location, navigationType]);

  // Monitor popstate events (both capture and bubble phase)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    let popStateFired = false;
    let lastUrl = window.location.href;

    const handlePopStateCapture = (event: PopStateEvent) => {
      popStateFired = true;
      console.group('🔙 [NavigationMonitor] PopState Event (CAPTURE phase - before React Router)');
      console.log('URL Changed to:', window.location.href);
      console.log('Previous URL:', lastUrl);
      console.log('State:', event.state);
      console.log('History Length:', window.history.length);
      console.log('Timestamp:', new Date().toISOString());
      console.log('Note: This fires BEFORE React Router processes the event');
      console.groupEnd();
      lastUrl = window.location.href;
    };

    const handlePopStateBubble = (event: PopStateEvent) => {
      console.group('🔙 [NavigationMonitor] PopState Event (BUBBLE phase - after React Router)');
      console.log('URL Changed to:', window.location.href);
      console.log('State:', event.state);
      console.log('History Length:', window.history.length);
      console.log('Timestamp:', new Date().toISOString());
      console.log('PopState fired:', popStateFired ? '✅ YES' : '❌ NO');
      console.log('Note: This fires AFTER React Router processes the event');
      console.groupEnd();
      popStateFired = false; // Reset for next event
    };

    // Monitor both phases
    window.addEventListener('popstate', handlePopStateCapture, true); // Capture
    window.addEventListener('popstate', handlePopStateBubble, false); // Bubble

    return () => {
      window.removeEventListener('popstate', handlePopStateCapture, true);
      window.removeEventListener('popstate', handlePopStateBubble, false);
    };
  }, []);

  return null;
}

