import "dotenv/config";
import express from "express";
import cors from "cors";
import * as mediaRoutes from "./routes/media.js";
import * as authRoutes from "./routes/auth.js";
import * as downloadRoutes from "./routes/downloads.js";
import * as adminRoutes from "./routes/admin.js";
import * as creatorRoutes from "./routes/creators.js";
import * as settingsRoutes from "./routes/settings.js";
import * as usersRoutes from "./routes/users.js";
import * as popupAdsRoutes from "./routes/popup-ads.js";
import * as referralRoutes from "./routes/referral.js";
import { handleFileUpload, handleUrlUpload, upload, handleAssetUpload } from "./routes/upload.js";
import { recoverCreatorAccounts } from "./routes/creators-recovery.js";
import { migrateStorageTo1GB } from "./routes/creators-migration.js";
import { initializeKV } from "./utils/database.js";
import { initializeAutoSync } from "./services/syncService.js";

// Log all environment variables at startup (for debugging Render issues)
if (process.env.RENDER || process.env.VERCEL) {
  console.log("🔍 === ENVIRONMENT VARIABLES DIAGNOSTICS ===");
  console.log(`   Platform: ${process.env.RENDER ? "Render" : "Vercel"}`);
  console.log(`   Service URL: ${process.env.RENDER_SERVICE_URL || "Not set"}`);
  console.log(`   Service ID: ${process.env.RENDER_SERVICE_ID || "Not set"}`);
  
  // Check for Redis variables
  const redisVars = {
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ? "✅ SET" : "❌ NOT SET",
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ? "✅ SET" : "❌ NOT SET",
  };
  console.log("   Redis Variables:");
  console.log(`      UPSTASH_REDIS_REST_URL: ${redisVars.UPSTASH_REDIS_REST_URL}`);
  if (process.env.UPSTASH_REDIS_REST_URL) {
    console.log(`         Value preview: ${process.env.UPSTASH_REDIS_REST_URL.substring(0, 40)}...`);
    console.log(`         Length: ${process.env.UPSTASH_REDIS_REST_URL.length}`);
    console.log(`         Has quotes: ${process.env.UPSTASH_REDIS_REST_URL.startsWith('"') || process.env.UPSTASH_REDIS_REST_URL.endsWith('"')}`);
  }
  console.log(`      UPSTASH_REDIS_REST_TOKEN: ${redisVars.UPSTASH_REDIS_REST_TOKEN}`);
  if (process.env.UPSTASH_REDIS_REST_TOKEN) {
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    console.log(`         Value preview: ${token.substring(0, 15)}...`);
    console.log(`         Length: ${token.length} ${token.length !== 80 ? "⚠️ (Expected ~80 characters)" : "✅"}`);
    console.log(`         Has quotes: ${token.startsWith('"') || token.endsWith('"')}`);
    console.log(`         First 10 chars: ${token.substring(0, 10)}`);
    console.log(`         Last 10 chars: ${token.substring(token.length - 10)}`);
    if (token.length < 70) {
      console.error(`         ⚠️  WARNING: Token seems too short! Upstash tokens are usually ~80 characters.`);
      console.error(`         ⚠️  Check if token was truncated when copying.`);
    }
  }
  
  // List ALL environment variables (for debugging)
  const allEnvKeys = Object.keys(process.env).sort();
  const redisRelatedKeys = allEnvKeys.filter(key => 
    key.includes('UPSTASH') || key.includes('REDIS') || key.includes('KV')
  );
  console.log(`   All Redis-related env vars found: ${redisRelatedKeys.length}`);
  redisRelatedKeys.forEach(key => {
    const value = process.env[key];
    console.log(`      ${key}: ${value ? `SET (length: ${value.length})` : "NOT SET"}`);
  });
  
  // Check for MongoDB variables
  const mongoVars = {
    MONGODB_URI: process.env.MONGODB_URI ? "✅ SET" : "❌ NOT SET",
    MONGODB_USERNAME: process.env.MONGODB_USERNAME ? "✅ SET" : "❌ NOT SET",
    MONGODB_PASSWORD: process.env.MONGODB_PASSWORD ? "✅ SET" : "❌ NOT SET",
    MONGODB_CLUSTER: process.env.MONGODB_CLUSTER ? "✅ SET" : "❌ NOT SET",
    MONGODB_DATABASE: process.env.MONGODB_DATABASE ? "✅ SET" : "❌ NOT SET",
  };
  console.log("   MongoDB Variables:");
  console.log(`      MONGODB_URI: ${mongoVars.MONGODB_URI}`);
  if (process.env.MONGODB_URI) {
    const uri = process.env.MONGODB_URI;
    // Mask password in URI for security
    const maskedUri = uri.replace(/mongodb\+srv:\/\/[^:]+:[^@]+@/, 'mongodb+srv://***:***@');
    console.log(`         Value preview: ${maskedUri.substring(0, 60)}...`);
  }
  console.log(`      MONGODB_USERNAME: ${mongoVars.MONGODB_USERNAME}`);
  console.log(`      MONGODB_PASSWORD: ${mongoVars.MONGODB_PASSWORD}`);
  console.log(`      MONGODB_CLUSTER: ${mongoVars.MONGODB_CLUSTER}`);
  console.log(`      MONGODB_DATABASE: ${mongoVars.MONGODB_DATABASE}`);
  
  console.log("🔍 === END DIAGNOSTICS ===");
}

