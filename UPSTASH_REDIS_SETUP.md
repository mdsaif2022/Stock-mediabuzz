# 🔴 Upstash Redis Setup Guide

## ✅ Your Credentials

You have Upstash Redis credentials ready:

```env
UPSTASH_REDIS_REST_URL="https://eternal-blowfish-28190.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AW4eAAIncDI4ZDdiMDc2MzBiMDY0ZGFjYWZlYmJhZDM2MGZjMzUzZnAyMjgxOTA"
```

---

## 🚀 Step 1: Add to Render Environment Variables

### Quick Steps:

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Select your backend service: `stock-mediabuzz-1` (or your service name)

2. **Navigate to Environment Tab**
   - Click on your service
   - Click **"Environment"** in the left sidebar

3. **Add the Variables**
   
   Click **"Add Environment Variable"** and add these two:

   **Variable 1:**
   - **Key:** `UPSTASH_REDIS_REST_URL`
   - **Value:** `https://eternal-blowfish-28190.upstash.io`
   - Click **"Save Changes"**

   **Variable 2:**
   - **Key:** `UPSTASH_REDIS_REST_TOKEN`
   - **Value:** `AW4eAAIncDI4ZDdiMDc2MzBiMDY0ZGFjYWZlYmJhZDM2MGZjMzUzZnAyMjgxOTA`
   - Click **"Save Changes"**

4. **Render will Auto-Redeploy**
   - After saving, Render will automatically redeploy your service
   - Wait for deployment to complete (usually 2-5 minutes)

---

## ✅ Step 2: Verify It's Working

### Option 1: Check Database Status Endpoint

After deployment completes, visit:

```
https://stock-mediabuzz-1.onrender.com/api/media/database/status
```

**Look for:**
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

✅ **If you see this, Redis is working!**

❌ **If you see:**
```json
{
  "storage": {
    "connectionTest": "❌ Connection failed: ...",
    "persistenceWarning": "⚠️ Data will NOT persist!"
  }
}
```

**Check:**
- Environment variables are saved correctly
- No typos in the URL or token
- Service has been redeployed

### Option 2: Check Server Logs

1. Go to Render Dashboard → Your Service → **"Logs"** tab
2. Look for these messages:

**✅ Success:**
```
✅ Connected to Upstash Redis - Data will persist
✅ Loaded X media items from KV (media-database)
```

**❌ Error:**
```
❌ Failed to initialize Upstash Redis: ...
⚠️ WARNING: Running on Render but Redis/KV is not configured!
```

---

## 🔍 Step 3: Test the Connection

### Test 1: Manual Sync

Trigger a sync to test if data persists:

```
GET https://stock-mediabuzz-1.onrender.com/api/media/sync-cloudinary
```

After sync completes, check:
```
GET https://stock-mediabuzz-1.onrender.com/api/media/database/status
```

The `media.count` should show your files, and they should persist after server restart.

### Test 2: Upload a File

1. Upload a file through your app
2. Check database status - count should increase
3. Wait 1-2 hours (or restart service)
4. Check again - count should still be there ✅

---

## 📋 Complete Environment Variables Checklist

Make sure you have these in Render:

### Required:
- [x] `UPSTASH_REDIS_REST_URL` ✅ (You have this)
- [x] `UPSTASH_REDIS_REST_TOKEN` ✅ (You have this)
- [ ] `ALLOWED_ORIGINS` (Your frontend domain)
- [ ] `ADMIN_EMAIL` (Admin email)
- [ ] `ADMIN_USERNAME` (Admin username)
- [ ] `ADMIN_PASSWORD` (Admin password)

### Optional (Auto-Sync):
- [ ] `AUTO_SYNC_INTERVAL_MINUTES=60` (Default: 60 minutes)
- [ ] `AUTO_SYNC_STARTUP_DELAY_SECONDS=30` (Default: 30 seconds)
- [ ] `AUTO_SYNC_ON_STARTUP=true` (Default: true)

---

## 🎯 What This Fixes

✅ **Data Persistence** - Your media database will now persist permanently  
✅ **No More Data Loss** - Data survives server restarts and spin-downs  
✅ **Automatic Sync** - Database syncs automatically on startup and periodically  
✅ **Production Ready** - Your app is now production-ready with persistent storage

---

## 🆘 Troubleshooting

### Problem: "Connection failed" in status endpoint

**Solutions:**
1. Double-check environment variables in Render (no extra spaces, quotes, etc.)
2. Make sure service was redeployed after adding variables
3. Check if Upstash Redis database is active in Upstash console
4. Verify credentials are correct (copy-paste again)

### Problem: Data still disappearing

**Solutions:**
1. Check database status endpoint - verify `hasKV: true`
2. Check server logs for Redis connection messages
3. Make sure environment variables are set in **Production** environment (not just Preview)
4. Wait for auto-sync to run (or trigger manual sync)

### Problem: "Redis client not available"

**Solutions:**
1. Check if `@upstash/redis` package is installed (should be in package.json)
2. Check server logs for import errors
3. Redeploy service after adding environment variables

---

## 📝 Next Steps

1. ✅ Add environment variables to Render (Step 1)
2. ✅ Verify connection (Step 2)
3. ✅ Trigger initial sync: `GET /api/media/sync-cloudinary`
4. ✅ Monitor sync status: `GET /api/media/sync/status`
5. ✅ Your data will now persist forever! 🎉

---

## 🔗 Useful Links

- **Render Dashboard:** https://dashboard.render.com
- **Upstash Console:** https://console.upstash.com/
- **Database Status:** https://stock-mediabuzz-1.onrender.com/api/media/database/status
- **Sync Status:** https://stock-mediabuzz-1.onrender.com/api/media/sync/status

---

**Your Redis credentials are ready! Just add them to Render and you're all set! 🚀**

