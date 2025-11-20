# Quick Command Reference

Copy and paste these commands (replace with YOUR values):

---

## 1. Create .env.production File

**Windows (Command Prompt):**
```cmd
cd G:\Stock-Media-web\Stock-Media
echo VITE_API_BASE_URL=https://your-backend.onrender.com > .env.production
echo VITE_ADMIN_EMAIL=admin@yourdomain.com >> .env.production
```

**Windows (PowerShell):**
```powershell
cd G:\Stock-Media-web\Stock-Media
@"
VITE_API_BASE_URL=https://your-backend.onrender.com
VITE_ADMIN_EMAIL=admin@yourdomain.com
"@ | Out-File -FilePath .env.production -Encoding utf8
```

**Mac/Linux:**
```bash
cd /path/to/your/project
cat > .env.production << EOF
VITE_API_BASE_URL=https://your-backend.onrender.com
VITE_ADMIN_EMAIL=admin@yourdomain.com
EOF
```

**Or manually:**
1. Create file named `.env.production`
2. Paste this (replace with YOUR values):
```
VITE_API_BASE_URL=https://your-backend.onrender.com
VITE_ADMIN_EMAIL=admin@yourdomain.com
```

---

## 2. Build Commands

**Using npm:**
```bash
npm install
npm run build:cpanel
```

**Using pnpm (recommended):**
```bash
pnpm install
pnpm build:cpanel
```

---

## 3. Check Build Output

**Windows:**
```cmd
dir dist\spa
```

**Mac/Linux:**
```bash
ls -la dist/spa
```

Should see: `index.html`, `assets/`, `.htaccess`, etc.

---

## 4. Test Backend

Visit in browser:
```
https://your-backend.onrender.com/api/ping
```

Should return: `{"message":"ping"}` or `{"message":"pong"}`

---

## 5. Test Frontend

Visit in browser:
```
https://yourdomain.com
https://yourdomain.com/login?role=admin
```

---

## Common Issues & Fixes

### Build Error: "Cannot find module"
```bash
npm install
# or
pnpm install
```

### Build Error: ".env.production not found"
- Make sure file is in project root (same folder as package.json)
- Make sure it's named exactly: `.env.production` (with the dot!)

### Admin Login Fails
1. Check backend: `https://your-backend.onrender.com/api/ping`
2. Check `.env.production` has correct backend URL
3. Rebuild: `npm run build:cpanel`
4. Re-upload to cPanel

### CORS Error
- Add your domain to backend `ALLOWED_ORIGINS` in Render
- Format: `https://yourdomain.com,https://www.yourdomain.com`

---

## File Locations

**Project root:**
- `package.json`
- `.env.production` ← Create this here!

**After build:**
- `dist/spa/index.html`
- `dist/spa/assets/`
- `dist/spa/.htaccess`
- Upload ALL of `dist/spa/` to cPanel `public_html/`

---

## Environment Variables Checklist

**In `.env.production` (frontend):**
- [ ] `VITE_API_BASE_URL` = Your Render backend URL
- [ ] `VITE_ADMIN_EMAIL` = Your admin email

**In Render (backend):**
- [ ] `ALLOWED_ORIGINS` = Your cPanel domain
- [ ] `ADMIN_EMAIL` = Your admin email (same as above)
- [ ] `ADMIN_USERNAME` = admin (or your choice)
- [ ] `ADMIN_PASSWORD` = Your password

---

## Complete Workflow

```bash
# 1. Create .env.production (see above)

# 2. Build
npm run build:cpanel

# 3. Upload dist/spa/ to cPanel public_html/

# 4. Test
# Visit: https://yourdomain.com
# Visit: https://yourdomain.com/login?role=admin
```

---

That's it! 🎉

