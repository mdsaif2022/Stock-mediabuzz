/**
 * AI Video Generation Provider Integrations
 * 
 * This file contains integration functions for FREE and paid AI video generation services.
 * 
 * 🆓 FREE OPTIONS (No API Key Required):
 * - Demo Mode: Generate placeholder videos (no external API needed) ✅ DEFAULT
 * - FFmpeg Local: Generate simple videos locally using FFmpeg
 * 
 * 🆓 FREE OPTIONS (API Key Required):
 * - Shotstack: Free demo key available (no signup needed)
 * - Veo 2 API: 10 credits/month free (see INTEGRATE_VEO2_FREE.md)
 * - Runway ML: 125 credits free on signup
 * - HeyGen: 10 credits/month free (watermarked)
 */

// Node.js built-in modules
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import { randomUUID } from "crypto";

const execAsync = promisify(exec);

// ============================================
// DEMO MODE - NO API REQUIRED (FREE FOREVER)
// ============================================

/**
 * Demo mode - returns sample videos without any external API
 * Perfect for development, testing, or demos
 * No API key, no credits, no costs - completely free!
 * 
 * ⚠️ IMPORTANT: Demo mode returns RANDOM sample videos - they do NOT match your prompt!
 * This is only for testing the UI/workflow. For real AI-generated videos from prompts, 
 * you MUST switch to a real provider:
 * 
 * - Veo 2 API: Real AI video generation (10 credits/month free)
 * - Runway ML: Real AI video generation (125 free credits on signup)
 * - MagicHour: Real AI video generation (free tier)
 * 
 * Shotstack creates text-based videos (title cards), not AI-generated scenes.
 * 
 * To switch: Set DEFAULT_AI_VIDEO_PROVIDER=veo2 or runway
 */
