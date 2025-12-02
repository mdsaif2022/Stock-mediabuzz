# 🔄 Sync Cloudinary Files to Database (Render Backend)

## ⚠️ CRITICAL: Sync on Production Backend Only!

**IMPORTANT:** You MUST sync on your **production backend** (Render), NOT on localhost!

- ✅ **Production Backend** (`https://your-backend.onrender.com`) = Files visible to ALL users
- ❌ **Localhost** (`http://localhost:8080`) = Files only visible on YOUR device

**If you already synced on localhost, you need to sync again on production!**

---

## ✅ Your Site is Live But Media Missing?

**Problem:** Files are in Cloudinary but not showing on your site.
**Solution:** Sync Cloudinary files to your database on the production backend.

---

## 🚀 Quick Sync (2 Steps)

### Step 1: Trigger the Sync

**Open this URL in your browser:**
```
https://stock-mediabuzz-1.onrender.com/api/media/sync-cloudinary
```

**OR use curl:**
```bash
curl https://stock-mediabuzz-1.onrender.com/api/media/sync-cloudinary
```

### Step 2: Wait and Watch

The sync will:
1. ✅ Connect to all 3 Cloudinary accounts
2. ✅ List all images, videos, and APK files
3. ✅ Create database entries for each file
4. ✅ Save to Redis database (persistent)

**This may take 2-10 minutes** depending on how many files you have.

---

## 📊 Monitor Progress

### Option 1: Watch Browser Response

After opening the URL, you'll see a JSON response when complete:
```json
{
  "success": true,
  "message": "Synced 154 new media items from Cloudinary",
  "stats": {
    "totalInCloudinary": 154,
    "existingInDatabase": 0,
    "newItemsAdded": 154,
    "skipped": 0,
    "totalInDatabase": 154
  },
  "storage": {
    "type": "Upstash Redis",
    "isVercel": false,
    "hasKV": true,
    "note": "✅ Files will persist permanently"
  }
}
```

### Option 2: Watch Render Logs

1. Go to: **Render Dashboard** → Your Service → **"Logs"** tab
2. You'll see progress:
   ```
   🔄 Starting Cloudinary sync...
   📡 Fetching resources from Cloudinary...
   📦 Found XX total files in Cloudinary
   📚 Loading existing database...
   🔄 Processing resources...
   ✅ Processed XX resources: XX new, 0 skipped
   💾 Saving XX items to database...
   ✅ Database saved successfully
   ```

---

## ✅ Verify Sync Completed

### Check 1: Database Status

**Open in browser:**
```
https://stock-mediabuzz-1.onrender.com/api/media/database/status
```

**Should show:**
```json
{
  "status": "ok",
  "media": {
    "count": 154
  }
}
```

### Check 2: Media List

**Open in browser:**
```
https://stock-mediabuzz-1.onrender.com/api/media
```

**Should show:** An array of all your media items

### Check 3: Your Website

1. Visit: `https://genztools.top`
2. Click: "Browse Media" or "Video"
3. **Should see:** All your media files! ✅

---

## 🆘 Troubleshooting

### Error: "Failed to fetch resources from Cloudinary"

**Possible causes:**
1. Cloudinary credentials missing on Render
2. API rate limits (if you have thousands of files)

**Fix:**
1. **Check Render Environment Variables:**
   - Go to: Render → Environment tab
   - Verify these exist:
     - `CLOUDINARY_SERVER1_CLOUD_NAME`
     - `CLOUDINARY_SERVER1_API_KEY`
     - `CLOUDINARY_SERVER1_API_SECRET`
     - `CLOUDINARY_SERVER2_...` (same for server2, server3)

2. **If missing, add them:**
   - Copy from your `.env.local` file
   - Add to Render → Environment tab
   - Save and redeploy

### Error: "Database save failed"

**Possible causes:**
1. Redis/Upstash not configured
2. Environment variables missing

**Fix:**
1. Check: Render → Environment → `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
2. If missing, add them (from Upstash dashboard)
3. Redeploy Render

### Sync Takes Too Long / Timeout

**If you have 500+ files:**
- The sync might timeout (Render has request limits)
- **Solution:** Sync will continue in background, check logs for progress
- Or run sync multiple times (it skips already-synced files)

---

## 🔄 Run Sync Multiple Times

**Safe to run multiple times!** The sync:
- ✅ Skips files already in database
- ✅ Only adds new files
- ✅ Won't duplicate entries

If sync stops partway:
1. Wait a few minutes
2. Run sync again
3. It will continue from where it left off

---

## ✅ Success Checklist

After sync:
- [ ] Sync endpoint returned `"success": true`
- [ ] Database status shows correct file count
- [ ] `/api/media` returns your files
- [ ] Website shows media items
- [ ] No errors in Render logs

---

## 📝 Notes

- **Sync is safe:** Won't delete or modify existing files
- **Persistent:** Saved to Redis, won't disappear
- **Automatic:** New uploads auto-sync (no need to re-run)
- **Fast:** Only syncs new files on subsequent runs

