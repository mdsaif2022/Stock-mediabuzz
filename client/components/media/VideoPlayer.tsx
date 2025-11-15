import { useEffect, useRef, useState } from "react";
import { RotateCcw, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMediaTimestamp } from "@/lib/media";

interface VideoPlayerProps {
  src: string;
  poster?: string | null;
  preload?: "none" | "metadata" | "auto";
  className?: string;
}

export function VideoPlayer({ src, poster, preload = "metadata", className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const seekBy = (offset: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(video.currentTime + offset, 0), video.duration || duration);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration || 0);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, []);

  return (
    <div ref={containerRef} className={cn("w-full rounded-xl overflow-hidden shadow-md bg-black", className)}>
      <video
        ref={videoRef}
        src={src}
        poster={poster ?? undefined}
        preload={preload}
        controls
        className="w-full h-full bg-black"
      />

      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-slate-900 text-white text-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => seekBy(-10)}
            className="flex items-center gap-1 rounded-full bg-white/10 hover:bg-white/20 px-3 py-1 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> 10s
          </button>
          <button
            type="button"
            onClick={() => seekBy(10)}
            className="flex items-center gap-1 rounded-full bg-white/10 hover:bg-white/20 px-3 py-1 transition-colors"
          >
            10s <RotateCw className="w-4 h-4" />
          </button>
        </div>

        <div className="font-mono text-xs tabular-nums text-white/80">
          {formatMediaTimestamp(currentTime)} / {formatMediaTimestamp(duration)}
        </div>

        <div className="text-xs text-white/60">{isPlaying ? "Playing" : "Paused"}</div>
      </div>
    </div>
  );
}


