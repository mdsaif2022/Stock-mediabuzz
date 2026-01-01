import { RequestHandler } from "express";
import { Media, MediaResponse, MediaUploadRequest } from "@shared/api";
import { Database } from "../utils/database.js";
import { CloudinaryServer } from "../config/cloudinary.js";
import { isMongoDBAvailable } from "../utils/mongodb.js";
import * as mongoService from "../services/mongodbService.js";

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

// Initialize and load data on startup (skip during build)
import { isBuildTime } from "../utils/buildCheck.js";

let mediaData: Media[] = [];
if (!isBuildTime()) {
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
}

// Helper functions to get and save media (with MongoDB support)
async function getMediaDatabase(): Promise<Media[]> {
  const useMongo = await isMongoDBAvailable();
  
  if (useMongo) {
    try {
      const media = await mongoService.getAllMedia();
      // Remove MongoDB _id and return as array
      return media.map((item: any) => {
        const { _id, ...rest } = item;
        return rest as Media;
      });
    } catch (error) {
      console.error("❌ Error loading from MongoDB:", error);
      // Fallback to old database
      return await mediaDatabase.load();
    }
  }
  
  // Fallback to old database system
  return await mediaDatabase.load();
}

async function saveMediaDatabase(data: Media[]): Promise<void> {
  const useMongo = await isMongoDBAvailable();
  
  if (useMongo) {
    try {
      await mongoService.replaceAllMedia(data);
      mediaData = data;
      return;
    } catch (error) {
      console.error("❌ Error saving to MongoDB:", error);
      // Fallback to old database
    }
  }
  
  // Fallback to old database system
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

  // Filter by status: only show approved items to regular users (admin panel will show all)
  // Items without status are considered approved for backward compatibility
  filtered = filtered.filter((m) => !m.status || m.status === "approved");

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

  // Only return approved items to regular users (admin panel can access all)
  // Items without status are considered approved for backward compatibility
  if (media.status && media.status !== "approved") {
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

  // Allow updating status, title, description, tags, type, isPremium
  if ("status" in req.body) {
    updates.status = req.body.status;
  }
  if ("rejectedReason" in req.body) {
    updates.rejectedReason = req.body.rejectedReason;
  }
  if ("title" in req.body) {
    updates.title = req.body.title;
  }
  if ("description" in req.body) {
    updates.description = req.body.description;
  }
  if ("tags" in req.body) {
    updates.tags = Array.isArray(req.body.tags) ? req.body.tags : typeof req.body.tags === 'string' ? req.body.tags.split(',').map(t => t.trim()) : [];
  }
  if ("type" in req.body) {
    updates.type = req.body.type;
  }
  if ("isPremium" in req.body) {
    updates.isPremium = req.body.isPremium === true || req.body.isPremium === "true";
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

// Helper function to extract public_id and server from Cloudinary URL
function extractCloudinaryInfo(url: string): { publicId: string; server: CloudinaryServer; resourceType: "image" | "video" | "raw" } | null {
  try {
    // Cloudinary URL format: 
    // https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{transformations}/{public_id}.{ext}
    // or: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{public_id}.{ext}
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(p => p);
    
    // Find the resource type index (image, video, or raw)
    const resourceTypeIndex = pathParts.findIndex(p => ['image', 'video', 'raw'].includes(p));
    if (resourceTypeIndex === -1) return null;
    
    const resourceType = pathParts[resourceTypeIndex] as "image" | "video" | "raw";
    const uploadIndex = pathParts.findIndex((p, i) => i > resourceTypeIndex && p === 'upload');
    if (uploadIndex === -1) return null;
    
    // Extract public_id (everything after 'upload', but skip transformations)
    // Transformations are typically single segments like "w_500", "q_auto", etc.
    // The public_id starts after transformations or immediately after 'upload'
    const afterUpload = pathParts.slice(uploadIndex + 1);
    
    // Find where public_id starts (after transformations)
    // Transformations are usually short segments with underscores or specific patterns
    // Public ID typically contains slashes (for folders) or is a longer segment
    let publicIdStartIndex = 0;
    for (let i = 0; i < afterUpload.length; i++) {
      const segment = afterUpload[i];
      // If segment looks like a transformation (short, has underscore, no slashes expected)
      // or if it's a common transformation pattern, skip it
      if (segment.includes('_') && segment.length < 20 && !segment.includes('/')) {
        continue;
      }
      // Otherwise, this is likely the start of the public_id
      publicIdStartIndex = i;
      break;
    }
    
    // Extract public_id from the remaining segments
    const publicIdParts = afterUpload.slice(publicIdStartIndex);
    let publicId = publicIdParts.join('/');
    
    // Remove file extension
    publicId = publicId.replace(/\.(jpg|jpeg|png|gif|webp|mp4|webm|mov|avi|apk|xapk|zip|pdf|psd|raw|mp3|wav|ogg)$/i, '');
    
    // Determine server from cloud_name
    const cloudName = pathParts[0]; // First part after res.cloudinary.com
    let server: CloudinaryServer = "server1";
    if (cloudName === "dxijk3ivo") server = "server2";
    else if (cloudName === "dvdtbffva") server = "server3";
    else if (cloudName === "dk81tgmae") server = "server1";
    else server = "auto";
    
    return { publicId, server, resourceType };
  } catch (error) {
    console.error("Error extracting Cloudinary info:", error);
    return null;
  }
}

// Delete media - Admin only, deletes from both database and Cloudinary
export const deleteMedia: RequestHandler = async (req, res) => {
  console.log(`🗑️ Delete request received for media ID: ${req.params.id}`);
  const { id } = req.params;
  const mediaDatabase = await getMediaDatabase();
  const media = mediaDatabase.find((m) => m.id === id);

  if (!media) {
    console.log(`❌ Media not found: ${id}`);
    res.status(404).json({ error: "Media not found" });
    return;
  }

  console.log(`📦 Found media to delete: ${media.title} (${media.fileUrl})`);

  try {
    // Delete from Cloudinary if fileUrl exists
    if (media.fileUrl) {
      const cloudinaryInfo = extractCloudinaryInfo(media.fileUrl);
      if (cloudinaryInfo) {
        try {
          const { deleteFromCloudinary } = await import("../config/cloudinary.js");
          await deleteFromCloudinary(
            cloudinaryInfo.publicId,
            cloudinaryInfo.server,
            cloudinaryInfo.resourceType
          );
          console.log(`✅ Deleted file from Cloudinary: ${cloudinaryInfo.publicId} (${cloudinaryInfo.server})`);
        } catch (cloudinaryError: any) {
          console.error("⚠️ Failed to delete from Cloudinary:", cloudinaryError);
          // Continue with database deletion even if Cloudinary deletion fails
          // (file might already be deleted or URL might be invalid)
        }
      } else {
        console.warn(`⚠️ Could not extract Cloudinary info from URL: ${media.fileUrl}`);
      }
    }

    // Also delete preview/icon/screenshots if they exist
    if (media.previewUrl && media.previewUrl !== media.fileUrl) {
      const previewInfo = extractCloudinaryInfo(media.previewUrl);
      if (previewInfo) {
        try {
          const { deleteFromCloudinary } = await import("../config/cloudinary.js");
          await deleteFromCloudinary(previewInfo.publicId, previewInfo.server, "image");
        } catch (error) {
          console.warn("⚠️ Failed to delete preview from Cloudinary:", error);
        }
      }
    }

    if (media.iconUrl) {
      const iconInfo = extractCloudinaryInfo(media.iconUrl);
      if (iconInfo) {
        try {
          const { deleteFromCloudinary } = await import("../config/cloudinary.js");
          await deleteFromCloudinary(iconInfo.publicId, iconInfo.server, "image");
        } catch (error) {
          console.warn("⚠️ Failed to delete icon from Cloudinary:", error);
        }
      }
    }

    if (media.featureScreenshots && Array.isArray(media.featureScreenshots)) {
      for (const screenshot of media.featureScreenshots) {
        if (screenshot.url) {
          const screenshotInfo = extractCloudinaryInfo(screenshot.url);
          if (screenshotInfo) {
            try {
              const { deleteFromCloudinary } = await import("../config/cloudinary.js");
              await deleteFromCloudinary(screenshotInfo.publicId, screenshotInfo.server, "image");
            } catch (error) {
              console.warn("⚠️ Failed to delete screenshot from Cloudinary:", error);
            }
          }
        }
      }
    }

    // Delete from database
    const updatedDatabase = mediaDatabase.filter((m) => m.id !== id);
    await saveMediaDatabase(updatedDatabase);

    res.json({ 
      success: true,
      message: "Media deleted successfully from database and Cloudinary",
      deletedId: id
    });
  } catch (error: any) {
    console.error("Failed to delete media:", error);
    res.status(500).json({ 
      error: "Failed to delete media",
      message: error.message 
    });
  }
};

// Get trending media
export const getTrendingMedia: RequestHandler = async (req, res) => {
  const mediaDatabase = await getMediaDatabase();
  const trending = [...mediaDatabase]
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 10);

  res.json(trending);
};

// Helper function to generate video thumbnail URL from Cloudinary video URL
function getVideoThumbnailUrl(videoUrl: string): string | null {
  try {
    // Check if this is a Cloudinary video URL
    if (videoUrl.includes('cloudinary.com') && videoUrl.includes('/video/')) {
      const urlObj = new URL(videoUrl);
      const pathParts = urlObj.pathname.split('/');
      const videoIndex = pathParts.indexOf('video');
      
      if (videoIndex !== -1 && pathParts[videoIndex + 1] === 'upload') {
        // Extract cloud_name and public_id
        const cloudName = pathParts[videoIndex - 1] || pathParts[1];
        const publicIdParts = pathParts.slice(videoIndex + 2);
        const publicId = publicIdParts.join('/').replace(/\.(mp4|webm|mov|avi)$/i, '');
        
        // Generate thumbnail URL using Cloudinary transformation
        // so_1 = seek to 1 second, w_640 = width 640, h_360 = height 360, q_auto = quality auto, f_jpg = format jpg
        const thumbnailUrl = `https://res.cloudinary.com/${cloudName}/video/upload/so_1,w_640,h_360,q_auto,f_jpg/${publicId}.jpg`;
        return thumbnailUrl;
      }
    }
    
    // For non-Cloudinary videos, return null to use preview endpoint
    return null;
  } catch (e) {
    // If URL parsing fails, return null
    return null;
  }
}

export const getCategorySummary: RequestHandler = async (_req, res) => {
  const mediaDatabase = await getMediaDatabase();
  const summary = CATEGORY_KEYS.map((category) => {
    // Filter approved items only (or items without status for backward compatibility)
    const items = mediaDatabase.filter(
      (item) => 
        normalizeCategoryValue(item.category) === category &&
        (!item.status || item.status === "approved")
    );
    
    if (items.length === 0) {
      return {
        category,
        count: 0,
        latestTitle: null,
        previewUrl: null,
        sampleId: null,
      };
    }
    
    // Try to get most popular item (by downloads + views)
    const mostPopular = [...items]
      .filter(item => (item.downloads || 0) + (item.views || 0) > 0)
      .sort((a, b) => {
        const scoreA = (a.downloads || 0) + (a.views || 0);
        const scoreB = (b.downloads || 0) + (b.views || 0);
        return scoreB - scoreA;
      })[0];
    
    // Fallback to latest if no popular items
    const selectedItem = mostPopular || [...items].sort(
      (a, b) => new Date(b.uploadedDate || 0).getTime() - new Date(a.uploadedDate || 0).getTime()
    )[0];
    
    // Determine best preview URL based on category
    let previewUrl: string | null = null;
    
    if (category === "video") {
      // For videos, try to generate thumbnail from fileUrl if it's Cloudinary
      if (selectedItem.fileUrl) {
        const thumbnailUrl = getVideoThumbnailUrl(selectedItem.fileUrl);
        if (thumbnailUrl) {
          previewUrl = thumbnailUrl;
        } else if (selectedItem.previewUrl) {
          // Check if previewUrl is already an image (not a video file)
          const isImageUrl = selectedItem.previewUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) || 
                            selectedItem.previewUrl.includes('/image/');
          if (isImageUrl) {
            previewUrl = selectedItem.previewUrl;
          } else {
            // If previewUrl is a video, use preview endpoint (will be handled on frontend)
            previewUrl = selectedItem.previewUrl;
          }
        }
      } else if (selectedItem.previewUrl) {
        previewUrl = selectedItem.previewUrl;
      }
    } else if (category === "apk") {
      // For APK, prefer iconUrl or first feature screenshot
      if (selectedItem.iconUrl) {
        previewUrl = selectedItem.iconUrl;
      } else if (selectedItem.featureScreenshots && selectedItem.featureScreenshots.length > 0) {
        previewUrl = selectedItem.featureScreenshots[0].url;
      } else if (selectedItem.previewUrl) {
        previewUrl = selectedItem.previewUrl;
      }
    } else if (category === "audio") {
      // For audio, prefer iconUrl, then previewUrl
      if (selectedItem.iconUrl) {
        previewUrl = selectedItem.iconUrl;
      } else if (selectedItem.previewUrl) {
        previewUrl = selectedItem.previewUrl;
      }
    } else if (category === "template") {
      // For templates, prefer iconUrl, then previewUrl
      if (selectedItem.iconUrl) {
        previewUrl = selectedItem.iconUrl;
      } else if (selectedItem.previewUrl) {
        previewUrl = selectedItem.previewUrl;
      }
    } else {
      // For images and others, use previewUrl directly
      previewUrl = selectedItem.previewUrl || null;
    }
    
    return {
      category,
      count: items.length,
      latestTitle: selectedItem?.title || null,
      previewUrl,
      sampleId: selectedItem?.id || null,
    };
  });

  res.json(summary);
};

// Get official apps (admin-uploaded, approved APKs)
export const getOfficialApps: RequestHandler = async (_req, res) => {
  const mediaDatabase = await getMediaDatabase();
  
  // Filter for official apps:
  // 1. Category must be "apk"
  // 2. Status must be "approved" or undefined (backward compatibility)
  // 3. No creatorId (admin-uploaded, not creator-uploaded)
  const officialApps = mediaDatabase.filter((m) => {
    const isApk = normalizeCategoryValue(m.category) === "apk";
    const isApproved = !m.status || m.status === "approved";
    const isAdminUpload = !m.creatorId; // No creatorId means admin uploaded
    return isApk && isApproved && isAdminUpload;
  });
  
  // Sort by most popular (downloads + views), then by latest
  officialApps.sort((a, b) => {
    const scoreA = (a.downloads || 0) + (a.views || 0);
    const scoreB = (b.downloads || 0) + (b.views || 0);
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    const dateA = new Date(a.uploadedDate || 0).getTime();
    const dateB = new Date(b.uploadedDate || 0).getTime();
    return dateB - dateA;
  });
  
  res.json({ data: officialApps });
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
    
    // Check for MongoDB
    const hasMongoURI = !!process.env.MONGODB_URI;
    const hasMongoComponents = !!(process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD && process.env.MONGODB_CLUSTER);
    const hasMongoDB = hasMongoURI || hasMongoComponents;
    
    // Check for Redis initialization errors
    let redisError = null;
    
    // Test MongoDB connection (highest priority)
    let mongoTest = "unknown";
    let mongoAvailable = false;
    if (hasMongoDB) {
      try {
        const { testMongoDBConnection } = await import("../utils/mongodb.js");
        const mongoResult = await testMongoDBConnection();
        mongoTest = mongoResult.message;
        mongoAvailable = mongoResult.success;
      } catch (error: any) {
        mongoTest = `❌ Connection failed: ${error.message}`;
        mongoAvailable = false;
      }
    }
    
    // Test Redis/KV connection (fallback)
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
    
    // Determine storage type (MongoDB > Redis/KV > File)
    let storageType = "File Storage";
    if (mongoAvailable) {
      storageType = "MongoDB";
    } else if (hasKV) {
      storageType = hasUpstashEnv ? "Upstash Redis" : "Vercel KV";
    } else if (isVercel || isRender) {
      storageType = "⚠️ None (Database not configured)";
    }
    
    res.json({
      status: "ok",
      storage: {
        type: storageType,
        isVercel,
        isRender,
        hasMongoDB: mongoAvailable,
        hasKV: hasKV && !mongoAvailable, // Only true if MongoDB not available
        hasUpstashRedis: hasUpstashEnv,
        hasVercelKV: hasVercelKV || hasVercelKVFull,
        // Debug info (shows if env vars are detected, but masked for security)
        envVars: {
          mongoURISet: hasMongoURI,
          mongoComponentsSet: hasMongoComponents,
          upstashUrlSet: !!upstashUrl,
          upstashTokenSet: !!upstashToken,
          upstashUrlPreview: upstashUrl ? `${upstashUrl.substring(0, 30)}...` : "Not set",
          vercelKVSet: hasVercelKV,
          vercelKVFullSet: hasVercelKVFull,
        },
        mongoTest: mongoAvailable ? mongoTest : (hasMongoDB ? mongoTest : "Not configured"),
        kvUrl: hasKV ? "✅ Set" : "❌ Not set",
        connectionTest: mongoAvailable ? mongoTest : storageTest,
        redisError: redisError || null,
        persistenceWarning: mongoAvailable
          ? "✅ Data will persist permanently (MongoDB)"
          : hasKV 
            ? "✅ Data will persist permanently (Redis/KV)"
            : isVercel || isRender
              ? "⚠️ Data will NOT persist! Configure MongoDB or Redis/KV to prevent data loss."
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
      const errorMsg = saveError.message || String(saveError);
      
      // Provide detailed error information
      console.error("⚠️  ⚠️  ⚠️  CRITICAL: Database save failed!");
      console.error("   Error:", errorMsg);
      
      // Check if it's a Redis connection issue
      if (errorMsg.includes("Redis") || errorMsg.includes("KV") || errorMsg.includes("persist") || errorMsg.includes("not available")) {
        console.error("⚠️  This is a Redis/KV connection problem!");
        console.error("⚠️  Your data will NOT persist until Redis is connected.");
        console.error("⚠️  Check Render logs above for Redis connection errors.");
        console.error("⚠️  Verify UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Render Dashboard.");
      }
      
      return {
        success: false,
        error: "Failed to save database - Redis/KV connection required",
        message: errorMsg,
        stats: {
          totalInCloudinary: allResources.length,
          existingInDatabase: existingDatabase.length,
          newItemsAdded: created,
          skipped: skipped,
          totalInDatabase: mergedDatabase.length,
        },
        troubleshooting: {
          issue: "Database save failed - likely Redis connection problem",
          action: "Check Render logs for Redis connection errors",
          check: "Verify UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Render Dashboard",
          endpoint: "Check /api/media/database/status for connection details",
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

// Health check endpoint - Verify data persistence
export const healthCheck: RequestHandler = async (_req, res) => {
  try {
    const mediaDatabase = await getMediaDatabase();
    const initialCount = mediaDatabase.length;
    
    // Test write and read
    const testItem = { id: "__health_check__", test: true, timestamp: Date.now() };
    const testDatabase = [...mediaDatabase, testItem as any];
    
    // Save test data
    await saveMediaDatabase(testDatabase);
    
    // Wait a moment for write to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify it was saved
    const verifyDatabase = await getMediaDatabase();
    const verifyCount = verifyDatabase.length;
    const testItemFound = verifyDatabase.find((item: any) => item.id === "__health_check__");
    
    // Clean up test item
    const cleanDatabase = verifyDatabase.filter((item: any) => item.id !== "__health_check__");
    await saveMediaDatabase(cleanDatabase);
    
    // Check persistence
    const persistenceOk = verifyCount === initialCount + 1 && testItemFound;
    const finalDatabase = await getMediaDatabase();
    const finalCount = finalDatabase.length;
    
    // Check storage type
    const isVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV);
    const isRender = !!process.env.RENDER;
    const hasUpstashEnv = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
    const hasVercelKV = !!(process.env.KV_URL || process.env.STORAGE_URL);
    const hasKV = hasUpstashEnv || hasVercelKV;
    
    res.json({
      status: persistenceOk ? "healthy" : "unhealthy",
      persistence: {
        testPassed: persistenceOk,
        initialCount,
        verifyCount,
        finalCount,
        testItemFound: !!testItemFound,
        message: persistenceOk 
          ? "✅ Data persistence is working correctly"
          : "❌ Data persistence test failed - data may not be saving",
      },
      storage: {
        type: hasKV 
          ? (hasUpstashEnv ? "Upstash Redis" : "Vercel KV")
          : isVercel || isRender
            ? "⚠️ File Storage (NOT PERSISTENT)"
            : "File Storage (localhost)",
        hasKV,
        isConfigured: hasKV,
        warning: !hasKV && (isVercel || isRender)
          ? "⚠️ Redis/KV not configured - data will NOT persist!"
          : null,
      },
      media: {
        count: finalCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      error: error.message,
      message: "Health check failed",
    });
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
