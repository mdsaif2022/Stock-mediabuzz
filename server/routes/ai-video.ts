import { RequestHandler } from "express";
import { Database } from "../utils/database.js";
import { AIGeneratedVideo, AIVideoGenerateRequest } from "@shared/api";

// Create database instance for AI videos
const aiVideoDatabase = new Database<AIGeneratedVideo>("ai_videos", []);

// Get all AI videos from database
async function getAIVideoDatabase(): Promise<AIGeneratedVideo[]> {
  try {
    return await aiVideoDatabase.load();
  } catch (error) {
    console.error("Failed to fetch AI videos from database:", error);
    return [];
  }
}

// Save AI videos to database
async function saveAIVideoDatabase(videos: AIGeneratedVideo[]): Promise<void> {
  try {
    await aiVideoDatabase.save(videos);
  } catch (error) {
    console.error("Failed to save AI videos to database:", error);
    throw error;
  }
}

// Save a single AI video (add or update)
async function saveAIVideo(video: AIGeneratedVideo): Promise<void> {
  try {
    const videos = await getAIVideoDatabase();
    const index = videos.findIndex((v) => v.id === video.id);
    
    if (index !== -1) {
      videos[index] = video;
    } else {
      videos.push(video);
    }
    
    await saveAIVideoDatabase(videos);
  } catch (error) {
    console.error("Failed to save AI video:", error);
    throw error;
  }
}

// Generate AI Video
export const generateVideo: RequestHandler = async (req, res) => {
  try {
    const { prompt, duration = 10, style = "realistic", aspectRatio = "16:9" }: AIVideoGenerateRequest = req.body;
    const user = (req as any).user;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        error: "Prompt is required",
        message: "Please provide a video generation prompt",
      });
    }

    // Create a new video generation record
    const videoId = Date.now().toString() + Math.random().toString(36).slice(2, 9);
    const newVideo: AIGeneratedVideo = {
      id: videoId,
      userId: user?.id || user?.uid || undefined,
      prompt: prompt.trim(),
      status: "processing",
      duration: typeof duration === "number" ? duration : parseInt(String(duration)) || 10,
      style: style || "realistic",
      aspectRatio: aspectRatio || "16:9",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to database
    const videos = await getAIVideoDatabase();
    videos.push(newVideo);
    await saveAIVideoDatabase(videos);

    // Use the configured provider (defaults to "demo" if not set - no API needed!)
    const provider = process.env.DEFAULT_AI_VIDEO_PROVIDER?.toLowerCase() || "demo";
    
    // Start video generation based on provider (async, don't wait)
    generateVideoWithProvider(provider, prompt.trim(), duration, aspectRatio, videoId).catch((error) => {
      console.error(`[${provider}] Video generation error:`, error);
      // Mark as failed
      saveAIVideo({
        ...newVideo,
        status: "failed",
        errorMessage: error.message || "Video generation failed",
        updatedAt: new Date().toISOString(),
      }).catch((saveError) => {
        console.error("Failed to save failed video:", saveError);
      });
    });

    res.json({
      success: true,
      video: newVideo,
      message: "Video generation started. This may take a few minutes.",
    });
  } catch (error: any) {
    console.error("Generate video error:", error);
    res.status(500).json({
      error: "Generation failed",
      message: error.message || "An error occurred while generating the video",
    });
  }
};

