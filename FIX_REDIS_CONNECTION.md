# 🔧 Fix Redis Connection on Render - Step by Step

## ⚠️ Your Current Problem

**Symptoms:**
- ✅ Works fine on localhost
- ❌ On Render, media disappears after 1-2 hours
- ❌ Need to manually sync every 1-2 hours
- ❌ Data doesn't persist

**Root Cause:** Redis connection is failing on Render, so data can't be saved permanently.

---

## 🎯 Solution: Fix Redis Connection

### Step 1: Check Your Upstash Redis Database

1. Go to: https://console.upstash.com/
2. Log in to your account
3. Find your Redis database: `eternal-blowfish-28190`
4. Check if it's **Active** (not paused or deleted)

### Step 2: Get Fresh Credentials

1. In Upstash Console, click on your database
2. Go to **"REST API"** tab
3. Copy:
   - **UPSTASH_REDIS_REST_URL** (should start with `https://`)
   - **UPSTASH_REDIS_REST_TOKEN** (long string)

### Step 3: Update Render Environment Variables

1. Go to: **Render Dashboard** → Your Service → **Environment** tab
2. Find these variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. **Delete both variables** (click the X)
4. **Add them again** with fresh values from Step 2:
   - **Name:** `UPSTASH_REDIS_REST_URL`
   - **Value:** `https://eternal-blowfish-28190.upstash.io` (NO quotes, NO spaces)
   - **Name:** `UPSTASH_REDIS_REST_TOKEN`
   - **Value:** `AW4eAAIncDI4ZDdiMDc2...` (NO quotes, NO spaces)
5. **Click "Save Changes"**

### Step 4: Redeploy Service

1. After saving environment variables, Render will auto-redeploy
2. Wait 2-5 minutes for deployment to complete
3. Or manually trigger: **Render Dashboard** → Your Service → **Manual Deploy** → **Deploy latest commit**

### Step 5: Check Logs for Connection Status

1. Go to: **Render Dashboard** → Your Service → **Logs** tab
2. Look for these messages:

**✅ SUCCESS:**
```
🔄 Attempting to connect to Upstash Redis...
   URL: https://eternal-blowfish-28190.upstash...
   Token: AW4eAAIncDI4ZDd...
   ✅ @upstash/redis package loaded
   Creating Redis client...
   Testing connection (ping)...
✅ Upstash Redis connected successfully!
   Ping result: PONG
✅ Connected to Upstash Redis - Data will persist
```

**❌ FAILURE (check the error message):**
```
🔄 Attempting to connect to Upstash Redis...
❌ Redis ping failed
   Error: [ERROR MESSAGE HERE]
```

### Step 6: Verify Connection

After deployment, check:

**URL:** `https://stock-mediabuzz-1.onrender.com/api/media/database/status`

Look for:
```json
{
  "storage": {
    "type": "Upstash Redis",
    "hasKV": true,
    "connectionTest": "✅ Connected and working",
    "persistenceWarning": "✅ Data will persist permanently"
  }
}
```

---

## 🆘 Common Errors & Fixes

### Error: "Unauthorized" or "401"

**Problem:** Token is incorrect or expired

**Fix:**
1. Get fresh token from Upstash Console
2. Update `UPSTASH_REDIS_REST_TOKEN` in Render
3. Redeploy

### Error: "Invalid URL" or "ENOTFOUND"

**Problem:** URL is wrong or database doesn't exist

**Fix:**
1. Check URL in Upstash Console → REST API tab
2. Make sure URL is exactly: `https://eternal-blowfish-28190.upstash.io`
3. No trailing slash, no quotes, no spaces
4. Update `UPSTASH_REDIS_REST_URL` in Render
5. Redeploy

### Error: "Network error" or "timeout"

**Problem:** Upstash database might be paused or network issue

**Fix:**
1. Check Upstash Console → Is database **Active**?
2. If paused, click "Resume"
3. Wait 1-2 minutes, then redeploy on Render

### Error: "MODULE_NOT_FOUND" or "@upstash/redis not found"

**Problem:** Package not installed

**Fix:**
1. This shouldn't happen (package is in package.json)
2. If it does: Check Render build logs
3. Make sure `pnpm install` runs successfully

---

## ✅ After Redis is Connected

Once you see `✅ Connected to Upstash Redis - Data will persist`:

1. **Auto-sync will run every 5 minutes** (faster recovery)
2. **Data will persist permanently** (survives restarts)
3. **No more manual syncing needed!**

### Test It:

1. Wait 5 minutes after Redis connects
2. Check: `https://stock-mediabuzz-1.onrender.com/api/media/sync/status`
3. Should show: `"lastSyncTime"` with recent timestamp
4. Your media should stay visible permanently!

---

## 📊 Monitor Status

**Check connection:**
```
GET https://stock-mediabuzz-1.onrender.com/api/media/database/status
```

**Check sync status:**
```
GET https://stock-mediabuzz-1.onrender.com/api/media/sync/status
```

**Check health:**
```
GET https://stock-mediabuzz-1.onrender.com/api/media/health
```

---

## 🎯 Summary

1. ✅ Get fresh credentials from Upstash Console
2. ✅ Update environment variables in Render (NO quotes, NO spaces)
3. ✅ Redeploy service
4. ✅ Check logs for connection success
5. ✅ Verify with `/api/media/database/status`
6. ✅ Wait 5 minutes for auto-sync to run
7. ✅ Your data will now persist permanently!

**Once Redis is connected, you'll never need to manually sync again!** 🚀

