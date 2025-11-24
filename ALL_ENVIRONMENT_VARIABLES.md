# All Environment Variables - Complete Reference

This document lists **ALL** environment variables used in the Stock Media Platform.

---

## 🎨 **VERCEL (Frontend) Environment Variables**

Add these in **Vercel Dashboard → Settings → Environment Variables**

### ✅ **Required Variables**

```bash
# API Base URL (Your Render backend URL)
VITE_API_BASE_URL=https://your-app-name.onrender.com

# Admin Email (for admin access)
VITE_ADMIN_EMAIL=admin@yourdomain.com
```

### 🔥 **Optional: Firebase Configuration**

**Note:** The code currently uses `REACT_APP_` prefix, but since this is a Vite project, you should use `VITE_` prefix. Update `client/services/firebase.ts` to use `VITE_` prefix.

```bash
# Firebase Configuration (if using Firebase Auth)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Current code uses (needs update):**
- `REACT_APP_FIREBASE_API_KEY` → Should be `VITE_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN` → Should be `VITE_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID` → Should be `VITE_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET` → Should be `VITE_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` → Should be `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID` → Should be `VITE_FIREBASE_APP_ID`

---

## 🖥️ **RENDER (Backend) Environment Variables**

Add these in **Render Dashboard → Your Service → Environment**

### ✅ **Required Variables**

```bash
# Server Port (Render automatically sets this, but you can override)
PORT=10000

# Allowed Origins (comma-separated list of frontend URLs)
# IMPORTANT: Include your Vercel URL and any custom domains
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://www.yourdomain.com

# Admin Credentials (for admin login)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password-here
```

### 📝 **Optional Variables**

```bash
# Ping Message (for health check endpoint /api/ping)
PING_MESSAGE=pong

# Node Environment
NODE_ENV=production
```

### ☁️ **Optional: Cloudinary Configuration**

The Cloudinary credentials are currently hardcoded in `server/config/cloudinary.ts`. For better security, you can move them to environment variables:

```bash
# Cloudinary Account 1
CLOUDINARY_CLOUD_NAME_1=dk81tgmae
CLOUDINARY_API_KEY_1=255731855284435
CLOUDINARY_API_SECRET_1=your_secret_key

# Cloudinary Account 2
CLOUDINARY_CLOUD_NAME_2=dxijk3ivo
CLOUDINARY_API_KEY_2=155419187991824
CLOUDINARY_API_SECRET_2=your_secret_key

# Cloudinary Account 3
CLOUDINARY_CLOUD_NAME_3=dvdtbffva
CLOUDINARY_API_KEY_3=767879943653787
CLOUDINARY_API_SECRET_3=your_secret_key
```

**Note:** To use these, you'll need to update `server/config/cloudinary.ts` to read from environment variables instead of hardcoded values.

---

## 📋 **Quick Copy & Paste**

### **Vercel (Frontend):**
```bash
VITE_API_BASE_URL=https://your-app-name.onrender.com
VITE_ADMIN_EMAIL=admin@yourdomain.com
```

### **Render (Backend):**
```bash
PORT=10000
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://www.yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password-here
PING_MESSAGE=pong
NODE_ENV=production
```

---

## 🔍 **Where Each Variable is Used**

### **Frontend (Vercel):**

| Variable | Used In | Purpose |
|----------|---------|---------|
| `VITE_API_BASE_URL` | `client/lib/api.ts` | Base URL for all API calls |
| `VITE_ADMIN_EMAIL` | `client/components/AdminLayout.tsx` | Admin email check for admin routes |
| `VITE_FIREBASE_*` | `client/services/firebase.ts` | Firebase authentication (if used) |

### **Backend (Render):**

| Variable | Used In | Purpose |
|----------|---------|---------|
| `PORT` | `server/index.ts`, `server/node-build.ts` | Server port (default: 3000 or 10000) |
| `ALLOWED_ORIGINS` | `server/index.ts` | CORS allowed origins |
| `ADMIN_EMAIL` | `server/routes/auth.ts` | Admin email for login |
| `ADMIN_USERNAME` | `server/routes/auth.ts` | Admin username for login |
| `ADMIN_PASSWORD` | `server/routes/auth.ts` | Admin password for login |
| `PING_MESSAGE` | `server/index.ts` | Custom message for `/api/ping` endpoint |
| `NODE_ENV` | Various | Environment mode (development/production) |

---

## ⚠️ **Important Notes**

1. **VITE_ Prefix:** All frontend environment variables must use `VITE_` prefix to be exposed to client-side code in Vite.

2. **REACT_APP_ vs VITE_:** The Firebase config currently uses `REACT_APP_` prefix, but this won't work with Vite. Update the code to use `VITE_` prefix.

3. **ALLOWED_ORIGINS:** Must include your Vercel frontend URL. Can be comma-separated for multiple domains.

4. **Admin Credentials:** `ADMIN_EMAIL` in Render should match `VITE_ADMIN_EMAIL` in Vercel for admin access to work.

5. **No Trailing Slash:** Don't add trailing slashes to URLs in environment variables.

---

## 🚀 **Setup Instructions**

### **Vercel Setup:**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Add each variable (name + value)
6. Select environment: **Production, Preview, Development**
7. Click **Save**
8. Redeploy your project

### **Render Setup:**
1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Select your backend service
3. Go to **Environment** tab
4. Click **"Add Environment Variable"**
5. Add each variable (name + value)
6. Click **"Save Changes"**
7. Render will auto-redeploy

---

## ✅ **Verification Checklist**

### **Frontend (Vercel):**
- [ ] `VITE_API_BASE_URL` points to your Render backend
- [ ] `VITE_ADMIN_EMAIL` matches your admin email
- [ ] API calls work from frontend to backend
- [ ] Admin login works with `VITE_ADMIN_EMAIL`

### **Backend (Render):**
- [ ] `ALLOWED_ORIGINS` includes your Vercel URL
- [ ] `ADMIN_EMAIL` matches `VITE_ADMIN_EMAIL` in Vercel
- [ ] `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set
- [ ] `/api/ping` returns your `PING_MESSAGE`
- [ ] CORS is working (no CORS errors in browser)

---

## 🔒 **Security Best Practices**

1. **Never commit** sensitive values to Git
2. **Use strong passwords** for admin credentials
3. **Rotate credentials** periodically
4. **Limit ALLOWED_ORIGINS** to only your production domains
5. **Use different credentials** for development and production
6. **Enable 2FA** on your Vercel and Render accounts
7. **Keep Cloudinary secrets** in environment variables, not hardcoded

---

## 🆘 **Troubleshooting**

### **Issue: CORS errors in browser**
**Solution:** Make sure your Vercel URL is included in Render's `ALLOWED_ORIGINS`

### **Issue: API calls failing**
**Solution:** Verify `VITE_API_BASE_URL` in Vercel matches your Render service URL

### **Issue: Admin login not working**
**Solution:** Check that `ADMIN_EMAIL` in Render matches `VITE_ADMIN_EMAIL` in Vercel

### **Issue: Environment variables not updating**
**Solution:** 
- Vercel: Redeploy after adding variables
- Render: Service auto-redeploys when you save environment variables

### **Issue: Firebase variables not working**
**Solution:** Update `client/services/firebase.ts` to use `VITE_` prefix instead of `REACT_APP_`

---

**Last Updated:** 2025-01-XX