// Initialize MongoDB first (highest priority)
import { initializeMongoDB } from "./utils/mongodb.js";
import { createIndexes } from "./models/mongodb.js";

// Check if we're in a build context (not runtime)
// During build, Vite will import this file but we shouldn't initialize databases
// Only skip initialization during actual build commands, not during dev server startup
const isBuildTime = process.env.VITE_BUILD === 'true' ||
                    process.argv.some(arg => 
                      arg.includes('build') && 
                      !arg.includes('dev') && 
                      !arg.includes('serve')
                    ) ||
                    (process.env.NODE_ENV === 'production' && 
                     process.argv.some(arg => arg.includes('vite') && arg.includes('build')));

// Initialize MongoDB with proper error handling
// Only run during actual server startup, not during build
if (!isBuildTime) {
  (async () => {
    try {
      console.log("🚀 Starting database initialization...");
      const db = await initializeMongoDB();
      
      if (db) {
        console.log("✅ MongoDB initialized as primary database");
        // Create indexes for better performance
        try {
          await createIndexes();
        } catch (indexError) {
          console.error("⚠️  Error creating indexes (non-critical):", indexError);
        }
        // Initialize auto-sync after MongoDB is ready
        initializeAutoSync();
      } else {
        console.log("⚠️  MongoDB not available, falling back to Redis/KV");
        console.log("   Check logs above for MongoDB connection error details");
        // Fallback to Redis/KV
        try {
          await initializeKV();
          initializeAutoSync();
        } catch (error) {
          console.error("❌ Failed to initialize KV:", error);
          console.log("⚠️  Initializing auto-sync anyway...");
          initializeAutoSync();
        }
      }
    } catch (error: any) {
      console.error("❌ Failed to initialize MongoDB:");
      console.error("   Error:", error?.message || error);
      if (error?.stack) {
        console.error("   Stack:", error.stack);
      }
      console.log("⚠️  Falling back to Redis/KV...");
      // Fallback to Redis/KV
      try {
        await initializeKV();
        initializeAutoSync();
      } catch (kvError) {
        console.error("❌ Failed to initialize KV:", kvError);
        console.log("⚠️  Initializing auto-sync anyway...");
        initializeAutoSync();
      }
    }
  })();
} else {
  console.log("🔧 Build detected - skipping database initialization");
  console.log("   Note: Server will still be created, but databases won't initialize");
}

