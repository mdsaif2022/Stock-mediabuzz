import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { PopupAd as PopupAdType } from "@shared/api";
import { apiFetch } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PopupAd() {
  const location = useLocation();
  const [ads, setAds] = useState<PopupAdType[]>([]);
  const [currentAd, setCurrentAd] = useState<PopupAdType | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const impressionTracked = useRef(false);
  const autoCloseTimer = useRef<NodeJS.Timeout | null>(null);
  const showTimer = useRef<NodeJS.Timeout | null>(null);

  // Get storage key for tracking ad displays
  const getAdDisplayKey = (adId: string) => `popup_ad_displays_${adId}`;
  const getAdImpressionKey = (adId: string) => `popup_ad_impression_${adId}`;

  // Fetch ads for current route
  useEffect(() => {
    const fetchAds = async () => {
      try {
        setIsLoading(true);
        const response = await apiFetch(`/api/popup-ads?route=${encodeURIComponent(location.pathname)}`);
        const data = await response.json();
        const activeAds = (data.data || []).filter((ad: PopupAdType) => ad.isActive);
        setAds(activeAds);
      } catch (error) {
        console.error("Error fetching pop-up ads:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAds();
  }, [location.pathname]);

  // Select and show an ad
  useEffect(() => {
    // Clear any existing timers
    if (showTimer.current) {
      clearTimeout(showTimer.current);
      showTimer.current = null;
    }
    if (autoCloseTimer.current) {
      clearTimeout(autoCloseTimer.current);
      autoCloseTimer.current = null;
    }

    if (isLoading || ads.length === 0) {
      return;
    }

    // Find an ad that hasn't exceeded maxDisplays
    const availableAd = ads.find((ad) => {
      if (!ad.maxDisplays) return true; // No limit

      const displayKey = getAdDisplayKey(ad.id);
      const displayCount = parseInt(localStorage.getItem(displayKey) || "0", 10);
      return displayCount < ad.maxDisplays;
    });

    if (!availableAd) {
      return; // No available ads
    }

    // Check if we've already shown an impression for this ad on this route
    const impressionKey = getAdImpressionKey(availableAd.id);
    const lastImpression = localStorage.getItem(impressionKey);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000; // 1 hour

    // Don't show if we showed it in the last hour on this route
    if (lastImpression && now - parseInt(lastImpression, 10) < oneHour) {
      return;
    }

    // Set show delay
    const delay = availableAd.showDelay || 2000;
    showTimer.current = setTimeout(() => {
      setCurrentAd(availableAd);
      setIsOpen(true);
      impressionTracked.current = false;
    }, delay);

    // Set auto-close timer if configured
    if (availableAd.closeAfter) {
      autoCloseTimer.current = setTimeout(() => {
        handleClose();
      }, delay + availableAd.closeAfter);
    }

    return () => {
      if (showTimer.current) {
        clearTimeout(showTimer.current);
      }
      if (autoCloseTimer.current) {
        clearTimeout(autoCloseTimer.current);
      }
    };
  }, [ads, isLoading, location.pathname]);

  // Track impression when ad opens
  useEffect(() => {
    if (isOpen && currentAd && !impressionTracked.current) {
      trackImpression(currentAd.id);
      impressionTracked.current = true;

      // Update display count
      if (currentAd.maxDisplays) {
        const displayKey = getAdDisplayKey(currentAd.id);
        const currentCount = parseInt(localStorage.getItem(displayKey) || "0", 10);
        localStorage.setItem(displayKey, (currentCount + 1).toString());

        // Store impression timestamp
        const impressionKey = getAdImpressionKey(currentAd.id);
        localStorage.setItem(impressionKey, Date.now().toString());
      }
    }
  }, [isOpen, currentAd]);

  const trackImpression = async (adId: string) => {
    try {
      await apiFetch(`/api/popup-ads/${adId}/impression`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error tracking impression:", error);
    }
  };

  const trackClick = async (adId: string) => {
    try {
      await apiFetch(`/api/popup-ads/${adId}/click`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error tracking click:", error);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (autoCloseTimer.current) {
      clearTimeout(autoCloseTimer.current);
      autoCloseTimer.current = null;
    }
    // Clear current ad after animation
    setTimeout(() => {
      setCurrentAd(null);
    }, 200);
  };

  const handleButtonClick = () => {
    if (currentAd) {
      trackClick(currentAd.id);
      if (currentAd.buttonLink) {
        window.open(currentAd.buttonLink, "_blank", "noopener,noreferrer");
      }
      handleClose();
    }
  };

  const handleMediaClick = () => {
    if (currentAd?.buttonLink) {
      handleButtonClick();
    }
  };

  if (!currentAd || isLoading) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className={cn(
          "max-w-md sm:max-w-lg p-0 overflow-hidden",
          "sm:rounded-xl",
          "max-h-[90vh] flex flex-col"
        )}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={handleClose}
      >
        <div className="relative flex flex-col max-h-[90vh]">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 z-50 rounded-full bg-black/60 hover:bg-black/80 text-white p-1.5 transition-colors shadow-lg"
            aria-label="Close ad"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Media Content */}
          <div
            className={cn(
              "relative w-full overflow-hidden",
              "flex items-center justify-center",
              currentAd.mediaType === "video" 
                ? "max-h-[50vh] aspect-video bg-black" 
                : "max-h-[60vh] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800"
            )}
            onClick={handleMediaClick}
          >
            {currentAd.mediaType === "video" ? (
              <video
                src={currentAd.mediaUrl}
                className="w-full h-full max-w-full max-h-full object-contain select-none"
                autoPlay
                muted
                loop
                playsInline
                controls={false}
                controlsList="nodownload noplaybackrate nopictureinpicture"
                disablePictureInPicture
                style={{
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  WebkitTouchCallout: "none",
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }}
              />
            ) : (
              <img
                src={currentAd.mediaUrl}
                alt={currentAd.title}
                className="w-full h-auto max-w-full max-h-full object-contain"
                onClick={currentAd.buttonLink ? handleMediaClick : undefined}
                style={{ 
                  cursor: currentAd.buttonLink ? "pointer" : "default",
                  maxHeight: "60vh"
                }}
              />
            )}
          </div>

          {/* Ad Info Section */}
          {(currentAd.title || currentAd.description || currentAd.buttonText) && (
            <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-border flex-shrink-0">
              {currentAd.title && (
                <DialogHeader className="space-y-2">
                  <DialogTitle className="text-left text-lg font-bold leading-tight">
                    {currentAd.title}
                  </DialogTitle>
                  {currentAd.description && (
                    <DialogDescription className="text-left text-sm text-muted-foreground">
                      {currentAd.description}
                    </DialogDescription>
                  )}
                </DialogHeader>
              )}
              {currentAd.buttonText && currentAd.buttonLink && (
                <div className="mt-4">
                  <Button
                    onClick={handleButtonClick}
                    className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 font-medium"
                    size="default"
                  >
                    {currentAd.buttonText}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

