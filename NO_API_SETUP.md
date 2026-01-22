# 🆓 Video Generation WITHOUT Any API - Complete Guide

This guide shows you how to use **completely FREE** video generation that doesn't require **ANY** external APIs or API keys!

## ✅ Option 1: Demo Mode (Default - Works Immediately!)

**NO SETUP NEEDED - Works right now!**

### What is Demo Mode?

Demo mode generates placeholder videos without calling any external services. Perfect for:
- ✅ Development and testing
- ✅ Demonstrations
- ✅ Prototyping
- ✅ UI/UX testing
- ✅ Learning the system

### Setup

**No configuration needed!** Demo mode is the default if no API keys are set.

```env
# Optional: Explicitly set demo mode
DEFAULT_AI_VIDEO_PROVIDER=demo
# No API key needed!
```

### How It Works

1. User enters a prompt
2. System simulates video generation (2-5 seconds)
3. Returns a **real sample video** (not AI-generated, but actual video file)
4. User can see the full workflow in action

### Test It Now

1. Start server: `pnpm dev`
2. Go to: `/ai-video-generator`
3. Enter any prompt: "A beautiful sunset"
4. Click "Generate Video"
5. ✅ **Real video** will be returned in 2-5 seconds!

**Note:** Demo mode returns sample videos for testing. For **real AI-generated videos**, switch to Shotstack (see below) or another provider.

**That's it! No API keys, no signup, no costs, no setup!**

---

## ✅ Option 2: Shotstack Demo Key (No Signup Needed!)

**FREE API with public demo key - No registration required!**

### Setup

```env
# Use Shotstack demo key (works immediately)
SHOTSTACK_API_KEY=demo
DEFAULT_AI_VIDEO_PROVIDER=shotstack
```

### How It Works

- Shotstack provides a public demo API key: `demo`
- No signup or credit card needed
- Generates real videos (with Shotstack branding/limitations)
- Perfect for testing and development

### Test It Now

1. Add to `.env`:
   ```env
   SHOTSTACK_API_KEY=demo
   DEFAULT_AI_VIDEO_PROVIDER=shotstack
   ```
2. Restart server: `pnpm dev`
3. Go to: `/ai-video-generator`
4. Generate a video
5. ✅ Real video generation (with demo limitations)

---

## ✅ Option 3: FFmpeg Local Generation (Advanced)

**Generate videos locally on your server - No external APIs!**

### Requirements

- FFmpeg installed on your server
- Server resources (CPU/RAM)

### Installation

#### Windows
```bash
choco install ffmpeg
```

#### macOS
```bash
brew install ffmpeg
```

#### Linux
```bash
sudo apt update
sudo apt install ffmpeg
```

### Setup

```env
DEFAULT_AI_VIDEO_PROVIDER=ffmpeg
# No API key needed!
```

### How It Works

- Generates simple videos using FFmpeg
- Creates colored backgrounds with text overlays
- Saves videos to `public/generated-videos/` folder
- Completely local, no external services

### Features

- ✅ Free forever
- ✅ No API keys
- ✅ Complete control
- ✅ No external dependencies (except FFmpeg)
- ⚠️ Requires FFmpeg installation
- ⚠️ Generates simple videos (not AI-generated content)

### Customization

Edit `server/services/aiVideoProviders.ts` to customize:
- Add image overlays
- Add animations
- Add audio tracks
- Create slideshows
- Use your own templates

---

## Quick Start (Recommended)

**Easiest Option - Demo Mode (Default)**

1. **No setup needed!** Just start your server:
   ```bash
   pnpm dev
   ```

2. Navigate to: `/ai-video-generator`

3. Enter a prompt and click "Generate Video"

4. ✅ Works immediately with placeholder videos!

**That's it!** Demo mode is enabled by default and requires no configuration.

---

## Comparison Table

| Option | Setup Time | API Key? | Cost | Quality | Best For |
|--------|------------|----------|------|---------|----------|
| **Demo Mode** | 0 minutes | ❌ No | FREE | Placeholder | Development, demos |
| **Shotstack Demo** | 1 minute | ✅ Demo key | FREE | Real videos | Testing, prototyping |
| **FFmpeg Local** | 5 minutes | ❌ No | FREE | Simple videos | Local generation |

---

## Production Recommendations

### For Development/Testing
- ✅ **Use Demo Mode** - Perfect for UI testing
- ✅ **Use Shotstack Demo** - Real API testing

### For Production (Free Options)
1. **Start with Demo Mode** - Get everything working
2. **Upgrade to Shotstack** - Get free demo key (no signup)
3. **Install FFmpeg** - For local video generation
4. **Get Free API Key** - Veo 2, Runway ML, etc. (10-125 free credits)

### For Production (Paid Options)
- Only if you need high-quality AI-generated content
- Consider costs and usage limits
- Implement user quotas to control costs

---

## Troubleshooting

### Demo Mode Not Working
- ✅ Check server logs for errors
- ✅ Verify route is registered: `/api/ai-video/generate`
- ✅ Check browser console for errors

### FFmpeg Not Working
- ✅ Verify FFmpeg is installed: `ffmpeg -version`
- ✅ Check server logs for FFmpeg errors
- ✅ Ensure `public/generated-videos/` directory exists
- ✅ Check file permissions

### Shotstack Demo Not Working
- ✅ Verify demo key is set: `SHOTSTACK_API_KEY=demo`
- ✅ Check Shotstack API status
- ✅ Review API request/response in server logs

---

## Next Steps

1. **Start with Demo Mode** - Test everything immediately
2. **Try Shotstack Demo** - Real API with demo key
3. **Install FFmpeg** - For local video generation
4. **Get Free API Keys** - When you need more features

All options are ready to use! 🎉

