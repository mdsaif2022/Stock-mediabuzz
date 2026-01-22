import Layout from "@/components/Layout";
import { Download, Share2, Heart, Clock, Eye, Tag, AlertCircle, Play, Image as ImageIcon, Music, Zap, Check, Smartphone } from "lucide-react";
import { Link, useParams, useNavigate, useLocation, useNavigationType } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Media, MediaResponse } from "@shared/api";
import { apiFetch, API_BASE_URL } from "@/lib/api";
import { DownloadVideoViewer } from "@/components/media/DownloadVideoViewer";
import { VideoCard } from "@/components/media/VideoCard";
import { AudioCard } from "@/components/media/AudioCard";
import { AudioPlayer } from "@/components/media/AudioPlayer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isBackNavigationActive } from "@/utils/backNavigationDetector";
import { getMediaDisplayStats, formatDuration } from "@/lib/mediaUtils";

export default function MediaDetail() {
  const { category, id } = useParams<{ category?: string; id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [media, setMedia] = useState<Media | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);
  const [relatedMedia, setRelatedMedia] = useState<Media[]>([]);
  const [isRelatedLoading, setIsRelatedLoading] = useState(false);
  const [activeScreenshot, setActiveScreenshot] = useState<{ title?: string; description?: string; url: string } | null>(null);
  const [downloadAttempts, setDownloadAttempts] = useState(0); // Track number of download button clicks
  const downloadAttemptsRef = useRef(0); // Ref to track attempts synchronously (fixes rapid click bug)
  const lastRedirectedIdRef = useRef<string | null>(null); // Track which ID we redirected for
  const isProcessingBackNavRef = useRef(false); // Track if we're currently processing back navigation
  const previousLocationRef = useRef<string>(''); // Track previous location to detect back navigation
  const hasPerformedRedirectRef = useRef(false); // Track if we've already performed redirect for this mount
  const mountTimeRef = useRef<number>(0); // Track when component mounted
  const hasEverDetectedBackNavRef = useRef(false); // CRITICAL: Track if we've EVER detected back nav for this mount
  const lastPopStateTimeRef = useRef<number>(0); // Track when popstate was last detected
  const [mediaDuration, setMediaDuration] = useState<string>("N/A");
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const seoStateRef = useRef<{
    title: string;
    meta: Map<string, string | null>;
    created: Set<string>;
    canonicalHref: string | null;
    canonicalCreated: boolean;
  }>({
    title: "",
    meta: new Map(),
    created: new Set(),
    canonicalHref: null,
    canonicalCreated: false,
  });

  // Track mount time on component mount
  useEffect(() => {
    mountTimeRef.current = Date.now();
    previousLocationRef.current = location.pathname + location.search;
    
    // Listen for popstate events directly to catch back navigation
    const handlePopState = () => {
      hasEverDetectedBackNavRef.current = true;
      isProcessingBackNavRef.current = true;
      lastPopStateTimeRef.current = Date.now();
      if (process.env.NODE_ENV === 'development') {
        console.log('[MediaDetail] Popstate detected - marking as back navigation permanently');
      }
    };
    
    window.addEventListener('popstate', handlePopState, true);
    
    return () => {
      // Reset flags on unmount
      isProcessingBackNavRef.current = false;
      hasPerformedRedirectRef.current = false;
      hasEverDetectedBackNavRef.current = false;
      window.removeEventListener('popstate', handlePopState, true);
    };
  }, []);

  // Fetch media data from API
  useEffect(() => {
    const fetchMedia = async () => {
      if (!id) return;
      
      // CRITICAL: SIMPLIFIED back navigation detection - check these in order:
      // 1. React Router's navigationType === 'POP' (most reliable)
      // 2. Global backNavigationDetector (catches popstate events)
      // 3. Local persistent flag (if we've ever detected back nav for this mount)
      // 
      // If ANY of these are true, NEVER run redirect logic
      const isPopNavigation = navigationType === 'POP';
      const isBackNavDetected = isBackNavigationActive(); // This now checks hasEverDetectedBackNav globally
      const hasLocalBackNav = hasEverDetectedBackNavRef.current;
      
      // SIMPLE RULE: If ANY back navigation indicator is true, block ALL redirects
      const shouldBlockRedirects = isPopNavigation || isBackNavDetected || hasLocalBackNav || isProcessingBackNavRef.current;
      
      // Log navigation state for debugging (development only)
      if (process.env.NODE_ENV === 'development') {
        console.log('[MediaDetail] Navigation check:', {
          id,
          category,
          navigationType,
          isPopNavigation,
          isBackNavDetected,
          hasLocalBackNav,
          isProcessingBackNav: isProcessingBackNavRef.current,
          shouldBlockRedirects: shouldBlockRedirects ? '✅ YES - Redirects BLOCKED' : '❌ NO - Redirects allowed',
          currentUrl: window.location.href,
          historyLength: window.history.length,
        });
      }
      
      // CRITICAL: If this is back/forward navigation, NEVER run redirect logic
      // This prevents unwanted redirects that would override the browser's native back behavior
      if (shouldBlockRedirects) {
        // Mark that we're processing back navigation - PERMANENTLY for this mount
        isProcessingBackNavRef.current = true;
        hasEverDetectedBackNavRef.current = true;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[MediaDetail] ⚠️ BACK navigation detected - BLOCKING all redirects and URL sync', {
            id,
            category,
            currentUrl: window.location.href,
            isPopNavigation,
            isBackNavDetected,
            hasLocalBackNav,
            reason: hasLocalBackNav 
              ? 'Back nav was previously detected (persistent)' 
              : isPopNavigation
                ? 'POP navigation detected'
                : isBackNavDetected
                  ? 'Back nav detector active'
                  : 'Currently processing back nav',
          });
        }
        
        // Still fetch the media data (user might be navigating back to a page they've seen)
        // But skip ALL redirect logic to preserve native back button behavior
        try {
          setIsLoading(true);
          const response = await apiFetch(`/api/media/${id}`);
          if (response.ok) {
            const data = await response.json();
            setMedia(data);
            // Reset download attempts when media changes
            setDownloadAttempts(0);
            downloadAttemptsRef.current = 0;
          }
          // On error during back navigation, don't redirect - let user see the error state
          // or stay on the page they navigated back to
        } catch (error) {
          console.error("Failed to fetch media during back navigation:", error);
          // Don't redirect on error during back navigation
        } finally {
          setIsLoading(false);
          // CRITICAL: DO NOT clear the back navigation flag
          // Keep it set for the entire mount to prevent redirects if user presses back again
        }
        return; // Exit early - no redirects on back navigation
      }
      
      // CRITICAL: Only clear back nav flag if we're on a COMPLETELY NEW forward navigation
      // (different ID means we navigated to a new page via link click, not back button)
      // This ensures the flag persists if user is still on the same page
      if (!shouldBlockRedirects && lastRedirectedIdRef.current !== id) {
        // New page via forward navigation - safe to clear flag
        isProcessingBackNavRef.current = false;
        hasEverDetectedBackNavRef.current = false;
      }
      
      // Reset redirect tracking when ID changes (only for forward navigation)
      // CRITICAL: Only reset if this is NOT back navigation and not currently processing back nav
      // This prevents redirect from running when user presses back button
      if (lastRedirectedIdRef.current !== id && !shouldBlockRedirects) {
        lastRedirectedIdRef.current = null;
      }
      
      // CRITICAL: If we've EVER detected back navigation (locally or globally), NEVER redirect
      // This is the ultimate safeguard - once back nav is detected, it stays detected
      // Check both local ref and global flag for maximum reliability
      const globalBackNavDetected = isBackNavigationActive(); // This now checks hasEverDetectedBackNav
      if (hasEverDetectedBackNavRef.current || globalBackNavDetected || shouldBlockRedirects) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[MediaDetail] ⛔ PERMANENT BLOCK: Back navigation detected - NO redirects allowed', {
            id,
            category,
            currentPath: location.pathname,
            hasLocalBackNav: hasEverDetectedBackNavRef.current,
            globalBackNav: globalBackNavDetected,
            shouldBlock: shouldBlockRedirects,
          });
        }
        // Still fetch media data, but skip ALL redirect logic
        // This ensures back button works correctly without interference
        try {
          setIsLoading(true);
          const response = await apiFetch(`/api/media/${id}`);
          if (response.ok) {
            const data = await response.json();
            setMedia(data);
            setDownloadAttempts(0);
            downloadAttemptsRef.current = 0;
          }
        } catch (error) {
          console.error("Failed to fetch media:", error);
          // CRITICAL: Even on error, don't redirect if back nav was detected
        } finally {
          setIsLoading(false);
        }
        return; // Exit early - no redirects ever if back nav was detected
      }
      
      // Only redirect if this was accessed via legacy route without category
      // This only runs on forward navigation (not back navigation)
      // CRITICAL: Multiple checks to ensure we never redirect on back navigation
      // Also check if we're already on the correct URL to avoid unnecessary redirects
      const currentPath = location.pathname;
      const isLegacyRoute = currentPath === `/media/${id}`;
      const shouldRedirect = isLegacyRoute && !category && !shouldBlockRedirects;
      
      try {
        setIsLoading(true);
        const response = await apiFetch(`/api/media/${id}`);
        if (response.ok) {
          const data = await response.json();
          setMedia(data);
          // Reset download attempts when media changes
          setDownloadAttempts(0);
          downloadAttemptsRef.current = 0;
          
          // If accessed via legacy route (/media/:id) without category, redirect to hierarchical URL
          // This only happens on forward navigation (back navigation was already handled above)
          // CRITICAL: Multiple checks to ensure we never redirect on back navigation
          // Also verify we're actually on the legacy route before redirecting
          // CRITICAL: Only redirect ONCE per mount to prevent re-redirects
          const canRedirect = shouldRedirect && 
                              isLegacyRoute &&
                              data.category && 
                              lastRedirectedIdRef.current !== id && 
                              !shouldBlockRedirects &&
                              !isProcessingBackNavRef.current &&
                              !hasPerformedRedirectRef.current;
          
          if (canRedirect) {
            // Mark that we've performed a redirect for this mount
            hasPerformedRedirectRef.current = true;
            const categoryPath = data.category.toLowerCase();
            lastRedirectedIdRef.current = id;
            
            // CRITICAL: Check history length before redirecting
            // If history is deep (user has navigated through multiple pages),
            // we should NOT use replace: true as it will corrupt the history stack
            const historyLength = window.history.length;
            const isDeepHistory = historyLength > 3;
            
            if (process.env.NODE_ENV === 'development') {
              console.log('[MediaDetail] Redirecting legacy route to hierarchical URL:', {
                from: `/media/${id}`,
                to: `/browse/${categoryPath}/${id}`,
                currentPath,
                isLegacyRoute,
                historyLength,
                isDeepHistory,
                isBackNavigation: isBrowserBack,
                isProcessingBackNav: isProcessingBackNavRef.current,
                shouldBlockRedirects,
                useReplace: !isDeepHistory,
                note: isDeepHistory 
                  ? 'Deep history - using push to preserve history stack' 
                  : 'Shallow history - using replace to avoid duplicate entry',
              });
            }
            
            // CRITICAL FIX: Only use replace: true for shallow history (initial page load)
            // For deep history (after multiple navigations), use push to preserve history stack
            // This prevents history corruption when navigating through multiple items
            if (isDeepHistory) {
              // Deep history - use push to preserve the navigation stack
              // This ensures back button can return through all previous pages
              navigate(`/browse/${categoryPath}/${id}`, { replace: false });
            } else {
              // Shallow history (initial load) - use replace to avoid duplicate entry
              navigate(`/browse/${categoryPath}/${id}`, { replace: true });
            }
            return;
          } else if (isLegacyRoute && shouldBlockRedirects) {
            // We're on legacy route but back navigation is detected - don't redirect
            if (process.env.NODE_ENV === 'development') {
              console.log('[MediaDetail] On legacy route but back navigation detected - NOT redirecting:', {
                currentPath,
                isLegacyRoute,
                shouldBlockRedirects,
                isBrowserBack,
                isProcessingBackNav: isProcessingBackNavRef.current,
              });
            }
          }
          
        } else {
          // Only redirect on error if NOT browser back navigation
          // Use replace: true to avoid adding to history when media not found
          // Navigate back to category page if category exists, otherwise to browse
          if (!shouldBlockRedirects) {
            if (category) {
              navigate(`/browse/${category}`, { replace: true });
            } else {
              navigate("/browse", { replace: true });
            }
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log('[MediaDetail] Media not found, but blocking redirect due to back navigation');
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch media:", error);
        // Only redirect on error if NOT browser back navigation
        // Use replace: true to avoid adding to history when error occurs
        // Navigate back to category page if category exists, otherwise to browse
        if (!shouldBlockRedirects) {
          if (category) {
            navigate(`/browse/${category}`, { replace: true });
          } else {
            navigate("/browse", { replace: true });
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('[MediaDetail] Error fetching media, but blocking redirect due to back navigation');
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedia();
    // CRITICAL: Only depend on id and category - NOT navigationType or location
    // This prevents the effect from re-running when back button is pressed
    // We check navigationType inside the effect, but don't re-run the effect when it changes
    // 
    // IMPORTANT: This effect should ONLY run when id or category actually changes
    // NOT when location changes due to back navigation
  }, [id, category, navigate]);
  
  // CRITICAL: Separate effect to detect back navigation via location changes
  // This runs when location changes and checks if it's back navigation
  useEffect(() => {
    const currentLocation = location.pathname + location.search;
    const previousLocation = previousLocationRef.current;
    
    // CRITICAL: Always check navigationType and backNavigationActive on every location change
    // This catches back navigation even if the main effect hasn't run yet
    if (navigationType === 'POP' || isBackNavigationActive()) {
      hasEverDetectedBackNavRef.current = true;
      isProcessingBackNavRef.current = true;
      lastPopStateTimeRef.current = Date.now();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[MediaDetail] ⚠️ Back navigation detected in location effect - setting permanent flag', {
          previousLocation,
          currentLocation,
          id,
          navigationType,
          isBackNavActive: isBackNavigationActive(),
        });
      }
    }
    
    // If location changed but we're on the same ID, this might be back navigation
    if (currentLocation !== previousLocation && id && previousLocation.includes(id)) {
      // Check if this looks like back navigation (same ID, different URL structure)
      const isLegacyRoute = previousLocation === `/media/${id}`;
      const isNewRoute = currentLocation.includes(`/browse/`) && currentLocation.includes(`/${id}`);
      
      // If we went from legacy route to new route with same ID, this was likely a redirect
      // But if we're going backwards in the URL structure, it might be back navigation
      if (isLegacyRoute && isNewRoute) {
        // This was a redirect, not back navigation - allow it
        previousLocationRef.current = currentLocation;
        return;
      }
      
      // If navigationType is POP, definitely back navigation
      if (navigationType === 'POP' || isBackNavigationActive()) {
        hasEverDetectedBackNavRef.current = true;
        isProcessingBackNavRef.current = true;
        lastPopStateTimeRef.current = Date.now();
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[MediaDetail] Location changed with same ID - detected as back navigation', {
            previousLocation,
            currentLocation,
            id,
            navigationType,
          });
        }
      }
    }
    
    previousLocationRef.current = currentLocation;
  }, [location.pathname, location.search, id, navigationType]);

  // Update SEO meta tags for media detail (helps crawlers build rich previews)
  useEffect(() => {
    if (!media) return;

    const origin = window.location.origin;
    const categoryPath = media.category ? String(media.category).toLowerCase() : "all";
    const canonicalUrl = `${origin}/browse/${categoryPath}/${media.id}`;
    const title = `${media.title || "Media"} | FreeMediaBuzz`;
    const description = media.description || "Download free media on FreeMediaBuzz.";
    const imageUrl = media.previewUrl || media.iconUrl || "";
    const isVideo = String(media.category || "").toLowerCase() === "video";

    const setMeta = (key: string, value: string, attr: "name" | "property" = "name") => {
      if (!value) return;
      const selector = `meta[${attr}="${key}"]`;
      let tag = document.querySelector(selector) as HTMLMetaElement | null;
      const mapKey = `${attr}:${key}`;
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
        seoStateRef.current.created.add(mapKey);
      }
      if (!seoStateRef.current.meta.has(mapKey)) {
        seoStateRef.current.meta.set(mapKey, tag.getAttribute("content"));
      }
      tag.setAttribute("content", value);
    };

    if (!seoStateRef.current.title) {
      seoStateRef.current.title = document.title;
    }
    document.title = title;

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
      seoStateRef.current.canonicalCreated = true;
    }
    if (!seoStateRef.current.canonicalHref) {
      seoStateRef.current.canonicalHref = canonical.getAttribute("href");
    }
    canonical.setAttribute("href", canonicalUrl);

    setMeta("description", description, "name");
    setMeta("og:type", isVideo ? "video.other" : "website", "property");
    setMeta("og:site_name", "FreeMediaBuzz", "property");
    setMeta("og:title", media.title || "FreeMediaBuzz", "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", canonicalUrl, "property");
    if (imageUrl) {
      setMeta("og:image", imageUrl, "property");
    }
    if (isVideo && media.fileUrl) {
      setMeta("og:video", media.fileUrl, "property");
    }
    setMeta("twitter:card", imageUrl ? "summary_large_image" : "summary", "name");
    setMeta("twitter:title", media.title || "FreeMediaBuzz", "name");
    setMeta("twitter:description", description, "name");
    if (imageUrl) {
      setMeta("twitter:image", imageUrl, "name");
    }

    const jsonLdId = "media-jsonld";
    let jsonLd = document.getElementById(jsonLdId) as HTMLScriptElement | null;
    if (!jsonLd) {
      jsonLd = document.createElement("script");
      jsonLd.type = "application/ld+json";
      jsonLd.id = jsonLdId;
      document.head.appendChild(jsonLd);
    }
    const baseJson = {
      "@context": "https://schema.org",
      name: media.title || "FreeMediaBuzz Media",
      description,
      url: canonicalUrl,
      uploadDate: media.uploadedDate || undefined,
      thumbnailUrl: imageUrl || undefined,
      contentUrl: media.fileUrl || undefined,
      publisher: {
        "@type": "Organization",
        name: "FreeMediaBuzz",
      },
    };
    const jsonLdPayload = isVideo
      ? { "@type": "VideoObject", ...baseJson }
      : String(media.category || "").toLowerCase() === "image"
        ? { "@type": "ImageObject", ...baseJson }
        : { "@type": "CreativeWork", ...baseJson };
    jsonLd.textContent = JSON.stringify(jsonLdPayload);

    return () => {
      if (seoStateRef.current.title) {
        document.title = seoStateRef.current.title;
      }
      seoStateRef.current.meta.forEach((prev, key) => {
        const [attr, name] = key.split(":");
        const selector = `meta[${attr}="${name}"]`;
        const tag = document.querySelector(selector) as HTMLMetaElement | null;
        if (!tag) return;
        if (seoStateRef.current.created.has(key)) {
          tag.remove();
        } else if (prev !== null) {
          tag.setAttribute("content", prev);
        }
      });
      seoStateRef.current.meta.clear();
      seoStateRef.current.created.clear();

      const canonicalTag = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (canonicalTag) {
        if (seoStateRef.current.canonicalCreated) {
          canonicalTag.remove();
        } else if (seoStateRef.current.canonicalHref) {
          canonicalTag.setAttribute("href", seoStateRef.current.canonicalHref);
        }
      }
      seoStateRef.current.canonicalCreated = false;
      seoStateRef.current.canonicalHref = null;

      const jsonLdTag = document.getElementById(jsonLdId);
      if (jsonLdTag) {
        jsonLdTag.remove();
      }
    };
  }, [media]);

  useEffect(() => {
    if (!media) {
      setRelatedMedia([]);
      return;
    }

    const controller = new AbortController();
    const fetchRelated = async () => {
      setIsRelatedLoading(true);
      try {
        // Use the current media's category for related media
        const currentCategory = media.category?.toLowerCase() || "all";
        const params = new URLSearchParams({
          category: currentCategory === "all" ? "" : currentCategory,
          page: "1",
          pageSize: "12",
          sort: "popular",
        });
        const response = await apiFetch(`/api/media?${params.toString()}`, { signal: controller.signal });
        if (response.ok) {
          const payload: MediaResponse = await response.json();
          const items = Array.isArray(payload?.data) ? payload.data : [];
          // Filter to only include items from the same category, excluding the current item
          const filtered = items.filter((item) => {
            const itemCategory = item.category?.toLowerCase() || "";
            return item.id !== media.id && itemCategory === currentCategory;
          }).slice(0, 12);
          setRelatedMedia(filtered);
        } else {
          setRelatedMedia([]);
        }
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Failed to load related media:", error);
        }
        setRelatedMedia([]);
      } finally {
        setIsRelatedLoading(false);
      }
    };

    fetchRelated();

    return () => controller.abort();
  }, [media?.id, media?.category]);

  const handleDownload = async () => {
    if (!media) return;
    
    setIsDownloading(true);
    
    try {
      const isApk = (media.category || "").toLowerCase() === "apk";
      
      // Use API_BASE_URL to get the correct API URL in production (handles Render backend)
      // Add cache-busting parameter to ensure browser doesn't use cached responses with wrong headers
      const proxyPath = `/api/download/proxy/${media.id}`;
      const cacheBuster = `?t=${Date.now()}`;
      const proxyUrl = API_BASE_URL ? `${API_BASE_URL}${proxyPath}${cacheBuster}` : `${proxyPath}${cacheBuster}`;
      
      // Adsterra popup links - all 20 links
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
      
      // Increment download attempts counter using ref to avoid stale closure issues
      // This ensures rapid clicks don't all see the same old value
      downloadAttemptsRef.current += 1;
      const currentAttempt = downloadAttemptsRef.current;
      setDownloadAttempts(currentAttempt);
      
      // Show popup ads on download button clicks
      const isFirstClick = currentAttempt === 1;
      const shouldShowAds = true; // Enable popup ads on download button clicks
      
      // Determine file extension for download attribute
      // Check category first (most reliable), then URL, then default
      let fileExtension: string;
      const mediaCategory = (media.category || '').toLowerCase();
      const urlLower = media.fileUrl.toLowerCase();
      
      if (isApk || mediaCategory === 'apk') {
        // For APK category, check URL to determine if it's APK, XAPK, or ZIP
        if (urlLower.endsWith('.xapk')) {
          fileExtension = 'xapk';
        } else if (urlLower.endsWith('.zip')) {
          fileExtension = 'zip';
        } else if (urlLower.endsWith('.apk')) {
          fileExtension = 'apk';
        } else {
          // Default to apk if category is apk but extension unclear
          fileExtension = 'apk';
        }
      } else if (mediaCategory === 'video') {
        if (urlLower.endsWith('.webm')) {
          fileExtension = 'webm';
        } else if (urlLower.endsWith('.mov')) {
          fileExtension = 'mov';
        } else if (urlLower.endsWith('.avi')) {
          fileExtension = 'avi';
        } else {
          fileExtension = 'mp4';
        }
      } else if (mediaCategory === 'image') {
        if (urlLower.endsWith('.png')) {
          fileExtension = 'png';
        } else if (urlLower.endsWith('.gif')) {
          fileExtension = 'gif';
        } else if (urlLower.endsWith('.webp')) {
          fileExtension = 'webp';
        } else {
          fileExtension = 'jpg';
        }
      } else if (mediaCategory === 'audio') {
        if (urlLower.endsWith('.wav')) {
          fileExtension = 'wav';
        } else if (urlLower.endsWith('.ogg')) {
          fileExtension = 'ogg';
        } else {
          fileExtension = 'mp3';
        }
      } else {
        // Try to extract from URL
        const urlParts = media.fileUrl.split('.');
        if (urlParts.length > 1) {
          const lastPart = urlParts[urlParts.length - 1].split('?')[0].split('#')[0].toLowerCase();
          // Allow longer extensions (xapk is 4 chars)
          if (lastPart && lastPart.length >= 2 && lastPart.length <= 10) {
            fileExtension = lastPart;
          } else {
            fileExtension = 'bin'; // Generic binary fallback
          }
        } else {
          fileExtension = 'bin'; // Generic binary fallback
        }
      }
      
      // Create download link - browser will use server's Content-Disposition header for filename
      // Note: We don't set the download attribute because browsers ignore it for cross-origin requests
      // The server's Content-Disposition header will control the filename
      const link = document.createElement("a");
      link.href = proxyUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      // Function to trigger download - returns a promise that resolves on success, rejects on failure
      const triggerDownload = (): Promise<void> => {
        return new Promise((resolve, reject) => {
          try {
            // Click the link to trigger download
            // The browser will use the server's Content-Disposition header for the filename
            link.click();
            
            // Track download (this happens after file starts downloading)
            apiFetch(`/api/download/${media.id}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ mediaId: media.id }),
            }).catch(console.error);
            
            setIsDownloading(false);
            
            // Clean up link after download starts
            setTimeout(() => {
              try {
                if (document.body.contains(link)) {
                  document.body.removeChild(link);
                }
              } catch {
                // ignore cleanup errors
              }
            }, 2000);
            
            // Resolve on success (download initiated)
            resolve();
          } catch (downloadError) {
            console.error("Download error:", downloadError);
            setIsDownloading(false);
            // Clean up on error
            try {
              if (document.body.contains(link)) {
                document.body.removeChild(link);
              }
            } catch {
              // ignore cleanup errors
            }
            // Reject on failure so caller knows download failed
            reject(downloadError);
          }
        });
      };
      
      if (shouldShowAds) {
        // Show popup ads: randomly select 1, 2, or 3 ads
        const numAdsToShow = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
        
        // Shuffle array and pick random unique ads
        const shuffled = [...adsterraLinks].sort(() => Math.random() - 0.5);
        const selectedAds = shuffled.slice(0, numAdsToShow);
        
        console.log(`Showing ${numAdsToShow} Adsterra popup ad(s) from ${adsterraLinks.length} total links`);
        
        // Open all selected ads synchronously within user gesture context
        // This is required to avoid popup blockers - browsers block popups opened outside direct user interaction
        const adWindows: Window[] = [];
        
        // Open all windows synchronously (within the same event handler)
        // Note: Browsers may block some popups if too many are opened, but this is the only way
        // to ensure they're not blocked due to being outside user gesture context
        for (const adUrl of selectedAds) {
          try {
            const adWindow = window.open(adUrl, "_blank", "width=800,height=600");
            if (adWindow) {
              adWindows.push(adWindow);
            }
          } catch (error) {
            // Some browsers may block popups, continue with others
            console.warn("Failed to open ad window:", error);
          }
        }
        
        // Function to close ad windows
        const closeAdWindows = () => {
          adWindows.forEach((adWindow) => {
            try {
              if (adWindow && !adWindow.closed) {
                adWindow.close();
              }
            } catch (error) {
              // Ignore errors when closing windows (user may have already closed them)
              console.warn("Error closing ad window:", error);
            }
          });
        };
        
        // After showing ads, trigger download (except on first click where we only show ads)
        // This ensures users get the file after seeing ads on subsequent attempts
        if (isFirstClick) {
          // First click: Only show ads, user must click again
          setIsDownloading(false);
          
          // Close ad windows after a reasonable time (5 seconds) to prevent accumulation
          setTimeout(() => {
            closeAdWindows();
          }, 5000);
          
          // Clean up link (we'll create a new one on next download attempt)
          setTimeout(() => {
            try {
              if (document.body.contains(link)) {
                document.body.removeChild(link);
              }
            } catch {
              // ignore cleanup errors
            }
          }, 1000);
        } else {
          // Subsequent clicks: Show ads AND trigger download
          // User sees ads, but download also starts
          console.log(`Showing popup ads and triggering download (attempt ${currentAttempt})`);
          
          // Trigger download after a short delay to allow ads to open
          setTimeout(() => {
            triggerDownload()
              .then(() => {
                // Only reset attempts counter after successful download
                setDownloadAttempts(0);
                downloadAttemptsRef.current = 0;
                
                // Close ad windows after download starts successfully
                setTimeout(() => {
                  closeAdWindows();
                }, 3000); // Give ads a few seconds to be seen, then close
              })
              .catch((error) => {
                // Download failed - keep the current attempt count
                console.error("Download failed, keeping attempt count:", error);
                alert("Failed to download. Please try again.");
                
                // Close ad windows even on failure to prevent accumulation
                setTimeout(() => {
                  closeAdWindows();
                }, 3000);
                
                // Don't reset downloadAttempts - user can retry with same attempt level
              });
          }, 500); // Small delay to let ads open first
        }
      } else {
        // Download directly without showing popup ads
        console.log(`Downloading directly without popup ads (attempt ${currentAttempt})`);
        triggerDownload()
          .then(() => {
            // Only reset attempts counter after successful download
            setDownloadAttempts(0);
            downloadAttemptsRef.current = 0;
          })
          .catch((error) => {
            // Download failed - keep the current attempt count
            // User can retry without restarting the ad cycle
            console.error("Download failed, keeping attempt count:", error);
            alert("Failed to download. Please try again.");
            // Don't reset downloadAttempts - user can retry with same attempt level
            // Note: downloadAttemptsRef.current keeps the current value, so next click will continue from there
          });
      }
    } catch (error) {
      console.error("Download error:", error);
      setIsDownloading(false);
      alert("Failed to download. Please try again.");
    }
  };

  const handleShare = async () => {
    if (!media) return;
    
    // Use hierarchical URL if category is available, otherwise fallback to legacy
    const categoryPath = category || media.category?.toLowerCase() || "all";
    const shareUrl = category 
      ? `${window.location.origin}/browse/${categoryPath}/${media.id}`
      : `${window.location.origin}/media/${media.id}`;
    const shareData = {
      title: media.title,
      text: media.description,
      url: shareUrl,
    };

    try {
      // Try Web Share API first (mobile)
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch (error: any) {
      // User cancelled or error occurred
      if (error.name !== "AbortError") {
        // Fallback: Copy to clipboard
        try {
          await navigator.clipboard.writeText(shareUrl);
          setShareCopied(true);
          setTimeout(() => setShareCopied(false), 2000);
        } catch (clipboardError) {
          console.error("Failed to copy to clipboard:", clipboardError);
          alert(`Share this link: ${shareUrl}`);
        }
      }
    }
  };

  const getIcon = (category?: string) => {
    const categoryLower = (category || "").toLowerCase();
    if (categoryLower === "video") return Play;
    if (categoryLower === "image") return ImageIcon;
    if (categoryLower === "audio") return Music;
    if (categoryLower === "apk") return Smartphone;
    return Zap;
  };

  const getGradientForCategory = (category?: string) => {
    const gradients: Record<string, string[]> = {
      video: ["from-orange-400 to-red-500", "from-green-500 to-emerald-600"],
      image: ["from-blue-400 to-blue-600", "from-slate-500 to-slate-700"],
      audio: ["from-purple-400 to-pink-600", "from-cyan-400 to-blue-500"],
      template: ["from-green-400 to-blue-600", "from-indigo-400 to-purple-600"],
      apk: ["from-indigo-400 to-purple-500", "from-purple-500 to-pink-600"],
    };
    const normalized = (category || "").toLowerCase();
    const palette = gradients[normalized] || ["from-slate-400 to-slate-600"];
    return palette[0];
  };

  // Calculate derived values (these are safe to compute even if media is null)
  const safeCategory = media ? (typeof media.category === "string" ? media.category : "unknown") : "unknown";
  const isVideo = safeCategory.toLowerCase() === "video";
  const isAudio = safeCategory.toLowerCase() === "audio";

  // Calculate duration for video/audio files
  useEffect(() => {
    if (!media) return;

    // If duration is already set in media, use it
    if (media.duration && media.duration !== "00:00" && media.duration !== "N/A") {
      setMediaDuration(media.duration);
      return;
    }

    // For video/audio, try to get duration from the media element
    if (isVideo && videoRef.current) {
      const video = videoRef.current;
      const handleLoadedMetadata = () => {
        if (video.duration && isFinite(video.duration) && video.duration > 0) {
          setMediaDuration(formatDuration(video.duration));
        }
      };
      const handleDurationChange = () => {
        if (video.duration && isFinite(video.duration) && video.duration > 0) {
          setMediaDuration(formatDuration(video.duration));
        }
      };

      video.addEventListener("loadedmetadata", handleLoadedMetadata);
      video.addEventListener("durationchange", handleDurationChange);
      
      // Try to load metadata
      if (video.readyState === 0) {
        video.load();
      }

      return () => {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        video.removeEventListener("durationchange", handleDurationChange);
      };
    }

    if (isAudio && audioRef.current) {
      const audio = audioRef.current;
      const handleLoadedMetadata = () => {
        if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
          setMediaDuration(formatDuration(audio.duration));
        }
      };
      const handleDurationChange = () => {
        if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
          setMediaDuration(formatDuration(audio.duration));
        }
      };

      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("durationchange", handleDurationChange);
      
      // Try to load metadata
      if (audio.readyState === 0) {
        audio.load();
      }

      return () => {
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("durationchange", handleDurationChange);
      };
    }

    // For non-video/audio, set N/A
    if (!isVideo && !isAudio) {
      setMediaDuration("N/A");
    }
  }, [media, isVideo, isAudio]);

  return (
    <Layout>
      {isLoading ? (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading media...</p>
          </div>
        </div>
      ) : !media ? (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Media not found</p>
            <Link to="/browse" className="text-primary hover:text-accent transition-colors mt-4 inline-block">
              Go to Browse
            </Link>
          </div>
        </div>
      ) : (
        <>
          {(() => {
            const safeCategory = typeof media.category === "string" ? media.category : "unknown";
            const safeTags = Array.isArray(media.tags) ? media.tags : [];
            
            // Get display stats with fake values if needed
            const displayStats = getMediaDisplayStats(media);

            const Icon = getIcon(safeCategory);
            const isImage = safeCategory.toLowerCase() === "image";
            const isApk = safeCategory.toLowerCase() === "apk";
            const featureScreenshots = Array.isArray(media.featureScreenshots)
              ? media.featureScreenshots.filter((shot) => shot && shot.url)
              : [];
            const shouldShowScreenshots = isApk && media.showScreenshots !== false && featureScreenshots.length > 0;

            return (
              <>
      {/* Page Container with distinct visual separation */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {/* Page Header with gradient background */}
        <div className="bg-gradient-to-r from-primary/10 via-secondary/5 to-accent/10 border-b border-border/50 py-8 sm:py-12">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6">
            {/* Breadcrumb */}
            <div className="mb-4">
            <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
              <Link to="/" className="hover:text-primary transition-colors">
                Home
              </Link>
              <span>/</span>
              {category ? (
                <>
                  <Link to={`/browse/${category}`} className="hover:text-primary transition-colors">
                    {media.category || category}
                  </Link>
                  <span>/</span>
                  <span className="text-foreground truncate">{media.title}</span>
                </>
              ) : (
                <>
                  <Link to="/browse" className="hover:text-primary transition-colors">
                    Browse
                  </Link>
                  <span>/</span>
                  <span className="text-foreground truncate">{media.category}</span>
                </>
              )}
            </nav>
          </div>
          </div>
        </div>
        
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Preview */}
              <div className="mb-6 sm:mb-8">
                {isVideo ? (
                  <>
                    <DownloadVideoViewer media={media} />
                    <video
                      ref={videoRef}
                      src={media.fileUrl}
                      preload="metadata"
                      className="hidden"
                      crossOrigin="anonymous"
                    />
                  </>
                ) : isAudio ? (
                  <>
                    <AudioPlayer src={media.fileUrl} title={media.title} />
                    <audio
                      ref={audioRef}
                      src={media.fileUrl}
                      preload="metadata"
                      className="hidden"
                      crossOrigin="anonymous"
                    />
                  </>
                ) : (
                  <div className="aspect-video rounded-lg overflow-hidden relative group shadow-lg bg-slate-900">
                    {isImage ? (
                      <img
                        src={media.previewUrl || media.fileUrl}
                        alt={media.title}
                        className="w-full h-full object-cover"
                      />
                    ) : isApk ? (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center flex-col">
                        <Smartphone className="w-16 h-16 sm:w-24 sm:h-24 text-white/80 mb-4" />
                        <p className="text-white text-lg sm:text-xl font-semibold">Android APK</p>
                        <p className="text-white/80 text-sm sm:text-base mt-2">{media.fileSize}</p>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
                        <Icon className="w-16 h-16 sm:w-24 sm:h-24 text-white/80" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Title and Description */}
              <div className="mb-6 sm:mb-8">
                <div className="flex items-start justify-between mb-3 sm:mb-4 gap-4">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 break-words">
                      {media.title}
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      By {media.uploadedBy || "Unknown"} • Uploaded {media.uploadedDate || "Unknown date"}
                    </p>
                  </div>
                  {media.isPremium && (
                    <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-yellow-500/20 border border-yellow-500 text-yellow-700 dark:text-yellow-300 text-xs sm:text-sm font-semibold rounded-full flex-shrink-0">
                      Premium
                    </div>
                  )}
                </div>

                <p className="text-base sm:text-lg text-foreground leading-relaxed mb-4 sm:mb-6">
                  {media.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {safeTags.length > 0 ? (
                    safeTags.map((tag) => (
                      <button
                        key={tag}
                        className="px-2 sm:px-3 py-0.5 sm:py-1 bg-primary/10 text-primary rounded-full text-xs sm:text-sm hover:bg-primary/20 transition-colors touch-manipulation"
                      >
                        #{tag}
                      </button>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No tags</span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 py-4 sm:py-6 border-y border-border">
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                    <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Downloads</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold">{displayStats.downloadsLabel}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Views</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold">{displayStats.viewsLabel}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Duration</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold">{mediaDuration}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                    <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Category</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold capitalize">{safeCategory}</p>
                </div>
              </div>

              {/* Technical Specs */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-4 sm:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Technical Specifications</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Type/Resolution</p>
                    <p className="font-semibold">{media.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">File Size</p>
                    <p className="font-semibold">{media.fileSize}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-semibold capitalize">{safeCategory}</p>
                  </div>
                  {mediaDuration !== "N/A" && (
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-semibold">{mediaDuration}</p>
                    </div>
                  )}
                </div>
              </div>

              {shouldShowScreenshots && (
                <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg sm:text-xl font-bold">Feature Screenshots</h3>
                    <span className="text-xs text-muted-foreground">Tap to enlarge</span>
                  </div>
                  <div className="hidden md:grid grid-cols-2 gap-4">
                    {featureScreenshots.map((shot, index) => (
                      <button
                        key={`${shot.url}-${index}`}
                        type="button"
                        onClick={() => setActiveScreenshot(shot)}
                        className="rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow text-left"
                      >
                        <img
                          src={shot.url}
                          alt={shot.title || `Screenshot ${index + 1}`}
                          className="w-full h-48 object-cover"
                          loading="lazy"
                        />
                        {(shot.title || shot.description) && (
                          <div className="p-3 space-y-1 bg-white dark:bg-slate-900">
                            {shot.title && <p className="text-sm font-semibold">{shot.title}</p>}
                            {shot.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{shot.description}</p>
                            )}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="md:hidden flex gap-3 overflow-x-auto snap-x pb-2">
                    {featureScreenshots.map((shot, index) => (
                      <button
                        key={`${shot.url}-mobile-${index}`}
                        type="button"
                        onClick={() => setActiveScreenshot(shot)}
                        className="snap-center min-w-[70%] rounded-xl overflow-hidden border border-border shadow-sm text-left"
                      >
                        <img
                          src={shot.url}
                          alt={shot.title || `Screenshot ${index + 1}`}
                          className="w-full h-48 object-cover"
                          loading="lazy"
                        />
                        {(shot.title || shot.description) && (
                          <div className="p-3 space-y-1 bg-white dark:bg-slate-900">
                            {shot.title && <p className="text-sm font-semibold">{shot.title}</p>}
                            {shot.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{shot.description}</p>
                            )}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Download CTA */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-4 sm:p-6 sticky top-20 sm:top-24 space-y-3 sm:space-y-4 shadow-sm">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  {isDownloading ? "Preparing Download..." : "Download Now"}
                </button>

                {isApk && media.iconUrl && (
                  <div className="rounded-lg border border-dashed border-border p-4 flex flex-col items-center text-center gap-2">
                    <img
                      src={media.iconUrl}
                      alt={`${media.title} icon`}
                      className="w-20 h-20 rounded-full object-cover border border-border"
                      loading="lazy"
                    />
                    <p className="text-sm font-semibold">App Icon</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="flex-1 py-2 border border-border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 touch-manipulation"
                  >
                    <Heart
                      className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${isFavorite ? "fill-destructive text-destructive" : ""}`}
                    />
                    <span className="hidden sm:inline text-sm sm:text-base">Save</span>
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 py-2 border border-border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 touch-manipulation"
                  >
                    {shareCopied ? (
                      <>
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-green-600" />
                        <span className="hidden sm:inline text-sm sm:text-base text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="hidden sm:inline text-sm sm:text-base">Share</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
                        Download Note
                      </p>
                      <p className="text-blue-800 dark:text-blue-300">
                        You'll see an ad before your download starts. This helps us keep everything free!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Usage Rights */}
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Usage Rights</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                      <span>Free for commercial use</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                      <span>No credit required</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                      <span>Modify and redistribute</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Related Media Section */}
          <div className="mt-8 sm:mt-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Related Media</h2>
            {isRelatedLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {Array.from({ length: 12 }).map((_, index) => (
                  <div key={`related-skeleton-${index}`} className="animate-pulse space-y-3">
                    <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : relatedMedia.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {relatedMedia.map((item) => {
                  const itemCategory = item.category?.toLowerCase() || "all";
                  const isVideoItem = itemCategory === "video";
                  const isAudioItem = itemCategory === "audio";
                  
                  if (isVideoItem) {
                    return (
                      <VideoCard
                        key={item.id}
                        media={item}
                        to={`/browse/${itemCategory}/${item.id}`}
                        variant="compact"
                      />
                    );
                  }

                  if (isAudioItem) {
                    return (
                      <AudioCard
                        key={item.id}
                        media={item}
                        to={`/browse/${itemCategory}/${item.id}`}
                        variant="compact"
                        theme="default"
                      />
                    );
                  }

                  const Icon = getIcon(item.category);
                  const gradient = getGradientForCategory(item.category);
                  const itemStats = getMediaDisplayStats(item);
                  const downloads = itemStats.downloadsLabel;

                  return (
                    <Link
                      key={item.id}
                      to={`/browse/${itemCategory}/${item.id}`}
                      className="group cursor-pointer touch-manipulation active:scale-[0.98] transition-transform"
                    >
                      <div className="relative overflow-hidden rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                        {item.previewUrl ? (
                          <div className="aspect-video relative">
                            <img
                              src={item.previewUrl || item.fileUrl}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                              <Download className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className={`aspect-video flex items-center justify-center relative bg-gradient-to-br ${gradient} group-hover:scale-[1.02] transition-transform duration-300`}>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                              <Download className="w-4 h-4 text-white" />
                            </div>
                            <Icon className="w-10 h-10 text-white/85 group-hover:text-white transition-colors" />
                          </div>
                        )}
                      </div>

                      <div className="mt-3">
                        <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1.5">
                          {item.title}
                        </h3>
                        <div className="flex gap-1.5 flex-wrap mb-1 text-xs">
                          <span className="bg-secondary/10 text-secondary px-1.5 py-0.5 rounded">
                            {item.category}
                          </span>
                          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            {item.type}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{downloads} downloads</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No related media found yet. Check back soon for more from this category.
              </div>
            )}
          </div>
        </div>
      </div>
      <Dialog open={!!activeScreenshot} onOpenChange={(open) => !open && setActiveScreenshot(null)}>
        <DialogContent className="max-w-3xl">
          {activeScreenshot && (
            <div className="space-y-3">
              <DialogHeader>
                <DialogTitle>{activeScreenshot.title || "Screenshot"}</DialogTitle>
              </DialogHeader>
              <img
                src={activeScreenshot.url}
                alt={activeScreenshot.title || "Screenshot preview"}
                className="w-full rounded-lg object-contain max-h-[70vh]"
              />
              {activeScreenshot.description && (
                <p className="text-sm text-muted-foreground">{activeScreenshot.description}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
              </>
            );
          })()}
        </>
      )}
    </Layout>
  );
}
