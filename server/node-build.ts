import path from "path";
import fs from "fs";
import { createServer } from "./index";
import * as express from "express";

const app = createServer();
const port = process.env.PORT || 3000;

// In production, serve the built SPA files
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");
const spaExists = fs.existsSync(distPath);

if (spaExists) {
  app.use(express.static(distPath));

  // Handle React Router - serve index.html for all non-API routes
  app.get(/^(?!\/api\/|\/health).*/, (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  // Optional: simple root handler so Render health checks have a response
  app.get("/", (_req, res) => {
    res.json({ status: "ok", message: "API server running (no SPA assets deployed)" });
  });
}

app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
