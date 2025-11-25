import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Ad {
  id: number;
  title: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  targetUrl: string;
  placement: string;
  status: "active" | "inactive";
}

// Demo custom ads - in production, this would come from API
// This simulates ads from admin panel
// When admin adds custom ads via admin panel, they will appear here
// For now, empty array means no custom ads, so Adsterra will show
const demoCustomAds: Ad[] = [
  // Example custom ads (uncomment to test):
  // {
  //   id: 1,
  //   title: "Special Offer - 50% Off",
  //   mediaUrl: "https://via.placeholder.com/728x90/4F46E5/FFFFFF?text=Special+Offer",
  //   mediaType: "image",
  //   targetUrl: "https://example.com/offer",
  //   placement: "Header",
  //   status: "active",
  // },
  // {
  //   id: 2,
  //   title: "New Product Launch",
  //   mediaUrl: "https://via.placeholder.com/728x90/10B981/FFFFFF?text=New+Product",
  //   mediaType: "image",
  //   targetUrl: "https://example.com/product",
  //   placement: "Header",
  //   status: "active",
  // },
];

// Adsterra direct links
const adsterraLinks = [
  "https://www.effectivegatecpm.com/hfy73qcy?key=e260bfac004e18965e13c7172696c1a3",
  "https://www.effectivegatecpm.com/ywhsa6yivz?key=bfec6a8bc15be21a9df294ff59815f8a",
  "https://www.effectivegatecpm.com/nt1fr8zua?key=ac0794fdc21673207b81cbf11e48786d",
  "https://www.effectivegatecpm.com/kbak28mme?key=4490d0846ff38b21b8e203adba4ee1e7",
  "https://www.effectivegatecpm.com/tjdzfszkgx?key=0857d1051a4e330c49332d384e8c7224",
  "https://www.effectivegatecpm.com/zm78tt82?key=8e75e688fb529c7e4e19b4023efde58a",
  "https://www.effectivegatecpm.com/xwkce5cqb5?key=a51fb8ac1e251487604903a450df3022",
  "https://www.effectivegatecpm.com/yjsx8070?key=d8d1ec71150dc79a9a16cfb5b6933aa6",
  "https://www.effectivegatecpm.com/yah4ti7k5?key=a021f0d4f330e7dd684090beb79fca53",
  "https://www.effectivegatecpm.com/ta0phpns?key=b5968cffaeae3f4ba4cc1b8d9f04627a",
  "https://www.effectivegatecpm.com/zzp52zmx?key=8f7d2827bbc3ed2e669873b5a864c6f9",
  "https://www.effectivegatecpm.com/pahd2aakkt?key=29cea4f7e122e7206cc4d7e17343fdc6",
  "https://www.effectivegatecpm.com/vvumg5fqg2?key=1cb75527f5edcd5929e57a06e1d27df6",
  "https://www.effectivegatecpm.com/byxrhrg3?key=c3543a8bba23c39fe33fc01d1ed4d260",
  "https://www.effectivegatecpm.com/ui2r75xv?key=8a6fef106b36cb213591cff574c778e2",
  "https://www.effectivegatecpm.com/msrc48a3?key=448ee3d229c4064ce805ee282a71254a",
  "https://www.effectivegatecpm.com/ycz1ni72n4?key=c807520bd1ea3746dc694effb2d3eebb",
  "https://www.effectivegatecpm.com/a51535dr?key=66e6ad1660b40bb8f64c42887ec8ebb4",
  "https://www.effectivegatecpm.com/b10fnb3rd?key=f923d62d96f4719b7797e881a42b8fb0",
  "https://www.effectivegatecpm.com/pmapdftgc?key=39235e43e4d81ee4fe645e7c24b48b1b",
];