export async function generateVideoDemo(
  prompt: string,
  duration: number = 5,
  aspectRatio: string = "16:9"
): Promise<{ taskId: string; status: string }> {
  // Generate a unique task ID
  const taskId = `demo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  
  // In demo mode, we simulate video generation and return sample videos
  // ⚠️ WARNING: These are random sample videos - they DO NOT match the prompt!
  // This is only for UI/workflow testing, not actual video generation
  
  console.warn(`[DEMO MODE] Generating video with prompt: "${prompt}"`);
  console.warn(`[DEMO MODE] ⚠️ WARNING: Demo mode returns random sample videos that do NOT match your prompt!`);
  console.warn(`[DEMO MODE] For real AI-generated videos, switch to Veo 2, Runway ML, or MagicHour`);
  
  return {
    taskId: taskId,
    status: "processing",
  };
}

export async function checkDemoStatus(taskId: string): Promise<{ status: string; videoUrl?: string; error?: string }> {
  // Simulate processing time (2-5 seconds)
  await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000));
  
  // In demo mode, return a sample video URL
  // Using reliable sample videos from Google Cloud Storage and other reliable sources
  
  // Reliable sample videos (tested and working)
  const sampleVideos = [
    // Google Cloud Storage (most reliable)
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreet.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  ];
  
  // Randomly select a sample video
  const randomVideo = sampleVideos[Math.floor(Math.random() * sampleVideos.length)];
  
  return {
    status: "completed",
    videoUrl: randomVideo,
    // Note: These are sample videos for demo purposes
    // For real video generation, switch to Shotstack or another provider
  };
}

// ============================================
// FFMPEG LOCAL GENERATION (FREE - NO API)
// ============================================

/**
 * Generate videos locally using FFmpeg
 * Requires FFmpeg installed on server
 * Completely free, no API needed
 * 
 * Install FFmpeg:
 * - Windows: choco install ffmpeg
 * - Mac: brew install ffmpeg
 * - Linux: sudo apt install ffmpeg
 * 
 * Or use Docker with FFmpeg pre-installed
 */

export async function generateVideoWithFFmpeg(
  prompt: string,
  duration: number = 5,
  aspectRatio: string = "16:9"
): Promise<{ taskId: string; status: string; outputPath?: string }> {
  const taskId = `ffmpeg_${Date.now()}_${randomUUID()}`;
  
  try {
    // Create output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), "public", "generated-videos");
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, `${taskId}.mp4`);
    
    // Extract dimensions from aspect ratio
    const dimensions = getDimensionsFromAspectRatio(aspectRatio);
    
    // Generate a simple video using FFmpeg
    // This creates a colored background with text overlay
    // Escape special characters in prompt for FFmpeg
    const escapedPrompt = prompt.replace(/'/g, "'\\''").substring(0, 50);
    const ffmpegCommand = `ffmpeg -f lavfi -i "color=c=0x4F46E5:s=${dimensions.width}x${dimensions.height}:d=${duration}" -vf "drawtext=text='${escapedPrompt}':fontsize=24:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" -pix_fmt yuv420p -y "${outputPath}"`;
    
    // Execute FFmpeg command (async - don't wait)
    execAsync(ffmpegCommand).catch((error) => {
      console.error("FFmpeg generation error:", error);
      // Mark video as failed if generation fails
    });
    
    return {
      taskId: taskId,
      status: "processing",
      outputPath: outputPath,
    };
  } catch (error: any) {
    console.error("FFmpeg setup error:", error);
    throw new Error(`FFmpeg generation failed: ${error.message}. Make sure FFmpeg is installed.`);
  }
}

function getDimensionsFromAspectRatio(aspectRatio: string): { width: number; height: number } {
  const [w, h] = aspectRatio.split(":").map(Number);
  const baseHeight = 720; // Base height
  const baseWidth = (baseHeight * w) / h;
  
  return {
    width: Math.round(baseWidth),
    height: baseHeight,
  };
}

export async function checkFFmpegStatus(taskId: string): Promise<{ status: string; videoUrl?: string; error?: string }> {
  try {
    const outputPath = path.join(process.cwd(), "public", "generated-videos", `${taskId}.mp4`);
    
    // Check if file exists
    try {
      await fs.access(outputPath);
      
      // File exists, video is ready
      const videoUrl = `/generated-videos/${taskId}.mp4`;
      
      return {
        status: "completed",
        videoUrl: videoUrl,
      };
    } catch {
      // File doesn't exist yet, still processing
      return {
        status: "processing",
      };
    }
  } catch (error: any) {
    return {
      status: "failed",
      error: error.message,
    };
  }
}

// ============================================
// SHOTSTACK FREE API (NO CREDIT CARD)
// ============================================

/**
 * Shotstack - Free developer sandbox
 * No credit card required
 * Perfect for testing and development
 */
export async function generateVideoWithShotstack(
  prompt: string,
  duration: number = 5,
  aspectRatio: string = "16:9"
): Promise<{ taskId: string; status: string }> {
  const apiKey = process.env.SHOTSTACK_API_KEY || "demo"; // Demo key works for testing
  
  try {
    // Shotstack API endpoint
    const response = await fetch("https://api.shotstack.io/v1/render", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeline: {
          soundtrack: {
            src: "https://shotstack-assets.s3.amazonaws.com/music/freepd.mp3",
            effect: "fadeOut",
          },
          tracks: [
            {
              clips: [
                {
                  asset: {
                    type: "title",
                    text: prompt,
                    style: "minimal",
                    color: "#FFFFFF",
                    size: "large",
                  },
                  start: 0,
                  length: duration,
                },
              ],
            },
          ],
        },
        output: {
          format: "mp4",
          resolution: "hd",
          aspectRatio: aspectRatio,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();

    return {
      taskId: data.response.id,
      status: data.response.status,
    };
  } catch (error: any) {
    console.error("Shotstack API error:", error);
    throw new Error(`Shotstack generation failed: ${error.message}`);
  }
}

export async function checkShotstackStatus(renderId: string): Promise<{ status: string; videoUrl?: string; error?: string }> {
  const apiKey = process.env.SHOTSTACK_API_KEY || "demo";
  
  try {
    const response = await fetch(`https://api.shotstack.io/v1/render/${renderId}`, {
      method: "GET",
      headers: {
        "X-API-KEY": apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();

    return {
      status: data.response.status,
      videoUrl: data.response.url,
      error: data.response.error,
    };
  } catch (error: any) {
    console.error("Shotstack status check error:", error);
    throw new Error(`Failed to check Shotstack status: ${error.message}`);
  }
}

// ============================================
// MAGICHOUR FREE API
// ============================================

