# 🆓 Quick Start: FREE Veo 2 API Integration

**Best FREE option - 10 credits/month forever, no credit card required!**

## Step 1: Get Your FREE API Key

1. Visit: **https://veo2api.com/**
2. Click **"Sign Up"** or **"Get Started"**
3. Register with your email (no credit card needed!)
4. Verify your email if required
5. Navigate to **"API Keys"** or **"Developer"** section
6. Generate a new API key
7. Copy your API key (save it securely)

**✅ You now have 10 FREE credits per month that renew automatically!**

## Step 2: Set Environment Variable

### Local Development (.env file)
```env
VEO2_API_KEY=your_veo2_api_key_here
DEFAULT_AI_VIDEO_PROVIDER=veo2
```

### Production (Render/Vercel)
1. Go to your service dashboard
2. Navigate to **"Environment Variables"**
3. Add:
   - Key: `VEO2_API_KEY`
   - Value: `your_api_key_here`
4. Add:
   - Key: `DEFAULT_AI_VIDEO_PROVIDER`
   - Value: `veo2`
5. Save and redeploy

## Step 3: Add Veo 2 Integration Code

Add this to `server/services/aiVideoProviders.ts`:

```typescript
// ============================================
// VEO 2 API INTEGRATION (FREE - 10 credits/month)
// ============================================

interface Veo2Response {
  task_id: string;
  status: string;
  video_url?: string;
  error?: string;
}

export async function generateVideoWithVeo2(
  prompt: string,
  duration: number = 5,
  aspectRatio: string = "16:9"
): Promise<{ taskId: string; status: string }> {
  const apiKey = process.env.VEO2_API_KEY;
  
  if (!apiKey) {
    throw new Error("VEO2_API_KEY environment variable is not set");
  }

  try {
    // Veo 2 API - Check their actual endpoint from their dashboard
    const response = await fetch("https://api.veo2api.com/v1/generate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        duration: Math.min(duration, 5), // Adjust based on Veo2 limits
        aspect_ratio: aspectRatio,
        // Additional parameters per Veo2 documentation
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data: Veo2Response = await response.json();

    return {
      taskId: data.task_id,
      status: data.status,
    };
  } catch (error: any) {
    console.error("Veo 2 API error:", error);
    throw new Error(`Veo 2 generation failed: ${error.message}`);
  }
}

export async function checkVeo2Status(taskId: string): Promise<{ status: string; videoUrl?: string; error?: string }> {
  const apiKey = process.env.VEO2_API_KEY;
  
  if (!apiKey) {
    throw new Error("VEO2_API_KEY environment variable is not set");
  }

  try {
    const response = await fetch(`https://api.veo2api.com/v1/status/${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data: Veo2Response = await response.json();

    return {
      status: data.status,
      videoUrl: data.video_url,
      error: data.error,
    };
  } catch (error: any) {
    console.error("Veo 2 status check error:", error);
    throw new Error(`Failed to check Veo 2 status: ${error.message}`);
  }
}
```

## Step 4: Update Provider Selector

In `server/services/aiVideoProviders.ts`, update the provider selector:

```typescript
export type AIVideoProvider = "veo2" | "runway" | "synthesia" | "d-id" | "placeholder";

export function getDefaultProvider(): AIVideoProvider {
  const provider = process.env.DEFAULT_AI_VIDEO_PROVIDER?.toLowerCase() || "veo2";
  
  if (["veo2", "runway", "synthesia", "d-id", "placeholder"].includes(provider)) {
    return provider as AIVideoProvider;
  }
  
  return "veo2"; // Default to free Veo 2
}

export function isProviderConfigured(provider: AIVideoProvider): boolean {
  switch (provider) {
    case "veo2":
      return !!process.env.VEO2_API_KEY;
    case "runway":
      return !!process.env.RUNWAY_API_KEY;
    case "synthesia":
      return !!process.env.SYNTHESIA_API_KEY;
    case "d-id":
      return !!process.env.DID_API_KEY;
    case "placeholder":
      return true; // Always available for demo
    default:
      return false;
  }
}
```

## Step 5: Update Server Route

In `server/routes/ai-video.ts`, import and use Veo 2:

```typescript
import { generateVideoWithVeo2, checkVeo2Status } from "../services/aiVideoProviders.js";

// In the generateVideo function, replace the TODO section with:
try {
  const veo2Result = await generateVideoWithVeo2(
    prompt.trim(),
    duration,
    aspectRatio
  );
  
  // Update video with task ID
  newVideo.status = "processing";
  
  // Poll for completion (background)
  pollVeo2Status(veo2Result.taskId, videoId);
  
} catch (error: any) {
  console.error("Veo 2 generation error:", error);
  newVideo.status = "failed";
  newVideo.errorMessage = error.message;
  await saveAIVideo(newVideo);
}

// Add polling function
async function pollVeo2Status(taskId: string, videoId: string) {
  const maxAttempts = 60; // 5 minutes
  let attempts = 0;
  
  const interval = setInterval(async () => {
    attempts++;
    
    try {
      const status = await checkVeo2Status(taskId);
      
      const videos = await getAIVideoDatabase();
      const videoIndex = videos.findIndex((v) => v.id === videoId);
      
      if (videoIndex !== -1) {
        if (status.status === "completed" && status.videoUrl) {
          videos[videoIndex] = {
            ...videos[videoIndex],
            status: "completed",
            videoUrl: status.videoUrl,
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
      }
    } catch (error) {
      console.error("Status check error:", error);
    }
    
    if (attempts >= maxAttempts) {
      clearInterval(interval);
    }
  }, 5000); // Check every 5 seconds
}
```

## Step 6: Verify API Endpoints

**Important**: Veo 2 API endpoints may vary. Check their dashboard/documentation for:
- Exact endpoint URLs
- Request/response formats
- Parameter names
- Authentication method

Common patterns:
- Base URL: `https://api.veo2api.com/` or check their dashboard
- Generate: `POST /v1/generate` or `/api/v1/video/generate`
- Status: `GET /v1/status/{task_id}` or `/api/v1/video/{task_id}`

## Step 7: Test

1. Start server: `pnpm dev`
2. Go to: `/ai-video-generator`
3. Enter prompt: "A beautiful sunset"
4. Click "Generate Video"
5. Check logs for API calls
6. Wait for completion (may take 1-5 minutes)

## Step 8: Monitor Free Credits

**Stay within free limits:**
- ✅ 10 credits per month (renews monthly)
- ✅ Monitor usage in Veo 2 dashboard
- ✅ Each video generation uses credits
- ✅ Credits reset monthly automatically

## Troubleshooting

**Error: "API key not found"**
- Verify: `echo $VEO2_API_KEY`
- Restart server after setting env vars

**Error: "Insufficient credits"**
- Check Veo 2 dashboard for remaining credits
- Wait for monthly reset OR upgrade plan

**Error: "Invalid endpoint"**
- Check Veo 2 dashboard for correct API endpoints
- Update endpoints in `aiVideoProviders.ts`

**Note**: Veo 2 API structure may vary. Always check their official documentation from your dashboard.

## Alternative Free Options

If Veo 2 doesn't work for you, try these FREE alternatives:
1. **HeyGen** - 10 credits/month (watermarked)
2. **Mozify** - Free credits for new users
3. **Pixazo** - Free API access
4. **Runway ML** - 125 free credits (one-time)

See `AI_VIDEO_API_INTEGRATION_GUIDE.md` for all options.

