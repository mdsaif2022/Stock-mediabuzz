# Visual Step-by-Step Guide

## 🎯 The Complete Picture

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR COMPUTER                             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. Create .env.production file                      │  │
│  │     (Put your backend URL here)                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  2. Run: npm run build:cpanel                        │  │
│  │     (Creates dist/spa/ folder)                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  3. Upload dist/spa/ to cPanel                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                      CPANEL                                 │
│                                                              │
│  public_html/                                                │
│    ├── index.html                                           │
│    ├── assets/                                               │
│    ├── .htaccess  ← Important!                              │
│    └── ...                                                   │
│                                                              │
│  ✅ User Site Works                                          │
│  ✅ Admin Panel Works (needs backend)                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
                    (API Calls)
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    RENDER.COM                               │
│                    (Backend Server)                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Deploy your backend here first!                      │  │
│  │  - Handles login                                       │  │
│  │  - Handles admin features                              │  │
│  │  - Handles API requests                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  URL: https://your-backend.onrender.com                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Step-by-Step Flow

### STEP 1: Backend (Render.com)
```
You → Render.com → Deploy Backend → Get URL
                                    ↓
                          https://xxx.onrender.com
```

**What to do:**
1. Go to render.com
2. Sign up (free)
3. New → Web Service
4. Connect GitHub
5. Set build/start commands
6. Add environment variables
7. Deploy
8. Copy the URL it gives you

---

### STEP 2: .env.production File
```
Your Computer
  └── Your Project Folder
      ├── package.json
      ├── .env.production  ← CREATE THIS!
      └── ...
```

**What to put inside:**
```
VITE_API_BASE_URL=https://xxx.onrender.com
VITE_ADMIN_EMAIL=admin@yourdomain.com
```

**How to create:**
- Windows: Notepad → Save as `.env.production`
- Mac/Linux: `nano .env.production`

---

### STEP 3: Build
```
Your Computer (Terminal)
  ↓
  npm run build:cpanel
  ↓
  dist/spa/
    ├── index.html
    ├── assets/
    ├── .htaccess
    └── ...
```

**Command:**
```bash
npm run build:cpanel
```

**Result:**
- Creates `dist/spa/` folder
- All files ready to upload

---

### STEP 4: Upload to cPanel
```
Your Computer          cPanel
  dist/spa/    →    public_html/
    ├── index.html      ├── index.html
    ├── assets/         ├── assets/
    ├── .htaccess       ├── .htaccess
    └── ...             └── ...
```

**How:**
1. Log into cPanel
2. File Manager
3. Go to `public_html`
4. Upload all files from `dist/spa/`

---

### STEP 5: Test
```
Browser
  ↓
https://yourdomain.com
  ↓
✅ Homepage loads
✅ Admin login works
✅ Everything works!
```

---

## 🔄 The Complete Flow

```
┌─────────────┐
│   START     │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ 1. Deploy Backend    │
│    to Render.com    │
│    Get URL          │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 2. Create           │
│    .env.production  │
│    (Put backend URL)│
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 3. Build            │
│    npm run          │
│    build:cpanel    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 4. Upload           │
│    dist/spa/ to     │
│    cPanel           │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 5. Test Website     │
│    Visit domain     │
│    Test admin       │
└──────┬──────────────┘
       │
       ▼
┌─────────────┐
│   DONE! ✅  │
└─────────────┘
```

---

## 📝 Quick Checklist

Print this and check off as you go:

### Backend (Render.com)
- [ ] Signed up at render.com
- [ ] Created new Web Service
- [ ] Connected GitHub
- [ ] Set build command: `npm install && npm run build:server`
- [ ] Set start command: `node dist/server/node-build.mjs`
- [ ] Added `ALLOWED_ORIGINS` environment variable
- [ ] Added `ADMIN_EMAIL` environment variable
- [ ] Added `ADMIN_PASSWORD` environment variable
- [ ] Deployed successfully
- [ ] Copied backend URL (e.g., `https://xxx.onrender.com`)
- [ ] Tested backend: `/api/ping` works

### Frontend (.env.production)
- [ ] Created `.env.production` file in project root
- [ ] Added `VITE_API_BASE_URL` with backend URL
- [ ] Added `VITE_ADMIN_EMAIL` with admin email
- [ ] Saved the file

### Build
- [ ] Opened terminal/command prompt
- [ ] Went to project folder
- [ ] Ran `npm run build:cpanel` (or `pnpm build:cpanel`)
- [ ] Build completed successfully
- [ ] Checked `dist/spa/` folder has files

### Upload
- [ ] Logged into cPanel
- [ ] Opened File Manager
- [ ] Went to `public_html` folder
- [ ] Deleted old files (or backed up)
- [ ] Uploaded all files from `dist/spa/`
- [ ] Verified `.htaccess` is uploaded

### Test
- [ ] Visited `https://yourdomain.com` - homepage loads
- [ ] Tested navigation - pages work
- [ ] Visited `/login?role=admin` - login page loads
- [ ] Logged in with admin credentials - works!
- [ ] Admin dashboard loads - works!
- [ ] Checked browser console (F12) - no errors

---

## 🎯 What Each Part Does

### Backend (Render.com)
- Handles user login
- Handles admin login
- Serves API data
- Processes requests

### Frontend (cPanel)
- Shows the website
- Displays pages
- Makes API calls to backend
- Shows admin panel UI

### .env.production
- Tells frontend where backend is
- Sets admin email for frontend

### Build Process
- Combines all code
- Includes environment variables
- Creates optimized files
- Ready to upload

---

## 💡 Remember

1. **Backend FIRST** - Deploy backend before building frontend
2. **Environment Variables** - Must match between frontend and backend
3. **Build BEFORE Upload** - Always build first, then upload
4. **Test Everything** - Check both user site and admin panel

---

## 🆘 If Something Breaks

1. **Check backend is running:**
   - Visit: `https://your-backend.onrender.com/api/ping`
   - Should return JSON

2. **Check .env.production:**
   - File exists?
   - Has correct backend URL?
   - In project root folder?

3. **Check build:**
   - Did build complete?
   - Is `dist/spa/` folder created?
   - Are files there?

4. **Check upload:**
   - Are all files uploaded?
   - Is `.htaccess` there?
   - File permissions correct?

5. **Check browser console:**
   - Press F12
   - Look at Console tab
   - What errors do you see?

---

That's the complete picture! Follow the steps in order and you'll be done! 🎉

