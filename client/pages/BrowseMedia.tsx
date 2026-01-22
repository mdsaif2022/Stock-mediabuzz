import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useSearchParams, useParams, useNavigate, useNavigationType, useLocation } from "react-router-dom";
import { Loader2, Search, Filter, Play, Image as ImageIcon, Music, Smartphone, FileText, ArrowRight, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";
import { Media } from "@shared/api";
import { apiFetch } from "@/lib/api";
import { VideoCard } from "@/components/media/VideoCard";
import { AudioCard } from "@/components/media/AudioCard";
import { getMediaDisplayStats } from "@/lib/mediaUtils";
import { isBackNavigationActive } from "@/utils/backNavigationDetector";

const CATEGORY_OPTIONS: Array<{ id: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "all", label: "All", icon: Filter },
  { id: "video", label: "Videos", icon: Play },
  { id: "image", label: "Images", icon: ImageIcon },
  { id: "audio", label: "Audio", icon: Music },
  { id: "template", label: "Templates", icon: FileText },
  { id: "apk", label: "APK / App", icon: Smartphone },
  { id: "aivideogenerator", label: "AI Video Generator", icon: Sparkles },
];

const SORT_OPTIONS = [
  { id: "latest", label: "Latest" },
  { id: "popular", label: "Most Downloaded" },
  { id: "views", label: "Most Viewed" },
];

const PAGE_SIZE = 12;

