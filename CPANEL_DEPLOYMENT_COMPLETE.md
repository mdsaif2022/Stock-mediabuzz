# 🚀 Complete cPanel Deployment Guide

## ⚠️ Important Understanding

Your project has **2 parts**:
1. **Frontend** (React website) → Goes to **cPanel** ✅
2. **Backend** (Express API server) → Goes to **Render/Railway/etc.** ✅

**cPanel can only host static files** - it cannot run your backend server. You **MUST** deploy the backend separately.

---

## 📋 Step-by-Step Deployment

### PART 1: Deploy Backend First (Required!)

#### Step 1.1: Create Backend Hosting Account

Choose one (all have free tiers):
- **Render.com** (recommended - easiest)
- **Railway.app**
- **Fly.io**

We'll use **Render** as example.

#### Step 1.2: Deploy Backend to Render

1. **Go to Render.com:**
   - Sign up/login: https://render.com
   - Click **"New +"** → **"Web Service"**

2. **Connect GitHub:**
   - Click **"Connect account"** → Connect your GitHub
   - Select repository: `Stock-mediabuzz`
   - Click **"Connect"**

3. **Configure Service:**
   - **Name:** `stock-media-backend` (or any name)
   - **Environment:** `Node`
   - **Region:** Choose closest to you
   - **Branch:** `main`
   - **Root Directory:** Leave empty (or `./`)
   - **Build Command:** `npm install && npm run build:server`
   - **Start Command:** `node dist/server/node-build.mjs`
   - **Plan:** Free

4. **Add Environment Variables:**
   Click **"Advanced"** → **"Add Environment Variable"** → Add these:
   ```
   PORT=10000
   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ADMIN_EMAIL=admin@yourdomain.com
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your-secure-password-here
   PING_MESSAGE=pong
   NODE_ENV=production
   ```
   
   **Important:** Replace `yourdomain.com` with your actual domain!

5. **Create Service:**
   - Click **"Create Web Service"**
   - Wait 5-10 minutes for deployment
   - **Copy your backend URL** (e.g., `https://stock-media-backend.onrender.com`)

6. **Test Backend:**
   - Visit: `https://your-backend-url.onrender.com/api/ping`
   - Should see: `{"message":"pong"}`

#### Step 1.3: Set Up KV for Backend (Optional but Recommended)

If you want data to persist on Render:
- Go to Render Dashboard → Your Service → **Environment**
- Add Vercel KV or Upstash Redis environment variables
- Or use file storage (data resets on restart, but works)

**For production, KV is recommended!**

---

### PART 2: Prepare Frontend for cPanel

#### Step 2.1: Create Environment File

Create `.env.production` in your project root:

```env
# Your backend URL from Step 1.2 (no trailing slash!)
VITE_API_BASE_URL=https://stock-media-backend.onrender.com

# Admin email (must match backend ADMIN_EMAIL)
VITE_ADMIN_EMAIL=admin@yourdomain.com
```

**Replace:**
- `https://stock-media-backend.onrender.com` with YOUR backend URL
- `admin@yourdomain.com` with YOUR admin email

#### Step 2.2: Build for cPanel

```bash
pnpm build:cpanel
```

Or:
```bash
npm run build:cpanel
```

**This will:**
- ✅ Build your React frontend
- ✅ Include environment variables
- ✅ Copy `.htaccess` file automatically
- ✅ Create files in `dist/spa/` folder

**Wait for:** `✅ cPanel build complete!`

---

### PART 3: Upload to cPanel

#### Step 3.1: Access cPanel File Manager

1. **Log into cPanel:**
   - Go to your hosting provider's website
   - Log in with your cPanel credentials
   - Access cPanel dashboard

2. **Open File Manager:**
   - Find **"File Manager"** in cPanel dashboard
   - Click to open

#### Step 3.2: Navigate to Website Root

1. **Find your domain's root:**
   - Usually `public_html/` (main domain)
   - Or `public_html/yourdomain.com/` (if subdomain)
   - Click to enter the folder

2. **Backup existing files (if any):**
   - Select all files
   - Right-click → **"Compress"** → Create backup
   - Or move to `backup/` folder

#### Step 3.3: Upload Your Website Files

**Method A: File Manager Upload**

1. **Delete old files** (if any) in `public_html/`
   - Select all → Delete

2. **Upload new files:**
   - Click **"Upload"** button in File Manager
   - Go to your computer: `dist/spa/` folder
   - **Select ALL files:**
     - `index.html`
     - `.htaccess`
     - `assets/` folder (select entire folder)
     - `favicon.ico`
     - `robots.txt`
     - Any other files
   - Click **"Open"** or **"Upload"**
   - Wait for upload to complete

**Method B: FTP/SFTP Upload (Faster for large files)**

1. **Get FTP credentials:**
   - cPanel → **"FTP Accounts"**
   - Create FTP account or use main account
   - Note: Host, Username, Password

2. **Connect with FTP client:**
   - Use FileZilla (free), WinSCP, or any FTP client
   - Connect to your server
   - Navigate to `public_html/`
   - Upload all files from `dist/spa/`

#### Step 3.4: Verify Files

Check that these files exist in `public_html/`:
- ✅ `index.html`
- ✅ `.htaccess` (important!)
- ✅ `assets/` folder
- ✅ `favicon.ico`

---

### PART 4: Configure Domain & SSL

#### Step 4.1: Verify Domain Points to cPanel

1. **Check Domain Settings:**
   - cPanel → **"Domains"** or **"Addon Domains"**
   - Verify your domain is listed
   - Document root should be `public_html/`

