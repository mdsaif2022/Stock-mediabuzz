import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import * as mediaRoutes from "./routes/media";
import * as authRoutes from "./routes/auth";
import * as downloadRoutes from "./routes/downloads";
import * as adminRoutes from "./routes/admin";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
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

  // Media routes
  app.get("/api/media", mediaRoutes.getMedia);
  app.get("/api/media/trending", mediaRoutes.getTrendingMedia);
  app.get("/api/media/:id", mediaRoutes.getMediaById);
  app.post("/api/media", mediaRoutes.createMedia); // Admin only
  app.put("/api/media/:id", mediaRoutes.updateMedia); // Admin only
  app.delete("/api/media/:id", mediaRoutes.deleteMedia); // Admin only

  // Download routes
  app.post("/api/download/:mediaId", downloadRoutes.initiateDownload);
  app.get("/api/download/history", downloadRoutes.getDownloadHistory);
  app.get("/api/admin/download-stats", downloadRoutes.getDownloadStats); // Admin only

  // Admin routes
  app.get("/api/admin/stats", adminRoutes.getDashboardStats);
  app.get("/api/admin/cloudinary-status", adminRoutes.getCloudinaryStatus);
  app.get("/api/admin/analytics", adminRoutes.getAnalyticsData);
  app.get("/api/admin/users", adminRoutes.getUsersData);
  app.post("/api/admin/users/:userId/ban", adminRoutes.toggleUserBan);
  app.post("/api/admin/users/:userId/promote", adminRoutes.promoteUserToAdmin);

  return app;
}
