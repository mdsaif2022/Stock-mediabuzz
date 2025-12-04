import { RequestHandler } from "express";
import { Media, MediaResponse, MediaUploadRequest } from "@shared/api";
import { Database } from "../utils/database.js";
import { CloudinaryServer } from "../config/cloudinary.js";

const CATEGORY_KEYS: Media["category"][] = ["video", "image", "audio", "template", "apk"];

const normalizeCategoryValue = (cat?: string): Media["category"] | "" => {
  if (!cat) return "";
  const normalized = cat.toLowerCase().trim();
  if (["video", "videos", "vid", "movie", "movies"].includes(normalized)) return "video";
  if (["image", "images", "photo", "photos", "pic", "pics"].includes(normalized)) return "image";
  if (["audio", "audios", "sound", "music", "song", "songs"].includes(normalized)) return "audio";
  if (["template", "templates", "theme", "themes", "design"].includes(normalized)) return "template";
  if (["apk", "apks", "android", "app", "apps"].includes(normalized)) return "apk";
  return normalized as Media["category"] | "";
};

// Default initial data - empty for production
const DEFAULT_MEDIA: Media[] = [];

const sanitizeFeatureScreenshots = (input: any): Media["featureScreenshots"] => {
  if (!input) return [];
  let parsed = input;
  if (typeof input === "string") {
    try {
      parsed = JSON.parse(input);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => {
      if (!item) return null;
      const url = typeof item.url === "string" ? item.url.trim() : "";
      if (!url) return null;
      const title = typeof item.title === "string" && item.title.trim() ? item.title.trim() : undefined;
      const description =
        typeof item.description === "string" && item.description.trim() ? item.description.trim() : undefined;
      return { title, description, url };
    })
    .filter(Boolean) as Media["featureScreenshots"];
};

const parseShowScreenshots = (value: any): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.toLowerCase().trim();
    if (normalized === "false" || normalized === "0") return false;
    if (normalized === "true" || normalized === "1") return true;
  }
  return true;
};

const normalizeIconUrl = (value: any): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
};

// Create database instance (uses KV on Vercel, file storage on localhost)
const mediaDatabase = new Database<Media>("media-database", DEFAULT_MEDIA);

// Initialize and load data on startup
let mediaData: Media[] = [];
mediaDatabase.load()
  .then((loaded) => {
    mediaData = loaded;
    if (loaded.length > 0) {
      console.log(`✅ Loaded ${loaded.length} media items from database`);
    } else {
      console.log(`📝 Media database is empty (new installation)`);
    }
  })
  .catch((error) => {
    console.error("❌ Failed to load media database:", error);
    // Don't use defaults - start with empty array
    mediaData = [];
  });

// Helper functions to get and save media
async function getMediaDatabase(): Promise<Media[]> {
  return await mediaDatabase.load();
}

async function saveMediaDatabase(data: Media[]): Promise<void> {
  await mediaDatabase.save(data);
  mediaData = data;
}

// Export for use in upload handler and other modules
export { mediaData as mediaDatabase, saveMediaDatabase, getMediaDatabase };

