# 🔄 Automatic Cloudinary Sync Setup

## ✅ What's Fixed

Your app now automatically syncs media from Cloudinary to your database:

1. **Automatic sync on server startup** - Database is populated when the server starts
2. **Periodic background sync** - Syncs every hour (configurable) to keep database in sync
3. **Better persistence checks** - Database status endpoint now shows if data will persist
4. **No more manual syncing needed** - The system handles it automatically!

---

## 🚀 How It Works

### Startup Sync
- Runs automatically 30 seconds after server starts (configurable)
- Ensures database is populated when the server wakes up (important for Render free tier)

### Periodic Sync
- Runs every 60 minutes by default (configurable)
- Keeps database in sync with Cloudinary
- Only adds new files (skips existing ones)

### Manual Sync
- Still available at: `GET /api/media/sync-cloudinary`
- Can be triggered anytime if needed

---

## ⚙️ Configuration

You can configure auto-sync using environment variables:

### Environment Variables

Add these to your `.env` file or Render environment variables:

```bash
# Enable/disable startup sync (default: true)
AUTO_SYNC_ON_STARTUP=true

# Delay before startup sync in seconds (default: 30)
AUTO_SYNC_STARTUP_DELAY_SECONDS=30

# Sync interval in minutes (default: 60)
AUTO_SYNC_INTERVAL_MINUTES=60
```

### Example Configurations

**Fast sync (every 15 minutes):**
```bash
AUTO_SYNC_INTERVAL_MINUTES=15
```

**Slow sync (every 6 hours):**
```bash
AUTO_SYNC_INTERVAL_MINUTES=360
```

**Disable startup sync (only periodic):**
```bash
AUTO_SYNC_ON_STARTUP=false
```

**Immediate startup sync:**
```bash
AUTO_SYNC_STARTUP_DELAY_SECONDS=5
```

---

## 📊 Monitoring

### Check Sync Status

**Endpoint:** `GET /api/media/sync/status`

Returns:
```json
{
  "isSyncing": false,
  "lastSyncTime": "2024-01-15T10:30:00.000Z",
  "syncError": null,
  "syncStats": {
    "totalInCloudinary": 150,
    "newItemsAdded": 5,
    "totalInDatabase": 150
  }
}
```

### Check Database Status

**Endpoint:** `GET /api/media/database/status`

Now includes:
- Storage type and connection test
- Persistence warnings
- Sync status information
- Media count

---

## ⚠️ Important: Data Persistence

### The Problem You Had

Your data was disappearing because:
1. **Render free tier** services spin down after inactivity
2. **No Redis/KV configured** - Data was stored in memory or temporary files
3. **Data lost on restart** - When service woke up, database was empty

### The Solution

**You MUST configure Redis/KV for data persistence!**

#### For Render (Your Current Setup)

1. **Add Upstash Redis** (Recommended):
   - Go to Render Dashboard → Your Service → Environment
   - Add environment variables:
     ```
     UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
     UPSTASH_REDIS_REST_TOKEN=your-token-here
     ```
   - Get credentials from: https://console.upstash.com/

2. **Or use Render Redis** (if available):
   - Create a Redis instance in Render
   - Connect it to your service

#### Verify It's Working

Check: `GET /api/media/database/status`

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

If you see:
```
"persistenceWarning": "⚠️ Data will NOT persist! Configure Redis/KV to prevent data loss."
```

**You need to configure Redis/KV immediately!**

---

## 🔍 Troubleshooting

### Sync Not Running

1. **Check logs** - Look for sync messages in server logs
2. **Check status** - `GET /api/media/sync/status`
3. **Check environment variables** - Make sure `AUTO_SYNC_ON_STARTUP` is not `false`

### Data Still Disappearing

1. **Check Redis/KV connection** - `GET /api/media/database/status`
2. **Verify environment variables** - `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
3. **Test connection** - The status endpoint tests the connection automatically

### Sync Taking Too Long

- Large Cloudinary libraries take time to sync
- First sync can take 5-10 minutes
- Subsequent syncs are faster (only new files)

### Too Many Syncs

- Increase `AUTO_SYNC_INTERVAL_MINUTES` to reduce frequency
- Disable startup sync: `AUTO_SYNC_ON_STARTUP=false`

---

## 📝 Summary

✅ **Automatic sync** - No more manual syncing needed  
✅ **Startup sync** - Database populated on server start  
✅ **Periodic sync** - Keeps database in sync automatically  
✅ **Better monitoring** - Status endpoints to check everything  
⚠️ **Configure Redis/KV** - Required for data persistence!

---

## 🆘 Need Help?

1. Check sync status: `GET /api/media/sync/status`
2. Check database status: `GET /api/media/database/status`
3. Check server logs for sync messages
4. Verify Redis/KV is configured correctly

