# Quick Start: Integrating Runway ML API

This is a step-by-step guide to integrate Runway ML into your application.

## Step 1: Get Runway ML API Key

1. Visit: https://dev.runwayml.com/
2. Click "Sign Up" or "Log In"
3. Create a developer account
4. Navigate to "API Keys" section
5. Generate a new API key
6. Copy your API key (starts with something like `rw_api_...`)

## Step 2: Set Environment Variable

### Local Development (.env file)
```env
RUNWAY_API_KEY=your_runway_api_key_here
DEFAULT_AI_VIDEO_PROVIDER=runway
```

### Production (Render/Vercel)
1. Go to your service dashboard
2. Navigate to "Environment Variables"
3. Add:
   - Key: `RUNWAY_API_KEY`
   - Value: `your_api_key_here`
4. Add:
   - Key: `DEFAULT_AI_VIDEO_PROVIDER`
   - Value: `runway`
5. Save and redeploy

## Step 3: Update Server Route

Replace the placeholder code in `server/routes/ai-video.ts`:

```typescript
// At the top, import the provider function
import { generateVideoWithRunwayML, checkRunwayMLStatus } from "../services/aiVideoProviders.js";

// In the generateVideo function, replace the setTimeout block with:
try {
  const runwayResult = await generateVideoWithRunwayML(
    prompt.trim(),
    duration,
    aspectRatio
  );
  
  // Update the video record with Runway task ID
  newVideo.status = "processing";
  newVideo.videoUrl = undefined; // Will be set when complete
  // Store the task ID somewhere (you might want to add a taskId field to GeneratedVideo)
  
  // Poll for completion (do this in a background job)
  pollRunwayMLStatus(runwayResult.taskId, videoId);
  
} catch (error: any) {
  console.error("Runway ML generation error:", error);
  // Mark as failed
  newVideo.status = "failed";
  newVideo.errorMessage = error.message;
}

// Add a polling function (or use a job queue)
async function pollRunwayMLStatus(taskId: string, videoId: string) {
  const maxAttempts = 60; // Poll for 5 minutes (5 second intervals)
  let attempts = 0;
  
  const interval = setInterval(async () => {
    attempts++;
    
    try {
      const status = await checkRunwayMLStatus(taskId);
      
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
      // Mark as timeout
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
    }
  }, 5000); // Check every 5 seconds
}
```

## Step 4: Verify Runway ML API Endpoints

**Important**: Runway ML API endpoints and models may have changed. Check their official documentation:
- API Docs: https://docs.dev.runwayml.com/
- API Reference: https://docs.dev.runwayml.com/api/

Common endpoints:
- Text-to-Video: `POST /v1/image-to-video` or `/v1/text-to-video`
- Check Status: `GET /v1/tasks/{task_id}`
- List Models: `GET /v1/models`

## Step 5: Test the Integration

1. Start your development server: `pnpm dev`
2. Navigate to `/ai-video-generator`
3. Enter a test prompt: "A serene sunset over the ocean"
4. Click "Generate Video"
5. Check server logs for API calls
6. Wait for video to complete (may take 30 seconds to 5 minutes)

## Step 6: Monitor Usage & Costs

Runway ML uses a credit-based system:
- Check your credit balance: https://app.runwayml.com/account/usage
- Monitor costs in your dashboard
- Set up usage limits if needed

## Troubleshooting

**Error: "API key not found"**
- Verify environment variable is set: `echo $RUNWAY_API_KEY`
- Restart your server after setting env vars

**Error: "Invalid endpoint"**
- Check Runway ML documentation for current endpoints
- API structure may have changed

**Error: "Rate limit exceeded"**
- Wait and retry
- Consider implementing rate limiting in your code
- Upgrade your Runway ML plan if needed

**Videos stuck in "processing"**
- Check Runway ML status via their API
- Verify polling function is working
- Check server logs for errors

## Next Steps

1. **Implement Job Queue**: For production, use a proper job queue (Bull, BullMQ) instead of setTimeout
2. **Add Retry Logic**: Retry failed generations automatically
3. **Cost Limits**: Implement per-user generation limits
4. **Caching**: Cache frequently requested prompts
5. **Webhooks**: Set up Runway ML webhooks for status updates (more efficient than polling)

## Alternative: Use Other Providers

The code supports multiple providers:
- **Synthesia**: Set `SYNTHESIA_API_KEY` and `DEFAULT_AI_VIDEO_PROVIDER=synthesia`
- **D-ID**: Set `DID_API_KEY` and `DEFAULT_AI_VIDEO_PROVIDER=d-id`

Switch providers by changing the environment variable and updating the route code accordingly.

