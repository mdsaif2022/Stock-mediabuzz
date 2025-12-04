import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Ad-blocker detection component
 * Detects ad-blockers and shows a modal pop-up when detected
 */
export default function AdBlockerDetector() {
  const [isAdBlocked, setIsAdBlocked] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed the ad-blocker warning
    const dismissed = localStorage.getItem("adblock-dismissed");
    if (dismissed === "true") {
      setIsDismissed(true);
      return;
    }

    // Multiple detection methods for reliability across all browsers and ad-blockers
    const detectAdBlocker = (): Promise<boolean> => {
      return new Promise((resolve) => {
        let detectedCount = 0;
        const checks: boolean[] = [];

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
          const isBlocked = 
            testAd.offsetHeight === 0 || 
            testAd.offsetParent === null ||
            testAd.style.display === "none" ||
            testAd.style.visibility === "hidden" ||
            window.getComputedStyle(testAd).display === "none";
          
          if (testAd.parentNode) {
            document.body.removeChild(testAd);
          }
          
          checks.push(isBlocked);
          if (isBlocked) detectedCount++;
          checkResults();
        }, 150);

        // Method 2: Check for blocked ad script
        const adScript = document.createElement("script");
        adScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
        adScript.async = true;
        adScript.id = "adsbygoogle-test";
        
        let scriptTimeout: NodeJS.Timeout;
        adScript.onerror = () => {
          clearTimeout(scriptTimeout);
          checks.push(true);
          detectedCount++;
          checkResults();
        };
        
        adScript.onload = () => {
          clearTimeout(scriptTimeout);
          checks.push(false);
          checkResults();
        };
        
        document.head.appendChild(adScript);
        
        // Timeout: if script doesn't load in 2 seconds, likely blocked
        scriptTimeout = setTimeout(() => {
          if (adScript.parentNode) {
            document.head.removeChild(adScript);
          }
          checks.push(true);
          detectedCount++;
          checkResults();
        }, 2000);

        // Method 3: Check for blocked ad network fetch
        fetch("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", {
          method: "HEAD",
          mode: "no-cors",
        })
          .catch(() => {
            checks.push(true);
            detectedCount++;
            checkResults();
          })
          .then(() => {
            checks.push(false);
            checkResults();
          });

        // Method 4: Check for common ad-blocker global variables
        try {
          const hasAdBlocker = 
            !!(window as any).uBlock || 
            !!(window as any).adblock || 
            !!(window as any).AdBlock ||
            !!(window as any).uBlockOrigin ||
            !!(window as any).AdblockPlus;
          
          checks.push(hasAdBlocker);
          if (hasAdBlocker) detectedCount++;
          checkResults();
        } catch (e) {
          checks.push(false);
          checkResults();
        }

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
            if (!iframeDoc) {
              checks.push(true);
              detectedCount++;
            } else {
              checks.push(false);
            }
          } catch (e) {
            checks.push(true);
            detectedCount++;
          }
          checkResults();
        };
        
        testIframe.onerror = () => {
          clearTimeout(iframeTimeout);
          checks.push(true);
          detectedCount++;
          checkResults();
        };
        
        document.body.appendChild(testIframe);
        
        iframeTimeout = setTimeout(() => {
          if (testIframe.parentNode) {
            document.body.removeChild(testIframe);
          }
          checks.push(true);
          detectedCount++;
          checkResults();
        }, 1500);

        function checkResults() {
          // If we have at least 2 checks indicating ad-blocker, consider it detected
          // This makes detection more reliable (not just one false positive)
          if (checks.length >= 3) {
            const positiveChecks = checks.filter(Boolean).length;
            // If 2 or more methods detect ad-blocker, it's likely true
            resolve(positiveChecks >= 2 || detectedCount >= 2);
          }
        }
      });
    };

    // Run detection after DOM is ready
    const timer = setTimeout(async () => {
      const blocked = await detectAdBlocker();
      
      if (blocked) {
        setIsAdBlocked(true);
        setIsVisible(true);
      }
    }, 1500);

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
    setIsVisible(false);
    setIsDismissed(true);
    // Store dismissal in localStorage (optional - remove if you want it to show every time)
    localStorage.setItem("adblock-dismissed", "true");
  };

  const handleClose = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem("adblock-dismissed", "true");
  };

  // Don't render if dismissed or not detected
  if (isDismissed || !isAdBlocked || !isVisible) {
    return null;
  }

  return (
    <>
      {/* Background overlay with blur effect - dims and blurs entire site */}
      <div
        className={cn(
          "fixed inset-0 z-[100] bg-black/70 backdrop-blur-md transition-all duration-300",
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <Dialog open={isVisible} onOpenChange={(open) => {
        // Prevent closing the dialog - user must click "Allow ads"
        if (!open) {
          return;
        }
        setIsVisible(open);
      }}>
        <DialogContent
          className={cn(
            "sm:max-w-md z-[101] border-2 shadow-2xl",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-300",
            "[&>button]:hidden" // Hide default close button
          )}
          onInteractOutside={(e) => e.preventDefault()} // Prevent closing by clicking outside
          onEscapeKeyDown={(e) => e.preventDefault()} // Prevent closing with Escape
          onPointerDownOutside={(e) => e.preventDefault()} // Prevent closing
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

