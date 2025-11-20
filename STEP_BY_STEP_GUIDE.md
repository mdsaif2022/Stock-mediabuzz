# Complete Step-by-Step Guide

This guide shows you EXACTLY how to do each step.

---

## PART 1: How to Deploy the Backend to Render.com

### Step 1.1: Sign Up for Render

1. Go to: **https://render.com**
2. Click **"Get Started for Free"** or **"Sign Up"**
3. Sign up with:
   - GitHub account (recommended), OR
   - Email address
4. Verify your email if needed

### Step 1.2: Connect Your Code

**Option A: If your code is on GitHub**
1. In Render dashboard, click **"New +"** button (top right)
2. Click **"Web Service"**
3. Click **"Connect account"** next to GitHub
4. Authorize Render to access your GitHub
5. Select your repository (the one with your code)
6. Click **"Connect"**

**Option B: If your code is NOT on GitHub**
1. First, push your code to GitHub:
   - Create a GitHub account
   - Create a new repository
   - Upload your code there
2. Then follow Option A above

### Step 1.3: Configure the Backend Service

Fill in these settings:

**Name:**
```
your-app-backend
```
(You can use any name you want)

**Region:**
```
Oregon (US West)
```
(Or choose closest to you)

**Branch:**
```
main
```
(Or `master` if that's your branch name)

**Root Directory:**
```
(leave empty)
```

**Runtime:**
```
Node
```

**Build Command:**
```
npm install && npm run build:server
```

**Start Command:**
```
node dist/server/node-build.mjs
```

**Plan:**
```
Free
```
(Click the Free plan)

### Step 1.4: Add Environment Variables

Scroll down to **"Environment Variables"** section.

Click **"Add Environment Variable"** for each one:

**Variable 1:**
- **Key:** `ALLOWED_ORIGINS`
- **Value:** `https://yourdomain.com,https://www.yourdomain.com`
- (Replace `yourdomain.com` with YOUR actual domain)

**Variable 2:**
- **Key:** `ADMIN_EMAIL`
- **Value:** `admin@yourdomain.com`
- (Use your admin email)

**Variable 3:**
- **Key:** `ADMIN_USERNAME`
- **Value:** `admin`
- (Or any username you want)

**Variable 4:**
- **Key:** `ADMIN_PASSWORD`
- **Value:** `YourSecurePassword123!`
- (Use a strong password - remember this!)

**Variable 5 (Optional):**
- **Key:** `PING_MESSAGE`
- **Value:** `pong`
- (This is optional)

### Step 1.5: Deploy

1. Scroll to bottom
2. Click **"Create Web Service"**
3. Wait 5-10 minutes for deployment
4. Watch the logs - it will show progress
5. When it says **"Your service is live"**, you're done!

### Step 1.6: Get Your Backend URL

1. Look at the top of the page
2. You'll see a URL like: `https://your-app-backend.onrender.com`
3. **COPY THIS URL** - you'll need it in Part 2!
4. Test it: Visit `https://your-app-backend.onrender.com/api/ping`
   - Should show: `{"message":"ping"}` or `{"message":"pong"}`

---

## PART 2: How to Create the .env.production File

### Step 2.1: Open Your Project Folder

1. On your computer, go to your project folder
   - This is where your `package.json` file is
   - Example: `C:\Users\YourName\Stock-Media` or `G:\Stock-Media-web\Stock-Media`

### Step 2.2: Create the File

**On Windows:**

**Method 1: Using Notepad**
1. Open Notepad
2. Type this (replace with YOUR backend URL from Part 1):
   ```
   VITE_API_BASE_URL=https://your-app-backend.onrender.com
   VITE_ADMIN_EMAIL=admin@yourdomain.com
   ```
3. Click **File → Save As**
4. Navigate to your project folder
5. In "Save as type", select **"All Files (*.*)"**
6. File name: `.env.production` (with the dot at the start!)
7. Click **Save**

**Method 2: Using File Explorer**
1. In your project folder, right-click
2. Click **New → Text Document**
3. Name it: `.env.production` (with the dot!)
4. If Windows warns about the dot, click **Yes**
5. Right-click the file → **Open with → Notepad**
6. Paste this (replace with YOUR values):
   ```
   VITE_API_BASE_URL=https://your-app-backend.onrender.com
   VITE_ADMIN_EMAIL=admin@yourdomain.com
   ```
7. Save and close

**On Mac/Linux:**
1. Open Terminal
2. Go to your project folder:
   ```bash
   cd /path/to/your/project
   ```
3. Create the file:
   ```bash
   nano .env.production
   ```
4. Paste this (replace with YOUR values):
   ```
   VITE_API_BASE_URL=https://your-app-backend.onrender.com
   VITE_ADMIN_EMAIL=admin@yourdomain.com
   ```
5. Press `Ctrl+X`, then `Y`, then `Enter` to save

### Step 2.3: Verify the File

1. Make sure the file is in the same folder as `package.json`
2. Make sure it's named exactly: `.env.production` (with the dot!)
3. Make sure it contains your backend URL (from Part 1)

**Example of what it should look like:**
```
VITE_API_BASE_URL=https://my-backend-123.onrender.com
VITE_ADMIN_EMAIL=admin@mydomain.com
```

---

## PART 3: How to Build

### Step 3.1: Open Terminal/Command Prompt

**On Windows:**
1. Press `Windows Key + R`
2. Type: `cmd` or `powershell`
3. Press Enter

**On Mac:**
1. Press `Cmd + Space`
2. Type: `Terminal`
3. Press Enter

**On Linux:**
1. Press `Ctrl + Alt + T`

### Step 3.2: Go to Your Project Folder

Type this (replace with YOUR project path):

**Windows:**
```bash
cd G:\Stock-Media-web\Stock-Media
```

**Mac/Linux:**
```bash
cd /path/to/your/project
```

Press Enter.

### Step 3.3: Install Dependencies (if needed)

If you haven't installed dependencies yet:

**Using npm:**
```bash
npm install
```

**Using pnpm (recommended):**
```bash
pnpm install
```

Wait for it to finish (may take a few minutes).

### Step 3.4: Run the Build Command

Type this command:

**Using npm:**
```bash
npm run build:cpanel
```

**Using pnpm:**
```bash
pnpm build:cpanel
```

Press Enter.

### Step 3.5: Wait for Build to Complete

You'll see output like this:
```
✓ built in 15.23s
✅ Environment variables found in .env.production
✅ .htaccess copied to dist/spa/

📦 cPanel build complete!
📁 Upload all files from dist/spa/ to public_html/ in cPanel
```

**If you see errors:**
- Make sure `.env.production` file exists
- Make sure you're in the correct folder
- Try running `npm install` first

### Step 3.6: Verify Build Output

1. Go to your project folder
2. Open the `dist` folder
3. Open the `spa` folder
4. You should see files like:
   - `index.html`
   - `assets/` (folder)
   - `.htaccess`
   - `favicon.ico`
   - `robots.txt`

**If these files exist, your build is successful! ✅**

---

## PART 4: How to Upload to cPanel

### Step 4.1: Log into cPanel

1. Go to your hosting provider's website
2. Log into your account
3. Find and click **"cPanel"** or **"Control Panel"**
4. Enter your cPanel username and password
5. Click **"Log in"**

### Step 4.2: Open File Manager

1. In cPanel, look for **"Files"** section
2. Click **"File Manager"**
3. If it asks, select **"Web Root (public_html/www)"**
4. Click **"Go"**

### Step 4.3: Navigate to public_html

1. In the left sidebar, you'll see folders
2. Click on **`public_html`** folder
   - This is where your website files go
   - This is your website's root directory

### Step 4.4: Backup Existing Files (Optional but Recommended)

1. If there are files already in `public_html`:
   - Select all files (Ctrl+A or Cmd+A)
   - Right-click → **"Compress"** or **"Create Archive"**
   - Name it: `backup-2025-01-XX.zip`
   - This creates a backup in case you need it later

### Step 4.5: Delete Old Files (if any)

1. Select all files in `public_html` (Ctrl+A or Cmd+A)
2. Right-click → **"Delete"**
3. Confirm deletion
4. **OR** move them to a backup folder first

### Step 4.6: Upload New Files

**Method 1: Using File Manager Upload**

1. Make sure you're in `public_html` folder
2. Click **"Upload"** button (top menu)
3. Click **"Select File"** or drag and drop
4. Navigate to your computer's `dist/spa` folder
5. Select **ALL files**:
   - `index.html`
   - `assets` folder (select the whole folder)
   - `.htaccess`
   - `favicon.ico`
   - `robots.txt`
   - Any other files
6. Click **"Open"** or **"Upload"**
7. Wait for upload to complete

**Method 2: Using FTP (FileZilla, WinSCP, etc.)**

1. Open your FTP client
2. Connect to your cPanel FTP:
   - Host: `ftp.yourdomain.com` or your server IP
   - Username: Your cPanel username
   - Password: Your cPanel password
   - Port: 21 (or 22 for SFTP)
3. Navigate to `public_html` folder
4. Navigate to your computer's `dist/spa` folder
5. Select all files
6. Drag and drop to `public_html`
7. Wait for upload to complete

### Step 4.7: Verify Files Are Uploaded

1. In File Manager, check `public_html` folder
2. You should see:
   - ✅ `index.html`
   - ✅ `assets/` folder
   - ✅ `.htaccess` (important!)
   - ✅ `favicon.ico`
   - ✅ `robots.txt`

**Make sure `.htaccess` is there!** If it's missing:
- It might be hidden (files starting with `.` are sometimes hidden)
- In File Manager, enable "Show Hidden Files"
- Or upload it manually

### Step 4.8: Set File Permissions (if needed)

1. Select `.htaccess` file
2. Right-click → **"Change Permissions"** or **"File Permissions"**
3. Set to: `644` (or check: Read, Write for Owner; Read for Others)
4. Click **"Change Permissions"**

For folders:
- Set folders to: `755` (or check: Read, Write, Execute for Owner; Read, Execute for Others)

---

## PART 5: Test Your Website

### Step 5.1: Test User Site

1. Open your web browser
2. Visit: `https://yourdomain.com`
3. **Should see:** Your homepage loads ✅
4. Try clicking links - pages should work ✅
5. Try refreshing a page - should NOT show 404 error ✅

### Step 5.2: Test Admin Panel

1. Visit: `https://yourdomain.com/login?role=admin`
2. **Should see:** Login page with "Sign in as Admin" option ✅
3. Enter:
   - **Email:** `admin@yourdomain.com` (or your ADMIN_EMAIL)
   - **Password:** Your ADMIN_PASSWORD (from Part 1, Step 1.4)
4. Click **"Sign in as Admin"**
5. **Should see:** Admin dashboard at `/admin-2025` ✅

### Step 5.3: Check for Errors

1. Press **F12** (opens Developer Tools)
2. Click **"Console"** tab
3. Look for **red errors**
   - If you see CORS errors → Backend ALLOWED_ORIGINS needs your domain
   - If you see 404 errors → Check `.htaccess` file
   - If you see API errors → Check backend URL in `.env.production`

---

## 🎉 Success!

If everything works:
- ✅ Website loads
- ✅ Admin login works
- ✅ No errors in console

**You're done!** 🎊

---

## ❌ Troubleshooting

### Problem: Build fails
**Solution:** 
- Make sure `.env.production` file exists
- Make sure you're in the project folder
- Try: `npm install` first

### Problem: Files won't upload
**Solution:**
- Check file size limits
- Try uploading one file at a time
- Use FTP instead of File Manager

### Problem: Website shows 404
**Solution:**
- Make sure `.htaccess` is uploaded
- Check file permissions (should be 644)
- Contact hosting support to enable `mod_rewrite`

### Problem: Admin login doesn't work
**Solution:**
- Check backend is running: Visit `https://your-backend.onrender.com/api/ping`
- Check `.env.production` has correct backend URL
- Rebuild and re-upload
- Check browser console for errors

---

## 📞 Need Help?

If you're stuck on any step, tell me:
1. Which part you're on (Part 1, 2, 3, or 4)
2. What error message you see (if any)
3. What happens when you try

I'll help you fix it! 😊

