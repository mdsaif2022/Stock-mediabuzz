import { useEffect, useState } from "react";

const FALLBACK_THUMBNAIL = "https://placehold.co/640x360?text=Video";
const thumbnailCache = new Map<string, string>();

type ThumbnailStatus = "idle" | "loading" | "ready" | "error";

export function useVideoThumbnail(videoUrl?: string, existing?: string | null) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(existing || undefined);
  const [status, setStatus] = useState<ThumbnailStatus>(existing ? "ready" : "idle");

  useEffect(() => {
    if (!videoUrl || existing) {
      setStatus(existing ? "ready" : "idle");
      return;
    }

    if (thumbnailCache.has(videoUrl)) {
      setThumbnailUrl(thumbnailCache.get(videoUrl));
      setStatus("ready");
      return;
    }

    let isCancelled = false;
    setStatus("loading");

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.preload = "metadata";
    video.src = videoUrl;

    const handleLoadedData = () => {
      if (isCancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        fallback();
        return;
      }

      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        thumbnailCache.set(videoUrl, dataUrl);
        setThumbnailUrl(dataUrl);
        setStatus("ready");
      } catch (error) {
        console.error("Failed to extract video thumbnail:", error);
        fallback();
      }
    };

    const handleError = () => {
      if (isCancelled) return;
      fallback();
    };

    const fallback = () => {
      setThumbnailUrl(FALLBACK_THUMBNAIL);
      setStatus("error");
    };

    video.addEventListener("loadeddata", handleLoadedData, { once: true });
    video.addEventListener("error", handleError, { once: true });

    return () => {
      isCancelled = true;
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("error", handleError);
      video.src = "";
    };
  }, [videoUrl, existing]);

  return {
    thumbnailUrl: thumbnailUrl || existing || FALLBACK_THUMBNAIL,
    status,
  };
}


