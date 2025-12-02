# 🔧 Fix 404 Error on Page Reload (React Router SPA)

## ❌ Problem

When you navigate to a page (like `/browse` or `/categories`) and reload, you see:
- **404 Not Found**
- **"The resource requested could not be found on this server!"**
- LiteSpeed Web Server error page

**This happens because:** The server looks for a file at `/browse` and doesn't find it. React Router handles routing client-side, so we need to tell the server to serve `index.html` for all routes.

---

## ✅ Solution: Fix .htaccess File

### Step 1: Check if .htaccess Exists in cPanel

1. **Log into cPanel**
2. **Open File Manager**
3. **Navigate to `public_html/`** (your website root)
4. **Check if `.htaccess` file exists**

**Important:** The file must be named exactly `.htaccess` (starts with a dot, no extension)

---

### Step 2A: If .htaccess Doesn't Exist - Create It

1. In File Manager, make sure **"Show Hidden Files"** is enabled:
   - Click **Settings** (top right)
   - Check **"Show Hidden Files (dotfiles)"**
   - Click **Save**

2. **Create new file:**
   - Click **+ File** button
   - Name it: `.htaccess` (must start with a dot!)
   - Click **Create New File**

3. **Edit the file** and paste this content:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Don't rewrite existing files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Don't rewrite API calls
  RewriteCond %{REQUEST_URI} !^/api/
  
  # Rewrite everything else to index.html for React Router
  RewriteRule ^(.*)$ /index.html [L]
</IfModule>
```

4. **Save the file**

---

### Step 2B: If .htaccess Exists - Update It

1. **Right-click on `.htaccess`** → **Edit**
2. **Replace all content** with this:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Don't rewrite existing files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Don't rewrite API calls
  RewriteCond %{REQUEST_URI} !^/api/
  
  # Rewrite everything else to index.html for React Router
  RewriteRule ^(.*)$ /index.html [L]
</IfModule>
```

3. **Save the file**

---

### Step 3: Set Correct File Permissions

1. **Right-click on `.htaccess`** → **Change Permissions**
2. **Set to:** `644`
   - Owner: Read + Write
   - Group: Read
   - Public: Read
3. **Click Save**

---

### Step 4: Verify File Name

**Critical:** The file must be named exactly `.htaccess`
- ✅ Correct: `.htaccess`
- ❌ Wrong: `htaccess`
- ❌ Wrong: `htaccess.txt`
- ❌ Wrong: `.htaccess.txt`

If the file has wrong name:
1. **Rename it** to `.htaccess` (starts with dot, no extension)
2. Make sure "Show Hidden Files" is enabled to see it

---

### Step 5: Test the Fix

1. **Clear browser cache:**
   - Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
   - Clear cached images and files

2. **Visit your website:**
   - Go to: `https://genztools.top`
   - Navigate to: `/browse` or `/categories`
   - **Reload the page** (F5 or Ctrl+R)
   - **Should work now!** ✅

---

## 🆘 Troubleshooting

### Problem: Still Getting 404 After Fix

**Check 1: File Name**
- Make sure file is exactly `.htaccess` (starts with dot)
- Enable "Show Hidden Files" in File Manager settings

**Check 2: File Location**
- File must be in `public_html/` (website root)
- Not in a subfolder

**Check 3: Permissions**
- Set to `644`

**Check 4: Content**
- Copy the exact content from Step 2 above
- No extra spaces or characters

**Check 5: LiteSpeed Compatibility**
If still not working, try this LiteSpeed-specific version:

```apache
# LiteSpeed Compatible Configuration
RewriteEngine On
RewriteBase /

# Skip existing files
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Skip API calls
RewriteCond %{REQUEST_URI} !^/api/

# Rewrite to index.html
RewriteRule . /index.html [L]
```

---

### Problem: "500 Internal Server Error" After Adding .htaccess

**This means:** There's a syntax error in `.htaccess`

**Fix:**
1. **Check the content** - make sure you copied it exactly
2. **Try the minimal version:**

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

3. **If still error:** Contact your hosting provider to enable `mod_rewrite`

---

### Problem: File Upload Shows as "htaccess.txt"

**This happens when:** Uploading via File Manager creates files with extensions

**Fix:**
1. **Upload the file** (it will be `htaccess.txt`)
2. **Rename it** to `.htaccess`:
   - Right-click → Rename
   - Change to: `.htaccess`
   - Click Rename

---

## ✅ Success Checklist

After fixing:
- [ ] `.htaccess` file exists in `public_html/`
- [ ] File is named exactly `.htaccess` (starts with dot)
- [ ] File permissions set to `644`
- [ ] File contains the rewrite rules
- [ ] Homepage loads: `https://genztools.top`
- [ ] Navigate to `/browse` works
- [ ] Reload `/browse` page works (no 404)
- [ ] All routes work on reload

---

## 📝 Alternative: Upload via FTP

If File Manager has issues, use FTP:

1. **Download the `.htaccess` file** from your local `public/.htaccess`
2. **Connect via FTP** (FileZilla, WinSCP, etc.)
3. **Upload to `public_html/`**
4. **Make sure filename is exactly `.htaccess`**

---

## 🎯 Quick Fix Summary

**The Problem:** Server doesn't know about React Router routes  
**The Solution:** `.htaccess` redirects all routes to `index.html`  
**The Result:** React Router handles routing, no more 404 errors!

**Remember:**
- ✅ File must be named `.htaccess` (starts with dot)
- ✅ File must be in `public_html/` (website root)
- ✅ Permissions: `644`
- ✅ Enable "Show Hidden Files" to see it

---

**Need more help?** Check your hosting provider's documentation for LiteSpeed Web Server `.htaccess` support.