export async function generateVideoWithMagicHour(
  prompt: string,
  duration: number = 5,
  aspectRatio: string = "16:9"
): Promise<{ taskId: string; status: string }> {
  const apiKey = process.env.MAGICHOUR_API_KEY;
  
  if (!apiKey) {
    throw new Error("MAGICHOUR_API_KEY environment variable is not set. Get free API key at https://magichour.ai/api");
  }

  try {
    const response = await fetch("https://api.magichour.ai/v1/generate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        duration: duration,
        aspect_ratio: aspectRatio,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();

    return {
      taskId: data.task_id || data.id,
      status: data.status || "processing",
    };
  } catch (error: any) {
    console.error("MagicHour API error:", error);
    throw new Error(`MagicHour generation failed: ${error.message}`);
  }
}

// ============================================
// MOZIFY API (FREE - Multiple AI Models)
// ============================================

interface MozifyResponse {
  task_id?: string;
  id?: string;
  status: string;
  video_url?: string;
  videoUrl?: string;
  url?: string;
  error?: string;
}

/**
 * Mozify - Unified API for multiple AI video models
 * Supports OpenAI Sora, Google Veo, and more
 * Free credits for new users
 * Get API key at: https://mozify.ai/
 */
export async function generateVideoWithMozify(
  prompt: string,
  duration: number = 5,
  aspectRatio: string = "16:9"
): Promise<{ taskId: string; status: string }> {
  const apiKey = process.env.MOZIFY_API_KEY;
  
  if (!apiKey) {
    throw new Error("MOZIFY_API_KEY environment variable is not set. Get free API key at https://mozify.ai/");
  }

  try {
    console.log(`[Mozify] Generating video with prompt: "${prompt.substring(0, 50)}..."`);
    console.log(`[Mozify] Using API key: ${apiKey.substring(0, 10)}...`);
    
    // Mozify API endpoint (based on documentation)
    const response = await fetch("https://api.mozify.ai/v1/video/generate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sora-2-15s", // Default model - can be changed based on available models
        prompt: prompt,
        duration: Math.min(duration, 15), // Mozify supports up to 15 seconds with sora-2-15s
        aspect_ratio: aspectRatio,
        // Additional parameters based on Mozify API docs
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || `HTTP ${response.status}` };
      }
      
      console.error(`[Mozify] API error (${response.status}):`, errorData);
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${errorText}`);
    }

    const data: MozifyResponse = await response.json();
    
    console.log(`[Mozify] Generation started. Task ID: ${data.task_id || data.id}`);

    return {
      taskId: data.task_id || data.id || data.url || "",
      status: data.status || "processing",
    };
  } catch (error: any) {
    console.error("[Mozify] API error:", error);
    
    // Provide helpful error messages
    if (error.message?.includes("401") || error.message?.includes("Unauthorized")) {
      throw new Error("Mozify API key is invalid. Please check your MOZIFY_API_KEY in environment variables.");
    } else if (error.message?.includes("404")) {
      throw new Error("Mozify API endpoint not found. Please check mozify.ai documentation for the correct endpoint.");
    } else if (error.message?.includes("ENOTFOUND") || error.message?.includes("network")) {
      throw new Error("Cannot connect to Mozify API. Check your internet connection or mozify.ai status.");
    }
    
    throw new Error(`Mozify generation failed: ${error.message}`);
  }
}

export async function checkMozifyStatus(taskId: string): Promise<{ status: string; videoUrl?: string; error?: string }> {
  const apiKey = process.env.MOZIFY_API_KEY;
  
  if (!apiKey) {
    throw new Error("MOZIFY_API_KEY environment variable is not set");
  }

  try {
    // Mozify status check endpoint
    // Common patterns:
    // - https://api.mozify.ai/v1/video/status/{task_id}
    // - https://api.mozify.ai/v1/video/{task_id}
    // Update based on actual Mozify API documentation
    
    const response = await fetch(`https://api.mozify.ai/v1/video/status/${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      // If status endpoint doesn't work, try alternative endpoint
      const altResponse = await fetch(`https://api.mozify.ai/v1/video/${taskId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      });

      if (!altResponse.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${response.status}` };
        }
        
        console.error(`[Mozify] Status check error (${response.status}):`, errorData);
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${errorText}`);
      }

      const altData: MozifyResponse = await altResponse.json();
      return {
        status: altData.status || "processing",
        videoUrl: altData.video_url || altData.videoUrl || altData.url,
        error: altData.error,
      };
    }

    const data: MozifyResponse = await response.json();

    return {
      status: data.status || "processing",
      videoUrl: data.video_url || data.videoUrl || data.url,
      error: data.error,
    };
  } catch (error: any) {
    console.error("[Mozify] Status check error:", error);
    throw new Error(`Failed to check Mozify status: ${error.message}`);
  }
}

// ============================================
// VEO 2 API INTEGRATION (FREE - 10 credits/month)
// ============================================

interface Veo2GenerateResponse {
  request_id: string;
  status: string;
  progress?: number;
  error?: string;
}

interface Veo2StatusResponse {
  status: string;
  progress?: number;
  error?: string;
}

interface Veo2ResultResponse {
  video?: {
    url: string;
  };
  status?: string;
  error?: string;
}

/**
 * Veo 2 API - Text to Video Generation
 * Official API documentation: https://veo2api.com/
 * Endpoint: https://veo2api.com/api/index.php
 * 
 * Each video generation costs 100 credits
 * Status checks and result retrievals are free
 */
export async function generateVideoWithVeo2(
  prompt: string,
  duration: number = 5,
  aspectRatio: string = "16:9"
): Promise<{ taskId: string; status: string }> {
  const apiKey = process.env.VEO2_API_KEY;
  
  if (!apiKey) {
    throw new Error("VEO2_API_KEY environment variable is not set. Get free API key at https://veo2api.com/");
  }

  try {
    console.log(`[Veo 2] Generating video with prompt: "${prompt.substring(0, 50)}..."`);
    console.log(`[Veo 2] Using API key: ${apiKey.substring(0, 10)}...`);
    
    // Veo 2 API endpoint (official documentation)
    const response = await fetch("https://veo2api.com/api/index.php", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        aspect_ratio: aspectRatio,
        resolution: "720p", // Default: "720p" or "480p"
        duration: Math.min(duration, 10).toString(), // "5" or "10" seconds (default: "5")
        camera_fixed: false, // Whether to fix camera position (default: false)
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || `HTTP ${response.status}` };
      }
      
      console.error(`[Veo 2] API error (${response.status}):`, errorData);
      
      // Handle specific error codes
      if (response.status === 402) {
        throw new Error("Insufficient credits. Each video generation costs 100 credits. Purchase credits from your Veo 2 dashboard.");
      } else if (response.status === 401) {
        throw new Error("Veo 2 API key is invalid. Please check your VEO2_API_KEY in environment variables.");
      }
      
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${errorText}`);
    }

    const data: Veo2GenerateResponse = await response.json();
    
    console.log(`[Veo 2] Generation started. Request ID: ${data.request_id}, Status: ${data.status}, Progress: ${data.progress || 0}%`);

    return {
      taskId: data.request_id,
      status: data.status || "processing",
    };
  } catch (error: any) {
    console.error("[Veo 2] API error:", error);
    
    // Provide helpful error messages
    if (error.message?.includes("401") || error.message?.includes("Unauthorized")) {
      throw new Error("Veo 2 API key is invalid. Please check your VEO2_API_KEY in environment variables.");
    } else if (error.message?.includes("402") || error.message?.includes("Insufficient")) {
      throw new Error("Insufficient Veo 2 credits. Each video costs 100 credits. Purchase credits from your dashboard.");
    } else if (error.message?.includes("404")) {
      throw new Error("Veo 2 API endpoint not found. Please check veo2api.com documentation.");
    } else if (error.message?.includes("ENOTFOUND") || error.message?.includes("network")) {
      throw new Error("Cannot connect to Veo 2 API. Check your internet connection or veo2api.com status.");
    }
    
    throw new Error(`Veo 2 generation failed: ${error.message}`);
  }
}

