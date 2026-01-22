# ⚠️ Important: Veo 2 API Endpoints May Need Updates

## 🔍 Your Veo 2 API Key

Your API key has been configured:
```
VEO2_API_KEY=sk_2b149c06a9a16b287c735750fdaa4f4e3e1bef41200b0a1b9a39a6b97bdb0
DEFAULT_AI_VIDEO_PROVIDER=veo2
```

## ⚠️ Important: Check Actual API Endpoints

The Veo 2 API endpoints in the code are **placeholder/estimated** endpoints. You need to verify the actual endpoints from your Veo 2 dashboard:

1. **Log into**: https://veo2api.com/ (or your Veo 2 provider's dashboard)
2. **Check API Documentation**: Look for the actual endpoint URLs
3. **Update the code** in `server/services/aiVideoProviders.ts` if endpoints are different

## 📝 Current Endpoints (May Need Updates)

**Generate Video:**
```
POST https://api.veo2api.com/v1/generate
```

**Check Status:**
```
GET https://api.veo2api.com/v1/status/{task_id}
```

## 🔧 How to Update Endpoints

If your Veo 2 API uses different endpoints:

1. **Open**: `server/services/aiVideoProviders.ts`
2. **Find**: `generateVideoWithVeo2()` function (around line 358)
3. **Update**: The `fetch()` URL to match your actual endpoint
4. **Find**: `checkVeo2Status()` function (around line 403)
5. **Update**: The status check URL to match your actual endpoint

## 🧪 Testing Your API Key

To test if your API key works:

1. **Check Veo 2 Dashboard**:
   - Log into https://veo2api.com/dashboard
   - Verify your API key is active
   - Check your credit balance (10 free credits/month)

2. **Test via Server Logs**:
   - Restart server: `pnpm dev`
   - Try generating a video
   - Check server console for API calls
   - Look for any error messages

3. **Check API Response**:
   - If you get 401 (Unauthorized): API key is wrong
   - If you get 404 (Not Found): Endpoint URL is wrong
   - If you get 400 (Bad Request): Request format is wrong

## 🔒 Security Note

**⚠️ IMPORTANT**: Your API key was shared publicly in this conversation. For security:

1. **Generate a new API key** at https://veo2api.com/dashboard
2. **Revoke the old key** (if possible)
3. **Update your `.env` file** with the new key
4. **Never share API keys** in public conversations or commit them to Git

## ✅ Next Steps

1. **Verify your API key** is active in Veo 2 dashboard
2. **Check API documentation** for exact endpoints
3. **Update endpoints** in `server/services/aiVideoProviders.ts` if needed
4. **Restart server**: `pnpm dev`
5. **Test video generation** with a simple prompt
6. **Check server logs** for any errors

## 📚 Finding the Correct Endpoints

The actual Veo 2 API endpoints depend on the service provider. Common sources:

- **veo2api.com Dashboard** → API Documentation
- **Fal.ai** (if using their Veo 2 service) → https://fal.ai/models/fal-ai/veo2/api
- **Google Cloud** (if direct Veo 2 access) → Google Cloud documentation

Check your Veo 2 provider's documentation for the exact endpoints!

