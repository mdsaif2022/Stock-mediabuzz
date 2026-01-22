# 🎬 Switch from Demo Mode to Real Video Generation

Currently, your AI Video Generator is using **Demo Mode** which returns sample videos. To generate **real videos**, you have two options:

## Option 1: Shotstack Demo (Recommended - Real Videos, No Signup!)

**✅ Best option for real videos without signup!**

Shotstack provides a free demo API key that generates **real videos** without any signup or credit card.

### Setup (2 minutes)

1. **Add to your `.env` file:**
   ```env
   SHOTSTACK_API_KEY=demo
   DEFAULT_AI_VIDEO_PROVIDER=shotstack
   ```

2. **Or add to Render/Vercel environment variables:**
   - Key: `SHOTSTACK_API_KEY`
   - Value: `demo`
   - Key: `DEFAULT_AI_VIDEO_PROVIDER`
   - Value: `shotstack`

3. **Restart your server:**
   ```bash
   pnpm dev
   # Or redeploy on Render/Vercel
   ```

### What You Get

- ✅ **Real video generation** (not just placeholders)
- ✅ **No signup required** (works with demo key)
- ✅ **No credit card needed**
- ⚠️ Videos may have Shotstack branding/watermarks (demo limitations)
- ⚠️ Demo key has usage limits

### Test It

1. Go to: `/ai-video-generator`
2. Enter a prompt: "A beautiful sunset"
3. Click "Generate Video"
4. ✅ Real video will be generated!

---

## Option 2: FFmpeg Local Generation (Free Forever)

**✅ Generate videos locally on your server - completely free!**

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

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

#### Render (Docker)
Add to your Dockerfile or use a build command:
```dockerfile
RUN apt-get update && apt-get install -y ffmpeg
```

### Setup

1. **Install FFmpeg** (see above)

2. **Verify installation:**
   ```bash
   ffmpeg -version
   ```

3. **Add to `.env`:**
   ```env
   DEFAULT_AI_VIDEO_PROVIDER=ffmpeg
   ```

4. **Restart server**

### What You Get

- ✅ **Free forever** (no external APIs)
- ✅ **Local generation** (on your server)
- ✅ **No API keys needed**
- ⚠️ **Simple videos** (colored backgrounds with text, not AI-generated content)
- ⚠️ Requires FFmpeg installation

---

## Option 3: Get Free API Keys (For Real AI Videos)

For **real AI-generated videos** with high quality:

### Veo 2 API (10 credits/month free)
```env
VEO2_API_KEY=your_api_key_here
DEFAULT_AI_VIDEO_PROVIDER=veo2
```
Sign up: https://veo2api.com/

### Runway ML (125 free credits on signup)
```env
RUNWAY_API_KEY=your_api_key_here
DEFAULT_AI_VIDEO_PROVIDER=runway
```
Sign up: https://dev.runwayml.com/

See `AI_VIDEO_API_INTEGRATION_GUIDE.md` for more options.

---

## Quick Comparison

| Provider | Setup Time | Cost | Quality | API Key? |
|----------|------------|------|---------|----------|
| **Shotstack Demo** | 2 min | FREE | Real videos | Demo key |
| **FFmpeg** | 5 min | FREE | Simple videos | ❌ No |
| **Veo 2** | 5 min | FREE* | AI videos | ✅ Yes |
| **Runway ML** | 5 min | FREE* | AI videos | ✅ Yes |

*Free tier has limited credits

---

## Recommended: Use Shotstack Demo

**Easiest way to get real videos working immediately:**

```env
SHOTSTACK_API_KEY=demo
DEFAULT_AI_VIDEO_PROVIDER=shotstack
```

That's it! No signup, no credit card, just real video generation! 🎉

