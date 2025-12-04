# 🔴 Redis Connection Debugging

## Common Issues After Adding Environment Variables

### Issue 1: Quotes in Values ❌

**WRONG:**
```
UPSTASH_REDIS_REST_URL="https://eternal-blowfish-28190.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AW4eAAIncDI4ZDdiMDc2MzBiMDY0ZGFjYWZlYmJhZDM2MGZjMzUzZnAyMjgxOTA"
```

**CORRECT (No Quotes):**
```
UPSTASH_REDIS_REST_URL=https://eternal-blowfish-28190.upstash.io
UPSTASH_REDIS_REST_TOKEN=AW4eAAIncDI4ZDdiMDc2MzBiMDY0ZGFjYWZlYmJhZDM2MGZjMzUzZnAyMjgxOTA
```

### Issue 2: Trailing Spaces ❌

**WRONG:**
```
UPSTASH_REDIS_REST_URL=https://eternal-blowfish-28190.upstash.io 
UPSTASH_REDIS_REST_TOKEN=AW4eAAIncDI4ZDdiMDc2MzBiMDY0ZGFjYWZlYmJhZDM2MGZjMzUzZnAyMjgxOTA 
```

**CORRECT (No Spaces):**
```
UPSTASH_REDIS_REST_URL=https://eternal-blowfish-28190.upstash.io
UPSTASH_REDIS_REST_TOKEN=AW4eAAIncDI4ZDdiMDc2MzBiMDY0ZGFjYWZlYmJhZDM2MGZjMzUzZnAyMjgxOTA
```

### Issue 3: Wrong Variable Names ❌

**WRONG:**
```
UPSTASH_REDIS_URL=...
UPSTASH_REDIS_TOKEN=...
REDIS_URL=...
REDIS_TOKEN=...
```

**CORRECT (Exact Names):**
```
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

### Issue 4: Service Not Redeployed ❌

After adding variables, Render must redeploy. Check:
1. Did you click "Save Changes"?
2. Did Render show "Redeploying..."?
3. Wait 2-5 minutes for deployment to complete

### Issue 5: Wrong Environment ❌

Make sure variables are set for **Production** environment, not just Preview.

---

## Step-by-Step Fix

### Step 1: Verify Variables in Render

1. Go to Render Dashboard → Your Service → **Environment** tab
2. Check each variable:
   - **Name**: Must be EXACTLY `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
   - **Value**: No quotes, no spaces
   - **Environment**: Should be "Production" or "All"

### Step 2: Force Redeploy

1. Go to Render Dashboard → Your Service
2. Click **"Manual Deploy"** → **"Deploy latest commit"**
3. Wait for deployment to complete (2-5 minutes)

### Step 3: Check Server Logs

1. Go to Render Dashboard → Your Service → **"Logs"** tab
2. Look for these messages:

**✅ Success:**
```
✅ Connected to Upstash Redis - Data will persist
✅ Saved X items to Redis/KV (media-database) - verified
```

**❌ Error:**
```
❌ Failed to initialize Upstash Redis: [error message]
📁 Using file storage (localhost mode)
```

### Step 4: Test Connection

After deployment, test:

```
GET https://stock-mediabuzz-1.onrender.com/api/media/database/status
```

Look for:
```json
{
  "storage": {
    "type": "Upstash Redis",
    "hasKV": true,
    "hasUpstashRedis": true,
    "connectionTest": "✅ Connected and working"
  }
}
```

### Step 5: Health Check

```
GET https://stock-mediabuzz-1.onrender.com/api/media/health
```

Should show:
```json
{
  "status": "healthy",
  "persistence": {
    "testPassed": true
  }
}
```

---

## Still Not Working?

### Check 1: Variable Values

In Render, click "Edit" on each variable and verify:
- No quotes around the value
- No trailing spaces
- Exact URL and token

### Check 2: Package Installation

Verify `@upstash/redis` is in `package.json`:
```json
{
  "dependencies": {
    "@upstash/redis": "^1.35.7"
  }
}
```

### Check 3: Upstash Console

1. Go to https://console.upstash.com/
2. Check your Redis database is **Active**
3. Verify the URL and token match what you added

### Check 4: Render Logs

Look for specific error messages:
- `Cannot find module '@upstash/redis'` → Package not installed
- `Invalid URL` → URL has quotes or spaces
- `Unauthorized` → Token is wrong
- `Connection refused` → Network issue

---

## Quick Test

Add this temporary endpoint to test if variables are being read:

```typescript
app.get("/api/debug/env", (_req, res) => {
  res.json({
    hasUrl: !!process.env.UPSTASH_REDIS_REST_URL,
    hasToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    urlPreview: process.env.UPSTASH_REDIS_REST_URL?.substring(0, 30) + "...",
    tokenPreview: process.env.UPSTASH_REDIS_REST_TOKEN?.substring(0, 10) + "...",
  });
});
```

Then check: `GET /api/debug/env`

---

## Most Common Fix

**90% of issues are caused by quotes in the values!**

Remove quotes:
- ❌ `"https://eternal-blowfish-28190.upstash.io"`
- ✅ `https://eternal-blowfish-28190.upstash.io`

Then redeploy!