export default function AdsSlider() {
  const location = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [adsterraIndex, setAdsterraIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [customAds, setCustomAds] = useState<Ad[]>([]);
  const [showAdsterra, setShowAdsterra] = useState(false);

  // CRITICAL: Only show ads on home page (/) to prevent history manipulation
  // Ads on other pages can interfere with back button navigation
  const isHomePage = location.pathname === '/';

  // Filter active custom ads with Header placement
  useEffect(() => {
    const activeHeaderAds = demoCustomAds.filter(
      (ad) => ad.status === "active" && ad.placement === "Header"
    );
    setCustomAds(activeHeaderAds);
    
    // Show Adsterra only if no custom ads AND we're on home page
    setShowAdsterra(activeHeaderAds.length === 0 && isHomePage);
  }, [isHomePage]);

  // Auto-rotate custom ads
  useEffect(() => {
    if (customAds.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % customAds.length);
    }, 5000); // Change ad every 5 seconds

    return () => clearInterval(interval);
  }, [customAds.length]);

  // Auto-rotate Adsterra ads
  useEffect(() => {
    if (!showAdsterra || adsterraLinks.length <= 1) return;
    
    const interval = setInterval(() => {
      setAdsterraIndex((prev) => (prev + 1) % adsterraLinks.length);
    }, 5000); // Change ad every 5 seconds

    return () => clearInterval(interval);
  }, [showAdsterra]);

  // CRITICAL: Don't show ads on pages other than home page
  // This prevents ad scripts from manipulating browser history
  if (!isHomePage) {
    return null;
  }

  // Don't show anything if closed
  if (!isVisible) {
    return null;
  }

  // Show Adsterra ads when no custom ads
  if (showAdsterra || customAds.length === 0) {
    const currentAdsterraLink = adsterraLinks[adsterraIndex];
    
    return (
      <div className="w-full bg-slate-100 dark:bg-slate-900 border-b border-border">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-center h-16 sm:h-20 md:h-24 relative">
            {/* Close Button */}
            <button
              onClick={() => setIsVisible(false)}
              className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
              aria-label="Close ad"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            </button>

            {/* Navigation Buttons for Adsterra */}
            {adsterraLinks.length > 1 && (
              <>
                <button
                  onClick={() => setAdsterraIndex((prev) => (prev - 1 + adsterraLinks.length) % adsterraLinks.length)}
                  className="absolute left-2 sm:left-4 z-10 p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors touch-manipulation"
                  aria-label="Previous ad"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                </button>
                <button
                  onClick={() => setAdsterraIndex((prev) => (prev + 1) % adsterraLinks.length)}
                  className="absolute right-2 sm:right-4 z-10 p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors touch-manipulation"
                  aria-label="Next ad"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                </button>
              </>
            )}

                {/* Adsterra Ad */}
                <div className="w-full max-w-4xl h-full rounded-lg overflow-hidden">
                  <iframe
                    src={currentAdsterraLink}
                    className="w-full h-full border-0"
                    title="Adsterra Ad"
                    scrolling="no"
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
                    allow="autoplay; clipboard-read; clipboard-write; display-capture"
                    style={{ pointerEvents: 'auto' }}
                  />
                </div>

            {/* Dots Indicator for Adsterra */}
            {adsterraLinks.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {adsterraLinks.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setAdsterraIndex(index)}
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                      index === adsterraIndex
                        ? "bg-primary w-4 sm:w-6"
                        : "bg-slate-400 dark:bg-slate-600"
                    }`}
                    aria-label={`Go to ad ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentAd = customAds[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + customAds.length) % customAds.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % customAds.length);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <div className="w-full bg-slate-100 dark:bg-slate-900 border-b border-border relative">
      <div className="container mx-auto px-4 py-2">
        <div className="relative flex items-center justify-center h-16 sm:h-20 md:h-24">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
            aria-label="Close ad"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          </button>

          {/* Navigation Buttons */}
          {customAds.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-2 sm:left-4 z-10 p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors touch-manipulation"
                aria-label="Previous ad"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 sm:right-4 z-10 p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors touch-manipulation"
                aria-label="Next ad"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </button>
            </>
          )}

          {/* Ad Content */}
          <a
            href={currentAd.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full max-w-4xl h-full rounded-lg overflow-hidden relative group"
          >
            {currentAd.mediaType === "video" ? (
              <video
                src={currentAd.mediaUrl}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img
                src={currentAd.mediaUrl}
                alt={currentAd.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            )}
          </a>

          {/* Dots Indicator */}
          {customAds.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {customAds.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? "bg-primary w-4 sm:w-6"
                      : "bg-slate-400 dark:bg-slate-600"
                  }`}
                  aria-label={`Go to ad ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