export function createServer() {
  console.log("📦 Creating Express server...");
  const app = express();

  // Middleware
  const allowedOrigins =
    process.env.ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean) || [
      "http://localhost:8088",
      "http://localhost:5173",
      "https://stock-mediabuzz.vercel.app",
    ];
  const localOriginPatterns = [
    /^http:\/\/localhost(?::\d+)?$/i,
    /^http:\/\/127\.0\.0\.1(?::\d+)?$/i,
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(?::\d+)?$/i,
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        const isExplicitlyAllowed = allowedOrigins.includes(origin);
        const matchesLocalPattern = localOriginPatterns.some((pattern) => pattern.test(origin));

        if (isExplicitlyAllowed || matchesLocalPattern) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mock auth middleware (in production, use JWT verification)
  app.use((req, _res, next) => {
    // Check for user info in X-User-Info header (from Firebase Auth)
    const userInfoHeader = req.headers["x-user-info"];
    if (userInfoHeader && typeof userInfoHeader === "string") {
      try {
        const decoded = JSON.parse(Buffer.from(userInfoHeader, "base64").toString());
        (req as any).user = decoded;
        next();
        return;
      } catch {
        // Invalid user info, continue to check Authorization header
      }
    }
    
    // Fallback: Check Authorization header (legacy format)
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      try {
        const decoded = JSON.parse(Buffer.from(token, "base64").toString());
        (req as any).user = decoded;
      } catch {
        // Invalid token, continue without user
      }
    }
    next();
  });

  // Health check endpoint
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Debug endpoint to check environment variables (for troubleshooting)
  app.get("/api/debug/env", (_req, res) => {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    // Get all Redis-related env vars for debugging
    const allEnvVars = Object.keys(process.env)
      .filter(key => key.includes('UPSTASH') || key.includes('REDIS') || key.includes('KV'))
      .reduce((acc, key) => {
        const value = process.env[key];
        acc[key] = {
          exists: !!value,
          length: value?.length || 0,
          preview: value ? `${value.substring(0, 30)}...` : "Not set",
          hasQuotes: value ? (value.startsWith('"') || value.endsWith('"')) : false,
          hasSpaces: value ? (value.trim() !== value) : false,
          firstChar: value ? value[0] : null,
          lastChar: value ? value[value.length - 1] : null,
        };
        return acc;
      }, {} as Record<string, any>);
    
    const issues: string[] = [];
    if (!upstashUrl) issues.push("❌ UPSTASH_REDIS_REST_URL is NOT set in environment");
    if (!upstashToken) issues.push("❌ UPSTASH_REDIS_REST_TOKEN is NOT set in environment");
    if (upstashUrl?.startsWith('"')) issues.push("⚠️ URL has quotes at start - remove quotes!");
    if (upstashUrl?.endsWith('"')) issues.push("⚠️ URL has quotes at end - remove quotes!");
    if (upstashToken?.startsWith('"')) issues.push("⚠️ Token has quotes at start - remove quotes!");
    if (upstashToken?.endsWith('"')) issues.push("⚠️ Token has quotes at end - remove quotes!");
    if (upstashUrl && upstashUrl.trim() !== upstashUrl) issues.push("⚠️ URL has leading/trailing spaces - remove spaces!");
    if (upstashToken && upstashToken.trim() !== upstashToken) issues.push("⚠️ Token has leading/trailing spaces - remove spaces!");
    
    res.json({
      summary: {
        hasUrl: !!upstashUrl,
        hasToken: !!upstashToken,
        bothSet: !!(upstashUrl && upstashToken),
        isRender: !!process.env.RENDER,
        isVercel: !!(process.env.VERCEL || process.env.VERCEL_ENV),
      },
      upstashUrl: {
        exists: !!upstashUrl,
        length: upstashUrl?.length || 0,
        preview: upstashUrl ? `${upstashUrl.substring(0, 40)}...` : "Not set",
        hasQuotes: upstashUrl ? (upstashUrl.startsWith('"') || upstashUrl.endsWith('"')) : false,
        hasSpaces: upstashUrl ? (upstashUrl.trim() !== upstashUrl) : false,
        firstChar: upstashUrl ? upstashUrl[0] : null,
        lastChar: upstashUrl ? upstashUrl[upstashUrl.length - 1] : null,
      },
      upstashToken: {
        exists: !!upstashToken,
        length: upstashToken?.length || 0,
        preview: upstashToken ? `${upstashToken.substring(0, 15)}...` : "Not set",
        hasQuotes: upstashToken ? (upstashToken.startsWith('"') || upstashToken.endsWith('"')) : false,
        hasSpaces: upstashToken ? (upstashToken.trim() !== upstashToken) : false,
        firstChar: upstashToken ? upstashToken[0] : null,
        lastChar: upstashToken ? upstashToken[upstashToken.length - 1] : null,
      },
      allRedisEnvVars: allEnvVars,
      issues: issues.length > 0 ? issues : ["✅ No issues detected - variables look correct"],
      nextSteps: !upstashUrl || !upstashToken ? [
        "1. Go to Render Dashboard → Your Service → Environment tab",
        "2. Add UPSTASH_REDIS_REST_URL (NO quotes, NO spaces)",
        "3. Add UPSTASH_REDIS_REST_TOKEN (NO quotes, NO spaces)",
        "4. Click 'Save Changes' (this triggers auto-redeploy)",
        "5. Wait 2-5 minutes for redeploy",
        "6. Check this endpoint again to verify",
      ] : issues.length > 0 ? [
        "1. Remove quotes/spaces from environment variables in Render",
        "2. Click 'Save Changes' to trigger redeploy",
        "3. Wait 2-5 minutes and check again",
      ] : [
        "✅ Variables are set correctly!",
        "If Redis still not connecting, check Render logs for connection errors",
      ],
    });
  });

  // Auth routes
  app.post("/api/auth/signup", authRoutes.signup);
  app.post("/api/auth/login", authRoutes.login);
  app.get("/api/auth/user", authRoutes.getCurrentUser);
  app.post("/api/auth/logout", authRoutes.logout);
  app.post("/api/auth/reset-password", authRoutes.resetPasswordRequest);

  // User profile sync routes
  app.post("/api/users/register", usersRoutes.registerUser);

  // Media routes (specific routes before dynamic :id route)
  app.get("/api/media", mediaRoutes.getMedia);
  app.get("/api/media/trending", mediaRoutes.getTrendingMedia);
  app.get("/api/media/categories/summary", mediaRoutes.getCategorySummary);
  app.get("/api/media/database/status", mediaRoutes.getDatabaseStatus); // Diagnostic endpoint
  app.get("/api/media/health", mediaRoutes.healthCheck); // Health check - verify data persistence
  app.get("/api/media/test-cloudinary", mediaRoutes.testCloudinary); // Test Cloudinary connection
  app.post("/api/media/sync-cloudinary", mediaRoutes.syncFromCloudinary); // Sync from Cloudinary
  app.get("/api/media/sync-cloudinary", mediaRoutes.syncFromCloudinary); // Sync from Cloudinary (GET for easy testing)
  
  // Sync status endpoint
  app.get("/api/media/sync/status", async (_req, res) => {
    try {
      const { getSyncStatus } = await import("./services/syncService.js");
      res.json(getSyncStatus());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/media/clean-descriptions", mediaRoutes.cleanMediaDescriptions); // Clean up descriptions
  app.get("/api/media/clean-descriptions", mediaRoutes.cleanMediaDescriptions); // Clean up descriptions (GET for easy testing)
  app.get("/api/media/preview/:mediaId", downloadRoutes.proxyVideoPreview); // Video preview proxy (before :id route)
  app.get("/api/media/:id", mediaRoutes.getMediaById);
  app.post("/api/media", mediaRoutes.createMedia); // Admin only
  app.put("/api/media/:id", mediaRoutes.updateMedia); // Admin only
  app.delete("/api/media/:id", mediaRoutes.deleteMedia); // Admin only

  // Download routes
  app.get("/api/download/proxy/:mediaId", downloadRoutes.proxyDownload);
  app.post("/api/download/:mediaId", downloadRoutes.initiateDownload);
  app.get("/api/download/history", downloadRoutes.getDownloadHistory);
  app.get("/api/admin/download-stats", downloadRoutes.getDownloadStats); // Admin only

  // Admin routes
  app.get("/api/admin/stats", adminRoutes.getDashboardStats);
  app.get("/api/admin/cloudinary-status", adminRoutes.getCloudinaryStatus);
  app.get("/api/admin/analytics", adminRoutes.getAnalyticsData);
  app.get("/api/admin/users", usersRoutes.getUsersAdmin);
  app.post("/api/admin/users/:userId/ban", adminRoutes.toggleUserBan);
  app.post("/api/admin/users/:userId/promote", adminRoutes.promoteUserToAdmin);

  // Creator routes
  app.post("/api/creators", creatorRoutes.createOrUpdateCreator);
  app.get("/api/creators/status", creatorRoutes.getCreatorStatus);
  app.post("/api/creators/storage/purchase", creatorRoutes.purchaseCreatorStorage);
  app.post("/api/creators/storage/purchase/manual", creatorRoutes.purchaseCreatorStorageManual);
  app.get("/api/admin/storage/manual-payments", creatorRoutes.getManualStoragePayments);
  app.get("/api/admin/storage/all-purchases", creatorRoutes.getAllStoragePurchases);
  app.delete("/api/admin/storage/purchases/:creatorId/:purchaseId", creatorRoutes.deleteStoragePurchase);
  app.patch("/api/admin/storage/purchases/:creatorId/:purchaseId/extend", creatorRoutes.extendCreatorStorage);
  app.post("/api/admin/storage/manual-payments/:creatorId/:purchaseId/approve", creatorRoutes.approveManualStoragePayment);
  app.post("/api/admin/storage/manual-payments/:creatorId/:purchaseId/reject", creatorRoutes.rejectManualStoragePayment);
  app.patch("/api/admin/creators/:creatorId/freeze", creatorRoutes.freezeCreatorAccount);

  app.get("/api/settings/payment", settingsRoutes.getPaymentSettings);
  app.put("/api/settings/payment", settingsRoutes.updatePaymentSettings);
  app.get("/api/settings/branding", settingsRoutes.getBrandingSettings);
  app.put("/api/settings/branding", settingsRoutes.updateBrandingSettings);
  app.get("/api/settings/general", settingsRoutes.getGeneralSettings);
  app.put("/api/settings/general", settingsRoutes.updateGeneralSettings);
  app.get("/api/settings/app", settingsRoutes.getAppSettings);
  app.put("/api/settings/app", settingsRoutes.updateAppSettings);
  app.get("/api/admin/creators", creatorRoutes.getCreatorsAdmin);
  app.patch("/api/admin/creators/:id", creatorRoutes.updateCreatorStatus);
  
  // Creator recovery endpoint (admin only)
  app.post("/api/admin/creators/recover", recoverCreatorAccounts);
  
  // One-time migration endpoint to update all creators from 5 GB to 1 GB (admin only)
  app.post("/api/admin/creators/migrate-storage", migrateStorageTo1GB);

  // Upload routes
  app.post("/api/upload/file", upload.array("files", 10), handleFileUpload);
  app.post("/api/upload/url", handleUrlUpload);
  app.post("/api/upload/asset", upload.single("file"), handleAssetUpload);

  // Pop-up ads routes
  app.get("/api/popup-ads", popupAdsRoutes.getPopupAds);
  app.get("/api/popup-ads/:id", popupAdsRoutes.getPopupAdById);
  app.post("/api/popup-ads", popupAdsRoutes.createPopupAd);
  app.put("/api/popup-ads/:id", popupAdsRoutes.updatePopupAd);
  app.delete("/api/popup-ads/:id", popupAdsRoutes.deletePopupAd);
  app.post("/api/popup-ads/:id/impression", popupAdsRoutes.trackImpression);
  app.post("/api/popup-ads/:id/click", popupAdsRoutes.trackClick);

  // Referral & Sharing System routes
  // User endpoints
  app.get("/api/referral/info", referralRoutes.getUserReferralInfo);
  app.get("/api/referral/earnings", referralRoutes.getUserEarnings);
  app.get("/api/referral/history", referralRoutes.getReferralHistory);
  app.get("/api/share/posts", referralRoutes.getActiveSharePosts);
  app.post("/api/share/link", referralRoutes.createShareLink);
  app.get("/api/share/history", referralRoutes.getShareHistory);
  app.post("/api/withdraw/request", referralRoutes.createWithdrawRequest);
  app.get("/api/withdraw/history", referralRoutes.getWithdrawHistory);
  app.get("/api/share/track", referralRoutes.trackShareVisitor);
  
  // Admin endpoints
  app.get("/api/admin/share-posts", referralRoutes.getAllSharePosts);
  app.post("/api/admin/share-posts", referralRoutes.createSharePost);
  app.put("/api/admin/share-posts/:id", referralRoutes.updateSharePost);
  app.delete("/api/admin/share-posts/:id", referralRoutes.deleteSharePost);
  app.get("/api/admin/referrals", referralRoutes.getAllReferrals);
  app.put("/api/admin/referrals/:id", referralRoutes.updateReferralStatus);
  app.get("/api/admin/share-records", referralRoutes.getAllShareRecords);
  app.put("/api/admin/share-records/:id", referralRoutes.updateShareRecordStatus);
  app.get("/api/admin/withdraw-requests", referralRoutes.getAllWithdrawRequests);
  app.put("/api/admin/withdraw-requests/:id", referralRoutes.updateWithdrawRequestStatus);
  app.get("/api/admin/share-visitors", referralRoutes.getAllShareVisitors);

  console.log("✅ Express server created with all routes registered");
  return app;
}
