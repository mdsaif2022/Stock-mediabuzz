# cPanel Deployment Verification Guide

This guide ensures both the **user site** and **admin panel** work correctly after deploying to cPanel.

## ⚠️ Critical Requirements

### 1. Backend API Must Be Deployed Separately

**cPanel only hosts static files** - it cannot run your Express backend. You MUST deploy the backend separately:

- ✅ **Render** (recommended - free tier available)
- ✅ **Railway**
- ✅ **Heroku**
- ✅ **DigitalOcean App Platform**
- ✅ Any Node.js hosting service

**Without a backend, the following will NOT work:**
- ❌ Admin panel login
- ❌ Admin dashboard features
- ❌ User authentication
- ❌ Media browsing (if data comes from API)
- ❌ Downloads
- ❌ All API-dependent features

---

## ✅ Pre-Deployment Checklist

Before building for cPanel, ensure:

### 1. Backend is Deployed and Running

- [ ] Backend is deployed to Render/Railway/etc.
- [ ] Backend URL is accessible (test: `https://your-backend.com/api/ping`)
- [ ] Backend returns `{"message": "ping"}` or your custom message

### 2. Environment Variables Are Set

Create a `.env.production` file in your project root:

```env
# Required: Your backend API URL (no trailing slash)
VITE_API_BASE_URL=https://your-backend.onrender.com

# Required: Admin email (must match backend ADMIN_EMAIL)
VITE_ADMIN_EMAIL=admin@yourdomain.com
```

**Important:** These variables are baked into the build at build time. You cannot change them after building without rebuilding.

### 3. Backend CORS Configuration

In your backend (Render/Railway), set the `ALLOWED_ORIGINS` environment variable:

```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Note:** Replace `yourdomain.com` with your actual cPanel domain.

---

## 🚀 Deployment Steps

### Step 1: Set Environment Variables

Create `.env.production` file:

```bash
# .env.production
VITE_API_BASE_URL=https://your-backend.onrender.com
VITE_ADMIN_EMAIL=admin@yourdomain.com
```

### Step 2: Build for cPanel

```bash
npm run build:cpanel
```

This will:
- Build the frontend with your environment variables
- Copy `.htaccess` for React Router support

### Step 3: Upload to cPanel

Upload all files from `dist/spa/` to `public_html/` in cPanel.

### Step 4: Verify Backend Configuration

In your backend hosting (Render/Railway):
- Set `ALLOWED_ORIGINS` to include your cPanel domain
- Verify `ADMIN_EMAIL` matches `VITE_ADMIN_EMAIL` from your build
- Verify `ADMIN_PASSWORD` is set correctly

---

## 🧪 Post-Deployment Verification

### Test 1: User Site (Public Pages)

1. **Homepage**
   - [ ] Visit `https://yourdomain.com/`
   - [ ] Page loads without errors
   - [ ] No console errors (F12 → Console)

2. **Navigation**
   - [ ] Click links (Browse, Categories, etc.)
   - [ ] Pages load correctly
   - [ ] No 404 errors on page refresh

3. **Media Browsing** (if using API)
   - [ ] Visit `/browse`
   - [ ] Media items load
   - [ ] Check Network tab - API calls succeed
   - [ ] No CORS errors

### Test 2: Admin Panel

1. **Admin Login**
   - [ ] Visit `https://yourdomain.com/login?role=admin`
   - [ ] Enter admin credentials:
     - Email: (your `VITE_ADMIN_EMAIL`)
     - Password: (your backend `ADMIN_PASSWORD`)
   - [ ] Click "Sign in as Admin"
   - [ ] ✅ Should redirect to `/admin-2025`

2. **Admin Dashboard**
   - [ ] Dashboard loads at `/admin-2025`
   - [ ] Stats/data displays correctly
   - [ ] No console errors
   - [ ] Check Network tab - API calls to backend succeed

3. **Admin Features**
   - [ ] Media management (`/admin-2025/media`) works
   - [ ] Ads manager (`/admin-2025/ads`) works
   - [ ] Analytics (`/admin-2025/analytics`) loads data
   - [ ] Users page (`/admin-2025/users`) works
   - [ ] Settings page (`/admin-2025/settings`) works

### Test 3: API Connectivity

1. **Check Browser Console**
   - [ ] Open DevTools (F12)
   - [ ] Go to Network tab
   - [ ] Navigate through the site
   - [ ] All API calls should go to your backend URL
   - [ ] No CORS errors
   - [ ] No 404 errors

2. **Test API Endpoints Directly**
   - [ ] Visit `https://your-backend.com/api/ping`
   - [ ] Should return JSON: `{"message": "ping"}`

---

## 🔍 Troubleshooting

### Issue: Admin Panel Shows "Redirecting to login"

**Symptoms:**
- Admin panel immediately redirects to login
- Even after logging in, redirects back

