# 🚀 Render Backend Setup Guide

## ✅ Your Backend is Running!

Your Render backend is live at: **https://free-stock-media.onrender.com**

## 📋 Required Configuration

### 1. Render Backend Environment Variables

Go to **Render Dashboard** → **Your Service** → **Environment** tab and add/verify these:

```
PORT=10000
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://free-stock-media.onrender.com
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password-here
PING_MESSAGE=pong
NODE_ENV=production
```

**⚠️ IMPORTANT:** 
- Replace `yourdomain.com` with your **actual cPanel domain**
- Add both `http://` and `https://` versions if needed
- The `ALLOWED_ORIGINS` must include your cPanel domain to allow CORS requests

### 2. Frontend Environment File

Create `.env.production` in your project root:

```env
# Backend API URL (no trailing slash!)
VITE_API_BASE_URL=https://free-stock-media.onrender.com

# Admin email (must match Render ADMIN_EMAIL)
VITE_ADMIN_EMAIL=admin@yourdomain.com
```

**Replace `admin@yourdomain.com` with your actual admin email**

### 3. Build for cPanel

```bash
npm run build:cpanel
```

This will:
- ✅ Build React frontend with correct API URL
- ✅ Copy `.htaccess` file
- ✅ Create production files in `dist/spa/`

### 4. Test Backend Connection

After deploying to cPanel, test that API calls work:

1. Open browser console on your cPanel site
2. Run: `fetch('https://free-stock-media.onrender.com/api/ping')`
3. Should return: `{"message":"pong"}`

## 🔧 Troubleshooting

### CORS Errors

If you see CORS errors, check:
1. Your cPanel domain is in `ALLOWED_ORIGINS` on Render
2. Both `http://` and `https://` versions are included
3. No trailing slashes in URLs

### API Not Working

1. Check Render logs: Dashboard → Your Service → Logs
2. Verify backend is running: https://free-stock-media.onrender.com/api/ping
3. Check browser console for API errors
4. Verify `VITE_API_BASE_URL` in `.env.production`

## 📝 Quick Checklist

- [ ] Render backend is running (https://free-stock-media.onrender.com)
- [ ] `ALLOWED_ORIGINS` includes your cPanel domain
- [ ] `.env.production` file exists with correct `VITE_API_BASE_URL`
- [ ] Built with `npm run build:cpanel`
- [ ] Uploaded `dist/spa/` to cPanel `public_html/`
- [ ] Tested API connection from cPanel site

