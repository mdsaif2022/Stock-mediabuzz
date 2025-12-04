# 🔴 Redis Connection Troubleshooting

## ❌ Problem: Still showing "File Storage" after adding environment variables

If you've added the Redis environment variables but the status still shows `"hasKV": false`, follow these steps:

---

## ✅ Step 1: Verify Variables in Render

### Check Variable Names (EXACT match required):

1. Go to Render Dashboard → Your Service → **Environment** tab
2. Verify you have **EXACTLY** these two variables:

   ✅ **Correct:**
   ```
   UPSTASH_REDIS_REST_URL
   UPSTASH_REDIS_REST_TOKEN
   ```

   ❌ **Wrong (common mistakes):**
   ```
   UPSTASH_REDIS_URL          ← Missing "REST"
   UPSTASH_REDIS_TOKEN        ← Missing "REST"
   UPSTASH_REDIS_REST_API_URL ← Wrong name
   UPSTASH_REDIS_REST_API_TOKEN ← Wrong name
   ```

### Check Variable Values (No quotes, no spaces):

✅ **Correct:**
```
UPSTASH_REDIS_REST_URL = https://eternal-blowfish-28190.upstash.io
UPSTASH_REDIS_REST_TOKEN = AW4eAAIncDI4ZDdiMDc2MzBiMDY0ZGFjYWZlYmJhZDM2MGZjMzUzZnAyMjgxOTA
```

❌ **Wrong (common mistakes):**
```
UPSTASH_REDIS_REST_URL = "https://eternal-blowfish-28190.upstash.io"  ← No quotes!
UPSTASH_REDIS_REST_URL = https://eternal-blowfish-28190.upstash.io   ← Trailing space
UPSTASH_REDIS_REST_TOKEN = "AW4eAAIncDI4ZDdiMDc2MzBiMDY0ZGFjYWZlYmJhZDM2MGZjMzUzZnAyMjgxOTA"  ← No quotes!
```

**Important:** Render environment variables should NOT have quotes around the values!

---

## ✅ Step 2: Check Environment Scope

Make sure variables are set for **Production** environment:

1. In Render Environment tab, check the **"Environment"** column
2. Variables should be set for **"Production"** (or "All")
3. If only set for "Preview", they won't work in production!

---

## ✅ Step 3: Force Redeploy

After adding/changing environment variables:

1. **Render should auto-redeploy** - but sometimes it doesn't
2. **Manually trigger redeploy:**
   - Go to Render Dashboard → Your Service
   - Click **"Manual Deploy"** → **"Deploy latest commit"**
   - Wait for deployment to complete (2-5 minutes)

---

## ✅ Step 4: Check Server Logs

After redeploy, check if Redis is connecting:

1. Go to Render Dashboard → Your Service → **"Logs"** tab
2. Look for these messages:

**✅ Success:**
```
✅ Connected to Upstash Redis - Data will persist
✅ Loaded X media items from KV (media-database)
```

**❌ Error:**
```
❌ Failed to initialize Upstash Redis: [error message]
📁 Using file storage (localhost mode)
```

**Common errors:**
- `Failed to initialize Upstash Redis: Cannot find module '@upstash/redis'`
  - **Fix:** Package might not be installed. Check `package.json` has `@upstash/redis`
  
- `Failed to initialize Upstash Redis: Invalid URL`
  - **Fix:** Check URL has no quotes, no trailing spaces
  
- `Failed to initialize Upstash Redis: Unauthorized`
  - **Fix:** Check token is correct, no quotes, no spaces

---

## ✅ Step 5: Test Connection Manually

Create a test endpoint to see what environment variables are being read:

**Check:** `https://stock-mediabuzz-1.onrender.com/api/media/database/status`

Look at the response - it shows:
- `hasUpstashRedis`: Should be `true` if variables are detected
- `hasKV`: Should be `true` if Redis client is working
- `connectionTest`: Shows connection status

---

## 🔍 Common Issues & Solutions

### Issue 1: Variables added but not detected

**Symptoms:**
- `hasUpstashRedis: false`
- `hasKV: false`

**Solutions:**
1. ✅ Check variable names are EXACT (case-sensitive)
2. ✅ Remove any quotes from values
3. ✅ Remove trailing spaces
4. ✅ Redeploy service
5. ✅ Check logs for errors

### Issue 2: Variables detected but connection fails

**Symptoms:**
- `hasUpstashRedis: true`
- `hasKV: false`
- `connectionTest: "❌ Connection failed"`

**Solutions:**
1. ✅ Verify URL is correct (no typos)
2. ✅ Verify token is correct (no typos)
3. ✅ Check Upstash console - is database active?
4. ✅ Check server logs for specific error message

### Issue 3: Package not installed

**Symptoms:**
- Logs show: `Cannot find module '@upstash/redis'`

**Solutions:**
1. ✅ Check `package.json` includes `@upstash/redis`
2. ✅ If missing, add it: `pnpm add @upstash/redis`
3. ✅ Commit and push to trigger redeploy

---

## 📋 Quick Checklist

Before asking for help, verify:

- [ ] Variable names are EXACT: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- [ ] Values have NO quotes around them
- [ ] Values have NO trailing spaces
- [ ] Variables are set for "Production" environment
- [ ] Service has been redeployed after adding variables
- [ ] Checked server logs for error messages
- [ ] `@upstash/redis` package is in `package.json`

---

## 🆘 Still Not Working?

If you've checked everything above and it's still not working:

1. **Check Render Logs** - Look for specific error messages
2. **Verify Upstash Database** - Go to https://console.upstash.com/ and check your database is active
3. **Test credentials manually** - Try connecting to Redis from a test script
4. **Check package.json** - Ensure `@upstash/redis` is listed in dependencies

---

## 📝 Example: Correct Render Environment Setup

Here's exactly how it should look in Render:

```
Environment Variables:

Key: UPSTASH_REDIS_REST_URL
Value: https://eternal-blowfish-28190.upstash.io
Environment: Production

Key: UPSTASH_REDIS_REST_TOKEN  
Value: AW4eAAIncDI4ZDdiMDc2MzBiMDY0ZGFjYWZlYmJhZDM2MGZjMzUzZnAyMjgxOTA
Environment: Production
```

**Note:** No quotes, no spaces, exact names, Production environment.

