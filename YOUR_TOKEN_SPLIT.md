# 🔧 Your Redis Token Split Instructions

## ⚠️ Important: Your Token is Truncated!

The token you provided is **63 characters**, but Upstash tokens should be **80 characters**. This means it's already been truncated.

**You need to get the FULL 80-character token from Upstash Dashboard.**

---

## 📋 Step 1: Get FULL Token from Upstash

1. Go to: **https://console.upstash.com/**
2. Click on your Redis database: **eternal-blowfish-28190**
3. Go to **"REST API"** tab
4. Copy the **FULL token** (should be exactly **80 characters**)
   - Don't copy from Render or any other place
   - Copy directly from Upstash dashboard

---

## 📋 Step 2: Split Your CURRENT Token (63 chars)

**Your current token (63 characters):**
```
AW4eAAIncDI5ZmUwMTUzOTliZDQ0YTk0OGRkZTliYTAxY2IwYWFmYnAyMjgxOTA
```

**Split at character 40:**
- **Part 1** (first 40): `AW4eAAIncDI5ZmUwMTUzOTliZDQ0YTk0OGRkZTli`
- **Part 2** (last 23): `YTAxY2IwYWFmYnAyMjgxOTA`

⚠️ **Note:** Part 2 is only 23 characters because your token is truncated. This won't work!

---

## ✅ Step 3: Get FULL Token and Split Properly

Once you have the **FULL 80-character token** from Upstash:

1. **Split at character 40** (exactly in the middle)
2. **Part 1** = first 40 characters
3. **Part 2** = last 40 characters

**Example format:**
- Full token: `[80 characters]`
- Part 1: `[first 40 characters]`
- Part 2: `[last 40 characters]`

---

## 📋 Step 4: Update Render Environment Variables

1. Go to: **Render Dashboard** → Your Service → **Environment** tab

2. **DELETE these variables:**
   - `UPSTASH_REDIS_REST_TOKEN` (the truncated one)
   - `UPSTASH_REDIS_REST_TOKEN_B64` (if exists)

3. **ADD new variable:**
   - **Key:** `UPSTASH_REDIS_REST_TOKEN_PART1`
   - **Value:** `[Your first 40 characters from FULL token]`
   - **NO quotes, NO spaces**

4. **ADD new variable:**
   - **Key:** `UPSTASH_REDIS_REST_TOKEN_PART2`
   - **Value:** `[Your last 40 characters from FULL token]`
   - **NO quotes, NO spaces**

5. **KEEP this variable:**
   - **Key:** `UPSTASH_REDIS_REST_URL`
   - **Value:** `https://eternal-blowfish-28190.upstash.io`
   - **NO quotes**

6. **Click "Save Changes"**

---

## 🔍 How to Verify Full Token

After copying from Upstash, verify:
- Token length = **exactly 80 characters**
- Token starts with: `AW4eAAIncD...`
- Token ends with: `...MjgxOTA`

If your token is less than 80 characters, it's truncated. Get it again from Upstash.

---

## ✅ After Setting Split Token

After redeploy, check Render logs. You should see:

```
🔗 Detected split token (PART1 + PART2), combining parts...
✅ Token combined, total length: 80
✅ Upstash Redis connected successfully!
```

If you see "total length: 63" or less, the token is still truncated. Get the FULL token from Upstash.

---

**Remember: You MUST get the FULL 80-character token from Upstash Dashboard, not from Render or any other source!**

