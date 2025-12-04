# 🚨 Environment Variables Not Detected - Fix Guide

## ❌ Problem

Your database status shows:
```json
{
  "envVars": {
    "upstashUrlSet": false,
    "upstashTokenSet": false
  }
}
```

This means **Render is not passing the environment variables to your application**.

---

## ✅ Solution: Step-by-Step Fix

### Step 1: Verify Variables Are Actually Saved

1. Go to **Render Dashboard** → Your Service (`stock-mediabuzz-1`)
2. Click **"Environment"** tab (left sidebar)
3. **Look for these exact variable names:**
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

**If you DON'T see them:**
- They weren't saved properly
- Go to Step 2 to add them

**If you DO see them:**
- Check Step 3 for common issues

---

### Step 2: Add Variables Correctly

1. In Render Environment tab, click **"Add Environment Variable"**

2. **Variable 1:**
   - **Key:** `UPSTASH_REDIS_REST_URL`
   - **Value:** `https://eternal-blowfish-28190.upstash.io`
   - **Environment:** Select **"Production"** (or "All")
   - Click **"Save Changes"**
   - ⚠️ **Wait for the save to complete** (you'll see a confirmation)

3. **Variable 2:**
   - Click **"Add Environment Variable"** again
   - **Key:** `UPSTASH_REDIS_REST_TOKEN`
   - **Value:** `AW4eAAIncDI4ZDdiMDc2MzBiMDY0ZGFjYWZlYmJhZDM2MGZjMzUzZnAyMjgxOTA`
   - **Environment:** Select **"Production"** (or "All")
   - Click **"Save Changes"**
   - ⚠️ **Wait for the save to complete**

4. **Verify they're there:**
   - You should see both variables in the list
   - Check the "Environment" column shows "Production" or "All"

---

### Step 3: Check for Common Mistakes

#### ❌ Mistake 1: Quotes in Values

**WRONG:**
```
Value: "https://eternal-blowfish-28190.upstash.io"
```

**CORRECT:**
```
Value: https://eternal-blowfish-28190.upstash.io
```

**How to fix:**
1. Click "Edit" on the variable
2. Remove quotes from the value
3. Save

#### ❌ Mistake 2: Wrong Environment

**WRONG:**
- Variable set for "Preview" only
- Variable set for "Development" only

**CORRECT:**
- Variable set for "Production" or "All"

**How to fix:**
1. Click "Edit" on the variable
2. Change "Environment" to "Production" or "All"
3. Save

#### ❌ Mistake 3: Wrong Variable Names

**WRONG:**
```
UPSTASH_REDIS_URL
UPSTASH_REDIS_TOKEN
REDIS_URL
REDIS_TOKEN
```

**CORRECT:**
```
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

**How to fix:**
1. Delete the wrong variable
2. Add new variable with correct name

#### ❌ Mistake 4: Trailing Spaces

**WRONG:**
```
Value: https://eternal-blowfish-28190.upstash.io 
```

**CORRECT:**
```
Value: https://eternal-blowfish-28190.upstash.io
```

**How to fix:**
1. Click "Edit"
2. Remove any spaces before/after the value
3. Save

---

### Step 4: Force Redeploy

**After adding/changing variables, you MUST redeploy:**

1. Go to Render Dashboard → Your Service
2. Click **"Manual Deploy"** button (top right)
3. Select **"Deploy latest commit"**
4. Wait for deployment to complete (2-5 minutes)
5. Watch the logs to see deployment progress

**⚠️ IMPORTANT:** Render should auto-redeploy when you save environment variables, but sometimes it doesn't. Always manually trigger a redeploy to be sure.

---

### Step 5: Verify Variables Are Detected

After redeploy, check the debug endpoint:

```
https://stock-mediabuzz-1.onrender.com/api/debug/env
```

**Should show:**
```json
{
  "hasUrl": true,
  "hasToken": true,
  "urlPreview": "https://eternal-blowfish-2...",
  "tokenPreview": "AW4eAAIncDI...",
  "issues": []
}
```

**If still showing `false`:**
- Variables aren't being passed to the app
- Check Render logs for errors
- Try deleting and re-adding variables
- Make sure you're checking the correct service

---

### Step 6: Check Render Logs

1. Go to Render Dashboard → Your Service → **"Logs"** tab
2. Look for these messages:

**✅ Success:**
```
🔍 Redis-related environment variables: { UPSTASH_REDIS_REST_URL: 'https://eternal...', ... }
✅ Upstash Redis connected successfully
```

**❌ Error:**
```
⚠️  Upstash Redis env vars not found:
   UPSTASH_REDIS_REST_URL: NOT SET
   UPSTASH_REDIS_REST_TOKEN: NOT SET
```

**If you see "NOT SET":**
- Variables aren't being passed to the application
- Go back to Step 2 and verify they're saved correctly

---

## 🔍 Advanced Troubleshooting

### Check All Environment Variables

The debug endpoint shows all Redis-related variables. Check:

```
GET https://stock-mediabuzz-1.onrender.com/api/debug/env
```

Look at the `issues` array - it will tell you exactly what's wrong.

### Verify in Render

1. Go to Render Dashboard → Your Service → Environment
2. Take a screenshot of your variables
3. Verify:
   - Names are EXACT (case-sensitive)
   - Values have NO quotes
   - Values have NO spaces
   - Environment is "Production" or "All"

### Test with Manual Variable

If variables still aren't detected, try:

1. Add a test variable: `TEST_VAR=test123`
2. Redeploy
3. Check if it appears in logs: `console.log(process.env.TEST_VAR)`
4. If test variable works but Redis variables don't, there's a typo in the names

---

## 📋 Complete Checklist

Before saying it's not working, verify:

- [ ] Variables are in Render Environment tab
- [ ] Variable names are EXACT: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- [ ] Values have NO quotes
- [ ] Values have NO trailing spaces
- [ ] Environment is set to "Production" or "All"
- [ ] Clicked "Save Changes" on each variable
- [ ] Service was redeployed after adding variables
- [ ] Checked debug endpoint: `/api/debug/env`
- [ ] Checked server logs for variable detection
- [ ] Waited 2-5 minutes after redeploy

---

## 🆘 Still Not Working?

If you've done everything above and variables still aren't detected:

1. **Delete both variables** in Render
2. **Wait 1 minute**
3. **Add them again** (follow Step 2 exactly)
4. **Force redeploy** (Step 4)
5. **Check debug endpoint** (Step 5)

Sometimes Render needs a "fresh start" with environment variables.

---

## 📞 Need More Help?

Check:
- Render documentation: https://render.com/docs/environment-variables
- Render support: If variables are saved but not detected, contact Render support
- Server logs: Look for any errors during startup

---

**Most common issue: Variables are saved but service wasn't redeployed!**

Always manually trigger a redeploy after adding environment variables.

