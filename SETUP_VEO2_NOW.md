# ⚡ Quick Setup: Veo 2 API Key

## Your Veo 2 API Key
```
sk_2b149c06a9a16b287c735750fdaa4f4e3e1bef41200b0a1b9a39a6b97bdb0
```

## 🔧 Step 1: Local Development Setup

### Option A: Create `.env` file (Recommended)

Create a `.env` file in your project root (if it doesn't exist):

```env
VEO2_API_KEY=sk_2b149c06a9a16b287c735750fdaa4f4e3e1bef41200b0a1b9a39a6b97bdb0
DEFAULT_AI_VIDEO_PROVIDER=veo2
```

**⚠️ IMPORTANT:** The `.env` file is already in `.gitignore`, so it won't be committed to Git (safe!).

### Option B: Set in Terminal (Temporary - Only for current session)

**Windows PowerShell:**
```powershell
$env:VEO2_API_KEY="sk_2b149c06a9a16b287c735750fdaa4f4e3e1bef41200b0a1b9a39a6b97bdb0"
$env:DEFAULT_AI_VIDEO_PROVIDER="veo2"
```

**Windows CMD:**
```cmd
set VEO2_API_KEY=sk_2b149c06a9a16b287c735750fdaa4f4e3e1bef41200b0a1b9a39a6b97bdb0
set DEFAULT_AI_VIDEO_PROVIDER=veo2
```

**macOS/Linux:**
```bash
export VEO2_API_KEY=sk_2b149c06a9a16b287c735750fdaa4f4e3e1bef41200b0a1b9a39a6b97bdb0
export DEFAULT_AI_VIDEO_PROVIDER=veo2
```

---

## 🌐 Step 2: Production Setup (Render/Vercel)

### For Render (Backend)

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Select your backend service**
3. **Go to "Environment" tab**
4. **Click "Add Environment Variable"**
5. **Add these variables:**

   **Variable 1:**
   - Key: `VEO2_API_KEY`
   - Value: `sk_2b149c06a9a16b287c735750fdaa4f4e3e1bef41200b0a1b9a39a6b97bdb0`
   - Environment: Production (or All)
   
   **Variable 2:**
   - Key: `DEFAULT_AI_VIDEO_PROVIDER`
   - Value: `veo2`
   - Environment: Production (or All)

6. **Click "Save Changes"**
7. **Wait for redeploy** (auto-redeploys after saving)

### For Vercel (If deploying backend there)

Same steps as Render - add the variables in Vercel Dashboard → Settings → Environment Variables.

---

## ✅ Step 3: Verify Setup

### Local Testing

1. **Restart your dev server:**
   ```bash
   pnpm dev
   ```

2. **Check server logs** - you should see:
   ```
   ✅ Veo 2 API configured
   ✅ Default provider: veo2
   ```

3. **Test video generation:**
   - Go to: `/ai-video-generator`
   - Enter a prompt: "A beautiful sunset over the ocean"
   - Click "Generate Video"
   - ✅ Video should now match your prompt!

### Production Testing

After redeploying on Render:

1. **Check Render logs** for any errors
2. **Test the API endpoint:**
   ```
   POST https://your-backend.onrender.com/api/ai-video/generate
   ```
3. **Generate a video** from your frontend
4. **Verify** the video matches your prompt!

---

## 🔒 Security Reminder

**⚠️ IMPORTANT - Keep Your API Key Safe:**

1. ✅ **DO:** Use `.env` file (already gitignored)
2. ✅ **DO:** Add to Render/Vercel environment variables (secure)
3. ❌ **DON'T:** Commit `.env` file to Git
4. ❌ **DON'T:** Share your API key publicly
5. ❌ **DON'T:** Hardcode it in your code files

**If you shared your key publicly:**
- Go to https://veo2api.com/dashboard
- Generate a new API key
- Revoke the old one
- Update your environment variables

---

## 🎬 What Happens Now

Once configured:

1. **Demo mode warning disappears** (if you remove demo mode)
2. **Videos will match your prompts** ✅
3. **Real AI-generated videos** from Veo 2
4. **10 free credits per month** (renews automatically)

---

## 🆘 Troubleshooting

### Issue: "VEO2_API_KEY not set"

**Solution:** 
- Verify `.env` file exists in project root
- Check variable name is exactly `VEO2_API_KEY`
- Restart server after adding variables

### Issue: "Veo 2 generation failed"

**Possible causes:**
- API key is invalid or expired
- Veo 2 API endpoint changed
- Rate limit exceeded (10 credits/month)
- Check Veo 2 dashboard for API status

### Issue: Still using demo mode

**Solution:**
- Verify `DEFAULT_AI_VIDEO_PROVIDER=veo2` is set
- Restart server
- Check server logs for provider selection

---

## ✅ Quick Test

After setup, test with this prompt:
```
"A serene sunset over a calm ocean with gentle waves"
```

The video should actually show a sunset over the ocean - not a random sci-fi scene! 🎉

