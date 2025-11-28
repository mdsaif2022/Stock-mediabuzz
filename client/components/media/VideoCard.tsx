import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Video } from "lucide-react";
import { Media } from "@shared/api";
import { useVideoThumbnail } from "@/hooks/useVideoThumbnail";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

interface VideoCardProps {
  media: Media;
  to: string;
  variant?: "detailed" | "compact";
  className?: string;
}

const PREVIEW_DURATION = 5;
const FALLBACK_VIDEO_THUMBNAIL = "https://placehold.co/640x360?text=Video";

export function VideoCard({ media, to, variant = "detailed", className }: VideoCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isInView = useInView(cardRef, { threshold: 0.4 });
  const supportsHover = useSupportsHover();

  const [isHovering, setIsHovering] = useState(false);
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { thumbnailUrl } = useVideoThumbnail(media.fileUrl, media.previewUrl, media.id);

  // Use proxy URL for video preview to avoid CORS issues
  // Only use proxy for videos, not other media types
  // CRITICAL: For Cloudinary videos, use direct URL (they support range requests natively)
  // For other videos, use proxy endpoint
  const isVideo = media.category?.toLowerCase() === "video";
  const getVideoUrl = (fileUrl: string, id: string) => {
    // Check if this is a Cloudinary video
    const isCloudinary = fileUrl.includes('cloudinary.com') || fileUrl.includes('res.cloudinary.com');
    
    if (isCloudinary) {
      // Cloudinary videos support range requests and CORS natively
      // Use direct URL for better performance and reliability
      return fileUrl;
    }
    
    // For non-Cloudinary videos, use proxy endpoint
    // CRITICAL: Use absolute URL in production (Vercel) to ensure correct domain
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/media/preview/${id}`;
    }
    return `/api/media/preview/${id}`;
  };
  
  const videoUrl = (media.fileUrl && isVideo)
    ? getVideoUrl(media.fileUrl, media.id)
    : "";

  // Determine if video should be loaded and visible
  // YouTube-style: Show video when hovering (with smooth transition)
  const shouldShowVideo = isHovering && supportsHover && videoUrl && !previewError;
  
  // Preload video metadata when in view (even if not hovering) for faster hover response
  const shouldPreloadVideo = isInView && videoUrl && !previewError;

  // Store thumbnail in ref to prevent it from disappearing
  const thumbnailRef = useRef<string | undefined>(undefined);
  
  const safeThumbnail = useMemo(() => {
    if (thumbnailError) {
      // Use cached thumbnail if available, otherwise fallback
      return thumbnailRef.current || FALLBACK_VIDEO_THUMBNAIL;
    }

    const source = thumbnailUrl || thumbnailRef.current || FALLBACK_VIDEO_THUMBNAIL;

    // Update ref when we have a valid thumbnail
    if (source && source !== FALLBACK_VIDEO_THUMBNAIL) {
      thumbnailRef.current = source;
    }

    try {
      const sanitized = source.split("?")[0].toLowerCase();
      if (/\.(mp4|webm|mov|avi|mkv|m4v)$/i.test(sanitized)) {
        // Use cached thumbnail if available
        return thumbnailRef.current || FALLBACK_VIDEO_THUMBNAIL;
      }
    } catch {
      return thumbnailRef.current || FALLBACK_VIDEO_THUMBNAIL;
    }

    return source;
  }, [thumbnailUrl, thumbnailError]);

  // Monitor video playback and pause at PREVIEW_DURATION (YouTube-style)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !supportsHover || !isVideo) return;

    const handleTimeUpdate = () => {
      // Pause video at PREVIEW_DURATION seconds (don't reset isHovering - keep hover state)
      if (video.currentTime >= PREVIEW_DURATION) {
        video.pause();
        // Keep video at PREVIEW_DURATION (don't reset to 0) for smooth UX
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [supportsHover, isVideo]);

  // Set video source early (when in view) to allow preloading metadata
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo || !videoUrl) return;

    // Set video src when component is in view (allows metadata preload)
    if (shouldPreloadVideo) {
      const currentSrc = video.src || video.currentSrc || '';
      if (!currentSrc.includes(videoUrl)) {
        video.src = videoUrl;
        // Preload metadata for faster hover response
        video.preload = "metadata";
      }
    }

    // Cleanup on unmount
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
    };
  }, [shouldPreloadVideo, videoUrl, isVideo]);

  // YouTube-style hover preview: Play video on hover, pause on hover-out
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo || !videoUrl) return;

    if (shouldShowVideo) {
      // HOVERING: Start playing video preview
      const tryPlay = async () => {
        try {
          // Reset to start for fresh preview
          video.currentTime = 0;
          
          // If video has enough data, play immediately
          if (video.readyState >= 2) { // HAVE_CURRENT_DATA
            setIsPreviewReady(true);
            await video.play().catch(() => {
              // Autoplay blocked - show thumbnail instead
              setPreviewError(false); // Don't mark as error, just can't autoplay
            });
          } else {
            // Wait for video to load, then play
            const handleCanPlay = async () => {
              try {
                video.currentTime = 0;
                setIsPreviewReady(true);
                await video.play().catch(() => {
                  // Autoplay blocked - show thumbnail instead
                });
              } catch (err) {
                // Silently handle autoplay errors
                if (process.env.NODE_ENV === 'development') {
                  console.warn("Video autoplay blocked:", err);
                }
              }
            };
            
            // Listen for video ready events
            video.addEventListener('canplay', handleCanPlay, { once: true });
            video.addEventListener('loadeddata', handleCanPlay, { once: true });
            video.addEventListener('loadedmetadata', handleCanPlay, { once: true });
          }
        } catch (err) {
          // Silently handle errors
          if (process.env.NODE_ENV === 'development') {
            console.warn("Video play error:", err);
          }
        }
      };
      
      // Ensure video src is set
      if (!video.src || !video.src.includes(videoUrl)) {
        video.src = videoUrl;
      }
      
      // Try to play
      tryPlay();
    } else {
      // NOT HOVERING: Pause and reset to thumbnail
      video.pause();
      video.currentTime = 0;
      setIsPreviewReady(false);
    }
  }, [shouldShowVideo, videoUrl, isVideo]);

  const meta = useMemo(() => {
    const downloads = Number(media.downloads) || 0;
    const views = Number(media.views) || 0;
    return {
      downloads: downloads.toLocaleString(),
      views: views.toLocaleString(),
      date: media.uploadedDate ? new Date(media.uploadedDate).toLocaleDateString() : "",
    };
  }, [media.downloads, media.views, media.uploadedDate]);

  return (
    <Link
      ref={cardRef}
      to={to}
      className={cn(
        "group bg-white dark:bg-slate-900 border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col touch-manipulation active:scale-[0.98] transition-transform",
        className
      )}
      onMouseEnter={() => {
        if (!supportsHover) return;
        // YouTube-style: Small delay before starting preview (prevents accidental triggers)
        hoverTimeoutRef.current = setTimeout(() => {
          setIsHovering(true);
        }, 200); // 200ms delay like YouTube
      }}
      onMouseLeave={() => {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
        if (supportsHover) {
          setIsHovering(false);
        }
      }}
      onFocus={() => setIsHovering(false)}
    >
      <div className="relative aspect-video bg-slate-900">
        {media.fileUrl && isVideo ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              poster={safeThumbnail}
              muted
              playsInline
              crossOrigin="anonymous"
              preload={shouldPreloadVideo ? "metadata" : "none"}
              controlsList="nodownload noplaybackrate nopictureinpicture"
              disablePictureInPicture
              className={cn("w-full h-full object-cover transition-opacity duration-300 absolute inset-0 z-10 select-none", {
                "opacity-0 pointer-events-none": !isPreviewReady || previewError || !shouldShowVideo,
                "opacity-100": isPreviewReady && !previewError && shouldShowVideo,
              })}
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
              onLoadedData={() => {
                if (shouldShowVideo) {
                  setIsPreviewReady(true);
                  setPreviewError(false);
                }
              }}
              onCanPlay={() => {
                if (shouldShowVideo) {
                  setIsPreviewReady(true);
                  setPreviewError(false);
                }
              }}
              onLoadedMetadata={() => {
                if (shouldShowVideo) {
                  setIsPreviewReady(true);
                  setPreviewError(false);
                }
              }}
              onWaiting={() => {
                // Video is buffering - keep showing video if it was already playing
                if (shouldShowVideo && isPreviewReady) {
                  // Keep video visible during buffering
                }
              }}
              onError={(e) => {
                // Handle video errors - show thumbnail instead
                if (process.env.NODE_ENV === 'development') {
                  console.warn("Video preview error for media:", media.id, e);
                }
                setPreviewError(true);
                setIsPreviewReady(false);
              }}
            />
            {/* Thumbnail - always visible by default, hidden only when video is playing (YouTube-style) */}
            <img
              src={safeThumbnail}
              alt={media.title}
              className={cn(
                "absolute inset-0 w-full h-full object-cover transition-opacity duration-300 z-0",
                shouldShowVideo && isPreviewReady && !previewError ? "opacity-0" : "opacity-100"
              )}
              loading="lazy"
              onError={() => {
                // If thumbnail fails to load, fall back to placeholder
                setThumbnailError(true);
                setPreviewError(true);
              }}
            />
            {/* Only show unavailable if both video and thumbnail fail */}
            {previewError && thumbnailError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gradient-to-br from-slate-600 to-slate-900 gap-2">
                <Video className="w-10 h-10" />
                <span className="text-sm font-medium">Video preview unavailable</span>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gradient-to-br from-slate-600 to-slate-900 gap-2">
            <Video className="w-10 h-10" />
            <span className="text-sm font-medium">Video preview unavailable</span>
          </div>
        )}

        {/* Play button overlay - shows on thumbnail, hidden when video is playing (YouTube-style) */}
        {(() => {
          // Show play button only when video is NOT playing
          const isVideoPlaying = shouldShowVideo && isPreviewReady && !previewError;
          return (
            <div
              className={cn(
                "absolute inset-0 pointer-events-none bg-black/40 transition-opacity flex items-center justify-center z-20",
                isVideoPlaying ? "opacity-0" : supportsHover && isHovering ? "opacity-100" : "opacity-0"
              )}
            >
              <span className="flex items-center justify-center rounded-full bg-white/80 text-slate-900 w-12 h-12 shadow-lg">
                <Play className="w-6 h-6" />
              </span>
            </div>
          );
        })()}
      </div>

      <div className={cn("p-4 space-y-2 flex-1", variant === "compact" && "p-3")}>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">{media.category}</span>
          {variant === "detailed" && meta.date && <span>{meta.date}</span>}
        </div>
        <h3 className={cn("font-semibold leading-tight text-base line-clamp-2 group-hover:text-primary transition-colors")}>
          {media.title}
        </h3>
        {variant === "detailed" && media.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{media.description}</p>
        )}
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>{meta.downloads} downloads</span>
          {variant === "detailed" ? <span>{meta.views} views</span> : <span>{media.type}</span>}
        </div>
      </div>
    </Link>
  );
}

function useSupportsHover() {
  const [supportsHover, setSupportsHover] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia === "undefined") {
      return;
    }
    const mediaQuery = window.matchMedia("(hover: hover)");
    setSupportsHover(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => setSupportsHover(event.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return supportsHover;
}


