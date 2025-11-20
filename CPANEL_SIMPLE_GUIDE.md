# Simple cPanel Deployment Guide

## 🎯 What You Need to Know (Simple Version)

Your website has **2 parts**:
1. **Frontend** (what users see) - This goes to cPanel ✅
2. **Backend** (the server that makes things work) - This goes somewhere else ❌

**cPanel can only host the frontend (static files).** It cannot run your backend server.

---

## 📝 Step-by-Step Instructions

### STEP 1: Deploy Your Backend First

**Where:** Render.com (it's free)

1. Go to https://render.com
2. Sign up for free account
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Set these settings:
   - **Name:** `your-app-backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build:server`
   - **Start Command:** `node dist/server/node-build.mjs`
   - **Plan:** Free

6. Add these environment variables in Render:
   ```
   ALLOWED_ORIGINS=https://yourdomain.com
   ADMIN_EMAIL=admin@yourdomain.com
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=yourpassword123
   ```

7. Click "Create Web Service"
8. Wait for it to deploy (5-10 minutes)
9. **Copy your backend URL** (looks like: `https://your-app-backend.onrender.com`)

---

### STEP 2: Prepare Your Frontend Build

**On your computer:**

1. Create a file named `.env.production` in your project folder
2. Put this inside (replace with YOUR backend URL from Step 1):
   ```
   VITE_API_BASE_URL=https://your-app-backend.onrender.com
   VITE_ADMIN_EMAIL=admin@yourdomain.com
   ```
3. Save the file

---

### STEP 3: Build Your Website

**On your computer, run:**

```bash
npm run build:cpanel
```

Wait for it to finish. You'll see: "✅ cPanel build complete!"

---

### STEP 4: Upload to cPanel

1. Log into your cPanel
2. Open **File Manager**
3. Go to `public_html` folder
4. **Delete everything** in `public_html` (or backup first)
5. Go to your computer, open the `dist/spa` folder
6. **Upload ALL files** from `dist/spa` to `public_html` in cPanel
   - Select all files
   - Click "Upload" or drag and drop
   - Make sure `.htaccess` is included

---

### STEP 5: Test Your Website

1. Visit your website: `https://yourdomain.com`
2. **Test user site:**
   - Homepage should load ✅
   - Click around - pages should work ✅

3. **Test admin panel:**
   - Go to: `https://yourdomain.com/login?role=admin`
   - Login with:
     - Email: `admin@yourdomain.com` (or your ADMIN_EMAIL)
     - Password: `yourpassword123` (your ADMIN_PASSWORD)
   - Should go to admin dashboard ✅

---

## ❌ What If Something Doesn't Work?

### Problem: Admin login doesn't work

**Check:**
1. Is your backend running? Visit: `https://your-app-backend.onrender.com/api/ping`
   - Should show: `{"message":"ping"}`
   - If it doesn't load, your backend isn't running

2. Did you set the environment variables correctly?
   - Check `.env.production` has the right backend URL
   - Rebuild: `npm run build:cpanel`
   - Re-upload to cPanel

3. Check browser console (Press F12 → Console tab)
   - Look for red errors
   - If you see "CORS" error, add your domain to backend `ALLOWED_ORIGINS`

### Problem: Pages show 404 error

**Check:**
1. Is `.htaccess` file in `public_html`?
2. If not, copy it from `public/.htaccess` to `public_html/.htaccess`

### Problem: API calls fail

**Check:**
1. Backend URL in `.env.production` is correct
2. Backend is running (test `/api/ping`)
3. Rebuild and re-upload

---

## 🎯 Quick Checklist

Before you start:
- [ ] Have a Render.com account (free)
- [ ] Have cPanel access
- [ ] Know your domain name

Step 1 - Backend:
- [ ] Backend deployed on Render
- [ ] Backend URL copied (e.g., `https://xxx.onrender.com`)
- [ ] Environment variables set in Render
- [ ] Backend is running (test `/api/ping`)

Step 2 - Frontend:
- [ ] `.env.production` file created
- [ ] Backend URL added to `.env.production`
- [ ] Admin email added to `.env.production`

Step 3 - Build:
- [ ] Ran `npm run build:cpanel`
- [ ] Build completed successfully
- [ ] `dist/spa` folder has files

Step 4 - Upload:
- [ ] All files from `dist/spa` uploaded to `public_html`
- [ ] `.htaccess` file is included

Step 5 - Test:
- [ ] Website loads
- [ ] Admin login works
- [ ] No errors in browser console

---

## 💡 Simple Explanation

Think of it like a restaurant:

- **Frontend (cPanel)** = The dining room (what customers see)
- **Backend (Render)** = The kitchen (where the work happens)

You need BOTH:
- The dining room (frontend on cPanel) ✅
- The kitchen (backend on Render) ✅

Without the kitchen, customers can't get food. Without the backend, your website can't work.

---

## 📞 Need More Help?

If you're stuck:

1. **Check the error message** - What exactly doesn't work?
2. **Check browser console** - Press F12, look at Console tab
3. **Check backend** - Visit `https://your-backend.onrender.com/api/ping`
4. **Verify environment variables** - Make sure they're set correctly

---

## 🎉 Success Looks Like:

✅ Website loads at your domain
✅ You can browse pages
✅ Admin login works
✅ Admin dashboard shows up
✅ No red errors in browser console

**That's it!** If all these work, you're done! 🎊

