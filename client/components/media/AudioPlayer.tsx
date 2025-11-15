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

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [sourceReady]);

  const seekBy = (offset: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(Math.max(audio.currentTime + offset, 0), audio.duration || duration);
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

        <audio
          ref={audioRef}
          src={sourceReady}
          preload={preload}
          controls
          className="w-full accent-primary"
        />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatMediaTimestamp(currentTime)}</span>
          <span>{formatMediaTimestamp(duration)}</span>
        </div>

        <div className="flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => seekBy(-10)}
              className="flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 hover:bg-primary/20 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> 10s
            </button>
            <button
              type="button"
              onClick={() => seekBy(10)}
              className="flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 hover:bg-primary/20 transition-colors"
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