// Get all media with pagination and filtering
export const getMedia: RequestHandler = async (req, res) => {
  const { page = 1, pageSize = 20, category, search, sort = "latest" } = req.query as {
    page?: string | number;
    pageSize?: string | number;
    category?: string;
    search?: string;
    sort?: "latest" | "popular" | "views";
  };

  const mediaDatabase = await getMediaDatabase();
  let filtered = [...mediaDatabase];

  if (category) {
    const normalizedCategory = normalizeCategoryValue(category as string);
    filtered = normalizedCategory
      ? filtered.filter((m) => normalizeCategoryValue(m.category) === normalizedCategory)
      : filtered;
  }

  if (search) {
    const searchLower = (search as string).toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.title.toLowerCase().includes(searchLower) ||
        m.description.toLowerCase().includes(searchLower) ||
        m.tags.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  }

  const sortKey = typeof sort === "string" ? sort.toLowerCase() : "latest";
  filtered.sort((a, b) => {
    if (sortKey === "popular") {
      return (b.downloads || 0) - (a.downloads || 0);
    }
    if (sortKey === "views") {
      return (b.views || 0) - (a.views || 0);
    }
    const dateA = new Date(a.uploadedDate || 0).getTime();
    const dateB = new Date(b.uploadedDate || 0).getTime();
    return dateB - dateA;
  });

  const pageNum = parseInt(page as string) || 1;
  const pageSizeNum = parseInt(pageSize as string) || 20;
  const start = (pageNum - 1) * pageSizeNum;
  const end = start + pageSizeNum;

  const paginatedData = filtered.slice(start, end);

  const response: MediaResponse = {
    data: paginatedData,
    total: filtered.length,
    page: pageNum,
    pageSize: pageSizeNum,
  };

  res.json(response);
};

// Get single media by ID
export const getMediaById: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const mediaDatabase = await getMediaDatabase();
  const media = mediaDatabase.find((m) => m.id === id);

  if (!media) {
    res.status(404).json({ error: "Media not found" });
    return;
  }

  res.json(media);
};

// Create new media (admin only)
export const createMedia: RequestHandler = async (req, res) => {
  const { title, description, category, type, tags, isPremium, previewUrl, fileUrl }: MediaUploadRequest = req.body;

  if (!title || !category || !fileUrl) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const normalizedCategory = normalizeCategoryValue(category) || (category as string).toLowerCase();
  const iconUrl = normalizeIconUrl((req.body as any).iconUrl);
  const featureScreenshots = sanitizeFeatureScreenshots((req.body as any).featureScreenshots);
  const showScreenshots = parseShowScreenshots((req.body as any).showScreenshots);

  const newMedia: Media = {
    id: Date.now().toString(),
    title,
    description,
    category: (normalizedCategory as Media["category"]) || "video",
    type,
    fileSize: "1 MB",
    previewUrl,
    fileUrl,
    tags,
    downloads: 0,
    views: 0,
    isPremium,
    uploadedBy: req.user?.name || "Admin",
    uploadedDate: new Date().toISOString().split("T")[0],
    cloudinaryAccount: 1,
    iconUrl,
    featureScreenshots,
    showScreenshots,
  };

  const mediaDatabase = await getMediaDatabase();
  mediaDatabase.push(newMedia);

  try {
    await saveMediaDatabase(mediaDatabase);
    res.status(201).json(newMedia);
  } catch (error) {
    console.error("Failed to save media:", error);
    res.status(500).json({ error: "Failed to save media" });
  }
};

// Update media (admin only)
export const updateMedia: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const mediaDatabase = await getMediaDatabase();
  const media = mediaDatabase.find((m) => m.id === id);

  if (!media) {
    res.status(404).json({ error: "Media not found" });
    return;
  }

  const bodyCopy = { ...req.body };
  delete bodyCopy.featureScreenshots;
  delete bodyCopy.iconUrl;
  delete bodyCopy.showScreenshots;

  const updates: Partial<Media> = {};
  if ("iconUrl" in req.body) {
    updates.iconUrl = normalizeIconUrl(req.body.iconUrl);
  }
  if ("featureScreenshots" in req.body) {
    updates.featureScreenshots = sanitizeFeatureScreenshots(req.body.featureScreenshots);
  }
  if ("showScreenshots" in req.body) {
    updates.showScreenshots = parseShowScreenshots(req.body.showScreenshots);
  }

  Object.assign(media, bodyCopy, updates);

  try {
    await saveMediaDatabase(mediaDatabase);
    res.json(media);
  } catch (error) {
    console.error("Failed to save media:", error);
    res.status(500).json({ error: "Failed to save media" });
  }
};

