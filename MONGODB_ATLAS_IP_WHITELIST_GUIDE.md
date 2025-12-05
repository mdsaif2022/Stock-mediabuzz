# 🔧 MongoDB Atlas IP Whitelist - Step by Step Guide

If you don't see "Network Access", try these alternative paths:

## Method 1: Security Tab

1. **Go to MongoDB Atlas:**
   - Visit: https://cloud.mongodb.com/
   - Login to your account

2. **Click on "Security" in the left sidebar:**
   - Look for a shield icon or "Security" text
   - This is usually near the top of the sidebar

3. **Click "Network Access" or "IP Access List":**
   - Under Security, you should see:
     - Network Access
     - IP Access List
     - Whitelist
     - Access List

## Method 2: Project Settings

1. **Click on your Project Name** (top left)
2. **Look for "Security" or "Network" section**
3. **Click "Network Access" or "IP Access List"**

## Method 3: Direct URL

Try these direct URLs (replace `YOUR_PROJECT_ID` if needed):

- **Network Access:** https://cloud.mongodb.com/v2#/security/network/whitelist
- **IP Access List:** https://cloud.mongodb.com/v2#/security/network/accessList

## Method 4: Cluster Settings

1. **Click on your Cluster** (e.g., "Cluster0")
2. **Look for "Security" or "Network" tab**
3. **Click "Network Access" or "IP Access List"**

## Method 5: Search Bar

1. **Use the search bar** at the top of MongoDB Atlas
2. **Type:** "Network Access" or "IP Access List"
3. **Click the result**

## What to Look For

The feature might be named:
- ✅ **Network Access** (most common)
- ✅ **IP Access List**
- ✅ **Whitelist**
- ✅ **Access List**
- ✅ **Network Whitelist**

## Visual Guide

**Left Sidebar should show:**
```
📊 Overview
🔒 Security
   ├── Database Access
   ├── Network Access  ← THIS ONE!
   └── Encryption
```

**OR in Security section:**
```
Security
├── Database Access
├── Network Access  ← THIS ONE!
└── Encryption
```

## If You Still Can't Find It

### Option A: Check Your MongoDB Plan

1. **Free Tier (M0):**
   - Network Access should be available
   - Look under "Security" → "Network Access"

2. **Paid Plans:**
   - Should definitely have Network Access
   - Check "Security" section

### Option B: Try Database Access First

1. **Click "Database Access"** (under Security)
2. **Then look for "Network Access"** in the same section

### Option C: Contact Support

If you absolutely cannot find it:
1. **Check MongoDB Atlas documentation:**
   - https://docs.atlas.mongodb.com/security/ip-access-list/
2. **Or use MongoDB Support Chat** (bottom right of Atlas dashboard)

## Alternative: Use MongoDB Compass Connection String

If you can't access Network Access settings, you can:

1. **Get connection string from MongoDB Atlas:**
   - Click "Connect" on your cluster
   - Select "Connect your application"
   - Copy the connection string

2. **Test connection locally first:**
   - This will help verify the connection string works

3. **Then add IP whitelist** (you'll need to find it eventually)

## Quick Check: Are You on MongoDB Atlas?

Make sure you're using **MongoDB Atlas** (cloud.mongodb.com), not:
- ❌ MongoDB Compass (desktop app)
- ❌ Local MongoDB installation
- ❌ Other MongoDB services

**Correct URL:** https://cloud.mongodb.com/

## Still Stuck?

1. **Take a screenshot** of your MongoDB Atlas dashboard
2. **Look for any of these icons:**
   - 🔒 Security/Shield icon
   - 🌐 Network/Globe icon
   - ⚙️ Settings icon
3. **Click on them** and look for "Network Access" or "IP Access List"

---

**Most Common Location:** Left Sidebar → Security → Network Access

If you can share what you see in your MongoDB Atlas dashboard, I can help you find the exact location!