// Helper function to generate video with different providers
async function generateVideoWithProvider(
  provider: string,
  prompt: string,
  duration: number,
  aspectRatio: string,
  videoId: string
): Promise<void> {
  let taskId: string;
  let checkStatusFunction: (id: string) => Promise<any>;
  
  switch (provider) {
    case "demo":
      // Demo mode - no API needed, generates placeholder videos
      const { generateVideoDemo, checkDemoStatus } = await import("../services/aiVideoProviders.js");
      const demoResult = await generateVideoDemo(prompt, duration, aspectRatio);
      taskId = demoResult.taskId;
      checkStatusFunction = checkDemoStatus;
      break;
      
    case "ffmpeg":
      // FFmpeg local generation - requires FFmpeg installed
      const { generateVideoWithFFmpeg, checkFFmpegStatus } = await import("../services/aiVideoProviders.js");
      const ffmpegResult = await generateVideoWithFFmpeg(prompt, duration, aspectRatio);
      taskId = ffmpegResult.taskId;
      checkStatusFunction = checkFFmpegStatus;
      break;
      
    case "shotstack":
      // Shotstack - free developer sandbox (no credit card needed)
      const { generateVideoWithShotstack, checkShotstackStatus } = await import("../services/aiVideoProviders.js");
      const shotstackResult = await generateVideoWithShotstack(prompt, duration, aspectRatio);
      taskId = shotstackResult.taskId;
      checkStatusFunction = checkShotstackStatus;
      break;
      
    case "veo2":
      // Veo 2 API - 10 credits/month free
      const { generateVideoWithVeo2, checkVeo2Status } = await import("../services/aiVideoProviders.js");
      const veo2Result = await generateVideoWithVeo2(prompt, duration, aspectRatio);
      taskId = veo2Result.taskId;
      checkStatusFunction = checkVeo2Status;
      break;
      
    case "mozify":
      // Mozify - Unified API for multiple AI models (Sora, Veo, etc.)
      const { generateVideoWithMozify, checkMozifyStatus } = await import("../services/aiVideoProviders.js");
      const mozifyResult = await generateVideoWithMozify(prompt, duration, aspectRatio);
      taskId = mozifyResult.taskId;
      checkStatusFunction = checkMozifyStatus;
      break;
      
    case "runway":
      // Runway ML - 125 free credits on signup
      const { generateVideoWithRunwayML, checkRunwayMLStatus } = await import("../services/aiVideoProviders.js");
      const runwayResult = await generateVideoWithRunwayML(prompt, duration, aspectRatio);
      taskId = runwayResult.taskId;
      checkStatusFunction = checkRunwayMLStatus;
      break;
      
    default:
      // Fallback to demo mode
      const { generateVideoDemo: demoFallback, checkDemoStatus: checkDemoFallback } = await import("../services/aiVideoProviders.js");
      const fallbackResult = await demoFallback(prompt, duration, aspectRatio);
      taskId = fallbackResult.taskId;
      checkStatusFunction = checkDemoFallback;
  }
  
  // Poll for completion (background)
  pollVideoStatus(taskId, videoId, checkStatusFunction);
}

// Helper function to poll video status
async function pollVideoStatus(taskId: string, videoId: string, checkStatus: (id: string) => Promise<any>) {
  const maxAttempts = 60; // Poll for 5 minutes (5 second intervals)
  let attempts = 0;
  
  const interval = setInterval(async () => {
    attempts++;
    
    try {
      const status = await checkStatus(taskId);
      
      const videos = await getAIVideoDatabase();
      const videoIndex = videos.findIndex((v) => v.id === videoId);
      
      if (videoIndex !== -1) {
        if (status.status === "completed" && status.videoUrl) {
          videos[videoIndex] = {
            ...videos[videoIndex],
            status: "completed",
            videoUrl: status.videoUrl,
            thumbnailUrl: status.videoUrl,
            updatedAt: new Date().toISOString(),
          };
          await saveAIVideo(videos[videoIndex]);
          clearInterval(interval);
        } else if (status.status === "failed" || status.error) {
          videos[videoIndex] = {
            ...videos[videoIndex],
            status: "failed",
            errorMessage: status.error || "Generation failed",
            updatedAt: new Date().toISOString(),
          };
          await saveAIVideo(videos[videoIndex]);
          clearInterval(interval);
        }
        // If still processing, continue polling
      }
    } catch (error) {
      console.error("Status check error:", error);
    }
    
    if (attempts >= maxAttempts) {
      clearInterval(interval);
      // Mark as timeout
      try {
        const videos = await getAIVideoDatabase();
        const videoIndex = videos.findIndex((v) => v.id === videoId);
        if (videoIndex !== -1) {
          videos[videoIndex] = {
            ...videos[videoIndex],
            status: "failed",
            errorMessage: "Generation timeout - video generation took too long",
            updatedAt: new Date().toISOString(),
          };
          await saveAIVideo(videos[videoIndex]);
        }
      } catch (error) {
        console.error("Failed to mark as timeout:", error);
      }
    }
  }, 5000); // Check every 5 seconds
}