// Delete media - DISABLED: Media deletion is not allowed to ensure all uploaded content remains forever
export const deleteMedia: RequestHandler = async (req, res) => {
  res.status(403).json({ 
    error: "Media deletion is not allowed",
    message: "All uploaded content must remain permanently. Media cannot be deleted by creators or admins."
  });
};

// Get trending media
export const getTrendingMedia: RequestHandler = async (req, res) => {
  const mediaDatabase = await getMediaDatabase();
  const trending = [...mediaDatabase]
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 10);

  res.json(trending);
};

export const getCategorySummary: RequestHandler = async (_req, res) => {
  const mediaDatabase = await getMediaDatabase();
  const summary = CATEGORY_KEYS.map((category) => {
    const items = mediaDatabase.filter((item) => normalizeCategoryValue(item.category) === category);
    const latest =
      items.length > 0
        ? [...items].sort(
            (a, b) => new Date(b.uploadedDate || 0).getTime() - new Date(a.uploadedDate || 0).getTime()
          )[0]
        : undefined;
    return {
      category,
      count: items.length,
      latestTitle: latest?.title || null,
      previewUrl: latest?.previewUrl || null,
      sampleId: latest?.id || null,
    };
  });

  res.json(summary);
};

// Test Cloudinary connection
export const testCloudinary: RequestHandler = async (_req, res) => {
  try {
    const cloudinaryModule = await import("../config/cloudinary.js");
    const { listCloudinaryResources, getCloudinaryConfig } = cloudinaryModule;
    
    const results: any = {
      success: true,
      servers: {},
    };
    
    const servers: Array<{ server: "server1" | "server2" | "server3"; account: number }> = [
      { server: "server1", account: 1 },
      { server: "server2", account: 2 },
      { server: "server3", account: 3 },
    ];
    
    for (const { server, account } of servers) {
      try {
        const config = getCloudinaryConfig(server);
        console.log(`Testing ${server}...`);
        
        // Try to list first 1 resource as a test
        const testResult = await listCloudinaryResources(server, {
          resource_type: "image",
          max_results: 1,
        });
        
        results.servers[server] = {
          connected: true,
          cloud_name: config.cloud_name,
          hasResources: testResult.resources.length > 0,
          resourceCount: testResult.resources.length,
        };
      } catch (error: any) {
        results.servers[server] = {
          connected: false,
          error: error.message,
        };
      }
    }
    
    res.json(results);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Diagnostic endpoint to check database status (admin only)
export const getDatabaseStatus: RequestHandler = async (_req, res) => {
  try {
    const mediaDatabase = await getMediaDatabase();
    const isVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV);
    const isRender = !!process.env.RENDER;
    
    // Check environment variables (for debugging)
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    const hasUpstashEnv = !!(upstashUrl && upstashToken);
    const hasVercelKV = !!(process.env.KV_URL || process.env.STORAGE_URL);
    const hasVercelKVFull = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
    
    // Check for Redis initialization errors
    let redisError = null;
    
    // Test Redis/KV connection
    let storageTest = "unknown";
    let hasKV = false;
    
    if (hasUpstashEnv || hasVercelKV || hasVercelKVFull) {
      try {
        const { Database } = await import("../utils/database.js");
        const testDb = new Database("__health_check__", []);
        await testDb.save([{ test: true }]);
        await testDb.load();
        await testDb.save([]); // Clean up
        storageTest = "✅ Connected and working";
        hasKV = true;
      } catch (error: any) {
        storageTest = `❌ Connection failed: ${error.message}`;
        hasKV = false;
      }
    }
    
    // Get sync status
    let syncStatus = null;
    try {
      const { getSyncStatus } = await import("../services/syncService.js");
      syncStatus = getSyncStatus();
    } catch (error) {
      // Sync service not available, ignore
    }
    
    res.json({
      status: "ok",
      storage: {
        type: hasKV 
          ? (hasUpstashEnv ? "Upstash Redis" : "Vercel KV")
          : isVercel || isRender
            ? "⚠️ None (Redis/KV not configured)" 
            : "File Storage",
        isVercel,
        isRender,
        hasKV,
        hasUpstashRedis: hasUpstashEnv,
        hasVercelKV: hasVercelKV || hasVercelKVFull,
        // Debug info (shows if env vars are detected, but masked for security)
        envVars: {
          upstashUrlSet: !!upstashUrl,
          upstashTokenSet: !!upstashToken,
          upstashUrlPreview: upstashUrl ? `${upstashUrl.substring(0, 30)}...` : "Not set",
          vercelKVSet: hasVercelKV,
          vercelKVFullSet: hasVercelKVFull,
        },
        kvUrl: hasKV ? "✅ Set" : "❌ Not set",
        connectionTest: storageTest,
        redisError: redisError || null,
        persistenceWarning: !hasKV && (isVercel || isRender) 
          ? "⚠️ Data will NOT persist! Configure Redis/KV to prevent data loss."
          : hasKV 
            ? "✅ Data will persist permanently"
            : "📁 Using file storage (localhost only)",
      },
      media: {
        count: mediaDatabase.length,
        items: mediaDatabase.slice(0, 5).map(m => ({ id: m.id, title: m.title })),
      },
      sync: syncStatus || {
        note: "Auto-sync service not initialized",
      },
      message: hasKV 
        ? "✅ Database configured correctly" 
        : isVercel || isRender
          ? "⚠️ KV not configured - data will not persist!" 
          : "📁 Using file storage (localhost)",
      troubleshooting: !hasKV && (isVercel || isRender) ? {
        step1: "Check Render Dashboard → Environment tab",
        step2: "Verify variables: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN",
        step3: "Ensure values have NO quotes and NO trailing spaces",
        step4: "Redeploy service after adding variables",
        step5: "Check server logs for connection errors",
        guide: "See REDIS_TROUBLESHOOTING.md for detailed help",
      } : null,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      error: error.message,
    });
  }
};

// Internal sync function (can be called from RequestHandler or background service)
export async function performCloudinarySync(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  stats?: any;
  storage?: any;
}> {
  try {
    console.log("🔄 Starting Cloudinary sync...");
    
    // Import Cloudinary functions
    let listAllCloudinaryResources: any;
    try {
      const cloudinaryModule = await import("../config/cloudinary.js");
      listAllCloudinaryResources = cloudinaryModule.listAllCloudinaryResources;
      
      if (!listAllCloudinaryResources) {
        throw new Error("listAllCloudinaryResources function not found");
      }
      console.log("✅ Cloudinary module loaded successfully");
    } catch (importError: any) {
      console.error("❌ Failed to import Cloudinary functions:", importError);
      console.error("Stack:", importError.stack);
      return {
        success: false,
        error: "Failed to load Cloudinary module",
        message: importError.message,
      };
    }
    
    // List all resources from all Cloudinary accounts
    let allResources: Array<{ resource: any; server: CloudinaryServer; account: number }> = [];
    try {
      console.log("📡 Fetching resources from Cloudinary...");
      console.log("   This may take a while if you have many files...");
      
      allResources = await listAllCloudinaryResources();
      
      console.log(`📦 Found ${allResources.length} total files in Cloudinary`);
      
      if (allResources.length === 0) {
        console.log("⚠️  WARNING: No resources found. Check:");
        console.log("   1. Cloudinary credentials are correct");
        console.log("   2. Files exist in your Cloudinary accounts");
        console.log("   3. Files are in the 'upload' type (not derived)");
      }
    } catch (cloudinaryError: any) {
      console.error("❌ Error fetching from Cloudinary:", cloudinaryError);
      console.error("Error details:", {
        message: cloudinaryError.message,
        http_code: cloudinaryError.http_code,
        name: cloudinaryError.name,
      });
      
      // Provide helpful error messages
      let errorDetails = "Check Cloudinary credentials in server/config/cloudinary.ts";
      if (cloudinaryError.http_code === 401) {
        errorDetails = "Cloudinary authentication failed - check API key and secret";
      } else if (cloudinaryError.http_code === 404) {
        errorDetails = "Cloudinary account not found - check cloud name";
      }
      
      return {
        success: false,
        error: "Failed to fetch resources from Cloudinary",
        message: cloudinaryError.message,
      };
    }
    
    if (allResources.length === 0) {
      console.log("⚠️  No resources found in Cloudinary");
      return {
        success: true,
        message: "No files found in Cloudinary to sync",
        stats: {
          totalInCloudinary: 0,
          existingInDatabase: 0,
          newItemsAdded: 0,
          skipped: 0,
          totalInDatabase: 0,
        },
      };
    }
    
    // Get existing database
    console.log("📚 Loading existing database...");
    let existingDatabase: Media[] = [];
    try {
      existingDatabase = await getMediaDatabase();
      console.log(`📚 Found ${existingDatabase.length} existing items in database`);
    } catch (dbError: any) {
      console.error("⚠️  Error loading database (continuing anyway):", dbError);
      existingDatabase = [];
    }
    
    const existingUrls = new Set(existingDatabase.map(m => m.fileUrl));
    
    // Create media entries for each Cloudinary resource
    const newMediaItems: Media[] = [];
    let skipped = 0;
    let created = 0;
    
    console.log("🔄 Processing resources...");
    for (const { resource, server, account } of allResources) {
      // Skip if already in database
      if (existingUrls.has(resource.secure_url)) {
        skipped++;
        continue;
      }
      
      // Determine category from resource type
      let category: Media["category"] = "video";
      if (resource.resource_type === "image") {
        category = "image";
      } else if (resource.resource_type === "video") {
        category = "video";
      } else if (resource.resource_type === "raw") {
        // Check if it's an APK
        const filename = resource.filename || resource.public_id || "";
        const isApk = filename.toLowerCase().endsWith(".apk") || filename.toLowerCase().endsWith(".xapk");
        category = isApk ? "apk" : "audio";
      }
      
      // Determine type
      let type = resource.format?.toUpperCase() || resource.resource_type.toUpperCase();
      if (category === "apk") {
        type = "Android APK";
      }
      
      // Calculate file size
      const bytes = resource.bytes || 0;
      const fileSizeMB = (bytes / (1024 * 1024)).toFixed(2);
      const fileSize = parseFloat(fileSizeMB) > 1024 
        ? `${(parseFloat(fileSizeMB) / 1024).toFixed(2)} GB` 
        : `${fileSizeMB} MB`;
      
      // Get duration for videos
      const duration = resource.duration 
        ? `${Math.floor(resource.duration / 60)}:${String(Math.floor(resource.duration % 60)).padStart(2, '0')}`
        : undefined;
      
      // Create media entry
      // Use resource.public_id + account to ensure unique IDs
      const uniqueId = `${account}_${resource.public_id}_${resource.created_at || Date.now()}`;
      const mediaItem: Media = {
        id: uniqueId.replace(/[^a-zA-Z0-9_-]/g, '_'), // Sanitize ID
        title: resource.filename || resource.public_id?.split('/').pop() || `Media from ${server}`,
        description: "", // Empty description - users can add their own
        category,
        type,
        fileSize,
        duration,
        previewUrl: resource.secure_url,
        fileUrl: resource.secure_url,
        tags: [],
        downloads: 0,
        views: 0,
        isPremium: false,
        uploadedBy: "System Sync",
        uploadedByEmail: undefined,
        uploadedDate: resource.created_at 
          ? new Date(resource.created_at).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        cloudinaryAccount: account,
      };
      
      newMediaItems.push(mediaItem);
      created++;
    }
    
    console.log(`✅ Processed ${allResources.length} resources: ${created} new, ${skipped} skipped`);
    
    // Merge with existing database (avoid duplicates by URL)
    const mergedDatabase = [...existingDatabase];
    
    for (const newItem of newMediaItems) {
      // Check if URL already exists
      if (!existingUrls.has(newItem.fileUrl)) {
        mergedDatabase.push(newItem);
        existingUrls.add(newItem.fileUrl); // Update set to prevent duplicates in same batch
      }
    }
    
    console.log(`💾 Saving ${mergedDatabase.length} items to database...`);
    
    // Save to database
    try {
      await saveMediaDatabase(mergedDatabase);
      console.log(`✅ Database saved successfully`);
    } catch (saveError: any) {
      console.error("❌ Error saving database:", saveError);
      return {
        success: false,
        error: "Failed to save database",
        message: saveError.message,
        stats: {
          totalInCloudinary: allResources.length,
          existingInDatabase: existingDatabase.length,
          newItemsAdded: created,
          skipped: skipped,
          totalInDatabase: mergedDatabase.length,
        },
      };
    }
    
    console.log(`✅ Sync complete: ${created} new items added, ${skipped} skipped (already exists)`);
    
    // Check storage type for user info
    const isVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV);
    const hasUpstashEnv = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
    const hasVercelKV = !!(process.env.KV_URL || process.env.STORAGE_URL);
    const hasKV = hasUpstashEnv || hasVercelKV;
    const storageType = hasKV 
      ? (hasUpstashEnv ? "Upstash Redis" : "Vercel KV")
      : isVercel 
        ? "⚠️ Temporary (Redis/KV not configured)" 
        : "File Storage";
    
    return {
      success: true,
      message: `Synced ${created} new media items from Cloudinary`,
      storage: {
        type: storageType,
        isVercel,
        hasKV,
        hasUpstashRedis: hasUpstashEnv,
        hasVercelKV: hasVercelKV,
        note: isVercel && !hasKV 
          ? "⚠️ Files saved but will disappear! Add Upstash Redis via Marketplace to persist." 
          : hasKV 
            ? "✅ Files will persist permanently" 
            : "📁 Files saved to local storage",
      },
      stats: {
        totalInCloudinary: allResources.length,
        existingInDatabase: existingDatabase.length,
        newItemsAdded: created,
        skipped: skipped,
        totalInDatabase: mergedDatabase.length,
      },
    };
  } catch (error: any) {
    console.error("❌ Unexpected sync error:", error);
    console.error("Stack:", error.stack);
    return {
      success: false,
      error: "Unexpected error during sync",
      message: error.message,
    };
  }
}

