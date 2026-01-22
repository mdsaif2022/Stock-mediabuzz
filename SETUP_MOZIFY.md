# 🎬 Mozify API Configuration Complete!

## ✅ Your Mozify API Key

Your API key has been configured and set as the default provider:
```
MOZIFY_API_KEY=moz_ptvZkeHqZntC_Bf5eaNsFZP6feuof4bWixUIk10O_yM
DEFAULT_AI_VIDEO_PROVIDER=mozify
```

## 🚀 What is Mozify?

**Mozify** is a unified API that provides access to multiple AI video generation models:
- ✅ **OpenAI Sora** (sora-2-15s)
- ✅ **Google Veo**
- ✅ And more AI video models

**Benefits:**
- 🎯 Single API for multiple AI models
- 🆓 Free credits for new users
- ⚡ High-quality video generation
- 🔄 Easy model switching

## 📝 Current Configuration

**Model Used:** `sora-2-15s` (OpenAI Sora - 15 seconds max)
**Endpoint:** `https://api.mozify.ai/v1/video/generate`
**Status Check:** `https://api.mozify.ai/v1/video/status/{task_id}`

## ✅ Next Steps

### 1. Restart Your Server

```bash
pnpm dev
```

### 2. Test Video Generation

1. **Go to**: `/ai-video-generator`
2. **Enter a prompt**: "A magical leap year story where February 29th comes every four years"
3. **Click**: "Generate Video"
4. **Wait**: Video generation typically takes 1-3 minutes
5. **Check**: Video should match your prompt! ✅

### 3. Monitor Server Logs

Watch for:
```
[Mozify] Generating video with prompt: "..."
[Mozify] Generation started. Task ID: ...
```

## 🔧 Configuration Options

### Change Model (Optional)

To use a different model, edit `server/services/aiVideoProviders.ts`:

```typescript
// In generateVideoWithMozify function
body: JSON.stringify({
  model: "sora-2-15s", // Change to: "veo-2", "sora-1", etc.
  prompt: prompt,
  // ...
}),
```

**Available Models** (check Mozify dashboard for latest):
- `sora-2-15s` - OpenAI Sora (up to 15 seconds)
- `sora-1` - Original Sora model
- `veo-2` - Google Veo 2
- Check Mozify dashboard for full list

## 🌐 Production Setup (Render/Vercel)

Add these environment variables to your hosting platform:

**For Render:**
1. Go to: https://dashboard.render.com
2. Select your backend service
3. Go to "Environment" tab
4. Add:
   - `MOZIFY_API_KEY` = `moz_ptvZkeHqZntC_Bf5eaNsFZP6feuof4bWixUIk10O_yM`
   - `DEFAULT_AI_VIDEO_PROVIDER` = `mozify`
5. Save and wait for redeploy

**For Vercel:**
- Same steps, add in Settings → Environment Variables

## 🆘 Troubleshooting

### Issue: "MOZIFY_API_KEY not set"

**Solution:**
- Verify `.env` file exists in project root
- Check variable name is exactly `MOZIFY_API_KEY`
- Restart server after adding variables

### Issue: "401 Unauthorized"

**Possible causes:**
- API key is invalid or expired
- API key format is wrong (should start with `moz_`)
- Check Mozify dashboard for key status

**Solution:**
- Verify API key in Mozify dashboard: https://mozify.ai/dashboard
- Generate a new key if needed
- Update `.env` file

### Issue: "404 Not Found" or "Endpoint not found"

**Solution:**
- Check Mozify API documentation for endpoint changes
- Update endpoint in `server/services/aiVideoProviders.ts` if needed
- Verify Mozify API status: https://status.mozify.ai (if available)

### Issue: "Generation timeout"

**Possible causes:**
- Video generation takes longer than expected
- Model is processing a complex prompt
- Network issues

**Solution:**
- Wait a bit longer (up to 5 minutes for complex videos)
- Try a simpler prompt
- Check Mozify dashboard for queue status
- Check server logs for detailed errors

### Issue: "Rate limit exceeded"

**Solution:**
- Check your Mozify dashboard for credit usage
- Wait for rate limit reset
- Consider upgrading your Mozify plan if needed

## 📊 Checking Your API Key Status

1. **Log into**: https://mozify.ai/dashboard
2. **Check**:
   - API key status (active/inactive)
   - Credit balance
   - Usage statistics
   - Available models

## 🔒 Security Notes

**⚠️ IMPORTANT - Keep Your API Key Safe:**

1. ✅ **DO:** Keep `.env` file in `.gitignore` (already done)
2. ✅ **DO:** Use environment variables on hosting platforms
3. ❌ **DON'T:** Commit API keys to Git
4. ❌ **DON'T:** Share API keys publicly
5. ❌ **DON'T:** Hardcode keys in code files

**If your key was exposed:**
- Generate a new API key at https://mozify.ai/dashboard
- Revoke the old key
- Update your `.env` and hosting platform variables

## 🎯 Switching Between Providers

If you want to switch back to Veo 2 or use another provider:

**Edit `.env` file:**
```env
# For Mozify (current)
DEFAULT_AI_VIDEO_PROVIDER=mozify

# For Veo 2
DEFAULT_AI_VIDEO_PROVIDER=veo2

# For Runway ML
DEFAULT_AI_VIDEO_PROVIDER=runway

# For Demo Mode (random samples)
DEFAULT_AI_VIDEO_PROVIDER=demo
```

Then restart your server.

## ✅ Success Indicators

You'll know Mozify is working when:
- ✅ Server starts without errors
- ✅ Video generation requests are accepted
- ✅ Server logs show `[Mozify]` messages
- ✅ Generated videos match your prompts
- ✅ Videos appear in your generation history

## 🎬 Test Prompt Examples

Try these prompts to test Mozify:

1. **Simple**: "A cat playing piano in a sunny room"
2. **Detailed**: "A serene sunset over a calm ocean with gentle waves, cinematic style, 4K quality"
3. **Creative**: "A magical leap year story where February 29th comes every four years"
4. **Action**: "A futuristic city with flying cars and neon lights at night"

---

**Need help?** Check Mozify documentation: https://mozify.ai/docs

