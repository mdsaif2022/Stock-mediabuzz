# 🔧 MongoDB Connection Troubleshooting

If you see "🔄 Attempting to connect to MongoDB..." but no success message, follow these steps:

## ⚠️ Most Common Issue: IP Whitelist

**MongoDB Atlas blocks connections from IPs not in the whitelist.**

### Fix: Add Render IP to MongoDB Atlas

1. **Go to MongoDB Atlas:**
   - Visit: https://cloud.mongodb.com/
   - Login to your account

2. **Navigate to Network Access:**
   - Click on your project
   - Click **"Network Access"** in the left sidebar
   - Or go directly to: https://cloud.mongodb.com/v2#/security/network/whitelist

3. **Add IP Address:**
   - Click **"Add IP Address"** button
   - Select **"Allow Access from Anywhere"** (recommended for Render)
   - OR enter: `0.0.0.0/0` (allows all IPs)
   - Click **"Confirm"**

4. **Wait 1-2 minutes:**
   - Changes take 1-2 minutes to propagate
   - Refresh your Render logs after waiting

5. **Verify:**
   - Check Render logs again
   - Should see: `✅ MongoDB Connected Successfully!`

## 🔍 Other Common Issues

### Issue 1: Connection Timeout

**Symptoms:**
- Logs show "🔄 Attempting to connect to MongoDB..."
- No success or error message
- Connection hangs

**Solutions:**
1. Check MongoDB Atlas Network Access (see above)
2. Verify cluster is running (not paused)
3. Check connection string is correct

### Issue 2: Authentication Failed

**Symptoms:**
- Error: "authentication failed" or "auth failed"

**Solutions:**
1. Verify username and password in connection string
2. Check database user has proper permissions
3. Ensure user is not deleted in MongoDB Atlas

### Issue 3: DNS/Network Error

**Symptoms:**
- Error: "ENOTFOUND" or "DNS error"

**Solutions:**
1. Verify cluster hostname is correct
2. Check network connectivity
3. Try using IP address instead of hostname (not recommended)

## 📋 Connection String Format

Your connection string should be:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?appName=Cluster0
```

**Important:**
- No spaces
- No quotes
- Password may contain special characters (URL encoded if needed)
- `appName` parameter is optional but recommended

## ✅ Verify Connection String

1. **Go to MongoDB Atlas:**
   - Click on your cluster
   - Click **"Connect"**
   - Select **"Connect your application"**
   - Copy the connection string
   - Replace `<password>` with your actual password

2. **Set in Render:**
   - Go to Render Dashboard → Your Service → Environment
   - Set `MONGODB_URI` = your connection string
   - NO quotes, NO spaces
   - Save and redeploy

## 🧪 Test Connection Locally

Test the connection string locally first:

```bash
# Install MongoDB shell (optional)
npm install -g mongosh

# Test connection
mongosh "mongodb+srv://mdh897046_db_user:bpRUzw0GmmJp7iFa@cluster0.cnqz5cm.mongodb.net/?appName=Cluster0"
```

If it works locally but not on Render, it's likely an IP whitelist issue.

## 📊 Expected Logs

**Success:**
```
🔄 Attempting to connect to MongoDB...
   URI: mongodb+srv://***:***@cluster0.cnqz5cm.mongodb.net/?appName=Cluster0
   Connecting to MongoDB Atlas...
   Testing connection with ping...
✅ MongoDB Connected Successfully!
✅ Using MongoDB database: stockmediabuzz
✅ MongoDB connection cached for reuse
✅ MongoDB initialized as primary database
```

**Failure (with diagnostics):**
```
🔄 Attempting to connect to MongoDB...
   URI: mongodb+srv://***:***@cluster0.cnqz5cm.mongodb.net/?appName=Cluster0
   Connecting to MongoDB Atlas...
❌ Failed to connect to MongoDB
   Error: Connection timeout after 10 seconds
   ⚠️  Connection timeout - Check:
      1. MongoDB Atlas Network Access allows your IP (0.0.0.0/0 for all)
      2. MongoDB cluster is running
      3. Connection string is correct
```

## 🔄 After Fixing

1. **Redeploy on Render:**
   - Changes to MongoDB Atlas take effect immediately
   - But you may need to restart your Render service
   - Go to Render Dashboard → Your Service → Manual Deploy → Clear build cache & deploy

2. **Check Logs:**
   - Should see success message within 10 seconds
   - If still failing, check error message for specific issue

## 📞 Still Not Working?

1. **Check MongoDB Atlas Status:**
   - Go to MongoDB Atlas Dashboard
   - Verify cluster is running (not paused)
   - Check for any service alerts

2. **Verify Connection String:**
   - Copy fresh connection string from MongoDB Atlas
   - Update `MONGODB_URI` in Render
   - Remove any quotes or spaces

3. **Check Render Logs:**
   - Look for specific error messages
   - Error messages now include detailed diagnostics

4. **Test with MongoDB Compass:**
   - Download MongoDB Compass
   - Try connecting with your connection string
   - If it works in Compass but not Render, it's an IP whitelist issue

---

**Most likely fix: Add `0.0.0.0/0` to MongoDB Atlas Network Access whitelist!** ✅