export default function BrowseMedia() {
  const { category: categoryParam } = useParams<{ category?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const location = useLocation();
  
  // Get category from URL path param (new structure) or query param (legacy)
  const rawCategory = categoryParam || searchParams.get("category");
  const activeCategory = rawCategory ? rawCategory.toLowerCase() : "all";
  const query = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "latest";
  
  // Track previous filter values to detect actual changes
  const prevFiltersRef = useRef({ category: activeCategory, query, sort });
  const scrollPositionRef = useRef<number>(0);
  const hasInitialFetchedRef = useRef(false);
  
  // Sync URL path with category when category changes via query params (for backward compatibility)
  // Only sync ONCE on initial mount if we have a category in query params but not in path params
  // CRITICAL: Never sync on back/forward navigation (POP)
  const hasSyncedRef = useRef(false);
  
  useEffect(() => {
    // If user pressed browser back or forward, do NOT run any redirect logic
    const isBrowserBack = navigationType === "POP";
    if (isBrowserBack) {
      if (process.env.NODE_ENV === "development") {
        console.log("[BrowseMedia] BACK navigation detected - skipping URL sync");
      }
      return;
    }

    if (hasSyncedRef.current) {
      return;
    }

    const categoryInQuery = searchParams.get("category");

    if (!categoryParam && categoryInQuery && activeCategory !== "all") {
      hasSyncedRef.current = true;

      const p = new URLSearchParams(searchParams);
      p.delete("category");
      const qs = p.toString();

      navigate(`/browse/${activeCategory}${qs ? `?${qs}` : ""}`, {
        replace: true,
      });
    } else {
      hasSyncedRef.current = true;
    }
  }, [
    categoryParam,
    searchParams,
    activeCategory,
    navigate,
    navigationType
  ]);

  // Store state in sessionStorage key based on current filters for persistence
  const storageKeyRef = useRef(`browseMedia_${activeCategory}_${query}_${sort}`);
  
  // Load saved state from sessionStorage on mount (only once)
  const [initialState] = useState(() => {
    try {
      const key = `browseMedia_${activeCategory}_${query}_${sort}`;
      storageKeyRef.current = key;
      const saved = sessionStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        scrollPositionRef.current = parsed.scrollPosition || 0;
        return {
          items: parsed.items || [],
          page: parsed.page || 1,
          hasMore: parsed.hasMore !== undefined ? parsed.hasMore : true,
        };
      }
    } catch (e) {
      console.error("Failed to load saved state:", e);
    }
    return { items: [], page: 1, hasMore: true };
  });

  const [mediaItems, setMediaItems] = useState<Media[]>(initialState.items);
  const [page, setPage] = useState(initialState.page);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialState.hasMore);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState(query);
  
  // Update storage key when filters change
  useEffect(() => {
    storageKeyRef.current = `browseMedia_${activeCategory}_${query}_${sort}`;
  }, [activeCategory, query, sort]);

  // Save scroll position when component unmounts (navigating away)
  useEffect(() => {
    return () => {
      // Save scroll position on unmount (when navigating to detail page or away)
      scrollPositionRef.current = window.scrollY;
      try {
        sessionStorage.setItem(storageKeyRef.current, JSON.stringify({
          items: mediaItems,
          page,
          hasMore,
          scrollPosition: scrollPositionRef.current,
        }));
      } catch (e) {
        // Ignore errors
      }
    };
  }, [mediaItems, page, hasMore]);
  
  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKeyRef.current, JSON.stringify({
        items: mediaItems,
        page,
        hasMore,
        scrollPosition: scrollPositionRef.current,
      }));
    } catch (e) {
      console.error("Failed to save state:", e);
    }
  }, [mediaItems, page, hasMore]);
  
  // Save scroll position before navigating away
  useEffect(() => {
    const handleScroll = () => {
      scrollPositionRef.current = window.scrollY;
    };
    
    // Save scroll position immediately when navigating to detail page
    const saveScrollBeforeNavigation = () => {
      scrollPositionRef.current = window.scrollY;
      try {
        sessionStorage.setItem(storageKeyRef.current, JSON.stringify({
          items: mediaItems,
          page,
          hasMore,
          scrollPosition: scrollPositionRef.current,
        }));
      } catch (e) {
        // Ignore errors
      }
    };
    
    // Throttle scroll position saving to avoid too many writes
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    const throttledSave = () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        try {
          sessionStorage.setItem(storageKeyRef.current, JSON.stringify({
            items: mediaItems,
            page,
            hasMore,
            scrollPosition: scrollPositionRef.current,
          }));
        } catch (e) {
          // Ignore errors
        }
        scrollTimeout = null;
      }, 500); // Save every 500ms
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('scroll', throttledSave, { passive: true });
    
    // Save scroll position before navigation (when clicking links)
    // Use capture phase to catch events before navigation happens
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href*="/browse/"]');
      if (link && link.getAttribute('href')?.match(/\/browse\/[^/]+\/[^/]+$/)) {
        // This is a link to a detail page, save scroll position immediately
        saveScrollBeforeNavigation();
        try {
          // Mark that we should restore scroll when returning to this browse state
          sessionStorage.setItem("browseMedia_shouldRestore", storageKeyRef.current);
        } catch {
          // Ignore storage errors
        }
      }
    };
    document.addEventListener('click', handleDocumentClick, true);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', throttledSave);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      document.removeEventListener('click', handleDocumentClick, true);
      // Save final state on unmount
      try {
        sessionStorage.setItem(storageKeyRef.current, JSON.stringify({
          items: mediaItems,
          page,
          hasMore,
          scrollPosition: scrollPositionRef.current,
        }));
      } catch (e) {
        // Ignore errors
      }
    };
  }, [mediaItems, page, hasMore]);

  const appliedFilters = useMemo(() => {
    const filters: string[] = [];
    if (activeCategory !== "all") filters.push(CATEGORY_OPTIONS.find((opt) => opt.id === activeCategory)?.label || "");
    if (query) filters.push(`"${query}"`);
    if (sort !== "latest") filters.push(SORT_OPTIONS.find((opt) => opt.id === sort)?.label || "");
    return filters.filter(Boolean);
  }, [activeCategory, query, sort]);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    // Check if this is back navigation
    const isBackNav = navigationType === "POP" || isBackNavigationActive();
    const shouldRestore = (() => {
      try {
        return sessionStorage.getItem("browseMedia_shouldRestore") === storageKeyRef.current;
      } catch {
        return false;
      }
    })();
    
    // Check if filters actually changed
    const filtersChanged = 
      prevFiltersRef.current.category !== activeCategory ||
      prevFiltersRef.current.query !== query ||
      prevFiltersRef.current.sort !== sort;
    
    // Update previous filters
    prevFiltersRef.current = { category: activeCategory, query, sort };
    
    // If it's back navigation (or we marked restore) and filters haven't changed, restore scroll position
    if ((isBackNav || shouldRestore) && !filtersChanged) {
      // Load saved scroll position
      try {
        const saved = sessionStorage.getItem(storageKeyRef.current);
        if (saved) {
          const parsed = JSON.parse(saved);
          scrollPositionRef.current = parsed.scrollPosition || 0;
          // Restore scroll position with higher priority and longer delay
          // This ensures it happens after ScrollToTop checks but before any other scrolling
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              window.scrollTo({
                top: scrollPositionRef.current,
                behavior: "auto",
              });
              // Double-check after a brief delay in case DOM wasn't ready
              setTimeout(() => {
                if (Math.abs(window.scrollY - scrollPositionRef.current) > 50) {
                  window.scrollTo({
                    top: scrollPositionRef.current,
                    behavior: "auto",
                  });
                }
              }, 100);
            });
          });
        }
      } catch (e) {
        console.error("Failed to restore scroll position:", e);
      }
      try {
        sessionStorage.removeItem("browseMedia_shouldRestore");
      } catch {
        // Ignore storage errors
      }
      hasInitialFetchedRef.current = true;
      return; // Don't reset state on back navigation
    }
    
    // On initial mount, fetch media if we don't have saved items or saved items are empty
    if (!hasInitialFetchedRef.current) {
      hasInitialFetchedRef.current = true;
      // Check if we have saved items in the initial state
      if (initialState.items.length === 0) {
        // No saved items - fetch media
        console.log("[BrowseMedia] Initial mount - no saved items, fetching media");
        fetchMedia(1, true);
      } else {
        console.log("[BrowseMedia] Initial mount - using saved items from sessionStorage");
      }
      return;
    }
    
    // Only reset if filters actually changed (not on back navigation)
    if (filtersChanged) {
      setMediaItems([]);
      setPage(1);
      setHasMore(true);
      scrollPositionRef.current = 0;
      fetchMedia(1, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, query, sort, navigationType]);

  const buildQueryString = (pageToFetch: number) => {
    const params = new URLSearchParams({
      page: pageToFetch.toString(),
      pageSize: PAGE_SIZE.toString(),
      sort,
    });
    if (activeCategory !== "all") params.set("category", activeCategory);
    if (query) params.set("search", query);
    return params.toString();
  };

  const fetchMedia = async (pageToFetch = page, replace = false) => {
    try {
      setIsLoading(true);
      setError("");
      const queryString = buildQueryString(pageToFetch);
      console.log(`[BrowseMedia] Fetching media: /api/media?${queryString}`);
      const response = await apiFetch(`/api/media?${queryString}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[BrowseMedia] API error: ${response.status} - ${errorText}`);
        throw new Error(`Failed to load media (${response.status})`);
      }
      
      const data = await response.json();
      console.log(`[BrowseMedia] API response:`, {
        hasData: !!data,
        isArray: Array.isArray(data),
        dataType: typeof data,
        dataKeys: data ? Object.keys(data) : [],
        itemsCount: Array.isArray(data) ? data.length : (data?.data?.length || 0)
      });
      
      // Handle both array response and object response format
      let fetchedItems: Media[] = [];
      if (Array.isArray(data)) {
        fetchedItems = data;
      } else if (data?.data && Array.isArray(data.data)) {
        fetchedItems = data.data;
      } else {
        console.warn("[BrowseMedia] Unexpected API response format:", data);
        fetchedItems = [];
      }
      
      const normalizedCategory = activeCategory.toLowerCase();
      const filteredItems =
        activeCategory === "all"
          ? fetchedItems
          : fetchedItems.filter((item) => item.category.toLowerCase() === normalizedCategory);

      console.log(`[BrowseMedia] Processed ${filteredItems.length} items (from ${fetchedItems.length} total)`);
      
      setMediaItems((prev) => (replace ? filteredItems : [...prev, ...filteredItems]));

      const total = typeof data?.total === "number" ? data.total : (Array.isArray(data) ? data.length : fetchedItems.length);
      const pageSizeFromServer = typeof data?.pageSize === "number" ? data.pageSize : PAGE_SIZE;
      const totalPages = Math.ceil(total / pageSizeFromServer) || 1;
      setHasMore(pageToFetch < totalPages && fetchedItems.length > 0);
      setPage(pageToFetch + 1);
    } catch (err: any) {
      console.error("[BrowseMedia] Error fetching media:", err);
      setError(err.message || "Unable to load media");
      // On error, clear items if replacing
      if (replace) {
        setMediaItems([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    const normalizedCategory = category.toLowerCase();
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete("page");
    
    if (category === "all") {
      // Navigate to /browse without category in path
      const queryString = newSearchParams.toString();
      navigate(`/browse${queryString ? `?${queryString}` : ""}`);
    } else {
      // Navigate to /browse/:category with category in path
      const queryString = newSearchParams.toString();
      navigate(`/browse/${normalizedCategory}${queryString ? `?${queryString}` : ""}`);
    }
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("sort", event.target.value);
      params.delete("page");
      return params;
    });
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (searchInput.trim()) {
        params.set("q", searchInput.trim());
      } else {
        params.delete("q");
      }
      params.delete("page");
      return params;
    });
  };

  const getCategoryIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower === "video") return Play;
    if (lower === "image") return ImageIcon;
    if (lower === "audio") return Music;
    if (lower === "apk") return Smartphone;
    return FileText;
  };

  return (
    <Layout>
      {/* Page Container with distinct visual separation */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {/* Page Header with gradient background */}
        <div className="bg-gradient-to-r from-primary/10 via-secondary/5 to-accent/10 border-b border-border/50 py-4 sm:py-6">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6">
            <header className="space-y-2 text-center">
              <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wide">Media Library</p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Browse All Free Assets
              </h1>
              <p className="text-muted-foreground max-w-3xl mx-auto text-sm sm:text-base">
                Filter by category, search by keywords, and sort through the latest uploads from creators around the world.
              </p>
            </header>
          </div>
        </div>
        
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">

          <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-4 sm:p-6 space-y-4 shadow-lg backdrop-blur-sm">
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search videos, images, audio..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-border bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-3">
                <select
                  value={sort}
                  onChange={handleSortChange}
                  className="px-3 py-2.5 rounded-lg border border-border bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-semibold flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
            </form>

            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isActive = activeCategory === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleCategoryChange(option.id)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>

            {appliedFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>Filters:</span>
                {appliedFilters.map((filter) => (
                  <span key={filter} className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                    {filter}
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 text-center">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {mediaItems.map((media) => {
              const Icon = getCategoryIcon(media.category);
              const isAudio = media.category?.toLowerCase() === "audio";
              const isVideo = media.category?.toLowerCase() === "video";
              const categoryPath = media.category?.toLowerCase() || "all";

              // Use AudioCard for audio category
              if (isAudio) {
                return <AudioCard key={media.id} media={media} to={`/browse/${categoryPath}/${media.id}`} variant="detailed" />;
              }

              // Use VideoCard for video category to properly generate thumbnails
              if (isVideo) {
                return <VideoCard key={media.id} media={media} to={`/browse/${categoryPath}/${media.id}`} variant="detailed" />;
              }

              // Use default card layout for other categories (image, apk, template)
              return (
                <Link
                  key={media.id}
                  to={`/browse/${categoryPath}/${media.id}`}
                  className="group bg-white dark:bg-slate-900 border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {media.previewUrl ? (
                      <img
                        src={media.previewUrl}
                        alt={media.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                        onError={(e) => {
                          (e.currentTarget.style.display = "none");
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-400 to-slate-600 text-white/80">
                        <Icon className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3 text-white text-xs">
                      <span className="bg-black/60 px-2 py-0.5 rounded-full">{media.type}</span>
                      <span className="font-semibold">{media.fileSize}</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                      <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">{media.category}</span>
                      <span>{new Date(media.uploadedDate).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-base font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {media.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{media.description}</p>
                    {(() => {
                      const displayStats = getMediaDisplayStats(media);
                      return (
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>{displayStats.downloadsLabel} downloads</span>
                          <span>{displayStats.viewsLabel} views</span>
                        </div>
                      );
                    })()}
                  </div>
                </Link>
              );
            })}
          </div>

          {isLoading && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && mediaItems.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-slate-900 border border-border rounded-2xl">
              <p className="text-lg font-semibold mb-2">No media found</p>
              <p className="text-muted-foreground">Try adjusting your filters or search keywords.</p>
              <Link
                to="/creator"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg border border-border hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Become a Creator <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {hasMore && !isLoading && mediaItems.length > 0 && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => fetchMedia(page)}
                className="px-6 py-3 rounded-lg font-semibold text-sm sm:text-base transition-colors flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

