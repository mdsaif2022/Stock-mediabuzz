import { useState, useEffect, useRef, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { Ad, StartAdWatchResponse, CompleteAdWatchResponse } from "@shared/api";
import { Play, Clock, Coins, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function AdEarnings() {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [ads, setAds] = useState<Ad[]>([]);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [watchId, setWatchId] = useState<string | null>(null);
  const [watchDuration, setWatchDuration] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingWatch, setStartingWatch] = useState(false);
  const [completingWatch, setCompletingWatch] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(0);
  const [todayCoinsEarned, setTodayCoinsEarned] = useState(0);
  const [adClicked, setAdClicked] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const clickTrackedRef = useRef(false);
  const handleCompleteWatchRef = useRef<() => Promise<void>>();

  const REQUIRED_DURATION = 15; // 15 seconds
  const FIXED_AD_COINS = 50;

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate("/login");
      return;
    }
    if (currentUser) {
      fetchAds();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, currentUser, navigate]);

  useEffect(() => {
    if (!isWatching) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Don't start timer if already completed
    if (watchDuration >= REQUIRED_DURATION) {
      return;
    }

    const intervalId = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setWatchDuration(elapsed);
        
        if (elapsed >= REQUIRED_DURATION) {
          // Auto-complete when 15 seconds reached (but check click requirement for Adsterra)
          if (selectedAd?.adType === "adsterra" && !adClicked) {
            // Don't auto-complete if Adsterra ad and not clicked - wait for click
            return;
          }
          // Complete the watch
          handleCompleteWatchRef.current?.();
        }
      }
    }, 1000);

    timerRef.current = intervalId;

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWatching, watchDuration, selectedAd?.adType, adClicked]);

  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch("/api/ads");
      const contentType = response.headers.get("content-type") || "";
      
      // Try to parse JSON only when server returns JSON
      let data: any = null;
      if (contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (parseError) {
          console.error("[AdEarnings] Failed to parse JSON response:", parseError);
          throw new Error("Ads service temporarily unavailable. Please try again later.");
        }
      } else {
        const text = await response.text().catch(() => "");
        console.warn("[AdEarnings] Non-JSON response from server:", {
          status: response.status,
          contentType,
          snippet: text.slice(0, 200),
        });
        throw new Error("Ads service temporarily unavailable. Please try again later.");
      }
      
      // Check if response has an error message
      if (data.error) {
        console.warn("[AdEarnings] Server returned error:", data.error);
        // Still set the data if available (server might return ads even with error)
        setAds(data.data || []);
        setDailyCount(data.dailyCount || 0);
        setDailyLimit(data.dailyLimit || 0);
        setTodayCoinsEarned(data.todayCoinsEarned || 0);
        
        // Only show error if no ads are available
        if (!data.data || data.data.length === 0) {
          setError(data.error || "Failed to load ads");
        }
      } else if (!response.ok) {
        // Non-200 status but valid JSON - show error if no data
        if (!data.data || data.data.length === 0) {
          setError(data.error || "Failed to fetch ads");
        }
        setAds(data.data || []);
        setDailyCount(data.dailyCount || 0);
        setDailyLimit(data.dailyLimit || 0);
        setTodayCoinsEarned(data.todayCoinsEarned || 0);
      } else {
        // Success
        console.log("[AdEarnings] Fetched ads data:", {
          adsCount: data.data?.length || 0,
          dailyCount: data.dailyCount,
          todayCoinsEarned: data.todayCoinsEarned,
          fullData: data
        });
        setAds(data.data || []);
        setDailyCount(data.dailyCount || 0);
        setDailyLimit(data.dailyLimit || 0);
        setTodayCoinsEarned(data.todayCoinsEarned || 0);
      }
    } catch (error: any) {
      console.error("[AdEarnings] Failed to fetch ads:", error);
      setError(error.message || "Failed to load ads. Please check your connection and try again.");
      // Set empty arrays to prevent crashes
      setAds([]);
      setDailyCount(0);
      setDailyLimit(0);
      setTodayCoinsEarned(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const resetWatch = useCallback(() => {
    setIsWatching(false);
    setIsCompleted(false);
    setWatchDuration(0);
    setWatchId(null);
    setSelectedAd(null);
    setCoinsEarned(0);
    setAdClicked(false);
    clickTrackedRef.current = false;
    startTimeRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleStartWatch = async (ad: Ad) => {
    try {
      setStartingWatch(true);
      setError(null);
      setSelectedAd(ad);
      setWatchDuration(0);
      setIsCompleted(false);
      setCoinsEarned(0);
      setAdClicked(false);
      clickTrackedRef.current = false;

      const response = await apiFetch("/api/ads/watch/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId: ad.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start ad watch");
      }

      const data: StartAdWatchResponse = await response.json();
      setWatchId(data.watchId);
      setIsWatching(true);
      startTimeRef.current = Date.now();
      
      // Track clicks for Adsterra ads
      if (ad.adType === "adsterra" && iframeRef.current) {
        const iframe = iframeRef.current;
        const handleClick = () => {
          if (!clickTrackedRef.current) {
            setAdClicked(true);
            clickTrackedRef.current = true;
            // Remove listener after first click
            iframe.contentWindow?.removeEventListener('click', handleClick);
          }
        };
        
        // Try to track clicks in iframe (may be blocked by CORS)
        try {
          iframe.contentWindow?.addEventListener('click', handleClick);
        } catch (e) {
          // CORS may block this, so we'll use a manual click button
        }
      }
    } catch (error: any) {
      console.error("Failed to start ad watch:", error);
      setError(error.message || "Failed to start watching ad");
      setSelectedAd(null);
    } finally {
      setStartingWatch(false);
    }
  };

  const handleCompleteWatch = useCallback(async () => {
    if (!watchId || !selectedAd) return;

    try {
      setCompletingWatch(true);
      setIsWatching(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Calculate actual elapsed time from start time to ensure accuracy
      const actualElapsed = startTimeRef.current 
        ? Math.max(watchDuration, Math.floor((Date.now() - startTimeRef.current) / 1000))
        : watchDuration;
      
      console.log(`[Frontend] Completing watch - watchDuration: ${watchDuration}, actualElapsed: ${actualElapsed}, clicked: ${adClicked}`);
      
      const response = await apiFetch("/api/ads/watch/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          watchId,
          watchDuration: actualElapsed, // Send the actual elapsed time
          clicked: selectedAd.adType === "adsterra" ? adClicked : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to complete ad watch");
      }

      const data: CompleteAdWatchResponse = await response.json();
      setIsCompleted(true);
      setCoinsEarned(data.coinsEarned);
      
      // Reset after showing result
      setTimeout(() => {
        resetWatch();
        fetchAds(); // Refresh ads and daily count
      }, 3000);
    } catch (error: any) {
      console.error("Failed to complete ad watch:", error);
      setError(error.message || "Failed to complete ad watch");
      resetWatch();
    } finally {
      setCompletingWatch(false);
    }
  }, [watchId, selectedAd, watchDuration, adClicked, resetWatch, fetchAds]);

  // Store latest version in ref
  useEffect(() => {
    handleCompleteWatchRef.current = handleCompleteWatch;
  }, [handleCompleteWatch]);

  const handleManualClick = () => {
    if (selectedAd?.adType === "adsterra" && !clickTrackedRef.current) {
      setAdClicked(true);
      clickTrackedRef.current = true;
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!currentUser) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground mb-4">Please log in to watch ads and earn coins.</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Watch Ads & Earn Coins</h1>
          <p className="text-muted-foreground mb-4">
            Watch ads for 15 seconds to earn coins. You must watch the full duration to earn coins.
          </p>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="bg-card border border-border rounded-lg px-4 py-2">
              <span className="text-muted-foreground">Daily Limit: </span>
              {dailyLimit === 0 ? (
                <span className="font-semibold text-primary">Unlimited</span>
              ) : (
                <span className={cn(
                  "font-semibold",
                  dailyCount >= dailyLimit ? "text-red-600 dark:text-red-400" : "text-primary"
                )}>
                  {dailyCount} / {dailyLimit} ads
                </span>
              )}
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-2 border-yellow-300 dark:border-yellow-600 rounded-lg px-4 py-2 flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <span className="text-xs text-muted-foreground block">Today's Total Earned</span>
                <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                  {todayCoinsEarned.toLocaleString()} coins
                </span>
              </div>
            </div>
            {dailyLimit > 0 && dailyCount >= dailyLimit && (
              <div className="text-red-600 dark:text-red-400 font-semibold">
                Daily limit reached! Come back tomorrow.
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
            <p className="font-semibold mb-1">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {isCompleted && (
          <div className="mb-6 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-3">
              {coinsEarned > 0 ? (
                <>
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-200">
                      Congratulations! You earned {coinsEarned} coins!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Coins have been added to your account.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="font-semibold text-red-800 dark:text-red-200">
                      You need to watch for at least {REQUIRED_DURATION} seconds to earn coins.
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      You watched for {watchDuration} seconds.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {selectedAd && isWatching && (
          <div className="mb-6 bg-card border border-border rounded-lg p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">{selectedAd.title}</h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="font-semibold">
                    {watchDuration} / {REQUIRED_DURATION} seconds
                  </span>
                </div>
                <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((watchDuration / REQUIRED_DURATION) * 100, 100)}%` }}
                  />
                </div>
              </div>
              {selectedAd.adType === "adsterra" && (
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    "px-3 py-1 rounded-full text-sm font-semibold",
                    adClicked 
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  )}>
                    {adClicked ? "✓ Clicked" : "⚠ Click required"}
                  </div>
                </div>
              )}
            </div>
            
            <div className="border border-border rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900 relative">
              <iframe
                ref={iframeRef}
                src={selectedAd.adUrl}
                className="w-full h-96"
                title={selectedAd.title}
                allow="autoplay; fullscreen"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
              {selectedAd.adType === "adsterra" && !adClicked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                  <button
                    onClick={handleManualClick}
                    className="pointer-events-auto px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 shadow-lg"
                  >
                    Click Here to Interact with Ad
                  </button>
                </div>
              )}
            </div>
            
            <p className="mt-4 text-sm text-muted-foreground text-center">
              {selectedAd.adType === "adsterra" ? (
                <>
                  Keep watching for {REQUIRED_DURATION - watchDuration} more seconds {!adClicked && "and click once in the ad"} to earn coins...
                </>
              ) : (
                <>
                  Keep watching for {REQUIRED_DURATION - watchDuration} more seconds to earn coins...
                </>
              )}
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : ads.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground">No ads available at the moment. Please check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ads.map((ad) => (
              <div
                key={ad.id}
                className={cn(
                  "bg-card border border-border rounded-lg p-6",
                  selectedAd?.id === ad.id && isWatching && "ring-2 ring-primary"
                )}
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">{ad.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs",
                      ad.adType === "adsterra" 
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                    )}>
                      {ad.adType === "adsterra" ? "Adsterra" : "Collaboration"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <span>{FIXED_AD_COINS} coins</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{ad.watchDuration}s</span>
                    </div>
                    {ad.adType === "adsterra" && (
                      <div className="text-xs text-muted-foreground">
                        + Click required
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedAd?.id === ad.id && isWatching ? (
                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground">Watching in progress...</p>
                  </div>
                ) : ad.isWatched ? (
                  <div className="text-center py-2">
                    <div className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-border">
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Already Watched</p>
                      <p className="text-xs text-muted-foreground">Try again after 30 Minutes</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartWatch(ad)}
                    disabled={startingWatch || isWatching || (dailyLimit > 0 && dailyCount >= dailyLimit) || !ad.canWatch}
                    className={cn(
                      "w-full px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2",
                      "bg-primary text-primary-foreground hover:bg-primary/90",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {startingWatch ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Starting...
                      </>
                    ) : dailyLimit > 0 && dailyCount >= dailyLimit ? (
                      <>
                        Daily Limit Reached
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Watch Ad
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
            <strong>How it works:</strong>
          </p>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
            <li>You can watch unlimited ads per day</li>
            <li>Watch each ad for {REQUIRED_DURATION} seconds to earn coins</li>
            <li>For Adsterra ads: You must also click once in the ad</li>
            <li>Adsterra ads: {FIXED_AD_COINS} coins</li>
            <li>Collaboration ads: {FIXED_AD_COINS} coins</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}

