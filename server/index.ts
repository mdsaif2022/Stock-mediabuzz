import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import * as mediaRoutes from "./routes/media";
import * as authRoutes from "./routes/auth";
import * as downloadRoutes from "./routes/downloads";
import * as adminRoutes from "./routes/admin";
import * as creatorRoutes from "./routes/creators.js";
import * as settingsRoutes from "./routes/settings.js";
import * as usersRoutes from "./routes/users.js";
import * as popupAdsRoutes from "./routes/popup-ads.js";
import { handleFileUpload, handleUrlUpload, upload, handleAssetUpload } from "./routes/upload.js";

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

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

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