export async function checkVeo2Status(taskId: string): Promise<{ status: string; videoUrl?: string; error?: string }> {
  const apiKey = process.env.VEO2_API_KEY;
  
  if (!apiKey) {
    throw new Error("VEO2_API_KEY environment variable is not set");
  }

  try {
    // Step 1: Check status
    const statusResponse = await fetch(`https://veo2api.com/api/index.php/status?request_id=${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || `HTTP ${statusResponse.status}` };
      }
      
      console.error(`[Veo 2] Status check error (${statusResponse.status}):`, errorData);
      throw new Error(errorData.error || errorData.message || `HTTP ${statusResponse.status}: ${errorText}`);
    }

    const statusData: Veo2StatusResponse = await statusResponse.json();
    
    // If status is completed, get the video URL
    if (statusData.status === "completed") {
      const resultResponse = await fetch(`https://veo2api.com/api/index.php?request_id=${taskId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      });

      if (!resultResponse.ok) {
        console.warn(`[Veo 2] Result fetch failed (${resultResponse.status}), but status is completed. Retrying...`);
        // Return status without URL, will retry on next poll
        return {
          status: statusData.status,
        };
      }

      const resultData: Veo2ResultResponse = await resultResponse.json();
      
      if (resultData.video?.url) {
        console.log(`[Veo 2] Video ready! URL: ${resultData.video.url}`);
        return {
          status: "completed",
          videoUrl: resultData.video.url,
        };
      } else {
        // Video not ready yet, return current status
        return {
          status: statusData.status || "processing",
        };
      }
    }

    // Return current status (processing or failed)
    return {
      status: statusData.status || "processing",
      error: statusData.error,
    };
  } catch (error: any) {
    console.error("[Veo 2] Status check error:", error);
    throw new Error(`Failed to check Veo 2 status: ${error.message}`);
  }
}

