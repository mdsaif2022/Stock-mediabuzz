import { RequestHandler } from "express";
import { DownloadResponse } from "@shared/api";
import { mediaDatabase } from "./media.js";

// Track downloads
export const downloadLog: Array<{ mediaId: string; userId: string; timestamp: string }> = [];

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
    
    // Determine file extension - check category first (most reliable), then URL, then content type
    let fileExtension: string | undefined;
    const mediaCategory = (media.category || '').toLowerCase();
    const urlLower = media.fileUrl.toLowerCase();
    
    // Priority 1: Check media category first (most reliable)
    if (mediaCategory === 'apk') {
      // For APK category, check URL to determine if it's APK or XAPK
      if (urlLower.endsWith('.xapk')) {
        fileExtension = 'xapk';
      } else if (urlLower.endsWith('.apk')) {
        fileExtension = 'apk';
      } else if (urlLower.endsWith('.zip')) {
        fileExtension = 'zip';
      } else {
        // Default to apk if category is apk but extension unclear
        fileExtension = 'apk';
      }
    } else if (mediaCategory === 'software') {
      // Software downloads should be ZIP by default
      fileExtension = 'zip';
    } else if (mediaCategory === 'video') {
      if (urlLower.endsWith('.webm')) {
        fileExtension = 'webm';
      } else if (urlLower.endsWith('.mov')) {
        fileExtension = 'mov';
      } else if (urlLower.endsWith('.avi')) {
        fileExtension = 'avi';
      } else {
        fileExtension = 'mp4';
      }
    } else if (mediaCategory === 'image') {
      if (urlLower.endsWith('.png')) {
        fileExtension = 'png';
      } else if (urlLower.endsWith('.gif')) {
        fileExtension = 'gif';
      } else if (urlLower.endsWith('.webp')) {
        fileExtension = 'webp';
      } else {
        fileExtension = 'jpg';
      }
    } else if (mediaCategory === 'audio') {
      if (urlLower.endsWith('.wav')) {
        fileExtension = 'wav';
      } else if (urlLower.endsWith('.ogg')) {
        fileExtension = 'ogg';
      } else {
        fileExtension = 'mp3';
      }
    }
    
    // Priority 2: If not determined by category, check URL extension
    if (!fileExtension) {
      const urlParts = media.fileUrl.split('.');
      if (urlParts.length > 1) {
        const lastPart = urlParts[urlParts.length - 1].split('?')[0].split('#')[0].toLowerCase();
        // Allow longer extensions (xapk is 4 chars, apk is 3, zip is 3)
        if (lastPart && lastPart.length >= 2 && lastPart.length <= 10) {
          fileExtension = lastPart;
        }
      }
    }
    if (!fileExtension && urlLower.endsWith('.zip')) {
      fileExtension = 'zip';
    }
    
    // Priority 3: If still not determined, check content type
    if (!fileExtension) {
      if (contentType.includes('application/vnd.android.package-archive')) {
        // Check URL to distinguish APK vs XAPK
        if (urlLower.endsWith('.xapk')) {
          fileExtension = 'xapk';
        } else {
          fileExtension = 'apk';
        }
      } else if (contentType.includes('application/zip')) {
        fileExtension = 'zip';
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
      }
    }
    
    // Priority 4: Default fallback based on category or generic binary
    if (!fileExtension) {
      if (mediaCategory === 'apk') {
        fileExtension = 'apk';
      } else if (mediaCategory === 'software') {
        fileExtension = 'zip';
      } else if (mediaCategory === 'software') {
        fileExtension = 'zip';
      } else if (mediaCategory === 'video') {
        fileExtension = 'mp4';
      } else if (mediaCategory === 'image') {
        fileExtension = 'jpg';
      } else if (mediaCategory === 'audio') {
        fileExtension = 'mp3';
      } else {
        fileExtension = 'bin'; // Generic binary fallback
      }
    }

    const filename = `${media.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${fileExtension}`;

    // Set the correct Content-Type based on the file extension we determined
    // CRITICAL: Browsers use Content-Type to determine file extension, which can override the filename
    // So we MUST set the correct Content-Type based on our determined extension, not the server response
    let correctContentType: string;
    if (fileExtension === 'apk') {
      correctContentType = 'application/vnd.android.package-archive';
    } else if (fileExtension === 'xapk') {
      correctContentType = 'application/zip'; // XAPK is a ZIP file
    } else if (fileExtension === 'zip') {
      correctContentType = 'application/zip';
    } else if (fileExtension === 'mp4') {
      correctContentType = 'video/mp4';
    } else if (fileExtension === 'webm') {
      correctContentType = 'video/webm';
    } else if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
      correctContentType = 'image/jpeg';
    } else if (fileExtension === 'png') {
      correctContentType = 'image/png';
    } else if (fileExtension === 'gif') {
      correctContentType = 'image/gif';
    } else if (fileExtension === 'webp') {
      correctContentType = 'image/webp';
    } else if (fileExtension === 'mp3') {
      correctContentType = 'audio/mpeg';
    } else if (fileExtension === 'wav') {
      correctContentType = 'audio/wav';
    } else if (fileExtension === 'ogg') {
      correctContentType = 'audio/ogg';
    } else {
      // Fallback to binary if unknown
      correctContentType = 'application/octet-stream';
    }

    // Log for debugging
    console.log(`[Download] Media ID: ${mediaId}, Category: ${mediaCategory}, Determined extension: ${fileExtension}, Content-Type: ${correctContentType}, Filename: ${filename}`);

    // Set headers for transfer behavior
    res.setHeader('Content-Type', correctContentType);
    // Always force download (attachment) to ensure files download instead of opening in browser
    // CRITICAL: Use simple filename format for maximum browser compatibility
    // The browser will use this filename when Content-Type matches the extension
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    const contentLength = fileResponse.headers.get('content-length') || undefined;
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    // Prevent caching to ensure fresh headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

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

    // Get range request header
    const range = req.headers.range;
    
    // CRITICAL: Check if this is a thumbnail request (no range or small range at start)
    // Thumbnail requests only need first 2MB for metadata extraction
    const isThumbnailRequest = !range || (range.startsWith('bytes=0-') && parseInt(range.split('-')[1] || '0') < 2 * 1024 * 1024);
    
    // For thumbnail generation, fetch only first chunk (2MB)
    if (isThumbnailRequest) {
      const maxChunkSize = 2 * 1024 * 1024; // 2MB
      const thumbnailRange = `bytes=0-${maxChunkSize}`;
      
      try {
        const thumbnailResponse = await fetch(media.fileUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Range': thumbnailRange,
          },
        });
        
        if (thumbnailResponse.ok || thumbnailResponse.status === 206) {
          const contentType = thumbnailResponse.headers.get('content-type') || 'video/mp4';
          
          // Set headers
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Range');
          res.setHeader('Content-Type', contentType);
          res.setHeader('Accept-Ranges', 'bytes');
          res.setHeader('Cache-Control', 'public, max-age=3600');
          
          if (thumbnailResponse.status === 206) {
            const contentRange = thumbnailResponse.headers.get('content-range');
            const contentLength = thumbnailResponse.headers.get('content-length');
            if (contentRange) res.setHeader('Content-Range', contentRange);
            if (contentLength) res.setHeader('Content-Length', contentLength);
            res.status(206);
          }
          
          const buffer = await thumbnailResponse.arrayBuffer();
          res.send(Buffer.from(buffer));
          return;
        }
      } catch (thumbErr: any) {
        console.error("Thumbnail request error:", thumbErr);
        // Fall through to full video proxy
      }
    }
    
    // For video playback (not thumbnail), we need proper range request support
    // CRITICAL: Check if this is a Cloudinary video
    const isCloudinaryVideo = media.fileUrl.includes('cloudinary.com') || media.fileUrl.includes('res.cloudinary.com');
    
    // For Cloudinary videos in production, use direct URL with CORS headers
    // Cloudinary supports range requests natively
    if (isCloudinaryVideo) {
      // Set CORS headers and redirect to Cloudinary
      // But we need to proxy it to add CORS headers since Cloudinary might not have them
      // Actually, let's proxy it to ensure CORS works
    }
    
    // Fetch the video from origin with range support
    let fileResponse: Response;
    try {
      const fetchOptions: RequestInit = {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      };
      
      // Add range header if present (for video playback seeking)
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

    if (!fileResponse.ok && fileResponse.status !== 206) {
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
    
    // Handle range requests for video seeking (CRITICAL for video playback)
    if (range && fileResponse.status === 206) {
      // Partial content response - this is needed for video playback
      const contentRange = fileResponse.headers.get('content-range');
      const contentLength = fileResponse.headers.get('content-length');
      
      if (contentRange) {
        res.setHeader('Content-Range', contentRange);
        res.status(206); // Partial Content - required for range requests
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

    // CRITICAL: For video playback, we need to stream properly
    // But Vercel serverless functions have limits, so we'll stream in chunks
    try {
      // For small videos (< 5MB), load into buffer
      // For larger videos, this might fail but we'll try
      const buffer = await fileResponse.arrayBuffer();
      
      // Check buffer size - warn but don't block for video playback
      // (thumbnails are handled separately above)
      if (buffer.byteLength > 50 * 1024 * 1024) { // 50MB limit for video playback
        res.status(413).json({ 
          error: "Video too large for serverless function",
          message: "Video exceeds 50MB limit. Consider using direct video URL or CDN."
        });
        return;
      }
      
      res.send(Buffer.from(buffer));
    } catch (bufferError: any) {
      console.error("Video buffer error:", bufferError);
      res.status(500).json({ 
        error: "Failed to load video", 
        message: "Video may be too large for serverless function. Consider using direct URL or CDN."
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
