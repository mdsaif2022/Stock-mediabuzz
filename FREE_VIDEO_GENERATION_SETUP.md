# 🆓 FREE Video Generation - No API Key Required!

This guide shows you how to use **completely FREE** video generation options that don't require any external API keys.

## Option 1: Demo Mode (Recommended - No Setup Needed)

**✅ BEST FOR QUICK START - Works immediately!**

### What is Demo Mode?

Demo mode generates placeholder videos without any external services. Perfect for:
- Development and testing
- Demonstrations
- Prototyping
- Learning the system

### Setup

**No setup needed!** Demo mode is enabled by default if no API keys are configured.

### Configuration

```env
# In .env file or environment variables
DEFAULT_AI_VIDEO_PROVIDER=demo
# No API key needed!
```

### How It Works

- Generates placeholder video URLs
- Simulates video generation process
- Shows all UI features working
- Perfect for development

### Usage

1. Start your server: `pnpm dev`
2. Navigate to `/ai-video-generator`
3. Enter any prompt
4. Click "Generate Video"
5. Video will be "generated" (placeholder) in 2-5 seconds

**That's it! No API keys, no signup, no costs!**

---

## Option 2: FFmpeg Local Generation (FREE - Requires FFmpeg)

**✅ Best for real video generation without external APIs**

### What is FFmpeg?

FFmpeg is a free, open-source tool that can generate videos locally on your server. No external API needed!

### Installation

#### Windows
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from: https://ffmpeg.org/download.html
```

#### macOS
```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

#### Docker
```dockerfile
FROM node:18
RUN apt-get update && apt-get install -y ffmpeg
# Your app code here
```

### Setup

1. Install FFmpeg (see above)
2. Verify installation:
   ```bash
   ffmpeg -version
   ```
3. Set environment variable:
   ```env
   DEFAULT_AI_VIDEO_PROVIDER=ffmpeg
   ```

### How It Works

- Creates videos locally on your server
- Uses FFmpeg to generate colored backgrounds with text
- Saves videos to `public/generated-videos/` folder
- Completely free, no external services

### Limitations

- Requires FFmpeg installed on server
- Generates simple videos (not AI-generated content)
- Uses server resources
- You can extend it to add images, animations, etc.

### Customization

Edit `server/services/aiVideoProviders.ts` to customize FFmpeg commands:
- Add image overlays
- Add animations
- Add audio tracks
- Create slideshows
- etc.

---

## Option 3: Shotstack Free Developer Sandbox (NO SIGNUP)

**✅ Free API with demo key - No credit card needed!**

### Getting Started

1. **No signup needed!** Shotstack provides a demo API key
2. Use the demo key: `demo`
3. Get your own free API key (optional): https://shotstack.io/

### Setup

```env
# Use demo key (works immediately)
SHOTSTACK_API_KEY=demo

# Or get your free API key from Shotstack
# SHOTSTACK_API_KEY=your_free_api_key_here

DEFAULT_AI_VIDEO_PROVIDER=shotstack
```

### Features

- ✅ Free developer sandbox
- ✅ No credit card required
- ✅ Generates real videos
- ✅ Good for testing and development

### How It Works

- Uses Shotstack API to generate videos
- Creates title-based videos from text prompts
- Returns actual video URLs
- Works with demo key for testing

---

## Option 4: Open-Source Self-Hosted (Advanced)

For complete control, you can run open-source AI video models on your own server.

### Option A: Stable Video Diffusion

```bash
# Install dependencies
pip install diffusers transformers torch

# Run model locally
python generate_video.py --prompt "your prompt here"
```

**Requirements:**
- Powerful GPU (8GB+ VRAM recommended)
- Python environment
- Technical expertise

### Option B: ModelScope (Hugging Face)

- Models available on Hugging Face
- Can be run locally or on cloud GPU
- Free but requires GPU resources

**Note**: These require significant computational resources and technical setup.

---

## Quick Comparison

| Option | Setup Time | Cost | Quality | API Key? |
|--------|------------|------|---------|----------|
| **Demo Mode** | 0 minutes | FREE | Placeholder | ❌ No |
| **FFmpeg Local** | 5 minutes | FREE | Simple videos | ❌ No |
| **Shotstack Demo** | 1 minute | FREE | Real videos | ✅ Demo key |
| **Open Source** | 30+ minutes | FREE* | High quality | ❌ No |

*Requires GPU/server costs

---

## Recommended Setup for Testing

**Quick Start (No Setup):**
```env
DEFAULT_AI_VIDEO_PROVIDER=demo
```

**Best Free Option (Simple Setup):**
```env
SHOTSTACK_API_KEY=demo
DEFAULT_AI_VIDEO_PROVIDER=shotstack
```

**Local Generation (Requires FFmpeg):**
```env
DEFAULT_AI_VIDEO_PROVIDER=ffmpeg
# Install FFmpeg first
```

---

## Implementation Details

### Demo Mode Implementation

Demo mode is already implemented in `server/services/aiVideoProviders.ts`:
- `generateVideoDemo()` - Starts generation
- `checkDemoStatus()` - Returns placeholder video

**No changes needed** - just set `DEFAULT_AI_VIDEO_PROVIDER=demo` or leave it unset.

### FFmpeg Implementation

FFmpeg generation is implemented and ready:
- `generateVideoWithFFmpeg()` - Creates videos locally
- `checkFFmpegStatus()` - Checks if video is ready

**Just install FFmpeg** and set `DEFAULT_AI_VIDEO_PROVIDER=ffmpeg`.

### Shotstack Implementation

Shotstack integration is ready:
- `generateVideoWithShotstack()` - Uses Shotstack API
- `checkShotstackStatus()` - Checks generation status

**Works with demo key** - no signup needed!

---

## Testing

1. **Demo Mode Test:**
   ```bash
   # No env vars needed
   pnpm dev
   # Visit /ai-video-generator
   # Generate a video - works immediately!
   ```

2. **Shotstack Test:**
   ```bash
   # Add to .env
   SHOTSTACK_API_KEY=demo
   DEFAULT_AI_VIDEO_PROVIDER=shotstack
   pnpm dev
   # Visit /ai-video-generator
   # Generate a video - uses Shotstack demo
   ```

3. **FFmpeg Test:**
   ```bash
   # Install FFmpeg first
   ffmpeg -version  # Verify installed
   
   # Add to .env
   DEFAULT_AI_VIDEO_PROVIDER=ffmpeg
   pnpm dev
   # Visit /ai-video-generator
   # Generate a video - creates locally!
   ```

---

## Production Considerations

### Demo Mode
- ✅ Perfect for development
- ⚠️ Only generates placeholders
- ⚠️ Not suitable for production (unless you want placeholder videos)

### FFmpeg
- ✅ Free and local
- ✅ No external dependencies
- ⚠️ Uses server resources
- ⚠️ Limited to simple videos
- ✅ Good for basic video generation

### Shotstack
- ✅ Real video generation
- ✅ Free demo key available
- ⚠️ Demo key has limitations
- ✅ Can upgrade for production use

---

## Next Steps

1. **Start with Demo Mode** - Test the UI immediately
2. **Try Shotstack** - Get real videos with demo key
3. **Install FFmpeg** - For local video generation
4. **Upgrade Later** - When you need higher quality or more features

All options are free and ready to use! 🎉

