# 🍃 MongoDB Setup Guide

MongoDB has been integrated into your application as the **primary database** (highest priority). The system will use MongoDB if available, then fall back to Redis/KV, then file storage.

## ✅ Priority Order

1. **MongoDB** (if `MONGODB_URI` is set) - **Primary**
2. **Redis/KV** (if `UPSTASH_REDIS_REST_URL` is set) - Fallback
3. **File Storage** (localhost only) - Last resort

---

## 📋 Step 1: Get MongoDB Connection String

You have two options:

### Option A: Use Full Connection String (Recommended)

1. Go to: **https://cloud.mongodb.com/**
2. Click on your cluster: **Cluster0**
3. Click: **"Connect"** button
4. Select: **"Connect your application"**
5. Copy the **connection string** (looks like):
   ```
   mongodb+srv://mdh897046_db_user:bpRUzw0GmmJp7iFa@cluster0.cnqz5cm.mongodb.net/?appName=Cluster0
   ```

### Option B: Use Individual Components

If you prefer to set individual environment variables:

- **Username:** `mdh897046_db_user`
- **Password:** `bpRUzw0GmmJp7iFa`
- **Cluster:** `cluster0.cnqz5cm.mongodb.net`
- **Database:** `stockmediabuzz` (or your preferred database name)

---

## 📋 Step 2: Set Environment Variables in Render

1. Go to: **Render Dashboard** → Your Service → **Environment** tab

2. **Add MongoDB URI** (Option A - Recommended):
   - **Key:** `MONGODB_URI`
   - **Value:** `mongodb+srv://mdh897046_db_user:bpRUzw0GmmJp7iFa@cluster0.cnqz5cm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
   - **IMPORTANT:** NO quotes, NO spaces

   **OR** use individual components (Option B):
   - **Key:** `MONGODB_USERNAME` → **Value:** `mdh897046_db_user`
   - **Key:** `MONGODB_PASSWORD` → **Value:** `bpRUzw0GmmJp7iFa`
   - **Key:** `MONGODB_CLUSTER` → **Value:** `cluster0.cnqz5cm.mongodb.net`
   - **Key:** `MONGODB_DATABASE` → **Value:** `stockmediabuzz` (optional, defaults to `stockmediabuzz`)

3. **Click "Save Changes"** (triggers auto-redeploy)

---

## ✅ Step 3: Verify Connection

After redeploy (2-5 minutes), check **Render Logs**. You should see:

```
🔄 Attempting to connect to MongoDB...
✅ Successfully connected to MongoDB!
✅ Using MongoDB database: stockmediabuzz
✅ MongoDB initialized - will be used as primary database
```

**Also check:** `https://your-app.onrender.com/api/media/database/status`
- Should show: `"type": "MongoDB"` and `"hasMongoDB": true`

---

## 🔍 Troubleshooting

### Connection Failed?

1. **Check MongoDB Atlas IP Whitelist:**
   - Go to: MongoDB Atlas → Network Access
   - Add: `0.0.0.0/0` (allow all IPs) OR your Render service IP
   - Wait 1-2 minutes for changes to propagate

2. **Verify Connection String:**
   - Make sure password is correct (no special characters need encoding)
   - Make sure cluster name matches exactly
   - Make sure database name is correct

3. **Check Environment Variables:**
   - Verify `MONGODB_URI` is set (or all individual components)
   - Make sure NO quotes around the value
   - Make sure NO trailing spaces

### Still Using Redis/File Storage?

- MongoDB takes **highest priority** - if it's configured, it will be used
- Check logs for MongoDB connection errors
- Verify `MONGODB_URI` is set correctly in Render

---

## 📊 Database Collections

MongoDB will automatically create collections as needed:

- `media-database` - All media files
- `users-database` - User accounts
- `creators-database` - Creator profiles
- `popup-ads-database` - Pop-up ads
- `settings` - Application settings

Each collection stores documents (one per item in your JSON arrays).

---

## 🔄 Migration from Redis/File Storage

When MongoDB is first connected:

1. **Existing data** from Redis/file storage will be **automatically loaded**
2. **New data** will be saved to MongoDB
3. **Old data** remains in Redis/file storage (as backup)

To fully migrate:
1. Ensure MongoDB is connected
2. Trigger a sync: `GET /api/media/sync-cloudinary`
3. All data will be saved to MongoDB
4. Redis/file storage can be kept as backup

---

## ✅ Benefits of MongoDB

- ✅ **Persistent storage** - Data never disappears
- ✅ **Scalable** - Handles large datasets
- ✅ **Reliable** - Managed by MongoDB Atlas
- ✅ **Queryable** - Can query by any field
- ✅ **Indexed** - Fast lookups
- ✅ **Backed up** - Automatic backups by MongoDB Atlas

---

## 📋 Final Checklist

- [ ] Got MongoDB connection string from MongoDB Atlas
- [ ] Added `MONGODB_URI` to Render environment variables (NO quotes)
- [ ] Saved changes in Render
- [ ] Waited for redeploy (2-5 minutes)
- [ ] Checked logs for "✅ Successfully connected to MongoDB!"
- [ ] Verified database status shows MongoDB as active
- [ ] Tested uploading media (should save to MongoDB)

---

**MongoDB is now your primary database! All new data will be saved to MongoDB automatically.** 🎉

