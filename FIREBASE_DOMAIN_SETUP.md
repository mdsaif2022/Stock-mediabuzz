# Firebase Unauthorized Domain Fix

## Problem
When clicking "Continue with Google" button, you see the error:
```
Firebase: Error (auth/unauthorized-domain).
```

## Solution
This error occurs because your domain is not authorized in Firebase Console. You need to add your domain to the authorized domains list.

## Steps to Fix

### 1. Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **stock-media-bb8cd**

### 2. Navigate to Authentication Settings
1. Click on **Authentication** in the left sidebar
2. Click on the **Settings** tab (gear icon)
3. Scroll down to **Authorized domains** section

### 3. Add Your Domain
Click **Add domain** and add the following domains:

#### For Development:
- `localhost` (usually already added)
- `127.0.0.1` (if using IP address)

#### For Production:
- Your production domain (e.g., `stock-mediabuzz.vercel.app`)
- Your custom domain (if you have one)

### 4. Common Domains to Add
Based on your setup, you may need to add:
- `localhost` (for local development)
- `127.0.0.1` (for local IP access)
- `stock-mediabuzz.vercel.app` (if deployed on Vercel)
- Your custom domain (if applicable)

### 5. Save Changes
After adding the domain, click **Save** or the changes will auto-save.

### 6. Test
Try clicking "Continue with Google" again. It should work now!

## Important Notes
- Changes may take a few seconds to propagate
- You don't need to include the port number (e.g., use `localhost` not `localhost:8080`)
- Firebase automatically includes some domains like `localhost` and `firebaseapp.com`
- For production, make sure to add your actual domain

## Current Domain Detection
The application will automatically detect your current domain and show it in the error message if this issue occurs, making it easier to know which domain to add.

