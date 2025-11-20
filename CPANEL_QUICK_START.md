# cPanel Quick Start Guide

## ⚠️ Important: Backend Required

**Both user site and admin panel need a backend API.** cPanel only hosts static files, so deploy your backend separately (Render/Railway/Heroku).

## Fastest Method: Static Frontend Only

### 1. Set Environment Variables

Create `.env.production` file:
```env
VITE_API_BASE_URL=https://your-backend.onrender.com
VITE_ADMIN_EMAIL=admin@yourdomain.com
```

### 2. Build for cPanel
```bash
npm run build:cpanel
```
or
```bash
pnpm build:cpanel
```

This command will:
- ✅ Build the frontend (`build:client`)
- ✅ Automatically copy `.htaccess` to `dist/spa/`
- ✅ Include your environment variables in the build

### 3. Upload to cPanel
- Upload **all files** from `dist/spa/` folder to `public_html/` in cPanel
- The `.htaccess` file is already included in the build!

### 4. Configure Backend
- Deploy backend to Render/Railway/Heroku
- Set `ALLOWED_ORIGINS` to include your cPanel domain
- Set `ADMIN_EMAIL` and `ADMIN_PASSWORD`

### 5. Verify Deployment
See `CPANEL_VERIFICATION.md` for complete testing checklist.

---

## What Files to Upload?

From `dist/spa/` folder:
```
✅ index.html
✅ assets/ (entire folder)
✅ favicon.ico
✅ robots.txt
✅ .htaccess (copy from public/.htaccess)
```

**Upload location:** `public_html/` in cPanel

---

## Need Full Details?

See `CPANEL_DEPLOYMENT.md` for complete instructions including:
- Node.js deployment option
- Environment variable setup
- Troubleshooting
- Security considerations

