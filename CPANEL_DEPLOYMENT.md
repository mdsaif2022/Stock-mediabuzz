# cPanel Deployment Guide

This guide covers deploying your Fusion Starter application to cPanel hosting. cPanel hosting typically comes in two flavors:

1. **Static File Hosting Only** (Most Common) - Only HTML/CSS/JS files
2. **Node.js Application Support** (Some Hosts) - Can run Node.js/Express backend

## Prerequisites

Before deploying, make sure you have:
- ✅ Built the application locally: `pnpm build`
- ✅ cPanel access credentials
- ✅ FTP/SFTP or File Manager access
- ✅ Your domain name configured in cPanel

---

## Option 1: Static Frontend Only (Most Common cPanel Setup)

If your cPanel only supports static files, you'll deploy just the frontend and need to host the backend separately (e.g., Render, Railway, or another Node.js host).

### Step 1: Build for cPanel

**Recommended:**
```bash
npm run build:cpanel
```
or
```bash
pnpm build:cpanel
```

This command will:
- Build the frontend (`build:client`)
- Automatically copy `.htaccess` to `dist/spa/`

**Alternative (manual):**
```bash
pnpm build:client
# Then manually copy public/.htaccess to dist/spa/.htaccess
```

This creates the static files in `dist/spa/` directory with `.htaccess` included.

### Step 2: Upload Files to cPanel

