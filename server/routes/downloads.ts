import { RequestHandler } from "express";
import { DownloadResponse } from "@shared/api";
import { mediaDatabase } from "./media.js";

// Track downloads
const downloadLog: Array<{ mediaId: string; userId: string; timestamp: string }> = [];

// Proxy download file to bypass CORS
export const proxyDownload: RequestHandler = async (req, res) => {
  const { mediaId } = req.params;
  
  if (!mediaId) {
    res.status(400).json({ error: "Media ID is required" });
    return;
  }

  try {
    // Find media in database
    const media = mediaDatabase.find((m) => m.id === mediaId);
    
    if (!media) {
      res.status(404).json({ error: "Media not found" });
      return;
    }

    // Fetch the file from origin
    let fileResponse: Response;
    try {
      fileResponse = await fetch(media.fileUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });
    } catch (fetchErr: any) {
      // Network error or invalid URL: fallback to redirect so user gets something
      const fallbackUrl = media.fileUrl || media.previewUrl;
      if (fallbackUrl) {
        res.redirect(fallbackUrl);
        return;
      }
      throw fetchErr;
    }

    if (!fileResponse.ok) {
      // Upstream returned non-200; try redirecting
      const fallbackUrl = media.fileUrl || media.previewUrl;
      if (fallbackUrl) {
        res.redirect(fallbackUrl);
        return;
      }
      throw new Error(`Failed to fetch file: ${fileResponse.status} ${fileResponse.statusText}`);
    }

    // Get content type
    const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';
    
    // Determine filename
    let fileExtension = 'mp4';
    const urlParts = media.fileUrl.split('.');
    if (urlParts.length > 1) {
      const lastPart = urlParts[urlParts.length - 1].split('?')[0].split('#')[0];
      if (lastPart && lastPart.length <= 5) {
        fileExtension = lastPart.toLowerCase();
      }
    }
    
    // Try to get extension from content type or URL
    const urlLower = media.fileUrl.toLowerCase();
    if (urlLower.endsWith('.apk')) {
      fileExtension = 'apk';
    } else if (urlLower.endsWith('.xapk')) {
      fileExtension = 'xapk';
    } else if (contentType.includes('image/jpeg') || contentType.includes('image/jpg')) {
      fileExtension = 'jpg';
    } else if (contentType.includes('image/png')) {
      fileExtension = 'png';
    } else if (contentType.includes('image/gif')) {
      fileExtension = 'gif';
    } else if (contentType.includes('image/webp')) {
      fileExtension = 'webp';
    } else if (contentType.includes('video/mp4')) {
      fileExtension = 'mp4';
    } else if (contentType.includes('video/webm')) {
      fileExtension = 'webm';
    } else if (contentType.includes('audio/mpeg') || contentType.includes('audio/mp3')) {
      fileExtension = 'mp3';
    } else if (contentType.includes('audio/wav')) {
      fileExtension = 'wav';
    } else if (contentType.includes('audio/ogg')) {
      fileExtension = 'ogg';
    } else if (contentType.includes('application/vnd.android.package-archive')) {
      fileExtension = 'apk';
    }

    const filename = `${media.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${fileExtension}`;

    // Set headers for transfer behavior
    res.setHeader('Content-Type', contentType);
    // Always force download (attachment) to ensure files download instead of opening in browser
    // This works better with the download attribute on the client side
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    const contentLength = fileResponse.headers.get('content-length') || undefined;
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    res.setHeader('Cache-Control', 'no-cache');

    // Stream the file to the response
    const buffer = await fileResponse.arrayBuffer();
    res.send(Buffer.from(buffer));

    // Log the download
    const userId = (req as any).user?.id || "anonymous";
    downloadLog.push({
      mediaId,
      userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Proxy download error:", error);
    res.status(500).json({ error: "Failed to download file", message: error.message });
  }
};

// Trigger download with ad display (legacy endpoint)
export const initiateDownload: RequestHandler = (req, res) => {
  const { mediaId } = req.params;
  const userId = (req as any).user?.id || "anonymous";

  if (!mediaId) {
    res.status(400).json({ error: "Media ID is required" });
    return;
  }

  // Find media to get the file URL
  const media = mediaDatabase.find((m) => m.id === mediaId);

  if (!media) {
    res.status(404).json({ error: "Media not found" });
    return;
  }

  // Log the download
  downloadLog.push({
    mediaId,
    userId,
    timestamp: new Date().toISOString(),
  });

  // Return proxy download URL
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const response: DownloadResponse = {
    downloadUrl: `/api/download/proxy/${mediaId}`,
    expiresAt: expiresAt.toISOString(),
  };

  res.json(response);
};

// Get download history for user
export const getDownloadHistory: RequestHandler = (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userDownloads = downloadLog.filter((d) => d.userId === userId);

  res.json({
    totalDownloads: userDownloads.length,
    downloads: userDownloads.slice(-20), // Last 20 downloads
  });
};

// Get download statistics (admin only)
export const getDownloadStats: RequestHandler = (req, res) => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const stats = {
    totalDownloads: downloadLog.length,
    todayDownloads: downloadLog.filter((d) => {
      const date = new Date(d.timestamp);
      const today = new Date();
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    }).length,
    uniqueUsers: new Set(downloadLog.map((d) => d.userId)).size,
    topDownloads: getTopDownloads(),
  };

  res.json(stats);
};

