# 🔧 Render Environment Variables Setup

## ⚠️ CRITICAL: Your Token is Truncated!

**Your current token:** 63 characters  
**Required token:** 80 characters  
**Missing:** 17 characters

This token will NOT work because it's incomplete. You MUST get the FULL token from Upstash.

---

## 📋 Current Token Split (Won't Work - Too Short)

**Your token (63 characters - TRUNCATED):**
```
AW4eAAIncDI5ZmUwMTUzOTliZDQ0YTk0OGRkZTliYTAxY2IwYWFmYnAyMjgxOTA
```

**Split:**
- **Part 1** (first 40): `AW4eAAIncDI5ZmUwMTUzOTliZDQ0YTk0OGRkZTli`
- **Part 2** (last 23): `YTAxY2IwYWFmYnAyMjgxOTA` ⚠️ Only 23 chars!

**This won't work because Part 2 is missing 17 characters!**

---

## ✅ Step 1: Get FULL 80-Character Token

1. **Go to:** https://console.upstash.com/
2. **Click:** Your Redis database → **eternal-blowfish-28190**
3. **Click:** **"REST API"** tab
4. **Find:** The **REST Token** field
5. **Copy:** The ENTIRE token (should be 80 characters)
6. **Verify:** Count the characters - must be exactly 80

**How to verify:**
- Token should start with: `AW4eAAIncD...`
- Token should end with: `...MjgxOTA`
- Total length: **80 characters** (not 63!)

---

## ✅ Step 2: Split the FULL Token

Once you have the **FULL 80-character token**, split it:

**Example:**
- Full token: `[80 characters]`
- **Part 1:** First 40 characters
- **Part 2:** Last 40 characters

**Verify:** Part 1 (40) + Part 2 (40) = 80 characters total

---

## ✅ Step 3: Update Render Environment Variables

1. **Go to:** Render Dashboard → Your Service → **Environment** tab

2. **DELETE these variables:**
   - ❌ `UPSTASH_REDIS_REST_TOKEN` (the truncated one)
   - ❌ `UPSTASH_REDIS_REST_TOKEN_B64` (if exists)

3. **ADD new variable:**
   - **Key:** `UPSTASH_REDIS_REST_TOKEN_PART1`
   - **Value:** `[First 40 characters from FULL token]`
   - **IMPORTANT:** NO quotes, NO spaces, NO trailing characters

4. **ADD new variable:**
   - **Key:** `UPSTASH_REDIS_REST_TOKEN_PART2`
   - **Value:** `[Last 40 characters from FULL token]`
   - **IMPORTANT:** NO quotes, NO spaces, NO trailing characters

5. **KEEP/UPDATE this variable:**
   - **Key:** `UPSTASH_REDIS_REST_URL`
   - **Value:** `https://eternal-blowfish-28190.upstash.io`
   - **IMPORTANT:** NO quotes

6. **Click:** **"Save Changes"** (triggers auto-redeploy)

---

## 📋 Final Environment Variables in Render

After setup, you should have **ONLY these 3 variables:**

1. ✅ `UPSTASH_REDIS_REST_URL` = `https://eternal-blowfish-28190.upstash.io`
2. ✅ `UPSTASH_REDIS_REST_TOKEN_PART1` = `[40 characters]`
3. ✅ `UPSTASH_REDIS_REST_TOKEN_PART2` = `[40 characters]`

**Total:** 3 variables (not 4, not 5)

---

## ✅ Step 4: Verify After Redeploy

After Render redeploys (2-5 minutes), check **Render Logs**. You should see:

```
🔗 Detected split token (PART1 + PART2), combining parts...
✅ Token combined, total length: 80
🔄 Attempting to connect to Upstash Redis...
✅ Redis client created
✅ Upstash Redis connected successfully!
```

**If you see:**
- `total length: 63` → Token is still truncated, get FULL token
- `total length: 80` → ✅ Success! Connection should work

---

## 🔍 Troubleshooting

### Token still truncated?
- **Problem:** You copied from Render or another source
- **Solution:** Copy DIRECTLY from Upstash Dashboard → REST API tab
- **Verify:** Token must be exactly 80 characters

### Connection still fails?
- Check Render logs for exact error
- Verify both PART1 and PART2 are exactly 40 characters each
- Verify no quotes or spaces in Render environment variables
- Verify `UPSTASH_REDIS_REST_URL` is correct

### Can't find token in Upstash?
1. Go to: https://console.upstash.com/
2. Click: Your database name
3. Click: **"REST API"** tab (not "Details" or "Settings")
4. Look for: **"REST Token"** field
5. Click: **"Show"** or **"Copy"** button

---

## ⚠️ Common Mistakes

1. ❌ Copying token from Render (it's truncated there)
2. ❌ Adding quotes around token parts
3. ❌ Adding spaces before/after token parts
4. ❌ Using truncated 63-character token
5. ❌ Forgetting to delete old `UPSTASH_REDIS_REST_TOKEN` variable

---

## ✅ Checklist

- [ ] Got FULL 80-character token from Upstash Dashboard (REST API tab)
- [ ] Verified token length = exactly 80 characters
- [ ] Split token at character 40 (Part 1 = 40, Part 2 = 40)
- [ ] Deleted `UPSTASH_REDIS_REST_TOKEN` in Render
- [ ] Deleted `UPSTASH_REDIS_REST_TOKEN_B64` in Render (if exists)
- [ ] Added `UPSTASH_REDIS_REST_TOKEN_PART1` = [40 chars, NO quotes]
- [ ] Added `UPSTASH_REDIS_REST_TOKEN_PART2` = [40 chars, NO quotes]
- [ ] Set `UPSTASH_REDIS_REST_URL` = `https://eternal-blowfish-28190.upstash.io` (NO quotes)
- [ ] Saved changes in Render
- [ ] Waited for redeploy (2-5 minutes)
- [ ] Checked logs for "Token combined, total length: 80"
- [ ] Verified connection success

---

**Remember: The token you provided is 63 characters. You MUST get the FULL 80-character token from Upstash Dashboard for this to work!**

