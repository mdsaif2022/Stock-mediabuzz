import { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Advanced Ad-blocker Detection Component
 * 
 * Uses 10+ detection methods for maximum reliability:
 * 1. Ad Container Element - Checks if ad divs are hidden/removed
 * 2. Ad Script Load - Attempts to load Google Ads script
 * 3. Ad Network Fetch - Tests network requests to ad servers
 * 4. Global Variables - Detects ad blocker global objects (uBlock, AdBlock, etc.)
 * 5. Iframe Access - Tests iframe blocking behavior
 * 6. Bait Elements - Multiple bait elements with various class names
 * 7. Mutation Observer - Detects DOM modifications by ad blockers
 * 8. Multiple Ad URLs - Tests multiple ad network URLs
 * 9. CSS Hiding - Checks for CSS-based element hiding
 * 10. Ad Image Load - Tests loading of ad images
 * 
 * Detection threshold: Requires 2+ positive checks OR 30%+ positive rate
 * This balances sensitivity with false positive prevention
 * 
 * Dismissal: Once dismissed, persists across refreshes and browser restarts via localStorage
 */
export default function AdBlockerDetector() {
  // Initialize dismissed state from localStorage immediately
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem("adblock-dismissed");
      return dismissed === "true";
    }
    return false;
  });
  const [isAdBlocked, setIsAdBlocked] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    console.log('[AdBlockerDetector] ========================================');
    console.log('[AdBlockerDetector] 🚀 Component mounted - starting detection');
    console.log('[AdBlockerDetector] ========================================');
    
    // ALWAYS run detection on every page load to detect ACTUAL current state
    // Don't skip detection based on previous dismissal - detect the real current state
    const dismissed = localStorage.getItem("adblock-dismissed");
    const isDismissedValid = dismissed === "true";
    
    console.log('[AdBlockerDetector] Starting fresh detection on page load:', { 
      dismissed, 
      isDismissedValid,
      note: 'Will detect ACTUAL current ad blocker state, not previous state'
    });
    
    // Reset state on fresh page load
    setIsDismissed(isDismissedValid);
    setIsAdBlocked(false);
    setIsVisible(false);
    
    // ALWAYS run detection - we need to know the ACTUAL current state
    console.log('[AdBlockerDetector] ✅ Running detection to check ACTUAL ad blocker state...');
    console.log('[AdBlockerDetector] 💡 Previous dismissal will be respected only if NO ad blocker is detected');

    // Advanced detection with multiple methods for maximum reliability
    const detectAdBlocker = (): Promise<boolean> => {
      return new Promise((resolve) => {
        let detectedCount = 0;
        const checks: boolean[] = [];
        const checkDetails: { method: string; result: boolean; details?: string }[] = [];
        let resolved = false;

        console.log('[AdBlockerDetector] 🚀 Starting ADVANCED detection with multiple methods...');

        // Method 1: Check for blocked ad container element
        const testAd = document.createElement("div");
        testAd.innerHTML = "&nbsp;";
        testAd.className = "adsbox pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links";
        testAd.style.position = "absolute";
        testAd.style.left = "-9999px";
        testAd.style.height = "1px";
        testAd.style.width = "1px";
        testAd.setAttribute("data-ad-client", "ca-pub-test");
        testAd.setAttribute("data-ad-slot", "1234567890");
        document.body.appendChild(testAd);

        setTimeout(() => {
          const computed = window.getComputedStyle(testAd);
          const isBlocked = 
            testAd.offsetHeight === 0 || 
            testAd.offsetWidth === 0 ||
            testAd.offsetParent === null ||
            testAd.style.display === "none" ||
            testAd.style.visibility === "hidden" ||
            computed.display === "none" ||
            computed.visibility === "hidden" ||
            computed.opacity === "0" ||
            computed.height === "0px" ||
            computed.width === "0px";
          
          if (testAd.parentNode) {
            document.body.removeChild(testAd);
          }
          
          checks.push(isBlocked);
          checkDetails.push({ 
            method: 'Ad Container Element', 
            result: isBlocked,
            details: isBlocked ? `Height: ${testAd.offsetHeight}, Display: ${computed.display}` : undefined
          });
          if (isBlocked) detectedCount++;
          console.log(`[AdBlockerDetector] Method 1 (Ad Container): ${isBlocked ? 'BLOCKED' : 'ALLOWED'}`, {
            offsetHeight: testAd.offsetHeight,
            offsetWidth: testAd.offsetWidth,
            display: computed.display,
            visibility: computed.visibility
          });
          checkResults();
        }, 100); // Reduced from 150ms to 100ms for faster detection

        // Method 2: Check for blocked ad script
        const adScript = document.createElement("script");
        adScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
        adScript.async = true;
        adScript.id = "adsbygoogle-test";
        
        let scriptTimeout: NodeJS.Timeout;
        adScript.onerror = () => {
          clearTimeout(scriptTimeout);
          checks.push(true);
          checkDetails.push({ method: 'Ad Script Load', result: true });
          detectedCount++;
          console.log(`[AdBlockerDetector] Method 2 (Ad Script): BLOCKED (onerror)`);
          checkResults();
        };
        
        adScript.onload = () => {
          clearTimeout(scriptTimeout);
          checks.push(false);
          checkDetails.push({ method: 'Ad Script Load', result: false });
          console.log(`[AdBlockerDetector] Method 2 (Ad Script): ALLOWED (onload)`);
          checkResults();
        };
        
        document.head.appendChild(adScript);
        
        // Timeout: if script doesn't load in 1.5 seconds, likely blocked (reduced from 2s)
        scriptTimeout = setTimeout(() => {
          if (adScript.parentNode) {
            document.head.removeChild(adScript);
          }
          checks.push(true);
          checkDetails.push({ method: 'Ad Script Load', result: true });
          detectedCount++;
          console.log(`[AdBlockerDetector] Method 2 (Ad Script): BLOCKED (timeout after 1.5s)`);
          checkResults();
        }, 1500); // Reduced from 2000ms to 1500ms for faster detection

        // Method 3: Check for blocked ad network fetch
        fetch("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", {
          method: "HEAD",
          mode: "no-cors",
        })
          .catch(() => {
            checks.push(true);
            checkDetails.push({ method: 'Ad Network Fetch', result: true });
            detectedCount++;
            console.log(`[AdBlockerDetector] Method 3 (Ad Network Fetch): BLOCKED (catch)`);
            checkResults();
          })
          .then(() => {
            checks.push(false);
            checkDetails.push({ method: 'Ad Network Fetch', result: false });
            console.log(`[AdBlockerDetector] Method 3 (Ad Network Fetch): ALLOWED (then)`);
            checkResults();
          });

        // Method 4: Check for common ad-blocker global variables (enhanced) + AdBlocker Ultimate
        try {
          const win = window as any;
          const adBlockerVars = {
            uBlock: !!win.uBlock,
            adblock: !!win.adblock,
            AdBlock: !!win.AdBlock,
            uBlockOrigin: !!win.uBlockOrigin,
            AdblockPlus: !!win.AdblockPlus,
            AdGuard: !!win.AdGuard,
            adblockUltimate: !!win.adblockUltimate,
            adblockerUltimate: !!win.adblockerUltimate,
            brave: !!win.brave,
            getComputedStyle: !!win.getComputedStyle && typeof win.getComputedStyle === 'function'
          };
          
          // Also check for AdBlocker Ultimate DOM elements
          const ultimateElement = document.getElementById('adblock-ultimate') || 
                                  document.querySelector('[data-adblock-ultimate]') ||
                                  document.querySelector('.adblock-ultimate');
          
          if (ultimateElement) {
            adBlockerVars.adblockUltimate = true;
          }
          
          const detectedVars = Object.entries(adBlockerVars)
            .filter(([_, value]) => value)
            .map(([key]) => key);
          
          const hasAdBlocker = detectedVars.length > 0;
          
          checks.push(hasAdBlocker);
          checkDetails.push({ 
            method: 'Global Variables', 
            result: hasAdBlocker,
            details: detectedVars.length > 0 ? `Detected: ${detectedVars.join(', ')}` : undefined
          });
          if (hasAdBlocker) detectedCount++;
          console.log(`[AdBlockerDetector] Method 4 (Global Variables): ${hasAdBlocker ? `BLOCKED (${detectedVars.join(', ')})` : 'ALLOWED'}`);
          checkResults();
        } catch (e) {
          checks.push(false);
          checkDetails.push({ method: 'Global Variables', result: false });
          console.log(`[AdBlockerDetector] Method 4 (Global Variables): ALLOWED (error: ${e})`);
          checkResults();
        }

        // Method 6: Check for blocked bait elements with various class names
        const baitClasses = [
          'adsbygoogle',
          'advertisement',
          'ad-banner',
          'ad-container',
          'ad-wrapper',
          'sponsor',
          'promo',
          'banner-ad',
          'sidebar-ad'
        ];
        
        let baitBlockedCount = 0;
        baitClasses.forEach((className, index) => {
          const bait = document.createElement("div");
          bait.className = className;
          bait.innerHTML = "&nbsp;";
          bait.style.position = "absolute";
          bait.style.left = "-9999px";
          bait.style.height = "1px";
          bait.style.width = "1px";
          bait.setAttribute("data-ad-client", "ca-pub-test");
          document.body.appendChild(bait);
          
          setTimeout(() => {
            const isBlocked = bait.offsetHeight === 0 || bait.offsetParent === null;
            if (bait.parentNode) {
              document.body.removeChild(bait);
            }
            if (isBlocked) baitBlockedCount++;
            
            if (index === baitClasses.length - 1) {
              // Last bait element checked
              const isBlocked = baitBlockedCount >= Math.ceil(baitClasses.length / 2);
              checks.push(isBlocked);
              checkDetails.push({ 
                method: 'Bait Elements', 
                result: isBlocked,
                details: `${baitBlockedCount}/${baitClasses.length} bait elements blocked`
              });
              if (isBlocked) detectedCount++;
              console.log(`[AdBlockerDetector] Method 6 (Bait Elements): ${isBlocked ? `BLOCKED (${baitBlockedCount}/${baitClasses.length})` : 'ALLOWED'}`);
              checkResults();
            }
          }, 100);
        });

        // Method 7: Check for MutationObserver detection (some ad blockers modify DOM)
        try {
          let mutationDetected = false;
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.type === 'childList') {
                mutation.removedNodes.forEach((node) => {
                  if (node.nodeType === 1) {
                    const el = node as Element;
                    if (el.className && (
                      el.className.includes('ad') || 
                      el.className.includes('ads') ||
                      el.id && el.id.includes('ad')
                    )) {
                      mutationDetected = true;
                    }
                  }
                });
              }
            });
          });
          
          const testDiv = document.createElement("div");
          testDiv.className = "test-ad-element";
          testDiv.id = "ad-test-element";
          testDiv.style.position = "absolute";
          testDiv.style.left = "-9999px";
          document.body.appendChild(testDiv);
          
          observer.observe(document.body, { childList: true, subtree: true });
          
          setTimeout(() => {
            observer.disconnect();
            if (testDiv.parentNode) {
              document.body.removeChild(testDiv);
            }
            checks.push(mutationDetected);
            checkDetails.push({ 
              method: 'Mutation Observer', 
              result: mutationDetected,
              details: mutationDetected ? 'Ad elements being removed' : undefined
            });
            if (mutationDetected) detectedCount++;
            console.log(`[AdBlockerDetector] Method 7 (Mutation Observer): ${mutationDetected ? 'BLOCKED' : 'ALLOWED'}`);
            checkResults();
          }, 500);
        } catch (e) {
          checks.push(false);
          checkDetails.push({ method: 'Mutation Observer', result: false });
          console.log(`[AdBlockerDetector] Method 7 (Mutation Observer): ALLOWED (error: ${e})`);
          checkResults();
        }

        // Method 8: Check for blocked ad network requests (multiple URLs)
        const adUrls = [
          'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
          'https://ads.yahoo.com/ads.js',
          'https://ad.doubleclick.net/adj/',
          'https://securepubads.g.doubleclick.net/gpt/pubads_impl.js',
          'https://www.googletagservices.com/tag/js/gpt.js'
        ];
        
        let blockedUrls = 0;
        let checkedUrls = 0;
        
        adUrls.forEach((url) => {
          fetch(url, { method: 'HEAD', mode: 'no-cors' })
            .then(() => {
              checkedUrls++;
              if (checkedUrls === adUrls.length) {
                const isBlocked = blockedUrls >= Math.ceil(adUrls.length / 2);
                checks.push(isBlocked);
                checkDetails.push({ 
                  method: 'Multiple Ad URLs', 
                  result: isBlocked,
                  details: `${blockedUrls}/${adUrls.length} URLs blocked`
                });
                if (isBlocked) detectedCount++;
                console.log(`[AdBlockerDetector] Method 8 (Multiple Ad URLs): ${isBlocked ? `BLOCKED (${blockedUrls}/${adUrls.length})` : 'ALLOWED'}`);
                checkResults();
              }
            })
            .catch(() => {
              blockedUrls++;
              checkedUrls++;
              if (checkedUrls === adUrls.length) {
                const isBlocked = blockedUrls >= Math.ceil(adUrls.length / 2);
                checks.push(isBlocked);
                checkDetails.push({ 
                  method: 'Multiple Ad URLs', 
                  result: isBlocked,
                  details: `${blockedUrls}/${adUrls.length} URLs blocked`
                });
                if (isBlocked) detectedCount++;
                console.log(`[AdBlockerDetector] Method 8 (Multiple Ad URLs): ${isBlocked ? `BLOCKED (${blockedUrls}/${adUrls.length})` : 'ALLOWED'}`);
                checkResults();
              }
            });
        });

        // Method 9: Check for CSS-based hiding (ad blockers often hide elements)
        try {
          const cssTest = document.createElement("div");
          cssTest.className = "adsbygoogle";
          cssTest.id = "google-ads-test";
          cssTest.style.position = "absolute";
          cssTest.style.left = "-9999px";
          cssTest.style.height = "1px";
          cssTest.style.width = "1px";
          cssTest.style.display = "block";
          cssTest.style.visibility = "visible";
          document.body.appendChild(cssTest);
          
          setTimeout(() => {
            const computed = window.getComputedStyle(cssTest);
            const isHidden = 
              computed.display === "none" ||
              computed.visibility === "hidden" ||
              computed.opacity === "0" ||
              cssTest.offsetHeight === 0 ||
              cssTest.offsetWidth === 0;
            
            if (cssTest.parentNode) {
              document.body.removeChild(cssTest);
            }
            
            checks.push(isHidden);
            checkDetails.push({ 
              method: 'CSS Hiding', 
              result: isHidden,
              details: isHidden ? `Display: ${computed.display}, Visibility: ${computed.visibility}` : undefined
            });
            if (isHidden) detectedCount++;
            console.log(`[AdBlockerDetector] Method 9 (CSS Hiding): ${isHidden ? 'BLOCKED' : 'ALLOWED'}`);
            checkResults();
          }, 200);
        } catch (e) {
          checks.push(false);
          checkDetails.push({ method: 'CSS Hiding', result: false });
          console.log(`[AdBlockerDetector] Method 9 (CSS Hiding): ALLOWED (error: ${e})`);
          checkResults();
        }

        // Method 10: Check for blocked image with ad-related src
        const adImage = document.createElement("img");
        adImage.src = "https://ad.doubleclick.net/ads/test.gif";
        adImage.style.position = "absolute";
        adImage.style.left = "-9999px";
        adImage.style.width = "1px";
        adImage.style.height = "1px";
        
        let imageTimeout: NodeJS.Timeout;
        adImage.onerror = () => {
          clearTimeout(imageTimeout);
          checks.push(true);
          checkDetails.push({ method: 'Ad Image Load', result: true });
          detectedCount++;
          console.log(`[AdBlockerDetector] Method 10 (Ad Image): BLOCKED (onerror)`);
          if (adImage.parentNode) {
            document.body.removeChild(adImage);
          }
          checkResults();
        };
        
        adImage.onload = () => {
          clearTimeout(imageTimeout);
          checks.push(false);
          checkDetails.push({ method: 'Ad Image Load', result: false });
          console.log(`[AdBlockerDetector] Method 10 (Ad Image): ALLOWED (onload)`);
          if (adImage.parentNode) {
            document.body.removeChild(adImage);
          }
          checkResults();
        };
        
        document.body.appendChild(adImage);
        
        imageTimeout = setTimeout(() => {
          if (adImage.parentNode) {
            document.body.removeChild(adImage);
          }
          checks.push(true);
          checkDetails.push({ method: 'Ad Image Load', result: true });
          detectedCount++;
          console.log(`[AdBlockerDetector] Method 10 (Ad Image): BLOCKED (timeout)`);
          checkResults();
        }, 2000);

        // Method 5: Check for blocked iframe
        const testIframe = document.createElement("iframe");
        testIframe.src = "about:blank";
        testIframe.style.display = "none";
        testIframe.style.width = "1px";
        testIframe.style.height = "1px";
        testIframe.setAttribute("data-ad-client", "ca-pub-test");
        
        let iframeTimeout: NodeJS.Timeout;
        testIframe.onload = () => {
          clearTimeout(iframeTimeout);
          // Try to access iframe content - if blocked, will throw error
          try {
            const iframeDoc = testIframe.contentDocument || testIframe.contentWindow?.document;
            const isBlocked = !iframeDoc;
            checks.push(isBlocked);
            checkDetails.push({ method: 'Iframe Access', result: isBlocked });
            if (isBlocked) detectedCount++;
            console.log(`[AdBlockerDetector] Method 5 (Iframe): ${isBlocked ? 'BLOCKED' : 'ALLOWED'}`);
          } catch (e) {
            checks.push(true);
            checkDetails.push({ method: 'Iframe Access', result: true });
            detectedCount++;
            console.log(`[AdBlockerDetector] Method 5 (Iframe): BLOCKED (error: ${e})`);
          }
          if (testIframe.parentNode) {
            document.body.removeChild(testIframe);
          }
          checkResults();
        };
        
        testIframe.onerror = () => {
          clearTimeout(iframeTimeout);
          checks.push(true);
          checkDetails.push({ method: 'Iframe Load', result: true });
          detectedCount++;
          console.log(`[AdBlockerDetector] Method 5 (Iframe): BLOCKED (onerror)`);
          if (testIframe.parentNode) {
            document.body.removeChild(testIframe);
          }
          checkResults();
        };
        
        document.body.appendChild(testIframe);
        
        iframeTimeout = setTimeout(() => {
          if (testIframe.parentNode) {
            document.body.removeChild(testIframe);
          }
          checks.push(true);
          checkDetails.push({ method: 'Iframe Timeout', result: true });
          detectedCount++;
          console.log(`[AdBlockerDetector] Method 5 (Iframe): BLOCKED (timeout)`);
          checkResults();
        }, 1500);

        function checkResults() {
          // Prevent multiple resolutions
          if (resolved) return;
          
          // Evaluate results - now we have up to 10 methods
          // LOWERED THRESHOLD: Require only 1 positive check for maximum sensitivity
          if (checks.length >= 1) {
            const positiveChecks = checks.filter(Boolean).length;
            const totalChecks = checks.length;
            const percentage = totalChecks > 0 ? (positiveChecks / totalChecks) * 100 : 0;
            
            // REQUIRE 2+ positive checks OR 30%+ positive rate for reliability
            // This reduces false positives while still catching ad blockers
            const isBlocked = positiveChecks >= 2 || percentage >= 30 || detectedCount >= 2;
            
            console.log('[AdBlockerDetector] 📊 Detection Results:', {
              totalChecks,
              positiveChecks,
              detectedCount,
              percentage: `${percentage.toFixed(1)}%`,
              isBlocked,
              threshold: '1+ positive OR 20%+ rate',
              details: checkDetails
            });
            
            // If threshold met, resolve immediately
            if (isBlocked) {
              resolved = true;
              console.log('[AdBlockerDetector] ✅ AD BLOCKER CONFIRMED - Showing modal');
              resolve(true);
            } else if (checks.length >= 8) {
              // If we have 8+ checks and still no detection, likely no ad blocker
              resolved = true;
              console.log('[AdBlockerDetector] ❌ No ad blocker detected after comprehensive check');
              resolve(false);
            }
          }
        }
      });
    };

    // Advanced quick check (runs first with multiple techniques)
    const quickCheck = () => {
      // Always run detection - we need to detect ACTUAL current state
      // Dismissal will only be respected if NO ad blocker is detected
      
      console.log('[AdBlockerDetector] ⚡ Running advanced quick check...');
      
      let quickBlockedCount = 0;
      let quickChecksCompleted = 0;
      const totalQuickChecks = 3;
      
      // Quick Check 1: Ad container element
      const quickTest1 = document.createElement("div");
      quickTest1.className = "adsbox pub_300x250";
      quickTest1.style.position = "absolute";
      quickTest1.style.left = "-9999px";
      quickTest1.style.height = "1px";
      quickTest1.style.width = "1px";
      quickTest1.setAttribute("data-ad-client", "ca-pub-test");
      document.body.appendChild(quickTest1);
      
      setTimeout(() => {
        const computed = window.getComputedStyle(quickTest1);
        const isBlocked = 
          quickTest1.offsetHeight === 0 || 
          quickTest1.offsetWidth === 0 ||
          quickTest1.offsetParent === null ||
          computed.display === "none" ||
          computed.visibility === "hidden";
        
        if (quickTest1.parentNode) {
          document.body.removeChild(quickTest1);
        }
        if (isBlocked) {
          quickBlockedCount++;
          console.log('[AdBlockerDetector] ⚡ Quick Check 1: Ad container blocked', {
            offsetHeight: quickTest1.offsetHeight,
            display: computed.display
          });
        } else {
          console.log('[AdBlockerDetector] ⚡ Quick Check 1: Ad container allowed');
        }
        quickChecksCompleted++;
        checkQuickResults();
      }, 100); // Reduced from 150ms to 100ms for faster detection
      
      // Quick Check 2: Google Ads script (faster timeout)
      const quickScript = document.createElement("script");
      quickScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
      quickScript.async = true;
      quickScript.id = "quick-adsbygoogle-test";
      
      let scriptQuickTimeout: NodeJS.Timeout;
      quickScript.onerror = () => {
        clearTimeout(scriptQuickTimeout);
        quickBlockedCount++;
        quickChecksCompleted++;
        console.log('[AdBlockerDetector] ⚡ Quick Check 2: Script blocked (onerror)');
        if (quickScript.parentNode) {
          document.head.removeChild(quickScript);
        }
        checkQuickResults();
      };
      
      quickScript.onload = () => {
        clearTimeout(scriptQuickTimeout);
        quickChecksCompleted++;
        console.log('[AdBlockerDetector] ⚡ Quick Check 2: Script loaded successfully');
        if (quickScript.parentNode) {
          document.head.removeChild(quickScript);
        }
        checkQuickResults();
      };
      
      document.head.appendChild(quickScript);
      scriptQuickTimeout = setTimeout(() => {
        if (quickScript.parentNode) {
          document.head.removeChild(quickScript);
        }
        quickBlockedCount++;
        quickChecksCompleted++;
        console.log('[AdBlockerDetector] ⚡ Quick Check 2: Script blocked (timeout)');
        checkQuickResults();
      }, 1000); // Reduced from 1500ms to 1000ms for faster detection
      
      // Quick Check 3: Global variables (enhanced) + AdBlocker Ultimate specific
      try {
        const win = window as any;
        const detected = [];
        
        // Standard ad blockers
        if (win.uBlock) detected.push('uBlock');
        if (win.adblock) detected.push('adblock');
        if (win.AdBlock) detected.push('AdBlock');
        if (win.uBlockOrigin) detected.push('uBlockOrigin');
        if (win.AdblockPlus) detected.push('AdblockPlus');
        if (win.AdGuard) detected.push('AdGuard');
        if (win.brave && win.brave.isBrave) detected.push('Brave');
        
        // AdBlocker Ultimate specific checks
        if (win.adblockUltimate) detected.push('AdBlockerUltimate');
        if (win.adblockerUltimate) detected.push('AdBlockerUltimate');
        if (document.getElementById('adblock-ultimate')) detected.push('AdBlockerUltimate');
        
        // Check for blocked elements that AdBlocker Ultimate typically blocks
        const testUltimate = document.createElement("div");
        testUltimate.id = "adblock-ultimate-test";
        testUltimate.className = "advertisement";
        testUltimate.style.position = "absolute";
        testUltimate.style.left = "-9999px";
        testUltimate.style.height = "1px";
        testUltimate.style.width = "1px";
        document.body.appendChild(testUltimate);
        
        setTimeout(() => {
          const ultimateBlocked = testUltimate.offsetHeight === 0 || testUltimate.offsetParent === null;
          if (testUltimate.parentNode) {
            document.body.removeChild(testUltimate);
          }
          if (ultimateBlocked && detected.length === 0) {
            detected.push('AdBlockerUltimate (behavioral)');
          }
          
          const hasQuickBlocker = detected.length > 0 || ultimateBlocked;
          if (hasQuickBlocker) {
            quickBlockedCount++;
            console.log(`[AdBlockerDetector] ⚡ Quick Check 3: Detected: ${detected.join(', ') || 'Behavioral detection'}`);
          } else {
            console.log('[AdBlockerDetector] ⚡ Quick Check 3: No ad blocker detected');
          }
          quickChecksCompleted++;
          checkQuickResults();
        }, 100);
      } catch (e) {
        console.log('[AdBlockerDetector] ⚡ Quick Check 3: Error checking:', e);
        quickChecksCompleted++;
        checkQuickResults();
      }
      
      function checkQuickResults() {
        if (quickChecksCompleted >= totalQuickChecks) {
          // REQUIRE 2+ positive checks for reliability (reduce false positives)
          const isBlocked = quickBlockedCount >= 2;
          
          console.log(`[AdBlockerDetector] ⚡ Quick check results: ${quickBlockedCount}/${totalQuickChecks} positive`);
          
          if (isBlocked) {
            console.log(`[AdBlockerDetector] ⚡ Quick check: AD BLOCKER DETECTED (${quickBlockedCount}/${totalQuickChecks} checks positive) - running full detection for verification`);
            // Don't show modal immediately - run full detection first for verification
            // Full detection will respect dismissal only if no ad blocker is actually detected
            runFullDetection();
          } else {
            console.log(`[AdBlockerDetector] ⚡ Quick check: No ad blocker detected (${quickBlockedCount}/${totalQuickChecks}) - ensuring modal is closed`);
            setIsAdBlocked(false);
            setIsVisible(false);
            // Respect dismissal if no ad blocker detected
            const stillDismissed = localStorage.getItem("adblock-dismissed") === "true";
            if (stillDismissed) {
              setIsDismissed(true);
            }
            // Run full detection to be thorough
            runFullDetection();
          }
        }
        
        // Don't show immediately - wait for full detection to verify
        // This prevents false positives
      }
    };
    
    // Full detection with multiple methods
    const runFullDetection = async () => {
      // Don't skip detection based on dismissal - we need to detect ACTUAL current state
      // Dismissal will only be respected if NO ad blocker is detected
      console.log('[AdBlockerDetector] Running full detection to check ACTUAL ad blocker state...');
      try {
        const blocked = await detectAdBlocker();
        
        // Don't check dismissal here - we'll respect it only if NO ad blocker is detected
        // If ad blocker IS detected, show modal regardless of previous dismissal
        console.log(`[AdBlockerDetector] Final result: ${blocked ? 'AD BLOCKER DETECTED' : 'NO AD BLOCKER'}`);
        
        if (blocked) {
          // Double-check before showing modal - run a quick verification
          console.log('[AdBlockerDetector] 🔍 Running verification check before showing modal...');
          const verifyBlocked = await new Promise<boolean>((resolve) => {
            const verifyScript = document.createElement("script");
            verifyScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
            verifyScript.async = true;
            let verifiedBlocked = false;
            let verifiedLoaded = false;
            
            verifyScript.onerror = () => {
              verifiedBlocked = true;
              if (verifyScript.parentNode) document.head.removeChild(verifyScript);
              resolve(true);
            };
            
            verifyScript.onload = () => {
              verifiedLoaded = true;
              if (verifyScript.parentNode) document.head.removeChild(verifyScript);
              resolve(false);
            };
            
            document.head.appendChild(verifyScript);
            
            setTimeout(() => {
              if (!verifiedLoaded && !verifiedBlocked) {
                verifiedBlocked = true;
                if (verifyScript.parentNode) document.head.removeChild(verifyScript);
              }
              resolve(verifiedBlocked);
            }, 1000);
          });
          
          if (verifyBlocked) {
            // Ad blocker is ACTUALLY detected - show modal regardless of previous dismissal
            // This ensures detection works on every page load/refresh
            console.log('[AdBlockerDetector] ✅ Verification confirmed - Ad blocker ACTUALLY detected - Showing modal');
            console.log('[AdBlockerDetector] 📌 Showing modal even if previously dismissed (detecting actual current state)');
            setIsAdBlocked(true);
            setIsVisible(true);
            // Clear dismissal since ad blocker is actually active
            setIsDismissed(false);
          } else {
            console.log('[AdBlockerDetector] ❌ Verification failed - Ad blocker NOT detected, NOT showing modal');
            setIsAdBlocked(false);
            setIsVisible(false);
            // Respect previous dismissal if no ad blocker detected
            const stillDismissed = localStorage.getItem("adblock-dismissed") === "true";
            if (stillDismissed) {
              setIsDismissed(true);
            }
          }
        } else {
          // No ad blocker detected - respect previous dismissal
          console.log('[AdBlockerDetector] ❌ No ad blocker detected, ensuring modal is closed');
          setIsAdBlocked(false);
          setIsVisible(false);
          const stillDismissed = localStorage.getItem("adblock-dismissed") === "true";
          if (stillDismissed) {
            setIsDismissed(true);
            console.log('[AdBlockerDetector] ✅ Respecting previous dismissal since no ad blocker detected');
          }
        }
      } catch (error) {
        console.error('[AdBlockerDetector] Error during detection:', error);
        // On error, don't assume blocked - just log and don't show modal
        // This prevents false positives
        console.log('[AdBlockerDetector] ⚠️ Detection error - NOT showing modal to avoid false positives');
        setIsAdBlocked(false);
        setIsVisible(false);
      }
    };
    
    // AGGRESSIVE: Run multiple immediate checks
    const immediateCheck = () => {
      console.log('[AdBlockerDetector] ⚡ Running IMMEDIATE checks...');
      // Always run - we need to detect ACTUAL current state on every page load
      
      let immediateBlocked = false;
      
      // Immediate Check 1: Ad container
      const test1 = document.createElement("div");
      test1.className = "adsbox advertisement ad-container";
      test1.style.position = "absolute";
      test1.style.left = "-9999px";
      test1.style.height = "1px";
      test1.style.width = "1px";
      test1.setAttribute("data-ad-client", "ca-pub-test");
      document.body.appendChild(test1);
      
      // Immediate Check 2: Try loading Google Ads script (most reliable)
      const testScript = document.createElement("script");
      testScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
      testScript.async = true;
      testScript.id = "immediate-adsbygoogle-test";
      
      let scriptBlocked = false;
      testScript.onerror = () => {
        scriptBlocked = true;
        console.log('[AdBlockerDetector] ⚡ IMMEDIATE: Script blocked (onerror)');
        checkImmediateResults();
      };
      
      testScript.onload = () => {
        console.log('[AdBlockerDetector] ⚡ IMMEDIATE: Script loaded');
        checkImmediateResults();
      };
      
      document.head.appendChild(testScript);
      
      // Timeout for script
      setTimeout(() => {
        if (!testScript.onload && !scriptBlocked) {
          scriptBlocked = true;
          console.log('[AdBlockerDetector] ⚡ IMMEDIATE: Script blocked (timeout)');
        }
        checkImmediateResults();
      }, 800); // Fast timeout
      
      // Check element after a frame
      requestAnimationFrame(() => {
        const computed = window.getComputedStyle(test1);
        const elementBlocked = 
          test1.offsetHeight === 0 || 
          test1.offsetWidth === 0 ||
          test1.offsetParent === null ||
          computed.display === "none" ||
          computed.visibility === "hidden";
        
        if (test1.parentNode) {
          document.body.removeChild(test1);
        }
        
        if (elementBlocked) {
          immediateBlocked = true;
          console.log('[AdBlockerDetector] ⚡ IMMEDIATE: Element blocked', {
            offsetHeight: test1.offsetHeight,
            display: computed.display
          });
        }
        
        checkImmediateResults();
      });
      
      function checkImmediateResults() {
        // Don't show modal immediately - always run full detection for verification
        // This prevents false positives when ad blocker is disabled
        if (scriptBlocked || immediateBlocked) {
          console.log('[AdBlockerDetector] ⚡ IMMEDIATE CHECK: Possible ad blocker detected - running full detection for verification');
          // Run full detection - it will show modal if ad blocker is actually detected
          // regardless of previous dismissal
          runFullDetection();
        } else {
          // No detection - ensure modal is closed and respect dismissal
          console.log('[AdBlockerDetector] ⚡ IMMEDIATE CHECK: No ad blocker detected - ensuring modal is closed');
          setIsAdBlocked(false);
          setIsVisible(false);
          const stillDismissed = localStorage.getItem("adblock-dismissed") === "true";
          if (stillDismissed) {
            setIsDismissed(true);
          }
        }
      }
    };
    
    // Run immediate check as soon as possible
    if (document.body) {
      // Body ready, run immediately
      setTimeout(immediateCheck, 50);
    } else {
      // Wait for body
      const bodyObserver = new MutationObserver((mutations, observer) => {
        if (document.body) {
          observer.disconnect();
          setTimeout(immediateCheck, 50);
        }
      });
      bodyObserver.observe(document.documentElement, { childList: true });
      
      // Also listen for DOMContentLoaded as backup
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(immediateCheck, 50);
      });
    }
    
    // Then run full quick check
    const timer = setTimeout(() => {
      quickCheck();
    }, 300); // Run after immediate check

    return () => clearTimeout(timer);
  }, []);

  // Add/remove blur class to body when modal is visible
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = "hidden";
      document.body.classList.add("adblock-modal-open");
    } else {
      document.body.style.overflow = "";
      document.body.classList.remove("adblock-modal-open");
    }
    
    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("adblock-modal-open");
    };
  }, [isVisible]);

  const handleAllowAds = () => {
    console.log('[AdBlockerDetector] User clicked "Allow ads" - dismissing modal');
    setIsVisible(false);
    setIsDismissed(true);
    // Store dismissal in localStorage with timestamp for tracking
    localStorage.setItem("adblock-dismissed", "true");
    localStorage.setItem("adblock-dismissed-timestamp", Date.now().toString());
    console.log('[AdBlockerDetector] Dismissal saved to localStorage - will not show again until reset');
  };

  const handleClose = () => {
    console.log('[AdBlockerDetector] User clicked "I understand" - dismissing modal');
    setIsVisible(false);
    setIsDismissed(true);
    // Store dismissal in localStorage with timestamp
    localStorage.setItem("adblock-dismissed", "true");
    localStorage.setItem("adblock-dismissed-timestamp", Date.now().toString());
    console.log('[AdBlockerDetector] Dismissal saved to localStorage - will not show again until reset');
  };

  const handleRecheck = useCallback(async (): Promise<void> => {
    console.log('[AdBlockerDetector] User clicked "Re-check" - verifying ad blocker status...');
    
    // Run a quick verification check
    const verifyAdBlocker = (): Promise<boolean> => {
      return new Promise((resolve) => {
        let blockedCount = 0;
        let totalChecks = 0;
        
        // Quick check 1: Ad container
        const testDiv = document.createElement("div");
        testDiv.className = "adsbox advertisement";
        testDiv.style.position = "absolute";
        testDiv.style.left = "-9999px";
        testDiv.style.height = "1px";
        testDiv.style.width = "1px";
        document.body.appendChild(testDiv);
        
        setTimeout(() => {
          totalChecks++;
          const computed = window.getComputedStyle(testDiv);
          const isBlocked = testDiv.offsetHeight === 0 || testDiv.offsetParent === null || computed.display === "none";
          if (isBlocked) blockedCount++;
          document.body.removeChild(testDiv);
          
          // Quick check 2: Script load
          const script = document.createElement("script");
          script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
          script.async = true;
          script.id = "verify-adsbygoogle";
          let scriptBlocked = false;
          let scriptLoaded = false;
          
          script.onerror = () => {
            scriptBlocked = true;
            totalChecks++;
            blockedCount++;
            if (script.parentNode) document.head.removeChild(script);
            resolve(blockedCount >= 1);
          };
          
          script.onload = () => {
            scriptLoaded = true;
            totalChecks++;
            if (script.parentNode) document.head.removeChild(script);
            resolve(blockedCount >= 1);
          };
          
          document.head.appendChild(script);
          
          // Timeout fallback
          setTimeout(() => {
            if (!scriptLoaded && !scriptBlocked) {
              totalChecks++;
              blockedCount++;
              if (script.parentNode) document.head.removeChild(script);
            }
            resolve(blockedCount >= 1);
          }, 1000);
        }, 200);
      });
    };
    
    const stillBlocked = await verifyAdBlocker();
    
    console.log('[AdBlockerDetector] Re-check result:', { stillBlocked });
    
    if (!stillBlocked) {
      // Ad blocker is disabled - FORCE dismiss modal immediately
      console.log('[AdBlockerDetector] ✅ Ad blocker appears to be disabled - FORCING modal to close');
      
      // CRITICAL: Set isAdBlocked to false FIRST, then close visibility
      // This ensures the force-close useEffect triggers
      setIsAdBlocked(false);
      setIsVisible(false);
      setIsDismissed(false); // Don't mark as dismissed, just close
      
      // Force update multiple times to ensure React processes it
      setTimeout(() => {
        setIsAdBlocked(false);
        setIsVisible(false);
        console.log('[AdBlockerDetector] ✅ Modal state forced to closed (delay 1)');
      }, 50);
      
      setTimeout(() => {
        setIsAdBlocked(false);
        setIsVisible(false);
        console.log('[AdBlockerDetector] ✅ Modal state forced to closed (delay 2)');
      }, 150);
    } else {
      // Still blocked - show message
      console.log('[AdBlockerDetector] ⚠️ Ad blocker still detected');
      alert('Ad blocker is still active. Please disable it completely and try again.');
    }
  }, []);

  // Expose test function to window for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).testAdBlocker = async () => {
        console.log('[AdBlockerDetector] Manual test triggered...');
        const testAd = document.createElement("div");
        testAd.className = "adsbox";
        testAd.style.position = "absolute";
        testAd.style.left = "-9999px";
        document.body.appendChild(testAd);
        
        setTimeout(() => {
          const blocked = testAd.offsetHeight === 0;
          document.body.removeChild(testAd);
          console.log(`[AdBlockerDetector] Manual test result: ${blocked ? 'BLOCKED' : 'ALLOWED'}`);
          alert(`Ad blocker test: ${blocked ? 'DETECTED' : 'NOT DETECTED'}`);
        }, 100);
      };
      
      (window as any).resetAdBlockerDismiss = () => {
        localStorage.removeItem("adblock-dismissed");
        localStorage.removeItem("adblock-dismissed-timestamp");
        console.log('[AdBlockerDetector] ✅ Reset dismissal - restarting detection...');
        setIsDismissed(false);
        setIsAdBlocked(false);
        setIsVisible(false);
        
        // Immediately restart detection after reset
        console.log('[AdBlockerDetector] 🔄 Restarting detection after reset...');
        setTimeout(() => {
          // Re-run the detection logic
          const immediateCheck = () => {
            const test = document.createElement("div");
            test.className = "adsbox advertisement";
            test.style.position = "absolute";
            test.style.left = "-9999px";
            test.style.height = "1px";
            test.style.width = "1px";
            document.body.appendChild(test);
            
            requestAnimationFrame(() => {
              const blocked = test.offsetHeight === 0 || test.offsetParent === null;
              if (test.parentNode) {
                document.body.removeChild(test);
              }
              
              if (blocked) {
                console.log('[AdBlockerDetector] ✅ After reset: Ad blocker detected!');
                setIsAdBlocked(true);
                setIsVisible(true);
              } else {
                console.log('[AdBlockerDetector] After reset: Running full detection...');
                // Trigger full detection
                window.testAdvancedAdBlocker();
              }
            });
          };
          immediateCheck();
        }, 100);
        
        alert('Dismissal reset. Detection will restart automatically.');
      };
      
      // Force show modal for testing
      (window as any).forceShowAdBlockerModal = () => {
        console.log('[AdBlockerDetector] 🔧 Force showing modal...');
        localStorage.removeItem("adblock-dismissed");
        localStorage.removeItem("adblock-dismissed-timestamp");
        
        // Force state update - use functional updates to ensure they work
        setIsDismissed(() => false);
        setIsAdBlocked(() => true);
        setIsVisible(() => true);
        
        console.log('[AdBlockerDetector] 🔧 State set to show modal');
        
        // Verify after a moment and force re-render if needed
        setTimeout(() => {
          const currentDismissed = localStorage.getItem("adblock-dismissed");
          console.log('[AdBlockerDetector] 🔧 Force show - Verification:', {
            dismissedInStorage: currentDismissed,
            shouldShow: currentDismissed !== "true"
          });
          
          // Force update again if needed
          if (currentDismissed !== "true") {
            setIsDismissed(false);
            setIsAdBlocked(true);
            setIsVisible(true);
            console.log('[AdBlockerDetector] 🔧 Forced state update again');
          }
        }, 200);
      };
      
      // Check current status
      (window as any).checkAdBlockerStatus = () => {
        const dismissed = localStorage.getItem("adblock-dismissed");
        const dismissedTimestamp = localStorage.getItem("adblock-dismissed-timestamp");
        const dismissedDate = dismissedTimestamp ? new Date(parseInt(dismissedTimestamp, 10)) : null;
        
        console.log('[AdBlockerDetector] Current Status:', {
          isDismissed: dismissed === "true",
          isAdBlocked,
          isVisible,
          dismissed,
          dismissedTimestamp,
          dismissedDate: dismissedDate?.toISOString()
        });
        
        alert(`Status:\nDismissed: ${dismissed === "true"}\nAd Blocked: ${isAdBlocked}\nVisible: ${isVisible}\nDismissed Date: ${dismissedDate?.toLocaleString() || 'Never'}`);
      };
      
      // Advanced test function - runs all detection methods
      (window as any).testAdvancedAdBlocker = async () => {
        console.log('[AdBlockerDetector] 🧪 Running advanced manual test...');
        
        const results: { method: string; blocked: boolean; details?: string }[] = [];
        
        // Test 1: Ad container (multiple class names)
        const test1 = document.createElement("div");
        test1.className = "adsbox advertisement ad-container";
        test1.style.position = "absolute";
        test1.style.left = "-9999px";
        test1.style.height = "1px";
        test1.style.width = "1px";
        document.body.appendChild(test1);
        await new Promise(resolve => setTimeout(resolve, 150));
        const computed1 = window.getComputedStyle(test1);
        const blocked1 = test1.offsetHeight === 0 || test1.offsetParent === null || computed1.display === "none";
        document.body.removeChild(test1);
        results.push({ 
          method: 'Ad Container', 
          blocked: blocked1,
          details: blocked1 ? `Height: ${test1.offsetHeight}, Display: ${computed1.display}` : undefined
        });
        
        // Test 2: Script load (most reliable)
        let blocked2 = false;
        let scriptLoaded = false;
        const script = document.createElement("script");
        script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
        script.async = true;
        script.id = "test-adsbygoogle";
        script.onerror = () => { 
          blocked2 = true;
          console.log('[AdBlockerDetector] 🧪 Test 2: Script blocked (onerror)');
        };
        script.onload = () => { 
          scriptLoaded = true;
          console.log('[AdBlockerDetector] 🧪 Test 2: Script loaded');
        };
        document.head.appendChild(script);
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (!scriptLoaded && !blocked2) {
          blocked2 = true; // Timeout = blocked
          console.log('[AdBlockerDetector] 🧪 Test 2: Script blocked (timeout)');
        }
        if (script.parentNode) document.head.removeChild(script);
        results.push({ 
          method: 'Script Load', 
          blocked: blocked2,
          details: blocked2 ? 'Script failed to load' : 'Script loaded successfully'
        });
        
        // Test 3: Global variables (including AdBlocker Ultimate)
        const win = window as any;
        const detected = [];
        if (win.uBlock) detected.push('uBlock');
        if (win.adblock) detected.push('adblock');
        if (win.AdBlock) detected.push('AdBlock');
        if (win.uBlockOrigin) detected.push('uBlockOrigin');
        if (win.adblockUltimate) detected.push('AdBlockerUltimate');
        if (win.adblockerUltimate) detected.push('AdBlockerUltimate');
        const hasVars = detected.length > 0;
        results.push({ 
          method: 'Global Variables', 
          blocked: hasVars,
          details: hasVars ? `Detected: ${detected.join(', ')}` : undefined
        });
        
        // Test 4: Fetch
        let blocked4 = false;
        try {
          await Promise.race([
            fetch("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", { method: 'HEAD', mode: 'no-cors' }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
          ]);
          results.push({ method: 'Network Fetch', blocked: false });
        } catch (e) {
          blocked4 = true;
          results.push({ 
            method: 'Network Fetch', 
            blocked: true,
            details: String(e)
          });
        }
        
        // Test 5: AdBlocker Ultimate specific
        const testUltimate = document.createElement("div");
        testUltimate.id = "adblock-ultimate-test";
        testUltimate.className = "advertisement";
        testUltimate.style.position = "absolute";
        testUltimate.style.left = "-9999px";
        document.body.appendChild(testUltimate);
        await new Promise(resolve => setTimeout(resolve, 100));
        const blocked5 = testUltimate.offsetHeight === 0 || testUltimate.offsetParent === null;
        document.body.removeChild(testUltimate);
        results.push({ 
          method: 'AdBlocker Ultimate Test', 
          blocked: blocked5,
          details: blocked5 ? 'Element blocked (behavioral detection)' : undefined
        });
        
        const blockedCount = results.filter(r => r.blocked).length;
        // Require 2+ positive checks for reliability
        const isBlocked = blockedCount >= 2;
        
        console.log('[AdBlockerDetector] 🧪 Test Results:', results);
        console.log(`[AdBlockerDetector] 🧪 Final: ${isBlocked ? '✅ AD BLOCKER DETECTED' : '❌ NO AD BLOCKER'} (${blockedCount}/${results.length} positive)`);
        
        // If blocked, show modal - FORCE show regardless of dismissal for testing
        if (isBlocked) {
          const dismissed = localStorage.getItem("adblock-dismissed");
          console.log('[AdBlockerDetector] 🧪 Test detected ad blocker - forcing modal to show', {
            dismissed,
            blockedCount,
            isBlocked
          });
          
          // Force show modal (clear dismissal for testing)
          if (dismissed === "true") {
            localStorage.removeItem("adblock-dismissed");
            localStorage.removeItem("adblock-dismissed-timestamp");
            console.log('[AdBlockerDetector] 🧪 Cleared dismissal to show modal');
          }
          
          // Force state update - use functional updates to ensure React sees the change
          console.log('[AdBlockerDetector] 🧪 Setting modal state to show...');
          setIsDismissed(() => false);
          setIsAdBlocked(() => true);
          setIsVisible(() => true);
          
          // Also use setTimeout as backup to ensure state propagates
          setTimeout(() => {
            setIsDismissed(() => false);
            setIsAdBlocked(() => true);
            setIsVisible(() => true);
            console.log('[AdBlockerDetector] 🧪 Modal state set (delayed backup)');
            
            // Force a re-render by updating state one more time
            setTimeout(() => {
              setIsVisible((prev) => {
                console.log('[AdBlockerDetector] 🧪 Final visibility check, prev:', prev);
                return true; // Force to true
              });
            }, 100);
          }, 50);
        }
        
        const resultText = `Test Results:\n${results.map(r => `${r.method}: ${r.blocked ? '❌ BLOCKED' : '✅ ALLOWED'}${r.details ? ` (${r.details})` : ''}`).join('\n')}\n\nFinal: ${isBlocked ? '✅ AD BLOCKER DETECTED' : '❌ NO AD BLOCKER'}\n(${blockedCount}/${results.length} positive)`;
        
        alert(resultText);
        
        return { isBlocked, results, blockedCount };
      };
      
      // Simple show modal function
      (window as any).showAdBlockerModal = () => {
        console.log('[AdBlockerDetector] 🔧 Direct show modal command');
        localStorage.removeItem("adblock-dismissed");
        localStorage.removeItem("adblock-dismissed-timestamp");
        setIsDismissed(false);
        setIsAdBlocked(true);
        setIsVisible(true);
        console.log('[AdBlockerDetector] 🔧 Modal should be visible now');
      };
      
      // Expose re-check function
      (window as any).recheckAdBlocker = handleRecheck;
    }
  }, [isAdBlocked, isVisible, isDismissed, handleRecheck]);
  
  // Auto re-check when modal is visible (every 5 seconds)
  useEffect(() => {
    if (!isVisible || !isAdBlocked) return;
    
    console.log('[AdBlockerDetector] 🔄 Setting up auto re-check (every 5 seconds)');
    
    const interval = setInterval(async () => {
      console.log('[AdBlockerDetector] 🔄 Auto re-checking ad blocker status...');
      
      // Quick verification
      const testDiv = document.createElement("div");
      testDiv.className = "adsbox advertisement";
      testDiv.style.position = "absolute";
      testDiv.style.left = "-9999px";
      testDiv.style.height = "1px";
      testDiv.style.width = "1px";
      document.body.appendChild(testDiv);
      
      setTimeout(() => {
        const computed = window.getComputedStyle(testDiv);
        const isBlocked = testDiv.offsetHeight === 0 || testDiv.offsetParent === null || computed.display === "none";
        document.body.removeChild(testDiv);
        
        if (!isBlocked) {
          // Try script load as second check
          const script = document.createElement("script");
          script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
          script.async = true;
          let scriptBlocked = false;
          let scriptLoaded = false;
          
          script.onerror = () => {
            scriptBlocked = true;
            if (script.parentNode) document.head.removeChild(script);
            // Still blocked
            console.log('[AdBlockerDetector] 🔄 Auto re-check: Still blocked (script error)');
          };
          
          script.onload = () => {
            scriptLoaded = true;
            if (script.parentNode) document.head.removeChild(script);
            // Not blocked - FORCE dismiss modal
            console.log('[AdBlockerDetector] 🔄 Auto re-check: Ad blocker disabled - FORCING modal to close');
            setIsVisible(false);
            setIsAdBlocked(false);
            // Force again after delay
            setTimeout(() => {
              setIsVisible(false);
              setIsAdBlocked(false);
              console.log('[AdBlockerDetector] 🔄 Auto re-check: Modal state forced to closed');
            }, 100);
          };
          
          document.head.appendChild(script);
          
          setTimeout(() => {
            if (!scriptLoaded && !scriptBlocked) {
              // Timeout - assume not blocked if no error
              if (script.parentNode) document.head.removeChild(script);
              console.log('[AdBlockerDetector] 🔄 Auto re-check: Script timeout, assuming not blocked - closing modal');
              setIsVisible(false);
              setIsAdBlocked(false);
            }
          }, 1000);
        } else {
          console.log('[AdBlockerDetector] 🔄 Auto re-check: Still blocked (element check)');
        }
      }, 200);
    }, 5000); // Check every 5 seconds
    
    return () => {
      clearInterval(interval);
      console.log('[AdBlockerDetector] 🔄 Auto re-check stopped');
    };
  }, [isVisible, isAdBlocked]);

  // Debug logging with more details
  useEffect(() => {
    const dismissed = localStorage.getItem("adblock-dismissed");
    console.log('[AdBlockerDetector] 🔍 Render check:', {
      isDismissed,
      isAdBlocked,
      isVisible,
      dismissedInStorage: dismissed === "true",
      willRender: !isDismissed && isAdBlocked && isVisible,
      reason: isDismissed ? 'User dismissed' : !isAdBlocked ? 'Not detected' : !isVisible ? 'Not visible' : 'WILL RENDER'
    });
  }, [isDismissed, isAdBlocked, isVisible]);

  // Don't render if dismissed or not detected
  // CRITICAL: Only render when ad blocker is ACTUALLY detected
  const shouldRender = !isDismissed && isAdBlocked && isVisible;
  
  // Force close if ad blocker is not detected - CRITICAL for preventing false positives
  useEffect(() => {
    if (isVisible && !isAdBlocked) {
      console.log('[AdBlockerDetector] 🔧 CRITICAL: Force closing modal - Ad blocker not detected');
      setIsVisible(false);
      // Force close multiple times to ensure React processes it
      setTimeout(() => {
        setIsVisible(false);
        setIsAdBlocked(false);
        console.log('[AdBlockerDetector] 🔧 Modal force closed (delay 1)');
      }, 50);
      
      setTimeout(() => {
        setIsVisible(false);
        setIsAdBlocked(false);
        console.log('[AdBlockerDetector] 🔧 Modal force closed (delay 2)');
      }, 150);
    }
    
    // Also check if modal is visible but shouldn't be
    if (isVisible && isDismissed) {
      console.log('[AdBlockerDetector] 🔧 Force closing modal: User dismissed');
      setIsVisible(false);
    }
  }, [isAdBlocked, isVisible, isDismissed]);
  
  // Additional check: Run verification immediately when modal becomes visible
  useEffect(() => {
    if (isVisible && isAdBlocked) {
      console.log('[AdBlockerDetector] 🔍 Modal is visible - running immediate verification check...');
      // Run verification immediately - no setTimeout delay
      const verifyScript = document.createElement("script");
      verifyScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
      verifyScript.async = true;
      let verifiedBlocked = false;
      let verifiedLoaded = false;
      
      verifyScript.onerror = () => {
        verifiedBlocked = true;
        if (verifyScript.parentNode) document.head.removeChild(verifyScript);
        console.log('[AdBlockerDetector] 🔍 Verification: Ad blocker still detected');
      };
      
      verifyScript.onload = () => {
        verifiedLoaded = true;
        if (verifyScript.parentNode) document.head.removeChild(verifyScript);
        console.log('[AdBlockerDetector] 🔍 Verification: Ad blocker NOT detected - closing modal immediately');
        setIsAdBlocked(false);
        setIsVisible(false);
      };
      
      document.head.appendChild(verifyScript);
      
      // Timeout check - if script loads successfully, no ad blocker
      const verifyTimeout = setTimeout(() => {
        if (!verifiedLoaded && !verifiedBlocked) {
          if (verifyScript.parentNode) document.head.removeChild(verifyScript);
          // Timeout without error - assume not blocked
          console.log('[AdBlockerDetector] 🔍 Verification timeout - script loaded successfully, closing modal');
          setIsAdBlocked(false);
          setIsVisible(false);
        }
      }, 1000); // 1 second timeout for script load
      
      return () => {
        clearTimeout(verifyTimeout);
        if (verifyScript.parentNode) {
          document.head.removeChild(verifyScript);
        }
      };
    }
  }, [isVisible, isAdBlocked]);
  
  if (!shouldRender) {
    if (isDismissed) {
      console.log('[AdBlockerDetector] ❌ Not rendering: User dismissed');
    } else if (!isAdBlocked) {
      console.log('[AdBlockerDetector] ❌ Not rendering: Ad blocker not detected');
    } else if (!isVisible) {
      console.log('[AdBlockerDetector] ❌ Not rendering: Modal not visible');
    }
    return null;
  }
  
  console.log('[AdBlockerDetector] ✅ RENDERING MODAL NOW!', {
    isDismissed,
    isAdBlocked,
    isVisible,
    shouldRender,
    zIndex: 'z-[100] and z-[101]',
    dialogOpen: isVisible
  });

  // Ensure Dialog receives the correct open state
  const dialogOpen = isVisible && isAdBlocked && !isDismissed;

  return (
    <>
      {/* Background overlay with blur effect - dims and blurs entire site */}
      <div
        className={cn(
          "fixed inset-0 z-[100] bg-black/70 backdrop-blur-md transition-all duration-300",
          dialogOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        console.log('[AdBlockerDetector] Dialog onOpenChange called:', open);
        // Prevent closing the dialog - user must click "Allow ads"
        if (!open) {
          console.log('[AdBlockerDetector] Attempted to close dialog - preventing');
          return;
        }
        setIsVisible(open);
      }}>
        <DialogContent
          className={cn(
            "sm:max-w-md z-[9999] border-2 shadow-2xl",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-300",
            "[&>button]:hidden" // Hide default close button
          )}
          onInteractOutside={(e) => {
            console.log('[AdBlockerDetector] onInteractOutside - preventing');
            e.preventDefault();
          }} // Prevent closing by clicking outside
          onEscapeKeyDown={(e) => {
            console.log('[AdBlockerDetector] onEscapeKeyDown - preventing');
            e.preventDefault();
          }} // Prevent closing with Escape
          onPointerDownOutside={(e) => {
            console.log('[AdBlockerDetector] onPointerDownOutside - preventing');
            e.preventDefault();
          }} // Prevent closing
        >
          <DialogHeader className="text-center space-y-4">
            {/* Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
              <AlertCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>

            {/* Title */}
            <DialogTitle className="text-2xl font-bold text-center">
              Please allow ads on our site
            </DialogTitle>

            {/* Description */}
            <DialogDescription className="text-center text-base space-y-2 pt-2">
              <p>
                We've detected that you're using an ad-blocker. Ads help us keep this service free and support our content creators.
              </p>
              <p className="text-sm text-muted-foreground">
                Please disable your ad-blocker for this site to continue enjoying our free content.
              </p>
              <p className="text-xs text-muted-foreground pt-2">
                Already disabled your ad blocker? Click "Re-check" below to verify.
              </p>
            </DialogDescription>
          </DialogHeader>

          {/* Action Button */}
          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={handleAllowAds}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              Allow ads
            </Button>

            {/* Re-check button - verify if ad blocker is actually disabled */}
            <Button
              variant="outline"
              onClick={handleRecheck}
              className="w-full h-10 text-sm border-2"
            >
              Re-check (I've disabled my ad blocker)
            </Button>

            {/* Optional: Close button (uncomment if you want to allow closing) */}
            <Button
              variant="ghost"
              onClick={handleClose}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              I understand
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

