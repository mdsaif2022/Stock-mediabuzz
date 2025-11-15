import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, Search, Filter, Play, Image as ImageIcon, Music, Smartphone, FileText, ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import { Media } from "@shared/api";
import { apiFetch } from "@/lib/api";
import { VideoCard } from "@/components/media/VideoCard";

const CATEGORY_OPTIONS: Array<{ id: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "all", label: "All", icon: Filter },
  { id: "video", label: "Videos", icon: Play },
  { id: "image", label: "Images", icon: ImageIcon },
  { id: "audio", label: "Audio", icon: Music },
  { id: "template", label: "Templates", icon: FileText },
  { id: "apk", label: "APK / App", icon: Smartphone },
];

const SORT_OPTIONS = [
  { id: "latest", label: "Latest" },
  { id: "popular", label: "Most Downloaded" },
  { id: "views", label: "Most Viewed" },
];

const PAGE_SIZE = 12;

export default function BrowseMedia() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawCategory = searchParams.get("category");
  const activeCategory = rawCategory ? rawCategory.toLowerCase() : "all";
  const query = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "latest";

  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState(query);

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
    setMediaItems([]);
    setPage(1);
    setHasMore(true);
    fetchMedia(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, query, sort]);

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
      const response = await apiFetch(`/api/media?${buildQueryString(pageToFetch)}`);
      if (!response.ok) {
        throw new Error("Failed to load media");
      }
      const data = await response.json();
      const fetchedItems: Media[] = data?.data || [];
      const normalizedCategory = activeCategory.toLowerCase();
      const filteredItems =
        activeCategory === "all"
          ? fetchedItems
          : fetchedItems.filter((item) => item.category.toLowerCase() === normalizedCategory);

      setMediaItems((prev) => (replace ? filteredItems : [...prev, ...filteredItems]));

      const total = typeof data?.total === "number" ? data.total : fetchedItems.length;
      const pageSizeFromServer = typeof data?.pageSize === "number" ? data.pageSize : PAGE_SIZE;
      const totalPages = Math.ceil(total / pageSizeFromServer) || 1;
      setHasMore(pageToFetch < totalPages && fetchedItems.length > 0);
      setPage(pageToFetch + 1);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unable to load media");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (category === "all") {
        params.delete("category");
      } else {
        params.set("category", category.toLowerCase());
      }
      params.delete("page");
      return params;
    });
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 sm:py-12 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl space-y-8">
          <header className="space-y-4 text-center">
            <p className="text-sm font-semibold text-primary uppercase tracking-wide">Media Library</p>
            <h1 className="text-3xl sm:text-4xl font-bold">Browse All Free Assets</h1>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Filter by category, search by keywords, and sort through the latest uploads from creators around the world.
            </p>
          </header>

          <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm">
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
              const isVideo = media.category?.toLowerCase() === "video";

              if (isVideo) {
                return <VideoCard key={media.id} media={media} to={`/media/${media.id}`} variant="detailed" />;
              }

              return (
                <Link
                  key={media.id}
                  to={`/media/${media.id}`}
                  className="group bg-white dark:bg-slate-900 border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {media.previewUrl ? (
                      <img
                        src={media.previewUrl}
                        alt={media.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
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
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{media.downloads} downloads</span>
                      <span>{media.views} views</span>
                    </div>
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
            <div className="flex justify-center">
              <button
                onClick={() => fetchMedia(page)}
                className="px-5 py-2.5 rounded-lg border border-border bg-white dark:bg-slate-900 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
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