2. **DNS Settings (if needed):**
   - Point your domain's A record to your cPanel server IP
   - Or use nameservers provided by your host

#### Step 4.2: Enable SSL (HTTPS)

1. **Install SSL Certificate:**
   - cPanel → **"SSL/TLS Status"** or **"Let's Encrypt"**
   - Select your domain
   - Click **"Run AutoSSL"** or **"Install"**
   - Wait for SSL to activate

2. **Force HTTPS:**
   - Enable **"Force HTTPS Redirect"**
   - Or add to `.htaccess`:
   ```apache
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```

---

### PART 5: Verify Deployment

#### Step 5.1: Test Your Website

1. **Visit your domain:**
   ```
   https://yourdomain.com
   ```

2. **Check user site:**
   - ✅ Homepage loads
   - ✅ Navigation works
   - ✅ Pages load correctly
   - ✅ No 404 errors on refresh

3. **Check browser console (F12):**
   - No red errors ✅
   - API calls going to your backend ✅

#### Step 5.2: Test Admin Panel

1. **Go to login:**
   ```
   https://yourdomain.com/login?role=admin
   ```

2. **Login with:**
   - Email: Your `ADMIN_EMAIL` (e.g., `admin@yourdomain.com`)
   - Password: Your `ADMIN_PASSWORD`
   - Mode: **Admin**

3. **Verify admin dashboard:**
   - ✅ Login successful
   - ✅ Dashboard loads
   - ✅ All admin pages work

#### Step 5.3: Test API Connection

1. **Check backend is accessible:**
   - Visit: `https://your-backend.onrender.com/api/ping`
   - Should return: `{"message":"pong"}`

2. **Check CORS:**
   - Browser console (F12) → Network tab
   - API calls should succeed
   - No CORS errors ✅

---

## 🔧 Troubleshooting

### Problem: Website shows 404 errors

**Solution:**
- Check `.htaccess` file exists in `public_html/`
- Verify `.htaccess` has React Router rewrite rules
- Check file permissions (should be 644)

### Problem: Admin login doesn't work

**Solution:**
1. Check backend is running:
   - Visit: `https://your-backend.onrender.com/api/ping`
   
2. Check environment variables:
   - `.env.production` has correct backend URL
   - Rebuild: `pnpm build:cpanel`
   - Re-upload to cPanel

3. Check CORS:
   - Backend `ALLOWED_ORIGINS` includes your domain
   - Format: `https://yourdomain.com,https://www.yourdomain.com`

### Problem: API calls fail (CORS error)

**Solution:**
- In Render/Railway backend settings:
  - Add: `ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com`
  - Redeploy backend

### Problem: Pages don't load on refresh

**Solution:**
- `.htaccess` file missing or incorrect
- Re-run: `pnpm build:cpanel`
- Re-upload `.htaccess` to `public_html/`

---

## ✅ Deployment Checklist

### Backend (Render/Railway):
- [ ] Backend deployed and running
- [ ] Backend URL copied (e.g., `https://xxx.onrender.com`)
- [ ] Environment variables set:
  - [ ] `ALLOWED_ORIGINS` includes your domain
  - [ ] `ADMIN_EMAIL` set
  - [ ] `ADMIN_PASSWORD` set
- [ ] Backend test: `/api/ping` works
- [ ] KV/Redis configured (optional but recommended)

### Frontend (cPanel):
- [ ] `.env.production` file created
- [ ] `VITE_API_BASE_URL` set to backend URL
- [ ] `VITE_ADMIN_EMAIL` set
- [ ] Build completed: `pnpm build:cpanel`
- [ ] All files from `dist/spa/` uploaded to `public_html/`
- [ ] `.htaccess` file included
- [ ] SSL certificate installed (HTTPS)
- [ ] Domain points to correct directory

### Testing:
- [ ] Website loads at your domain
- [ ] User site works (homepage, navigation)
- [ ] Admin login works
- [ ] Admin dashboard loads
- [ ] Media browsing works (if backend synced)
- [ ] No errors in browser console
- [ ] No CORS errors

---

## 📝 Quick Commands Reference

```bash
# Build for cPanel
pnpm build:cpanel

# Or manually:
pnpm build:client
# Then copy public/.htaccess to dist/spa/.htaccess

# Check build output
ls dist/spa/
```

---

## 🎯 What Goes Where

```
┌─────────────────────────────────────┐
│  FRONTEND (cPanel)                  │
│  Location: public_html/             │
│  Files: dist/spa/*                  │
│  - index.html                       │
│  - assets/                          │
│  - .htaccess                        │
└─────────────────────────────────────┘
              ↓ API calls
┌─────────────────────────────────────┐
│  BACKEND (Render/Railway)           │
│  Location: Your Node.js host        │
│  Files: dist/server/*               │
│  - node-build.mjs                   │
│  - routes/                          │
│  - config/                          │
└─────────────────────────────────────┘
```

---

## 🆘 Still Need Help?

1. **Check error messages** - Browser console (F12)
2. **Verify backend** - Test `/api/ping` endpoint
3. **Check logs** - Render/Railway deployment logs
4. **Review documentation:**
   - `CPANEL_VERIFICATION.md` - Detailed testing
   - `CPANEL_DEPLOYMENT.md` - Full guide
   - `CPANEL_SIMPLE_GUIDE.md` - Simplified version

---

## 🎉 Success!

Once everything is working:
- ✅ Your website is live on your domain
- ✅ User site works perfectly
- ✅ Admin panel fully functional
- ✅ All media synced from Cloudinary
- ✅ Files persist (with KV setup)

**Congratulations! Your Stock Media platform is live! 🚀**