// Proxy video for preview (streaming, not download) - bypasses CORS
// CRITICAL FIX: For Vercel/serverless, we need to handle range requests properly
// and avoid loading entire video into memory
export const proxyVideoPreview: RequestHandler = async (req, res) => {
  // Handle OPTIONS request for CORS preflight (important for production)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    res.status(204).end();
    return;
  }

  const { mediaId } = req.params;
  
  if (!mediaId) {
    res.status(400).json({ error: "Media ID is required" });
    return;
  }

  try {
    // Find media in database
    const media = mediaDatabase.find((m) => m.id === mediaId);
    
    if (!media) {
      res.status(404).json({ error: "Media not found" });
      return;
    }

    // Only proxy video files
    const isVideo = media.category?.toLowerCase() === "video" || 
                    media.fileUrl?.match(/\.(mp4|webm|ogg|mov|avi)$/i);
    
    if (!isVideo) {
      res.status(400).json({ error: "Media is not a video" });
      return;
    }

    // If fileUrl is a placeholder or invalid, return 404
    if (!media.fileUrl || media.fileUrl.includes('example.com') || media.fileUrl.startsWith('data:')) {
      res.status(404).json({ error: "Video file not available" });
      return;
    }

    // CRITICAL: Check if this is a Cloudinary video - use Cloudinary transformation for better performance
    const isCloudinaryVideo = media.fileUrl.includes('cloudinary.com') || media.fileUrl.includes('res.cloudinary.com');
    
    // For Cloudinary videos, redirect to Cloudinary's optimized streaming URL
    if (isCloudinaryVideo) {
      // Cloudinary videos support range requests natively
      // Just redirect to the Cloudinary URL with proper CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.redirect(302, media.fileUrl);
      return;
    }

    // For non-Cloudinary videos, proxy with proper range request handling
    const range = req.headers.range;
    
    // Fetch the video from origin with range support
    let fileResponse: Response;
    try {
      const fetchOptions: RequestInit = {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      };
      
      // Add range header if present
      if (range) {
        fetchOptions.headers = {
          ...fetchOptions.headers,
          'Range': range,
        };
      }
      
      fileResponse = await fetch(media.fileUrl, fetchOptions);
    } catch (fetchErr: any) {
      console.error("Video preview proxy error:", fetchErr);
      res.status(500).json({ error: "Failed to fetch video", message: fetchErr.message });
      return;
    }

    if (!fileResponse.ok) {
      res.status(fileResponse.status).json({ 
        error: "Failed to fetch video", 
        message: fileResponse.statusText 
      });
      return;
    }

    // Get content type
    const contentType = fileResponse.headers.get('content-type') || 'video/mp4';
    
    // Set headers for video streaming (not download)
    // CRITICAL: Add CORS headers for production (Vercel)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Handle range requests for video seeking
    if (range && fileResponse.status === 206) {
      // Partial content response
      const contentRange = fileResponse.headers.get('content-range');
      const contentLength = fileResponse.headers.get('content-length');
      
      if (contentRange) {
        res.setHeader('Content-Range', contentRange);
        res.status(206); // Partial Content
      }
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }
    } else {
      const contentLength = fileResponse.headers.get('content-length');
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }
    }

    // CRITICAL FIX: For Vercel/serverless, we need to handle this carefully
    // The issue is that loading entire video into memory can exceed function limits
    // For thumbnail generation, we only need a small portion of the video
    // So we'll fetch a small chunk (first 2MB) which should be enough for metadata + first frame
    
    // Check if this is a range request for thumbnail generation (small chunk)
    const isThumbnailRequest = !range || range.includes('bytes=0-');
    const maxChunkSize = 2 * 1024 * 1024; // 2MB should be enough for thumbnail
    
    if (isThumbnailRequest || !range) {
      // For thumbnail generation, fetch only first chunk
      const thumbnailRange = `bytes=0-${maxChunkSize}`;
      const thumbnailResponse = await fetch(media.fileUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Range': thumbnailRange,
        },
      });
      
      if (thumbnailResponse.ok || thumbnailResponse.status === 206) {
        const buffer = await thumbnailResponse.arrayBuffer();
        res.send(Buffer.from(buffer));
        return;
      }
    }
    
    // For full video requests, try to stream (but this might fail for large videos in Vercel)
    // In production, consider using Cloudinary or CDN for video streaming
    try {
      const buffer = await fileResponse.arrayBuffer();
      // Check buffer size - if too large, return error suggesting CDN
      if (buffer.byteLength > 10 * 1024 * 1024) { // 10MB limit
        res.status(413).json({ 
          error: "Video too large for serverless function",
          message: "Please use direct video URL or CDN for large videos"
        });
        return;
      }
      res.send(Buffer.from(buffer));
    } catch (bufferError: any) {
      console.error("Buffer error:", bufferError);
      res.status(500).json({ 
        error: "Failed to load video", 
        message: "Video may be too large for serverless function. Consider using direct URL."
      });
    }
  } catch (error: any) {
    console.error("Video preview proxy error:", error);
    res.status(500).json({ error: "Failed to stream video", message: error.message });
  }
};

// Helper function to get top downloaded media
function getTopDownloads() {
  const counts: Record<string, number> = {};

  downloadLog.forEach((d) => {
    counts[d.mediaId] = (counts[d.mediaId] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([mediaId, count]) => ({
      mediaId,
      downloads: count,
    }))
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 10);
}
