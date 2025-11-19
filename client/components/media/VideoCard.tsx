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

export function VideoCard({ media, to, variant = "detailed", className }: VideoCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isInView = useInView(cardRef, { threshold: 0.4 });
  const supportsHover = useSupportsHover();

  const [isHovering, setIsHovering] = useState(false);
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const { thumbnailUrl } = useVideoThumbnail(media.fileUrl, media.previewUrl);

  const shouldLoadVideo = isInView || isHovering;
  
  // Use proxy URL for video preview to avoid CORS issues
  // Only use proxy for videos, not other media types
  const isVideo = media.category?.toLowerCase() === "video";
  const videoUrl = (media.fileUrl && isVideo)
    ? `/api/media/preview/${media.id}` 
    : "";

  // Determine if video should be loaded and visible
  const shouldShowVideo = isHovering && supportsHover && videoUrl && !previewError;
  // Always set video src when videoUrl exists, but control loading with preload
  const videoSrc = videoUrl || "";

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !supportsHover) return;

    const handleTimeUpdate = () => {
      if (video.currentTime >= PREVIEW_DURATION) {
        video.pause();
        video.currentTime = 0;
        setIsHovering(false);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [supportsHover]);

  // Play/pause video based on hover state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo || !videoUrl) return;

    if (shouldShowVideo) {
      // When hovering, ensure video is loaded and try to play
      const tryPlay = async () => {
        try {
          // Reset video to start
          video.currentTime = 0;
          
          // If video is already loaded enough, play immediately
          if (video.readyState >= 2) { // HAVE_CURRENT_DATA
            await video.play();
          } else {
            // Wait for video to have enough data, then play
            const handleCanPlay = async () => {
              try {
                video.currentTime = 0;
                await video.play();
              } catch (err) {
                // Autoplay blocked or other error - silently fail
                console.warn("Video autoplay blocked:", err);
              }
            };
            
            // Try multiple events to catch when video is ready
            video.addEventListener('canplay', handleCanPlay, { once: true });
            video.addEventListener('loadeddata', handleCanPlay, { once: true });
            video.addEventListener('loadedmetadata', handleCanPlay, { once: true });
          }
        } catch (err) {
          // Autoplay blocked or other error - silently fail
          console.warn("Video play error:", err);
        }
      };
      
      // Ensure video src is set (it should be from JSX, but double-check)
      // video.src returns full URL, so check if it includes the videoUrl path
      const currentSrc = video.src || video.currentSrc || '';
      if (videoUrl && !currentSrc.includes(videoUrl)) {
        video.src = videoUrl;
      }
      // Load the video to start buffering
      video.load();
      // Try to play once loaded
      tryPlay();
    } else if (!isHovering || !supportsHover) {
      // Not hovering, pause and reset
      video.pause();
      video.currentTime = 0;
      setIsPreviewReady(false);
    }
  }, [shouldShowVideo, isHovering, supportsHover, videoUrl, isVideo]);

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
      onMouseEnter={() => supportsHover && setIsHovering(true)}
      onMouseLeave={() => supportsHover && setIsHovering(false)}
      onFocus={() => setIsHovering(false)}
    >
      <div className="relative aspect-video bg-slate-900">
        {media.fileUrl && isVideo ? (
          <>
            <video
              ref={videoRef}
              src={videoSrc}
              poster={thumbnailUrl}
              muted
              playsInline
              preload={shouldShowVideo ? "metadata" : "none"}
              className={cn("w-full h-full object-cover transition-opacity duration-200 absolute inset-0 z-10", {
                "opacity-0": !isPreviewReady || previewError || !shouldShowVideo,
                "opacity-100": isPreviewReady && !previewError && shouldShowVideo,
              })}
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
                // Video is buffering, keep it visible
                if (shouldShowVideo) {
                  setIsPreviewReady(true);
                }
              }}
              onError={(e) => {
                // Handle video errors - show thumbnail instead
                console.warn("Video preview error for media:", media.id, e);
                setPreviewError(true);
                setIsPreviewReady(false);
              }}
            />
            {/* Always show thumbnail as fallback - visible when video is not playing */}
            {thumbnailUrl && (
              <img
                src={thumbnailUrl}
                alt={media.title}
                className={cn("absolute inset-0 w-full h-full object-cover transition-opacity duration-200 z-0", {
                  "opacity-0": shouldShowVideo && isPreviewReady && !previewError,
                  "opacity-100": !shouldShowVideo || !isPreviewReady || previewError,
                })}
                loading="lazy"
                onError={() => {
                  // If thumbnail also fails, show unavailable message
                  setPreviewError(true);
                }}
              />
            )}
            {/* Only show unavailable if both video and thumbnail fail */}
            {previewError && !thumbnailUrl && (
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

        <div
          className={cn(
            "absolute inset-0 pointer-events-none bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center",
            !supportsHover && "opacity-0"
          )}
        >
          <span className="flex items-center justify-center rounded-full bg-white/80 text-slate-900 w-12 h-12 shadow-lg">
            <Play className="w-6 h-6" />
          </span>
        </div>
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


