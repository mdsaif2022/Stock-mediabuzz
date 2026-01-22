# AI Video Generation API Integration Guide

This guide explains how to get **FREE** API access and integrate AI video generation services into your application.

## 🆓 Free APIs Available (Recommended)

### No API Key Required:
1. **[Demo Mode](#demo-mode)** - ✅ **Works immediately, no setup!**
2. **[Shotstack Demo](#shotstack)** - ✅ **Free demo key, no signup!**
3. **[FFmpeg Local](#ffmpeg-local)** - ✅ **Generate locally, no API!**

### Free APIs (API Key Required):
4. **[Veo 2 API](#veo-2-api)** - ✅ 10 free credits/month
5. **[HeyGen](#heygen)** - ✅ 10 free credits/month
6. **[Mozify](#mozify)** - ✅ Free credits for new users
7. **[Pixazo](#pixazo)** - ✅ Free API access with limited credits
8. **[Runway ML](#runway-ml)** - ✅ 125 free credits on signup

## Table of Contents
1. [Free APIs (Recommended)](#free-apis-recommended)
   - [Veo 2 API](#veo-2-api)
   - [HeyGen](#heygen)
   - [Mozify](#mozify)
   - [Pixazo](#pixazo)
2. [Other Options with Free Tiers](#other-options-with-free-tiers)
   - [Runway ML](#runway-ml)
   - [D-ID](#d-id)
3. [Paid Services](#paid-services)
   - [Synthesia](#synthesia)
4. [Integration Steps](#integration-steps)

---

## 🆓 Free APIs - NO API Key Required (Best for Quick Start)

### Demo Mode

**✅ BEST FOR QUICK START - Works immediately, no setup!**

#### What is Demo Mode?

Demo mode generates placeholder videos without any external APIs. Perfect for:
- ✅ **Development and testing** - Test the UI immediately
- ✅ **Demonstrations** - Show how the system works
- ✅ **Prototyping** - Build features without external dependencies
- ✅ **Learning** - Understand the workflow

#### Setup

**No setup needed!** Demo mode is enabled by default.

```env
# Optional: Explicitly set (not needed, it's the default)
DEFAULT_AI_VIDEO_PROVIDER=demo
# No API key needed!
```

#### How It Works

1. User enters a prompt
2. System simulates video generation (2-5 seconds)
3. Returns a placeholder video URL
4. Full workflow is demonstrated

#### Test It Now

1. Start server: `pnpm dev`
2. Navigate to: `/ai-video-generator`
3. Enter any prompt
4. Click "Generate Video"
5. ✅ Works immediately!

**That's it! No API keys, no signup, no costs, no setup!**

---

### Shotstack Demo (No Signup Needed)

**✅ Free demo API key - No registration required!**

#### Setup

```env
SHOTSTACK_API_KEY=demo
DEFAULT_AI_VIDEO_PROVIDER=shotstack
```

#### How It Works

- Shotstack provides a public demo key: `demo`
- No signup or credit card needed
- Generates real videos (with demo limitations)
- Perfect for testing

#### Features

- ✅ Real video generation
- ✅ No signup needed
- ✅ Works with demo key
- ⚠️ Demo key has limitations
- ⚠️ Videos may have branding

---

### FFmpeg Local Generation

**✅ Generate videos locally - No external APIs!**

#### Requirements

- FFmpeg installed on server

#### Setup

```env
DEFAULT_AI_VIDEO_PROVIDER=ffmpeg
# Install FFmpeg first: brew install ffmpeg (Mac) or apt install ffmpeg (Linux)
```

#### Features

- ✅ Completely free
- ✅ No API keys needed
- ✅ Local generation
- ✅ Full control
- ⚠️ Requires FFmpeg installation
- ⚠️ Generates simple videos (not AI-generated)

See `FREE_VIDEO_GENERATION_SETUP.md` for detailed FFmpeg setup.

---

## 🆓 Free APIs - API Key Required

### Veo 2 API

**✅ BEST FREE OPTION - 10 Credits/Month Forever**

#### Getting Free API Access

1. **Sign Up**: Visit [Veo 2 API](https://veo2api.com/)
2. **Create Account**: Register with email (no credit card required)
3. **Get API Key**: Available immediately after signup
4. **API Documentation**: Check their dashboard for API docs
5. **Free Tier**: 
   - ✅ 10 credits per month (renews monthly)
   - ✅ No credit card required
   - ✅ Uses Google's Veo 2 technology
   - ✅ High-quality video generation

#### API Endpoints

```
POST https://api.veo2api.com/v1/generate
GET  https://api.veo2api.com/v1/status/{task_id}
```

#### Authentication

```javascript
headers: {
  'Authorization': 'Bearer YOUR_VEO2_API_KEY',
  'Content-Type': 'application/json'
}
```

#### Example Request

```json
{
  "prompt": "A serene sunset over the ocean",
  "duration": 5,
  "aspect_ratio": "16:9"
}
```

---

### HeyGen

**✅ 10 Free Credits/Month (Watermarked)**

#### Getting Free API Access

1. **Sign Up**: Visit [HeyGen AI](https://heygen-ai.com/)
2. **Create Account**: Register for free account
3. **Get API Key**: Available in developer dashboard
4. **Free Tier**: 
   - ✅ 10 credits per month
   - ✅ Videos have watermark on free plan
   - ✅ Can create videos from text or templates

#### API Endpoints

```
POST https://api.heygen.com/v1/video/generate
GET  https://api.heygen.com/v1/video/{video_id}
```

#### Authentication

```javascript
headers: {
  'X-API-KEY': 'YOUR_HEYGEN_API_KEY',
  'Content-Type': 'application/json'
}
```

---

### Mozify

**✅ Free Credits for New Users**

#### Getting Free API Access

1. **Sign Up**: Visit [Mozify.ai](https://mozify.ai/)
2. **Create Account**: Register as new user
3. **Get API Key**: Available after registration
4. **Free Tier**: 
   - ✅ Free credits for new users
   - ✅ Access to multiple AI models (OpenAI Sora, Google Veo)
   - ✅ Unified API for multiple providers

#### API Endpoints

```
POST https://api.mozify.ai/v1/generate
GET  https://api.mozify.ai/v1/status/{task_id}
```

#### Authentication

```javascript
headers: {
  'Authorization': 'Bearer YOUR_MOZIFY_API_KEY',
  'Content-Type': 'application/json'
}
```

---

### Pixazo

**✅ Free API Access with Limited Credits**

#### Getting Free API Access

1. **Sign Up**: Visit [Pixazo.ai](https://www.pixazo.ai/models/free-api)
2. **Create Account**: Register for free
3. **Get API Key**: Available in API section
4. **Free Tier**: 
   - ✅ Limited free credits
   - ✅ Multiple AI models available
   - ✅ Good for testing and prototyping

#### API Endpoints

```
POST https://api.pixazo.ai/v1/video/generate
GET  https://api.pixazo.ai/v1/video/{video_id}
```

#### Authentication

```javascript
headers: {
  'X-API-KEY': 'YOUR_PIXAZO_API_KEY',
  'Content-Type': 'application/json'
}
```

---

## Other Options with Free Tiers

### Runway ML

### Getting API Access (Free Credits Available)

1. **Sign Up**: Visit [Runway Developer Portal](https://dev.runwayml.com/)
2. **Create Account**: Register for a developer account
3. **Get API Key**: After registration, go to your dashboard to generate an API key
4. **Review Documentation**: [Runway API Docs](https://docs.dev.runwayml.com/)
5. **Free Tier**: 
   - ✅ **125 FREE credits on signup** (one-time)
   - ✅ No credit card required for free credits
   - ⚠️ After free credits expire, paid plans required
   - 💰 Paid: ~$0.05-0.10 per second of generated video

### API Endpoints

```
POST https://api.runwayml.com/v1/image-to-video
POST https://api.runwayml.com/v1/text-to-video
GET  https://api.runwayml.com/v1/tasks/{task_id}
```

### Authentication

```javascript
headers: {
  'Authorization': 'Bearer YOUR_RUNWAY_API_KEY',
  'Content-Type': 'application/json'
}
```

---

## D-ID

### Getting API Access (Free Trial)

1. **Sign Up**: Visit [D-ID.com](https://www.d-id.com/)
2. **Create Account**: Register for free
3. **Get API Key**: Navigate to Developer section → API Keys
4. **Review Documentation**: [D-ID API Docs](https://docs.d-id.com/)
5. **Free Trial**: 
   - ✅ Limited free trial credits
   - ⚠️ After trial, paid plans required
   - 💰 Paid: $5.99/month (Lite) or $29.99/month (Pro)

### API Endpoints

```
POST https://api.d-id.com/talks
GET  https://api.d-id.com/talks/{talk_id}
POST https://api.d-id.com/clips
GET  https://api.d-id.com/clips/{clip_id}
```

### Authentication

```javascript
headers: {
  'Authorization': 'Basic ' + btoa('YOUR_DID_API_KEY:'),
  'Content-Type': 'application/json'
}
```

---

## Paid Services

### Synthesia

### Getting API Access

1. **Visit Website**: [Synthesia.io](https://www.synthesia.io/)
2. **Contact Sales**: API access typically requires direct contact with their sales team
3. **Enterprise Plan**: API access is usually part of enterprise/subscription plans
4. **API Documentation**: [Synthesia API Docs](https://docs.synthesia.io/)
5. **Pricing**: Contact for custom pricing (typically starts at $30-50/month)

### API Endpoints

```
POST https://api.synthesia.io/v2/videos
GET  https://api.synthesia.io/v2/videos/{video_id}
POST https://api.synthesia.io/v2/videos/{video_id}/status
```

### Authentication

```javascript
headers: {
  'Authorization': 'YOUR_SYNTHESIA_API_KEY',
  'Content-Type': 'application/json'
}
```

---

## D-ID

### Getting API Access

1. **Sign Up**: Visit [D-ID.com](https://www.d-id.com/)
2. **Create Account**: Register for free
3. **Get API Key**: Navigate to Developer section → API Keys
4. **Review Documentation**: [D-ID API Docs](https://docs.d-id.com/)
5. **Pricing**:
   - Lite Plan: $5.99/month (limited credits)
   - Pro Plan: $29.99/month
   - Enterprise: Custom pricing

### API Endpoints

```
POST https://api.d-id.com/talks
GET  https://api.d-id.com/talks/{talk_id}
POST https://api.d-id.com/clips
GET  https://api.d-id.com/clips/{clip_id}
```

### Authentication

```javascript
headers: {
  'Authorization': 'Basic ' + btoa('YOUR_DID_API_KEY:'),
  'Content-Type': 'application/json'
}
```

---

## Pika Labs

### Getting API Access

**Important**: Pika Labs does NOT currently offer a public API.

**Current Status**:
- No official public API available
- Only accessible via web interface or Discord bot
- Third-party integrations exist but use unofficial methods
- API may be released in the future

**Alternatives**:
1. **Wait for Official API**: Monitor [Pika.art](https://pika.art/) for announcements
2. **Use Alternatives**: Consider Runway ML or other services that offer APIs
3. **Contact Directly**: Reach out to Pika Labs through their website for partnership opportunities

---

## Integration Steps

### 1. Environment Variables Setup

Add to your `.env` file or Render/Vercel environment variables:

```env
# Runway ML
RUNWAY_API_KEY=your_runway_api_key_here

# Synthesia
SYNTHESIA_API_KEY=your_synthesia_api_key_here

# D-ID
DID_API_KEY=your_did_api_key_here

# Optional: Default provider
DEFAULT_AI_VIDEO_PROVIDER=runway  # or 'synthesia', 'd-id'
```

### 2. Install Required Dependencies

```bash
pnpm add axios  # If not already installed
# or
npm install axios
```

### 3. Integration Examples

See `server/routes/ai-video.ts` for complete integration examples for each provider.

---

## Quick Start: Runway ML Integration

1. **Get API Key**:
   - Visit https://dev.runwayml.com/
   - Sign up and get your API key

2. **Set Environment Variable**:
   ```bash
   export RUNWAY_API_KEY=your_key_here
   ```

3. **Test API**:
   ```bash
   curl -X POST https://api.runwayml.com/v1/text-to-video \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "A serene sunset"}'
   ```

---

## 🆓 Free Tier Comparison

| Service | Free Tier | Renews? | Watermark? | Best For |
|---------|-----------|---------|------------|----------|
| **Veo 2 API** | ✅ 10 credits/month | ✅ Monthly | ❌ No | Best free option, Google Veo 2 |
| **HeyGen** | ✅ 10 credits/month | ✅ Monthly | ✅ Yes | Quick videos, templates |
| **Mozify** | ✅ Free credits | ⚠️ One-time | ❌ No | Multiple models, unified API |
| **Pixazo** | ✅ Limited credits | ⚠️ One-time | ❌ No | Testing, prototyping |
| **Runway ML** | ✅ 125 credits | ❌ One-time | ❌ No | High-quality, creative |
| **D-ID** | ⚠️ Trial credits | ❌ No | ❌ No | Talking avatars only |

## 💰 Paid Tier Comparison

| Service | Paid Plans | Best For |
|---------|------------|----------|
| **Runway ML** | $0.05-0.10/sec | High-quality, creative videos |
| **Synthesia** | $30-50+/month | Avatar-based, talking videos (contact sales) |
| **D-ID** | $5.99-29.99/month | Talking avatars, face animation |
| **Pika Labs** | N/A (no API) | Community access only |

---

## 🎯 Recommended: Start with Veo 2 API (Best Free Option)

**Why Veo 2 API?**
- ✅ **10 FREE credits per month (renews monthly)**
- ✅ **No credit card required**
- ✅ Uses Google's latest Veo 2 technology
- ✅ High-quality video generation
- ✅ Official API with documentation
- ✅ Best for production use

**Alternative: If you need more credits, try Runway ML**
- ✅ 125 free credits on signup (one-time)
- ✅ No credit card needed for free tier
- ✅ Official public API available
- ✅ Good documentation
- ✅ High-quality video generation

---

## Next Steps (FREE Setup)

1. **Choose a FREE provider** (we recommend **Veo 2 API** - 10 credits/month free)
2. **Sign up** (no credit card required for free tiers)
3. **Get your FREE API key** from the provider's dashboard
4. **Add the API key** to your environment variables
5. **Update `server/routes/ai-video.ts`** with your chosen provider's code
6. **Test** with a simple prompt (using free credits)
7. **Deploy** - monitor usage to stay within free limits

## Quick Start with FREE Veo 2 API

See `INTEGRATE_VEO2_FREE.md` for step-by-step instructions using the completely free Veo 2 API.

---

## Support & Resources

- **Runway ML Community**: [Discord](https://discord.gg/runwayml)
- **Synthesia Support**: [support@synthesia.io](mailto:support@synthesia.io)
- **D-ID Support**: [help@d-id.com](mailto:help@d-id.com)

---

## Important Notes

⚠️ **API Rate Limits**: All services have rate limits. Monitor your usage.

⚠️ **Costs**: Video generation can be expensive. Implement usage limits and user quotas.

⚠️ **Processing Time**: Video generation can take 30 seconds to 5+ minutes. Use async processing.

⚠️ **Content Policies**: Review each service's content policy and terms of service.

