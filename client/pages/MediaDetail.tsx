import Layout from "@/components/Layout";
import { Download, Share2, Heart, Clock, Eye, Tag, AlertCircle, Play, Image as ImageIcon, Music, Zap, Check, Smartphone } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Media } from "@shared/api";
import { apiFetch } from "@/lib/api";

export default function MediaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [media, setMedia] = useState<Media | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

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
          navigate("/browse");
        }
      } catch (error) {
        console.error("Failed to fetch media:", error);
        navigate("/browse");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedia();
  }, [id, navigate]);

  const handlePlay = () => {
    if (videoRef) {
      if (isPlaying) {
        videoRef.pause();
        setIsPlaying(false);
      } else {
        videoRef.play().catch((error) => {
          console.error("Error playing video:", error);
        });
        setIsPlaying(true);
      }
    }
  };

  const handleDownload = async () => {
    if (!media) return;
    
    setIsDownloading(true);
    
    try {
      // Show Adsterra ad before download
      const adsterraLinks = [
        "https://www.effectivegatecpm.com/hfy73qcy?key=e260bfac004e18965e13c7172696c1a3",
        "https://www.effectivegatecpm.com/ywhsa6yivz?key=bfec6a8bc15be21a9df294ff59815f8a",
      ];
      const randomAd = adsterraLinks[Math.floor(Math.random() * adsterraLinks.length)];
      
      // Open ad in new window
      const adWindow = window.open(randomAd, "_blank", "width=800,height=600");
      
      // Wait a bit for ad to load, then start download
      setTimeout(() => {
        try {
          // Use server proxy endpoint to bypass CORS issues
          const proxyUrl = `/api/download/proxy/${media.id}`;
          
          // Create hidden iframe for download (more reliable than link.click())
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = proxyUrl;
          document.body.appendChild(iframe);
          
          // Also try direct link as fallback
          const link = document.createElement("a");
          link.href = proxyUrl;
          link.target = "_blank";
          link.download = media.title;
          document.body.appendChild(link);
          link.click();
          
          // Clean up after download starts
          setTimeout(() => {
            try {
              document.body.removeChild(link);
              document.body.removeChild(iframe);
            } catch (e) {
              // Ignore cleanup errors
            }
          }, 2000);
          
          // Track download (this happens after file starts downloading)
          apiFetch(`/api/download/${media.id}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ mediaId: media.id }),
          }).catch(console.error);
          
          setIsDownloading(false);
          
          // Close ad window after download starts
          setTimeout(() => {
            if (adWindow && !adWindow.closed) {
              adWindow.close();
            }
          }, 2000);
        } catch (downloadError) {
          console.error("Download error:", downloadError);
          setIsDownloading(false);
          alert("Failed to download. Please try again.");
        }
      }, 1500);
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

  const getIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower === "video") return Play;
    if (categoryLower === "image") return ImageIcon;
    if (categoryLower === "audio") return Music;
    if (categoryLower === "apk") return Smartphone;
    return Zap;
  };

  const Icon = getIcon(media.category);
  const isVideo = media.category.toLowerCase() === "video";
  const isImage = media.category.toLowerCase() === "image";
  const isAudio = media.category.toLowerCase() === "audio";
  const isApk = media.category.toLowerCase() === "apk";

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
              <div className="aspect-video rounded-lg overflow-hidden mb-6 sm:mb-8 relative group shadow-lg bg-slate-900">
                {isVideo ? (
                  <>
                    <video
                      ref={(el) => setVideoRef(el)}
                      src={media.fileUrl}
                      poster={media.previewUrl}
                      className="w-full h-full object-cover"
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      controls={isPlaying}
                      playsInline
                    />
                    {!isPlaying && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer" onClick={handlePlay}>
                        <button className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 hover:bg-white/30 backdrop-blur rounded-full flex items-center justify-center transition-all touch-manipulation">
                          <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-0.5 sm:ml-1 fill-white" />
                        </button>
                      </div>
                    )}
                    {media.duration && (
                      <span className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-black/70 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-medium">
                        {media.duration}
                      </span>
                    )}
                  </>
                ) : isImage ? (
                  <img
                    src={media.previewUrl || media.fileUrl}
                    alt={media.title}
                    className="w-full h-full object-cover"
                  />
                ) : isAudio ? (
                  <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center">
                    <Music className="w-16 h-16 sm:w-24 sm:h-24 text-white/80" />
                    <audio
                      src={media.fileUrl}
                      controls
                      className="absolute bottom-4 left-4 right-4 w-auto"
                    />
                  </div>
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

              {/* Title and Description */}
              <div className="mb-6 sm:mb-8">
                <div className="flex items-start justify-between mb-3 sm:mb-4 gap-4">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 break-words">
                      {media.title}
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      By {media.uploadedBy} • Uploaded {media.uploadedDate}
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
                  {media.tags && media.tags.length > 0 ? (
                    media.tags.map((tag) => (
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
                  <p className="text-xl sm:text-2xl font-bold">{(media.downloads / 1000).toFixed(1)}K</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Views</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold">{(media.views / 1000).toFixed(1)}K</p>
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
                  <p className="text-xl sm:text-2xl font-bold capitalize">{media.category}</p>
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
                    <p className="font-semibold capitalize">{media.category}</p>
                  </div>
                  {media.duration && (
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-semibold">{media.duration}</p>
                    </div>
                  )}
                </div>
              </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                {
                  id: 2,
                  title: "Professional Business Background",
                  category: "Image",
                  type: "4K",
                  downloads: "8.3K",
                  thumbnail: "bg-gradient-to-br from-blue-400 to-blue-600",
                  icon: ImageIcon,
                },
                {
                  id: 5,
                  title: "Forest Walking Path",
                  category: "Video",
                  type: "1080p",
                  downloads: "9.7K",
                  thumbnail: "bg-gradient-to-br from-green-500 to-emerald-600",
                  icon: Play,
                },
                {
                  id: 6,
                  title: "Modern Tech Workspace",
                  category: "Image",
                  type: "5K",
                  downloads: "11.2K",
                  thumbnail: "bg-gradient-to-br from-slate-500 to-slate-700",
                  icon: ImageIcon,
                },
                {
                  id: 3,
                  title: "Upbeat Electronic Music",
                  category: "Audio",
                  type: "320kbps",
                  downloads: "5.2K",
                  thumbnail: "bg-gradient-to-br from-purple-400 to-pink-600",
                  icon: Music,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    to={`/media/${item.id}`}
                    className="group cursor-pointer touch-manipulation active:scale-[0.98] transition-transform"
                  >
                    <div className="relative overflow-hidden rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                      <div className={`${item.thumbnail} aspect-video flex items-center justify-center relative group-hover:scale-105 transition-transform duration-300`}>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 sm:p-4">
                          <Download className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white/80 group-hover:text-white transition-colors" />
                      </div>
                    </div>

                    <div className="mt-3">
                      <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1.5">
                        {item.title}
                      </h3>
                      <div className="flex gap-1.5 flex-wrap mb-1">
                        <span className="text-xs bg-secondary/10 text-secondary px-1.5 py-0.5 rounded">
                          {item.category}
                        </span>
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.downloads} downloads
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