**Solutions:**
1. Check `VITE_ADMIN_EMAIL` matches backend `ADMIN_EMAIL`
2. Verify admin login API call succeeds (check Network tab)
3. Check browser console for errors
4. Clear browser cache and cookies
5. Verify `sessionStorage.getItem("adminSession")` is set after login

### Issue: CORS Errors

**Symptoms:**
- Browser console shows: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solutions:**
1. Add your cPanel domain to backend `ALLOWED_ORIGINS`:
   ```env
   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```
2. Redeploy backend after changing `ALLOWED_ORIGINS`
3. Verify no trailing slashes in URLs

### Issue: API Calls Return 404

**Symptoms:**
- Network tab shows 404 for API calls
- API calls go to wrong URL

**Solutions:**
1. Verify `VITE_API_BASE_URL` in `.env.production` is correct
2. Rebuild: `npm run build:cpanel`
3. Check API calls in Network tab - should go to `https://your-backend.com/api/...`
4. Verify backend is running and accessible

### Issue: Admin Login Fails

**Symptoms:**
- "Incorrect admin credentials" error
- Login button does nothing

**Solutions:**
1. Verify backend `ADMIN_EMAIL` matches `VITE_ADMIN_EMAIL`
2. Verify backend `ADMIN_PASSWORD` is correct
3. Check Network tab - login API call should succeed
4. Verify backend is running (test `/api/ping`)

### Issue: React Router 404 Errors

**Symptoms:**
- Direct URL access returns 404
- Page refresh shows 404

**Solutions:**
1. Verify `.htaccess` is in `public_html/` directory
2. Check `.htaccess` content is correct
3. Verify Apache `mod_rewrite` is enabled (contact hosting support)
4. Check file permissions (`.htaccess` should be 644)

### Issue: Environment Variables Not Working

**Symptoms:**
- API calls go to wrong URL
- Admin email check fails

**Solutions:**
1. **Environment variables must be set BEFORE building**
2. Create `.env.production` file
3. Rebuild: `npm run build:cpanel`
4. Verify variables are in the build (check `dist/spa/assets/index-*.js` - search for your API URL)

---

## 📋 Complete Verification Checklist

### Pre-Deployment
- [ ] Backend deployed and accessible
- [ ] `.env.production` file created with correct values
- [ ] Backend `ALLOWED_ORIGINS` includes cPanel domain
- [ ] Backend `ADMIN_EMAIL` matches `VITE_ADMIN_EMAIL`
- [ ] Backend `ADMIN_PASSWORD` is set

### Build Process
- [ ] Ran `npm run build:cpanel`
- [ ] Build completed without errors
- [ ] `dist/spa/.htaccess` exists
- [ ] `dist/spa/` contains all files

### Upload
- [ ] All files from `dist/spa/` uploaded to `public_html/`
- [ ] `.htaccess` is in `public_html/`
- [ ] File permissions are correct (644 for files, 755 for directories)

### User Site Testing
- [ ] Homepage loads
- [ ] Navigation works
- [ ] Page refresh doesn't cause 404
- [ ] Media browsing works (if applicable)
- [ ] No console errors

### Admin Panel Testing
- [ ] Admin login works
- [ ] Admin dashboard loads
- [ ] All admin pages accessible
- [ ] Admin features work (media, ads, analytics, users, settings)
- [ ] No console errors
- [ ] API calls succeed

### API Testing
- [ ] Backend `/api/ping` works
- [ ] No CORS errors
- [ ] All API calls go to correct backend URL
- [ ] API responses are correct

---

## ✅ Success Criteria

Your deployment is successful when:

1. ✅ **User site works:**
   - Homepage loads
   - Navigation works
   - No 404 errors on refresh
   - Media browsing works

2. ✅ **Admin panel works:**
   - Admin can login
   - Admin dashboard loads
   - All admin features functional
   - Data displays correctly

3. ✅ **API connectivity:**
   - No CORS errors
   - All API calls succeed
   - Backend responds correctly

4. ✅ **No errors:**
   - Browser console is clean
   - Network requests succeed
   - No 404 or 500 errors

---

## 🆘 Still Having Issues?

If you've followed all steps and still have problems:

1. **Check browser console** (F12) for specific error messages
2. **Check Network tab** to see which API calls are failing
3. **Verify backend is running** - test `/api/ping` directly
4. **Check backend logs** in Render/Railway dashboard
5. **Verify environment variables** are set correctly in both frontend build and backend
6. **Clear browser cache** and try again
7. **Test in incognito mode** to rule out cache issues

---

## 📝 Quick Reference

### Required Environment Variables

**Frontend (`.env.production`):**
```env
VITE_API_BASE_URL=https://your-backend.onrender.com
VITE_ADMIN_EMAIL=admin@yourdomain.com
```

**Backend (Render/Railway):**
```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

### Build Command
```bash
npm run build:cpanel
```

### Upload Location
- **cPanel:** `public_html/` directory
- **Files:** All contents from `dist/spa/`

---

**Remember:** The admin panel **requires** a backend API. If you only deploy the frontend to cPanel without a backend, the admin panel will not work.

