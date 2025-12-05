# 🚨 Environment Variables Not Detected on Render

## ⚠️ Your Current Problem

The status endpoint shows:
- `"upstashUrlSet": false`
- `"upstashTokenSet": false`

**This means Render is NOT passing the environment variables to your application.**

---

## 🔍 Step 1: Check What Server Sees

**Open this URL in your browser:**
```
https://stock-mediabuzz-1.onrender.com/api/debug/env
```

This will show you:
- ✅ If variables are detected
- ✅ If they have quotes or spaces
- ✅ Exact length and preview
- ✅ Specific issues found

**Share the output with me so I can help diagnose!**

---

## ✅ Step 2: Verify Variables in Render Dashboard

### Go to Render Dashboard

1. **Open:** https://dashboard.render.com/
2. **Click:** Your service (the one running your backend)
3. **Click:** **"Environment"** tab (left sidebar)

### Check Variables Exist

Look for these **exact** variable names:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

**Common Mistakes:**
- ❌ `UPSTASH_REDIS_URL` (missing `_REST_`)
- ❌ `UPSTASH_REDIS_TOKEN` (missing `_REST_`)
- ❌ `UPSTASH_REDIS_REST_URLS` (extra 'S')
- ❌ `UPSTASH_REDIS_REST_TOKENS` (extra 'S')

### Check Variable Values

Click on each variable to see its value:

**UPSTASH_REDIS_REST_URL should be:**
```
https://eternal-blowfish-28190.upstash.io
```

**UPSTASH_REDIS_REST_TOKEN should be:**
```
AW4eAAIncDI4ZDdiMDc2MzBiMDY0ZGFjYWZlYmJhZDM2MGZjMzUzZnAyMjgxOTA
```

**⚠️ CRITICAL: NO QUOTES, NO SPACES!**

---

## 🔧 Step 3: Fix Variables (If Wrong)

### If Variables Don't Exist:

1. **Click:** "Add Environment Variable" button
2. **Name:** `UPSTASH_REDIS_REST_URL`
3. **Value:** `https://eternal-blowfish-28190.upstash.io` (NO quotes)
4. **Click:** "Save"
5. **Repeat** for `UPSTASH_REDIS_REST_TOKEN`

### If Variables Have Quotes:

1. **Click** on the variable
2. **Edit** the value
3. **Remove** any quotes (`"` or `'`)
4. **Click:** "Save"

### If Variables Have Spaces:

1. **Click** on the variable
2. **Edit** the value
3. **Remove** any spaces at the start or end
4. **Click:** "Save"

### If Variable Names Are Wrong:

1. **Delete** the wrong variable
2. **Add** new variable with **exact** name:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. **Add** correct value (NO quotes, NO spaces)
4. **Click:** "Save"

---

## 🔄 Step 4: Trigger Redeploy

**After saving variables:**

1. Render **automatically redeploys** when you save environment variables
2. **Wait 2-5 minutes** for deployment to complete
3. **Check deployment status** in Render Dashboard → "Events" tab

**OR manually trigger:**

1. Go to **"Manual Deploy"** tab
2. Click **"Deploy latest commit"**
3. Wait for deployment to complete

---

## ✅ Step 5: Verify It's Working

### Check Debug Endpoint Again:

```
https://stock-mediabuzz-1.onrender.com/api/debug/env
```

**You should see:**
```json
{
  "summary": {
    "hasUrl": true,
    "hasToken": true,
    "bothSet": true
  },
  "issues": ["✅ No issues detected - variables look correct"]
}
```

### Check Status Endpoint:

```
https://stock-mediabuzz-1.onrender.com/api/media/database/status
```

**You should see:**
```json
{
  "storage": {
    "type": "Upstash Redis",
    "hasKV": true,
    "envVars": {
      "upstashUrlSet": true,
      "upstashTokenSet": true
    }
  }
}
```

---

## 🆘 Common Issues & Solutions

### Issue: Variables saved but still not detected

**Possible Causes:**
1. Service didn't redeploy after saving
2. Variables saved in wrong service (check you're editing the BACKEND service)
3. Variable names have typos

**Solution:**
1. Check Render Dashboard → Events tab → See if redeploy happened
2. Manually trigger redeploy
3. Double-check variable names are EXACTLY:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### Issue: Variables detected but Redis connection fails

**Check Render Logs:**
1. Go to Render Dashboard → Your Service → **Logs** tab
2. Look for Redis connection errors
3. Share the error message with me

### Issue: "Service not found" or can't access Render Dashboard

**Solution:**
1. Make sure you're logged into the correct Render account
2. Check you're editing the correct service
3. Verify service is running (not paused)

---

## 📋 Checklist

Before asking for help, verify:

- [ ] Checked `/api/debug/env` endpoint
- [ ] Verified variables exist in Render Dashboard → Environment tab
- [ ] Variable names are EXACTLY: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- [ ] Variable values have NO quotes
- [ ] Variable values have NO leading/trailing spaces
- [ ] Saved changes in Render (triggered redeploy)
- [ ] Waited 2-5 minutes for redeploy
- [ ] Checked Render Logs for errors
- [ ] Checked `/api/debug/env` again after redeploy

---

## 🎯 Quick Test

**Run this in your browser console or terminal:**

```bash
curl https://stock-mediabuzz-1.onrender.com/api/debug/env
```

**Or open in browser:**
```
https://stock-mediabuzz-1.onrender.com/api/debug/env
```

**Share the output** and I'll help you fix any issues!

---

## 📞 Still Not Working?

If after following all steps it's still not working:

1. **Share the output** of `/api/debug/env`
2. **Share a screenshot** of your Render Environment tab (blur sensitive values)
3. **Share Render logs** (especially around startup)

I'll help you diagnose the exact issue!