**Via File Manager:**
1. Log into cPanel
2. Open **File Manager**
3. Navigate to `public_html` (or your domain's root directory)
4. Delete any existing files (or backup first)
5. Upload all contents from `dist/spa/` folder:
   - `index.html`
   - `assets/` folder
   - `favicon.ico`
   - `robots.txt`
   - Any other static files

**Via FTP/SFTP:**
1. Connect using your FTP client (FileZilla, WinSCP, etc.)
2. Navigate to `public_html` directory
3. Upload all files from `dist/spa/` folder

### Step 3: Verify .htaccess is Included

The `.htaccess` file should already be in `dist/spa/.htaccess` if you used `npm run build:cpanel`.

**If .htaccess is missing:**
1. Check that `dist/spa/.htaccess` exists
2. If not, copy `public/.htaccess` to `dist/spa/.htaccess`
3. Or re-run `npm run build:cpanel`

**Note:** The `.htaccess` file is required for React Router to work correctly (prevents 404 errors on page refresh). It's automatically included when you use the `build:cpanel` command.

### Step 4: Host Backend Separately

Since cPanel can't run Node.js, host your backend on:
- **Render** (recommended - free tier available)
- **Railway**
- **Heroku**
- **DigitalOcean App Platform**
- Any Node.js hosting service

**Backend Deployment Steps:**
1. Build the backend: `pnpm build:server`
2. Deploy `dist/server/` to your Node.js host
3. Set environment variables on your Node.js host
4. Update your frontend's API URL

### Step 5: Update Frontend API Configuration

Before building, update your environment variables or API configuration:

**Option A: Using Environment Variables**
1. Create a `.env.production` file in your project root:
```env
VITE_API_BASE_URL=https://your-backend-host.com
VITE_ADMIN_EMAIL=your-admin@email.com
```

2. Rebuild: `pnpm build:client`

**Option B: Manual Configuration**
Edit `client/lib/api.ts` and update the API base URL directly.

### Step 6: Verify Deployment

1. Visit your domain: `https://yourdomain.com`
2. Check browser console (F12) for errors
3. Test API calls - they should go to your backend host
4. Verify React Router works (navigate to different pages)

---

## Option 2: Full Stack with Node.js Support (Advanced)

Some cPanel hosts offer Node.js application support. If yours does, you can deploy both frontend and backend together.

### Step 1: Check Node.js Support

1. Log into cPanel
2. Look for **"Node.js"** or **"Node.js Selector"** in the dashboard
3. If available, proceed with this option

### Step 2: Build Both Frontend and Backend

```bash
pnpm build
```

This creates:
- Frontend: `dist/spa/`
- Backend: `dist/server/`

### Step 3: Prepare Deployment Package

Create a deployment structure:

```
cpanel-deploy/
├── package.json          # Production dependencies only
├── node_modules/         # Install production deps
├── dist/
│   ├── spa/             # Frontend files
│   └── server/           # Backend files
└── .env                  # Environment variables
```

**Create production package.json:**
```json
{
  "name": "fusion-starter",
  "type": "module",
  "scripts": {
    "start": "node dist/server/node-build.mjs"
  },
  "dependencies": {
    "express": "^5.1.0",
    "cors": "^2.8.5",
    "dotenv": "^17.2.1",
    "cloudinary": "^2.8.0",
    "multer": "^2.0.2",
    "firebase": "^12.5.0",
    "zod": "^3.25.76"
  }
}
```

**Install production dependencies:**
```bash
cd cpanel-deploy
npm install --production
```

### Step 4: Upload to cPanel

1. Upload the entire `cpanel-deploy` folder to your cPanel
2. Place it in a directory like `public_html/app` or as configured by your host

### Step 5: Configure Node.js App in cPanel

1. Open **Node.js Selector** in cPanel
2. Create a new application:
   - **Application root**: `/home/username/public_html/app` (or your path)
   - **Application URL**: `/` or `/app` (depending on your setup)
   - **Application startup file**: `dist/server/node-build.mjs`
   - **Node.js version**: 18+ or 20+ (check what's available)
3. Set environment variables in the Node.js app settings
4. Start the application

### Step 6: Configure .htaccess (if needed)

If your Node.js app doesn't handle routing automatically, you may need `.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Don't rewrite API calls
  RewriteCond %{REQUEST_URI} ^/api/
  RewriteRule ^api/(.*)$ http://localhost:YOUR_NODE_PORT/api/$1 [P,L]
  
  # Rewrite everything else to index.html
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## Environment Variables Setup

### Frontend Variables (if using separate backend)

Set these in your build process or `.env.production`:

```env
VITE_API_BASE_URL=https://your-backend-url.com
VITE_ADMIN_EMAIL=admin@yourdomain.com
```

### Backend Variables

Set these in your Node.js host or cPanel Node.js app settings:

```env
PORT=3000
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
PING_MESSAGE=pong

# Cloudinary (if using)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Firebase (if using)
FIREBASE_API_KEY=your-firebase-key
FIREBASE_AUTH_DOMAIN=your-auth-domain
# ... other Firebase vars
```

---

## Troubleshooting

### Issue: 404 Errors on Page Refresh

**Solution**: Make sure `.htaccess` is configured correctly for React Router (see Step 3 in Option 1).

### Issue: API Calls Fail

**Solution**: 
- Check CORS settings in backend
- Verify `VITE_API_BASE_URL` is correct
- Ensure backend is running and accessible

### Issue: Node.js App Won't Start

**Solution**:
- Check Node.js version compatibility
- Verify all dependencies are installed
- Check application logs in cPanel
- Ensure `dist/server/node-build.mjs` exists

### Issue: Static Assets Not Loading

**Solution**:
- Verify all files from `dist/spa/assets/` are uploaded
- Check file permissions (should be 644 for files, 755 for directories)
- Clear browser cache

### Issue: Build Errors

**Solution**:
```bash
# Clean and rebuild
rm -rf dist node_modules
pnpm install
pnpm build
```

---

## ⚠️ Important: Backend Requirement

**Both user site and admin panel require a backend API.**

cPanel typically only hosts static files, so you **MUST** deploy your backend separately:
- ✅ **Render** (recommended - free tier available)
- ✅ **Railway**
- ✅ **Heroku**
- ✅ Any Node.js hosting service

**Without a backend:**
- ❌ Admin panel will not work
- ❌ User authentication will not work
- ❌ Media browsing (if using API) will not work
- ❌ All API-dependent features will fail

See `CPANEL_VERIFICATION.md` for complete verification steps.

## Recommended Setup

**For Most Users (Recommended):**
- **Frontend**: Deploy to cPanel (static files)
- **Backend**: Deploy to Render/Railway (Node.js)
- **Benefits**: 
  - Simple cPanel deployment
  - Better backend performance
  - Easier to scale
  - Free tier available on Render

**For Advanced Users:**
- **Full Stack**: Deploy both to cPanel with Node.js support
- **Benefits**: 
  - Single hosting location
  - Lower latency (same server)
  - Easier to manage

---

## Post-Deployment Checklist

- [ ] Frontend loads at your domain
- [ ] No console errors in browser
- [ ] React Router navigation works
- [ ] API calls succeed
- [ ] Admin login works
- [ ] Media browsing works
- [ ] Downloads work
- [ ] Environment variables are set correctly
- [ ] SSL certificate is active (HTTPS)
- [ ] `.htaccess` is configured for SPA routing

---

## Security Considerations

1. **Never commit `.env` files** - Use cPanel environment variable settings
2. **Use HTTPS** - Enable SSL certificate in cPanel
3. **Set proper file permissions**:
   - Files: 644
   - Directories: 755
   - `.htaccess`: 644
4. **Protect sensitive directories** - Don't expose `node_modules` or `dist/server/` source files
5. **Update CORS** - Only allow your production domain

---

## Need Help?

If you encounter issues:
1. Check cPanel error logs
2. Check browser console (F12)
3. Verify all environment variables
4. Test backend separately if using Option 1
5. Review Node.js app logs in cPanel

---

**Good luck with your deployment! 🚀**