// ============================================
// RUNWAY ML INTEGRATION
// ============================================

interface RunwayMLResponse {
  id: string;
  status: string;
  output?: string[];
  error?: string;
}

export async function generateVideoWithRunwayML(
  prompt: string,
  duration: number = 5,
  aspectRatio: string = "16:9"
): Promise<{ taskId: string; status: string }> {
  const apiKey = process.env.RUNWAY_API_KEY;
  
  if (!apiKey) {
    throw new Error("RUNWAY_API_KEY environment variable is not set");
  }

  try {
    // Runway ML Text-to-Video API
    // Note: Actual endpoint may vary - check Runway ML documentation
    const response = await fetch("https://api.runwayml.com/v1/image-to-video", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        duration: Math.min(duration, 5), // Runway typically supports up to 5 seconds
        aspectRatio: aspectRatio,
        model: "gen3a_turbo", // or "gen3a_diffusion" for higher quality
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data: RunwayMLResponse = await response.json();

    return {
      taskId: data.id,
      status: data.status,
    };
  } catch (error: any) {
    console.error("Runway ML API error:", error);
    throw new Error(`Runway ML generation failed: ${error.message}`);
  }
}

export async function checkRunwayMLStatus(taskId: string): Promise<{ status: string; videoUrl?: string; error?: string }> {
  const apiKey = process.env.RUNWAY_API_KEY;
  
  if (!apiKey) {
    throw new Error("RUNWAY_API_KEY environment variable is not set");
  }

  try {
    const response = await fetch(`https://api.runwayml.com/v1/tasks/${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data: RunwayMLResponse = await response.json();

    return {
      status: data.status,
      videoUrl: data.output?.[0],
      error: data.error,
    };
  } catch (error: any) {
    console.error("Runway ML status check error:", error);
    throw new Error(`Failed to check Runway ML status: ${error.message}`);
  }
}

// ============================================
// SYNTHESIA INTEGRATION
// ============================================

interface SynthesiaResponse {
  id: string;
  status: string;
  url?: string;
  error?: string;
}

export async function generateVideoWithSynthesia(
  prompt: string,
  duration: number = 30,
  aspectRatio: string = "16:9"
): Promise<{ videoId: string; status: string }> {
  const apiKey = process.env.SYNTHESIA_API_KEY;
  
  if (!apiKey) {
    throw new Error("SYNTHESIA_API_KEY environment variable is not set");
  }

  try {
    // Synthesia API typically uses avatars and scripts
    // This is a simplified example - actual implementation may vary
    // Check Synthesia API docs for exact endpoint and parameters
    const response = await fetch("https://api.synthesia.io/v2/videos", {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        test: false,
        title: prompt.substring(0, 100),
        description: prompt,
        visibility: "public",
        input: [
          {
            scriptText: prompt,
            avatar: "anna_costume1_cameraA", // Default avatar - change as needed
            background: {
              type: "color",
              color: "#000000",
            },
            // Additional parameters based on Synthesia API documentation
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data: SynthesiaResponse = await response.json();

    return {
      videoId: data.id,
      status: data.status,
    };
  } catch (error: any) {
    console.error("Synthesia API error:", error);
    throw new Error(`Synthesia generation failed: ${error.message}`);
  }
}

export async function checkSynthesiaStatus(videoId: string): Promise<{ status: string; videoUrl?: string; error?: string }> {
  const apiKey = process.env.SYNTHESIA_API_KEY;
  
  if (!apiKey) {
    throw new Error("SYNTHESIA_API_KEY environment variable is not set");
  }

  try {
    const response = await fetch(`https://api.synthesia.io/v2/videos/${videoId}`, {
      method: "GET",
      headers: {
        "Authorization": apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data: SynthesiaResponse = await response.json();

    return {
      status: data.status,
      videoUrl: data.url,
      error: data.error,
    };
  } catch (error: any) {
    console.error("Synthesia status check error:", error);
    throw new Error(`Failed to check Synthesia status: ${error.message}`);
  }
}

// ============================================
// D-ID INTEGRATION
// ============================================

interface DIDResponse {
  id: string;
  status: string;
  result_url?: string;
  error?: string;
}

export async function generateVideoWithDID(
  prompt: string,
  duration: number = 10,
  aspectRatio: string = "16:9"
): Promise<{ talkId: string; status: string }> {
  const apiKey = process.env.DID_API_KEY;
  
  if (!apiKey) {
    throw new Error("DID_API_KEY environment variable is not set");
  }

  try {
    // D-ID typically requires an image and text/audio for talking avatars
    // This creates a talking avatar video
    // For text-to-video, D-ID may have different endpoints - check their docs
    const response = await fetch("https://api.d-id.com/talks", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_url: "https://d-id-public-bucket.s3.amazonaws.com/or-roman.jpg", // Example avatar - replace with your image
        script: {
          type: "text",
          input: prompt,
          provider: {
            type: "amazon",
            voice_id: "Amy", // Change voice as needed
          },
        },
        config: {
          stitch: true,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data: DIDResponse = await response.json();

    return {
      talkId: data.id,
      status: data.status,
    };
  } catch (error: any) {
    console.error("D-ID API error:", error);
    throw new Error(`D-ID generation failed: ${error.message}`);
  }
}

export async function checkDIDStatus(talkId: string): Promise<{ status: string; videoUrl?: string; error?: string }> {
  const apiKey = process.env.DID_API_KEY;
  
  if (!apiKey) {
    throw new Error("DID_API_KEY environment variable is not set");
  }

  try {
    const response = await fetch(`https://api.d-id.com/talks/${talkId}`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data: DIDResponse = await response.json();

    return {
      status: data.status,
      videoUrl: data.result_url,
      error: data.error,
    };
  } catch (error: any) {
    console.error("D-ID status check error:", error);
    throw new Error(`Failed to check D-ID status: ${error.message}`);
  }
}

// ============================================
// PROVIDER SELECTOR
// ============================================

export type AIVideoProvider = "demo" | "ffmpeg" | "shotstack" | "magichour" | "veo2" | "runway" | "synthesia" | "d-id" | "heygen" | "mozify" | "pixazo" | "placeholder";

export function getDefaultProvider(): AIVideoProvider {
  // Default to demo mode (no API needed) if no provider specified
  const provider = process.env.DEFAULT_AI_VIDEO_PROVIDER?.toLowerCase() || 
                   (process.env.VEO2_API_KEY ? "veo2" : "demo"); // Default to demo (free, no API)
  
  if (["demo", "ffmpeg", "shotstack", "magichour", "veo2", "runway", "synthesia", "d-id", "heygen", "mozify", "pixazo", "placeholder"].includes(provider)) {
    return provider as AIVideoProvider;
  }
  
  return "demo"; // Default to demo mode (always works, no API needed)
}

export function isProviderConfigured(provider: AIVideoProvider): boolean {
  switch (provider) {
    case "demo":
      return true; // Always available - no API needed!
    case "ffmpeg":
      // Check if FFmpeg is installed (we'll check on first use)
      return true; // Assume available, will error if not
    case "shotstack":
      return true; // Has demo key, works without signup
    case "magichour":
      return !!process.env.MAGICHOUR_API_KEY;
    case "veo2":
      return !!process.env.VEO2_API_KEY;
    case "runway":
      return !!process.env.RUNWAY_API_KEY;
    case "synthesia":
      return !!process.env.SYNTHESIA_API_KEY;
    case "d-id":
      return !!process.env.DID_API_KEY;
    case "heygen":
      return !!process.env.HEYGEN_API_KEY;
    case "mozify":
      return !!process.env.MOZIFY_API_KEY;
    case "pixazo":
      return !!process.env.PIXAZO_API_KEY;
    case "placeholder":
      return true; // Always available for demo
    default:
      return false;
  }
}