// Sync media from Cloudinary - Rebuilds database from Cloudinary files
export const syncFromCloudinary: RequestHandler = async (req, res) => {
  const result = await performCloudinarySync();
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
};

// Clean up existing media descriptions - Remove "Synced from Cloudinary" text
export const cleanMediaDescriptions: RequestHandler = async (_req, res) => {
  try {
    console.log("🧹 Starting media description cleanup...");
    
    const mediaDatabase = await getMediaDatabase();
    let cleanedCount = 0;
    
    // Find and clean items with "Synced from Cloudinary" in description
    for (const media of mediaDatabase) {
      if (media.description && media.description.includes("Synced from Cloudinary")) {
        media.description = ""; // Clear the description
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      // Save the cleaned database
      await saveMediaDatabase(mediaDatabase);
      console.log(`✅ Cleaned ${cleanedCount} media item descriptions`);
      
      res.json({
        success: true,
        message: `Cleaned ${cleanedCount} media item descriptions`,
        cleaned: cleanedCount,
        total: mediaDatabase.length,
      });
    } else {
      res.json({
        success: true,
        message: "No media items with 'Synced from Cloudinary' text found",
        cleaned: 0,
        total: mediaDatabase.length,
      });
    }
  } catch (error: any) {
    console.error("❌ Error cleaning media descriptions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clean media descriptions",
      message: error.message,
    });
  }
};
