# 🔧 Render Environment Variables Setup

Complete guide for setting up environment variables on Render.com for your backend.

---

## 📋 Required Environment Variables

These are **ESSENTIAL** for your backend to work properly:

### 1. CORS Configuration
```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```
- **Purpose:** Allows your cPanel frontend to communicate with the backend
- **Format:** Comma-separated list of URLs (no spaces around commas)
- **Example:** `https://example.com,https://www.example.com,https://app.example.com`
- **⚠️ IMPORTANT:** Must include your actual domain with `https://`

---

### 2. Admin Authentication
```env
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password-123
```
- **Purpose:** Admin login credentials for `/login?role=admin`
- **ADMIN_EMAIL:** Admin email (can be used for login)
- **ADMIN_USERNAME:** Admin username (can also be used for login)
- **ADMIN_PASSWORD:** Admin password (make it strong!)
- **⚠️ SECURITY:** Use a strong password! Anyone with these can access admin panel.

---

## 🔄 Optional Environment Variables

### 3. Database/Storage (Optional - Recommended)

**Option A: Upstash Redis (Recommended for Render)**

If you want persistent storage (like Vercel KV), use Upstash Redis:

```env
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

**How to get Upstash Redis:**
1. Go to https://upstash.com
2. Create free account
3. Create new Redis database
4. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REST_API_TOKEN`
5. Add to Render environment variables

**Option B: Vercel KV (If you have Vercel KV)**

If you already have Vercel KV set up:

```env
KV_REST_API_URL=https://your-kv.vercel-storage.com
KV_REST_API_TOKEN=your-token-here
```

**Option C: File Storage (Default)**

If you don't set any database variables, the backend will use file storage.
- **⚠️ Note:** File storage on Render is **ephemeral** (data may be lost on restart)
- **For production:** Use Upstash Redis or Vercel KV

---

### 4. Server Configuration (Auto-configured by Render)

These are usually **auto-set by Render**, but you can override:

```env
PORT=3000
```
- **Default:** Render sets this automatically
- **Only set if:** You need a specific port

```env
NODE_ENV=production
```
- **Default:** Automatically set to `production` on Render
- **Usually:** Don't need to set manually

---

### 5. Test/Development (Optional)

```env
PING_MESSAGE=pong
```
- **Purpose:** Custom message for `/api/ping` endpoint
- **Default:** `"ping"` if not set
- **Usage:** Just for testing, not required

---

## 🚀 How to Add Variables in Render

### Step-by-Step:

1. **Go to your Render Dashboard**
2. **Select your Web Service** (backend service)
3. **Click "Environment"** tab (left sidebar)
4. **Click "Add Environment Variable"** button
5. **Add each variable:**
   - **Key:** Variable name (e.g., `ALLOWED_ORIGINS`)
   - **Value:** Variable value (e.g., `https://yourdomain.com`)
6. **Click "Save Changes"**
7. **Render will auto-redeploy** after saving

---

## 📝 Complete Example Setup

Here's a complete example of all variables you might add:

```env
# REQUIRED - CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# REQUIRED - Admin Login
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=MySecurePass123!@#

# OPTIONAL - Database (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxxxxxxxxxxxxxxxxxx

# OPTIONAL - Test
PING_MESSAGE=pong
```

---

## ✅ Quick Checklist

Before deploying, make sure you have:

- [ ] `ALLOWED_ORIGINS` set with your domain
- [ ] `ADMIN_EMAIL` set
- [ ] `ADMIN_USERNAME` set
- [ ] `ADMIN_PASSWORD` set (strong password!)
- [ ] (Optional) Database variables if using Upstash Redis

---

## 🔍 Verify Variables Are Set

After adding variables and redeploying, test:

1. **Test backend is running:**
   ```
   GET https://your-backend.onrender.com/api/ping
   ```
   Should return: `{"message":"ping"}` (or your custom message)

2. **Test admin login:**
   - Go to: `https://yourdomain.com/login?role=admin`
   - Login with your `ADMIN_EMAIL` or `ADMIN_USERNAME` and `ADMIN_PASSWORD`
   - Should work ✅

3. **Check database status:**
   ```
   GET https://your-backend.onrender.com/api/media/database/status
   ```
   Shows which storage type is being used.

---

## ⚠️ Common Mistakes

### ❌ Wrong ALLOWED_ORIGINS format:
```env
# WRONG - Has spaces
ALLOWED_ORIGINS=https://example.com, https://www.example.com

# CORRECT - No spaces
ALLOWED_ORIGINS=https://example.com,https://www.example.com
```

### ❌ Missing https:// in ALLOWED_ORIGINS:
```env
# WRONG
ALLOWED_ORIGINS=yourdomain.com

# CORRECT
ALLOWED_ORIGINS=https://yourdomain.com
```

### ❌ Weak admin password:
```env
# WRONG - Too weak
ADMIN_PASSWORD=admin

# CORRECT - Strong password
ADMIN_PASSWORD=MySecurePass123!@#
```

---

## 🆘 Troubleshooting

### "CORS Error" in browser console:
- ✅ Check `ALLOWED_ORIGINS` includes your exact domain
- ✅ Make sure it starts with `https://`
- ✅ No spaces in the list

### Admin login doesn't work:
- ✅ Verify `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` are set correctly
- ✅ Check no extra spaces in values
- ✅ Try both email and username for login

### Backend won't start:
- ✅ Check all required variables are set
- ✅ Verify no syntax errors in variable values
- ✅ Check Render logs for errors

---

## 📚 Related Guides

- `DEPLOY_CPANEL_NOW.md` - Quick deployment guide
- `CPANEL_DEPLOYMENT_COMPLETE.md` - Full deployment instructions
- `UPSTASH_CONFIGURATION.md` - Setting up Upstash Redis

---

**That's it! Your backend is configured!** 🎉

