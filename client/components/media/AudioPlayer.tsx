import { useEffect, useRef, useState } from "react";
import { RotateCcw, RotateCw, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/useInView";
import { formatMediaTimestamp } from "@/lib/media";

interface AudioPlayerProps {
  src: string;
  title?: string;
  preload?: "none" | "metadata" | "auto";
  className?: string;
}

export function AudioPlayer({ src, title, preload = "metadata", className }: AudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDoubleClickRef = useRef(false);
  const isInView = useInView(containerRef, { threshold: 0.1 });

  const [sourceReady, setSourceReady] = useState<string | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (isInView) {
      setSourceReady(src);
    }
  }, [isInView, src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);

    // Disable context menu to prevent download option
    const preventContextMenu = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("contextmenu", preventContextMenu);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("contextmenu", preventContextMenu);
    };
  }, [sourceReady]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  const seekBy = (offset: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Check if media is ready and has valid duration
    const mediaDuration = audio.duration;
    const validDuration = (mediaDuration && isFinite(mediaDuration) && mediaDuration > 0) 
      ? mediaDuration 
      : (duration && isFinite(duration) && duration > 0) 
        ? duration 
        : null;
    
    // If no valid duration, we can still seek but with no upper bound
    const currentTime = audio.currentTime || 0;
    const newTime = currentTime + offset;
    
    if (validDuration !== null) {
      audio.currentTime = Math.min(Math.max(newTime, 0), validDuration);
    } else {
      // Even without duration, we can seek forward/backward from current position
      audio.currentTime = Math.max(newTime, 0);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full rounded-2xl overflow-hidden border border-border shadow-md bg-white dark:bg-slate-900",
        className
      )}
    >
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3 text-primary">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold">Audio Preview</p>
            {title && <p className="text-xs text-muted-foreground line-clamp-1">{title}</p>}
          </div>
        </div>

        <div className="relative">
          <audio
            ref={audioRef}
            src={sourceReady}
            preload={preload}
            controls
            controlsList="nodownload noplaybackrate nofullscreen"
            crossOrigin="anonymous"
            onError={(e) => {
              console.error("Audio playback error:", e);
              const audio = e.currentTarget;
              console.error("Audio error details:", {
                error: audio.error,
                networkState: audio.networkState,
                readyState: audio.readyState,
                src: audio.src,
              });
            }}
            className="w-full accent-primary"
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }}
          />
          <style>{`
            audio::-webkit-media-controls-download-button {
              display: none !important;
            }
            audio::-webkit-media-controls-enclosure {
              overflow: hidden;
            }
          `}</style>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatMediaTimestamp(currentTime)}</span>
          <span>{formatMediaTimestamp(duration)}</span>
        </div>

        <div className="flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                if (isDoubleClickRef.current) {
                  isDoubleClickRef.current = false;
                  return;
                }
                clickTimeoutRef.current = setTimeout(() => {
                  if (!isDoubleClickRef.current) {
                    seekBy(-10);
                  }
                  clickTimeoutRef.current = null;
                }, 300);
              }}
              onDoubleClick={(e) => {
                e.preventDefault();
                isDoubleClickRef.current = true;
                if (clickTimeoutRef.current) {
                  clearTimeout(clickTimeoutRef.current);
                  clickTimeoutRef.current = null;
                }
                seekBy(-30);
                // Reset flag after a short delay
                setTimeout(() => {
                  isDoubleClickRef.current = false;
                }, 100);
              }}
              className="flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 hover:bg-primary/20 transition-colors select-none"
            >
              <RotateCcw className="w-4 h-4" /> 10s
            </button>
            <button
              type="button"
              onClick={(e) => {
                if (isDoubleClickRef.current) {
                  isDoubleClickRef.current = false;
                  return;
                }
                clickTimeoutRef.current = setTimeout(() => {
                  if (!isDoubleClickRef.current) {
                    seekBy(10);
                  }
                  clickTimeoutRef.current = null;
                }, 300);
              }}
              onDoubleClick={(e) => {
                e.preventDefault();
                isDoubleClickRef.current = true;
                if (clickTimeoutRef.current) {
                  clearTimeout(clickTimeoutRef.current);
                  clickTimeoutRef.current = null;
                }
                seekBy(30);
                // Reset flag after a short delay
                setTimeout(() => {
                  isDoubleClickRef.current = false;
                }, 100);
              }}
              className="flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 hover:bg-primary/20 transition-colors select-none"
            >
              10s <RotateCw className="w-4 h-4" />
            </button>
          </div>

          <span className="text-xs text-muted-foreground">{isPlaying ? "Playing" : "Paused"}</span>
        </div>
      </div>
    </div>
  );
}