// Get video status
export const getVideoStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const videos = await getAIVideoDatabase();
    const video = videos.find((v) => v.id === id);

    if (!video) {
      return res.status(404).json({
        error: "Video not found",
        message: "The requested video does not exist",
      });
    }

    res.json({
      success: true,
      video,
    });
  } catch (error: any) {
    console.error("Get video status error:", error);
    res.status(500).json({
      error: "Failed to get video status",
      message: error.message || "An error occurred",
    });
  }
};

// Get user's generated videos
export const getUserVideos: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const videos = await getAIVideoDatabase();
    
    // Filter by user if authenticated, otherwise return empty
    let userVideos = videos;
    if (user?.id || user?.uid) {
      userVideos = videos.filter(
        (v) => v.userId === user.id || v.userId === user.uid
      );
    } else {
      // For demo purposes, return all videos if not authenticated
      // In production, you might want to return empty or require authentication
      userVideos = videos.slice(0, 10); // Limit to last 10 for demo
    }

    // Sort by creation date (newest first)
    userVideos.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json({
      success: true,
      videos: userVideos,
      total: userVideos.length,
    });
  } catch (error: any) {
    console.error("Get user videos error:", error);
    res.status(500).json({
      error: "Failed to get videos",
      message: error.message || "An error occurred",
    });
  }
};

// Preview AI video (proxy to handle CORS)
export const previewAIVideo: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const videos = await getAIVideoDatabase();
    const video = videos.find((v) => v.id === id);

    if (!video) {
      return res.status(404).json({
        error: "Video not found",
        message: "The requested video does not exist",
      });
    }

    if (video.status !== "completed" || !video.videoUrl) {
      return res.status(400).json({
        error: "Video not ready",
        message: "This video is not ready for preview yet",
      });
    }

    // Redirect to video URL (browser will handle video playback)
    res.redirect(video.videoUrl);
  } catch (error: any) {
    console.error("Preview AI video error:", error);
    res.status(500).json({
      error: "Failed to preview video",
      message: error.message || "An error occurred",
    });
  }
};

// Download AI video (proxy to handle CORS and downloads)
export const downloadAIVideo: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const videos = await getAIVideoDatabase();
    const video = videos.find((v) => v.id === id);

    if (!video) {
      return res.status(404).json({
        error: "Video not found",
        message: "The requested video does not exist",
      });
    }

    if (video.status !== "completed" || !video.videoUrl) {
      return res.status(400).json({
        error: "Video not ready",
        message: "This video is not ready for download yet",
      });
    }

    // Fetch the video from the source URL
    try {
      const videoResponse = await fetch(video.videoUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      });

      if (!videoResponse.ok) {
        // If fetch fails, redirect to video URL (fallback)
        return res.redirect(video.videoUrl);
      }

      // Get content type
      const contentType = videoResponse.headers.get("content-type") || "video/mp4";
      
      // Determine filename
      const urlLower = video.videoUrl.toLowerCase();
      let extension = "mp4";
      if (urlLower.endsWith(".webm")) extension = "webm";
      else if (urlLower.endsWith(".mov")) extension = "mov";
      else if (urlLower.endsWith(".avi")) extension = "avi";
      
      const filename = `ai-video-${video.id}.${extension}`;

      // Set headers for download
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      
      // Stream the video to the client
      const videoBuffer = await videoResponse.arrayBuffer();
      res.send(Buffer.from(videoBuffer));
    } catch (fetchError: any) {
      console.error("Failed to fetch video:", fetchError);
      // Fallback: redirect to video URL
      res.redirect(video.videoUrl);
    }
  } catch (error: any) {
    console.error("Download AI video error:", error);
    res.status(500).json({
      error: "Failed to download video",
      message: error.message || "An error occurred",
    });
  }
};

