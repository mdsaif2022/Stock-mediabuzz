import Layout from "@/components/Layout";
import { Download, Share2, Heart, Clock, Eye, Tag, AlertCircle, Play, Image as ImageIcon, Music, Zap, Check, Smartphone } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Media, MediaResponse } from "@shared/api";
import { apiFetch, API_BASE_URL } from "@/lib/api";
import { DownloadVideoViewer } from "@/components/media/DownloadVideoViewer";
import { VideoCard } from "@/components/media/VideoCard";
import { AudioPlayer } from "@/components/media/AudioPlayer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function MediaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [media, setMedia] = useState<Media | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);
  const [relatedMedia, setRelatedMedia] = useState<Media[]>([]);
  const [isRelatedLoading, setIsRelatedLoading] = useState(false);
  const [activeScreenshot, setActiveScreenshot] = useState<{ title?: string; description?: string; url: string } | null>(null);

  // Fetch media data from API
  useEffect(() => {
    const fetchMedia = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const response = await apiFetch(`/api/media/${id}`);
        if (response.ok) {
          const data = await response.json();
          setMedia(data);
        } else {
          navigate("/browse", { replace: false });
        }
      } catch (error) {
        console.error("Failed to fetch media:", error);
        navigate("/browse", { replace: false });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedia();
  }, [id, navigate]);

  useEffect(() => {
    if (!media) {
      setRelatedMedia([]);
      return;
    }

    const controller = new AbortController();
    const fetchRelated = async () => {
      setIsRelatedLoading(true);
      try {
        const params = new URLSearchParams({
          category: media.category,
          page: "1",
          pageSize: "12",
          sort: "popular",
        });
        const response = await apiFetch(`/api/media?${params.toString()}`, { signal: controller.signal });
        if (response.ok) {
          const payload: MediaResponse = await response.json();
          const items = Array.isArray(payload?.data) ? payload.data : [];
          const filtered = items.filter((item) => item.id !== media.id).slice(0, 4);
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
      const proxyPath = `/api/download/proxy/${media.id}`;
      const proxyUrl = API_BASE_URL ? `${API_BASE_URL}${proxyPath}` : proxyPath;
      
      // Show Adsterra ad before download
      const adsterraLinks = [
        "https://www.effectivegatecpm.com/hfy73qcy?key=e260bfac004e18965e13c7172696c1a3",
        "https://www.effectivegatecpm.com/ywhsa6yivz?key=bfec6a8bc15be21a9df294ff59815f8a",
      ];
      const randomAd = adsterraLinks[Math.floor(Math.random() * adsterraLinks.length)];
      
      // Determine file extension for download attribute
      let fileExtension = 'mp4';
      const urlParts = media.fileUrl.split('.');
      if (urlParts.length > 1) {
        const lastPart = urlParts[urlParts.length - 1].split('?')[0].split('#')[0];
        if (lastPart && lastPart.length <= 5) {
          fileExtension = lastPart.toLowerCase();
        }
      }
      if (isApk) {
        fileExtension = 'apk';
      }
      
      // Create download link with download attribute to force download
      const link = document.createElement("a");
      link.href = proxyUrl;
      // Always use download attribute to force download instead of opening in new tab
      link.download = `${media.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${fileExtension}`;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      // Open ad window FIRST (while still in user gesture context)
      const adWindow = window.open(randomAd, "_blank", "width=800,height=600");
      
      // Small delay to ensure ad window opens, then trigger download
      setTimeout(() => {
        try {
          // Click the link to trigger download
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
          
          // Close ad window after download starts
          setTimeout(() => {
            if (adWindow && !adWindow.closed) {
              adWindow.close();
            }
          }, 5000);
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
          alert("Failed to download. Please try again.");
        }
      }, 100); // Small delay to ensure ad window opens first
    } catch (error) {
      console.error("Download error:", error);
      setIsDownloading(false);
      alert("Failed to download. Please try again.");
    }
  };

  const handleShare = async () => {
    if (!media) return;
    
    const shareUrl = `${window.location.origin}/media/${media.id}`;
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

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading media...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!media) {
    return (
      <Layout>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Media not found</p>
            <Link to="/browse" className="text-primary hover:text-accent transition-colors mt-4 inline-block">
              Go to Browse
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const safeCategory = typeof media.category === "string" ? media.category : "unknown";
  const safeTags = Array.isArray(media.tags) ? media.tags : [];
  const safeDownloads = typeof media.downloads === "number" ? media.downloads : Number(media.downloads) || 0;
  const safeViews = typeof media.views === "number" ? media.views : Number(media.views) || 0;

  const Icon = getIcon(safeCategory);
  const isVideo = safeCategory.toLowerCase() === "video";
  const isImage = safeCategory.toLowerCase() === "image";
  const isAudio = safeCategory.toLowerCase() === "audio";
  const isApk = safeCategory.toLowerCase() === "apk";
  const featureScreenshots = Array.isArray(media.featureScreenshots)
    ? media.featureScreenshots.filter((shot) => shot && shot.url)
    : [];
  const shouldShowScreenshots = isApk && media.showScreenshots !== false && featureScreenshots.length > 0;

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-6 sm:py-8 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          {/* Breadcrumb */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
              <a href="/" className="hover:text-primary transition-colors">
                Home
              </a>
              <span>/</span>
              <a href="/browse" className="hover:text-primary transition-colors">
                Browse
              </a>
              <span>/</span>
              <span className="text-foreground truncate">{media.category}</span>
            </nav>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Preview */}
              <div className="mb-6 sm:mb-8">
                {isVideo ? (
                  <DownloadVideoViewer media={media} />
                ) : isAudio ? (
                  <AudioPlayer src={media.fileUrl} title={media.title} />
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
                  <p className="text-xl sm:text-2xl font-bold">{(safeDownloads / 1000).toFixed(1)}K</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Views</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold">{(safeViews / 1000).toFixed(1)}K</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Duration</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold">{media.duration || "N/A"}</p>
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
                  {media.duration && (
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-semibold">{media.duration}</p>
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
                      className="w-20 h-20 rounded-2xl object-cover border border-border"
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
                {Array.from({ length: 4 }).map((_, index) => (
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
                  const isVideoItem = item.category?.toLowerCase() === "video";
                  if (isVideoItem) {
                    return (
                      <VideoCard
                        key={item.id}
                        media={item}
                        to={`/media/${item.id}`}
                        variant="compact"
                      />
                    );
                  }

                  const Icon = getIcon(item.category);
                  const gradient = getGradientForCategory(item.category);
                  const downloads = (Number(item.downloads) || 0).toLocaleString();

                  return (
                    <Link
                      key={item.id}
                      to={`/media/${item.id}`}
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
    </Layout>
  );
}
