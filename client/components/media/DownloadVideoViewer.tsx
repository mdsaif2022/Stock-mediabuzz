import { Media } from "@shared/api";
import { useRef } from "react";
import { Download } from "lucide-react";
import { useVideoThumbnail } from "@/hooks/useVideoThumbnail";
import { useInView } from "@/hooks/useInView";
import { VideoPlayer } from "./VideoPlayer";

interface DownloadVideoViewerProps {
  media: Media;
}

export function DownloadVideoViewer({ media }: DownloadVideoViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef);
  const { thumbnailUrl } = useVideoThumbnail(media.fileUrl, media.previewUrl);

  return (
    <div ref={containerRef} className="aspect-video rounded-lg overflow-hidden relative shadow-lg bg-slate-900">
      {isInView ? (
        <VideoPlayer src={media.fileUrl} poster={thumbnailUrl} preload="metadata" autoPlay={false} className="h-full" />
      ) : (
        <div className="w-full h-full relative">
          <img
            src={thumbnailUrl}
            alt={media.title}
            className="w-full h-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white gap-4">
            <Download className="w-10 h-10" />
            <p className="font-semibold text-sm sm:text-base text-center px-6">
              Video ready. Scroll into view to load the player.
            </p>
          </div>
        </div>
      )}
      {media.duration && (
        <span className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-0.5 rounded text-xs font-medium">
          {media.duration}
        </span>
      )}
    </div>
  );
}


