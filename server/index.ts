import "dotenv/config";
import express from "express";
import cors from "cors";
import * as mediaRoutes from "./routes/media";
import * as authRoutes from "./routes/auth";
import * as downloadRoutes from "./routes/downloads";
import * as adminRoutes from "./routes/admin";
import * as creatorRoutes from "./routes/creators.js";
import * as settingsRoutes from "./routes/settings.js";
import * as usersRoutes from "./routes/users.js";
import * as popupAdsRoutes from "./routes/popup-ads.js";
import { handleFileUpload, handleUrlUpload, upload, handleAssetUpload } from "./routes/upload.js";
import { initializeKV } from "./utils/database.js";
import { initializeAutoSync } from "./services/syncService.js";

// Initialize database connection (KV on Vercel, file storage on localhost)
initializeKV()
  .then(() => {
    // Initialize auto-sync after database is ready
    // Auto-sync will help recover data even if Redis isn't configured
    initializeAutoSync();
  })
  .catch((error) => {
    console.error("❌ Failed to initialize KV:", error);
    // Still initialize auto-sync - it will help recover data
    console.log("⚠️  Initializing auto-sync anyway to help with data recovery...");
    initializeAutoSync();
  });

export function createServer() {
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
  app.post("/api/admin/storage/manual-payments/:creatorId/:purchaseId/approve", creatorRoutes.approveManualStoragePayment);
  app.post("/api/admin/storage/manual-payments/:creatorId/:purchaseId/reject", creatorRoutes.rejectManualStoragePayment);

  app.get("/api/settings/payment", settingsRoutes.getPaymentSettings);
  app.put("/api/settings/payment", settingsRoutes.updatePaymentSettings);
  app.get("/api/settings/branding", settingsRoutes.getBrandingSettings);
  app.put("/api/settings/branding", settingsRoutes.updateBrandingSettings);
  app.get("/api/settings/general", settingsRoutes.getGeneralSettings);
  app.put("/api/settings/general", settingsRoutes.updateGeneralSettings);
  app.get("/api/admin/creators", creatorRoutes.getCreatorsAdmin);
  app.patch("/api/admin/creators/:id", creatorRoutes.updateCreatorStatus);

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

  return app;
}
