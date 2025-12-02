# ⚡ Quick Fix: 404 Error on Page Reload

## 🎯 The Problem

When you reload any page on `genztools.top`, you get 404 error. This is because the `.htaccess` file is missing or not working.

## ✅ Quick Fix (5 Minutes)

### Step 1: Go to cPanel File Manager

1. Log into cPanel
2. Open **File Manager**
3. Go to `public_html/` folder

### Step 2: Enable Show Hidden Files

1. Click **Settings** (top right)
2. Check **"Show Hidden Files (dotfiles)"**
3. Click **Save**

### Step 3: Create/Edit .htaccess File

**Option A: If file doesn't exist**
1. Click **+ File** button
2. Name: `.htaccess` (must start with dot!)
3. Click **Create**
4. Double-click to edit

**Option B: If file exists**
1. Find `.htaccess` file
2. Right-click → **Edit**

### Step 4: Paste This Content

Copy and paste exactly this:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Don't rewrite existing files
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Don't rewrite API calls
  RewriteCond %{REQUEST_URI} !^/api/
  
  # Rewrite to index.html
  RewriteRule ^(.*)$ /index.html [L]
</IfModule>
```

### Step 5: Save and Set Permissions

1. **Save** the file (Ctrl+S or Save button)
2. **Right-click** on `.htaccess` → **Change Permissions**
3. Set to: **644**
4. Click **Save**

### Step 6: Test

1. Go to: `https://genztools.top`
2. Navigate to: `/browse`
3. **Reload** the page (F5)
4. Should work! ✅

---

## ❌ Common Mistakes

- ❌ File named `htaccess` (missing dot) → Should be `.htaccess`
- ❌ File named `htaccess.txt` → Remove `.txt` extension
- ❌ File in wrong location → Must be in `public_html/`
- ❌ Hidden files not shown → Enable in File Manager settings

---

## 🆘 Still Not Working?

1. **Check filename:** Must be exactly `.htaccess` (starts with dot)
2. **Check location:** Must be in `public_html/` folder
3. **Try minimal version:**

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

---

**For detailed troubleshooting, see `FIX_404_ERROR.md`**

