import { RequestHandler } from "express";
import multer from "multer";
import { uploadToCloudinary, CloudinaryServer } from "../config/cloudinary.js";
import { saveMediaDatabase, getMediaDatabase } from "./media.js";
import { Media } from "@shared/api";
import { canCreatorConsumeStorage, incrementCreatorStorageUsage } from "./creators.js";

// Configure multer for memory storage
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

interface UploadRequest {
  files?: Express.Multer.File[];
  body: {
    server?: CloudinaryServer;
    folder?: string;
    resource_type?: "image" | "video" | "raw" | "auto";
    url?: string; // For URL uploads
    public_id?: string;
  };
}

const parseFeatureScreenshots = (input: any): Media["featureScreenshots"] => {
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

export const handleFileUpload: RequestHandler = async (req, res) => {
  try {
    const files = (req as any).files as Express.Multer.File[];
    let { server = "auto", folder, resource_type = "auto", public_id } = req.body;

    // Check if files are provided
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files provided" });
    }

    const totalUploadBytes = files.reduce((sum, file) => sum + file.size, 0);
    const creatorId = req.body.creatorId;
    
    // CRITICAL: Server 3 is dedicated to creator accounts only
    // Force all creator uploads to use server3, regardless of client request
    if (creatorId) {
      server = "server3";
      console.log(`[Upload] Creator upload detected - forcing Server 3 for creatorId: ${creatorId}`);
    }

    if (creatorId) {
      const storageCheck = canCreatorConsumeStorage(creatorId, totalUploadBytes);
      if (!storageCheck.allowed) {
        return res.status(403).json({
          error: "Storage limit reached. Please purchase additional storage.",
          remainingBytes: storageCheck.remainingBytes,
          quotaBytes: storageCheck.quotaBytes,
        });
      }
    }

    const uploadResults = await Promise.all(
      files.map(async (file, index) => {
        // Determine resource type from file mimetype if not specified
        let detectedResourceType: "image" | "video" | "raw" | "auto" = resource_type;
        if (resource_type === "auto") {
          if (file.mimetype.startsWith("image/")) {
            detectedResourceType = "image";
          } else if (file.mimetype.startsWith("video/")) {
            detectedResourceType = "video";
          } else {
            detectedResourceType = "raw";
          }
        }

        // Use public_id with index if multiple files
        const filePublicId = public_id ? `${public_id}_${index}` : undefined;

        const result = await uploadToCloudinary(file.buffer, {
          server: server as CloudinaryServer,
          folder,
          resource_type: detectedResourceType,
          public_id: filePublicId,
        });

        return {
          originalName: file.originalname,
          url: result.url,
          secure_url: result.secure_url,
          public_id: result.public_id,
          server: result.server,
          resource_type: detectedResourceType,
          size: file.size,
          mimetype: file.mimetype,
        };
      })
    );

    // Get form data from request
    const formTitle = req.body.title || "";
    const formCategory = req.body.category || "";
    const formType = req.body.type || "";
    const formDescription = req.body.description || "";
    const formTags = req.body.tags ? req.body.tags.split(",").map((tag: string) => tag.trim()) : [];
    const formIsPremium = req.body.isPremium === "true" || req.body.isPremium === true;
    const creatorName = req.body.creatorName;
    const creatorEmail = req.body.creatorEmail;
    const iconUrl = normalizeIconUrl(req.body.iconUrl);
    const featureScreenshots = parseFeatureScreenshots(req.body.featureScreenshots);
    const showScreenshots = parseShowScreenshots(req.body.showScreenshots);

    // Normalize category - map form values to lowercase API values
    const normalizeCategory = (cat: string): string => {
      const normalized = cat.toLowerCase().trim();
      // Map common variations to standard categories
      if (normalized === "video" || normalized === "videos") return "video";
      if (normalized === "image" || normalized === "images" || normalized === "photo" || normalized === "photos") return "image";
      if (normalized === "audio" || normalized === "audios" || normalized === "sound" || normalized === "music") return "audio";
      if (normalized === "template" || normalized === "templates") return "template";
      if (normalized === "apk" || normalized === "apks" || normalized === "android" || normalized === "app") return "apk";
      return normalized; // Return as-is if unknown
    };

    // Normalize category for filtering
    const normalizedCategory = formCategory ? normalizeCategory(formCategory) : null;
    const isApkUpload = normalizedCategory === "apk";
    
    // Filter out image files when uploading APK apps - they should only be stored as feature screenshots, not as separate media items
    const filesToSaveAsMedia = uploadResults.filter((file) => {
      if (isApkUpload) {
        // When uploading an APK, only save APK files as media items
        // Filter out image files - they should only be used as feature screenshots
        const fileName = file.originalName.toLowerCase();
        const isApkFile = fileName.endsWith(".apk") || fileName.endsWith(".xapk") || file.mimetype === "application/vnd.android.package-archive";
        const isImageFile = file.resource_type === "image" || file.mimetype.startsWith("image/");
        
        // Only save APK files, not image files (images should only be in featureScreenshots)
        if (isImageFile && !isApkFile) {
          return false; // Skip image files when uploading APK
        }
      }
      return true; // Save all files for non-APK uploads, or APK files for APK uploads
    });

    // Save media metadata to database for each file that should be saved as media
    const savedMedia = filesToSaveAsMedia.map((file, index) => {
      const title = formTitle || file.originalName.replace(/\.[^/.]+$/, ""); // Use form title or filename
      
      // Detect APK files from filename or mimetype
      const fileName = file.originalName.toLowerCase();
      const isApkFile = fileName.endsWith(".apk") || fileName.endsWith(".xapk") || file.mimetype === "application/vnd.android.package-archive";
      
      const category = formCategory 
        ? normalizeCategory(formCategory)
        : isApkFile 
          ? "apk" 
          : (file.resource_type === "image" ? "image" : file.resource_type === "video" ? "video" : file.resource_type === "raw" ? "audio" : "template");
      const type = formType || (isApkFile ? "Android APK" : file.mimetype.split("/")[1]?.toUpperCase() || "Unknown");
      
      // Determine file size
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const fileSize = fileSizeMB > 1024 ? `${(parseFloat(fileSizeMB) / 1024).toFixed(2)} GB` : `${fileSizeMB} MB`;

      const newMedia: Media = {
        id: Date.now().toString() + index,
        title: filesToSaveAsMedia.length > 1 ? `${title} (${index + 1})` : title,
        description: formDescription || `Uploaded ${file.originalName}`,
        category: category,
        type: type,
        fileSize: fileSize,
        duration: undefined, // Duration will be detected client-side from video metadata
        previewUrl: file.secure_url,
        fileUrl: file.secure_url,
        tags: formTags.length > 0 ? formTags : [],
        downloads: 0,
        views: 0,
        isPremium: formIsPremium,
        uploadedBy: creatorName || (req as any).user?.name || "Admin",
        uploadedByEmail: creatorEmail || (req as any).user?.email,
        creatorId: creatorId || undefined,
        uploadedDate: new Date().toISOString().split("T")[0],
        cloudinaryAccount: server === "server1" ? 1 : server === "server2" ? 2 : server === "server3" ? 3 : 1,
        iconUrl,
        featureScreenshots,
        showScreenshots,
        status: creatorId ? "pending" : "approved", // Creator uploads are pending, admin uploads are auto-approved
      };

      return newMedia;
    });

    // Validate that at least one file was saved as media
    if (savedMedia.length === 0) {
      return res.status(400).json({
        error: "No valid media files to save",
        message: isApkUpload 
          ? "When uploading an APK, please include at least one APK file. Image files should be uploaded as feature screenshots separately."
          : "No files were processed for saving.",
      });
    }

    // Log warning if image files were filtered out for APK uploads
    if (isApkUpload && uploadResults.length > filesToSaveAsMedia.length) {
      const filteredCount = uploadResults.length - filesToSaveAsMedia.length;
      console.log(`⚠️ Filtered out ${filteredCount} image file(s) from APK upload - these should be uploaded as feature screenshots separately, not as separate media items.`);
    }

    // Get current database and add new items
    const currentDatabase = await getMediaDatabase();
    currentDatabase.push(...savedMedia);

    // Save to database (KV on Vercel, file on localhost)
    await saveMediaDatabase(currentDatabase);
    
    // Verify data was saved (critical for persistence)
    try {
      const verifyDatabase = await getMediaDatabase();
      const savedCount = verifyDatabase.length;
      if (savedCount < currentDatabase.length) {
        console.error(`⚠️ Data persistence warning: Expected ${currentDatabase.length} items, found ${savedCount}`);
        // Retry save
        await saveMediaDatabase(currentDatabase);
        console.log("✅ Retry save completed");
      } else {
        console.log(`✅ Verified ${savedCount} items persisted to database`);
      }
    } catch (verifyError) {
      console.error("❌ Failed to verify data persistence:", verifyError);
    }

    // Trigger background sync to ensure Cloudinary and database stay in sync
    try {
      const { triggerSyncAfterUpload } = await import("../services/syncService.js");
      triggerSyncAfterUpload();
    } catch (syncError) {
      // Non-critical - just log
      console.log("Note: Could not trigger post-upload sync:", syncError);
    }

    if (creatorId) {
      await incrementCreatorStorageUsage(creatorId, totalUploadBytes);
    }

    res.json({
      success: true,
      files: filesToSaveAsMedia, // Return only files that were saved as media items
      media: savedMedia,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: "Upload failed",
      message: error.message || "An error occurred during upload",
    });
  }
};

export const handleUrlUpload: RequestHandler = async (req, res) => {
  try {
    let { url, server = "auto", folder, resource_type = "auto", public_id, title, category, type, description, tags, isPremium, previewUrl, creatorName, creatorEmail, creatorId } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // CRITICAL: Server 3 is dedicated to creator accounts only
    // Force all creator uploads to use server3, regardless of client request
    if (creatorId) {
      server = "server3";
      console.log(`[Upload] Creator URL upload detected - forcing Server 3 for creatorId: ${creatorId}`);
    }

    // CRITICAL: Detect resource type from URL to ensure videos are uploaded as "video" type
    // This is essential for videos to be playable - "raw" type videos won't play in browsers
    const urlLower = url.toLowerCase();
    let finalResourceType: "image" | "video" | "raw" = "raw"; // Default to raw
    
    // Detect from URL extension first (most reliable)
    if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/)) {
      finalResourceType = "image";
    } else if (urlLower.match(/\.(mp4|webm|mov|avi|mkv|m4v|flv|wmv|3gp|ogv)$/)) {
      finalResourceType = "video"; // CRITICAL: Videos must be "video" type, not "raw"
    } else if (urlLower.match(/\.(mp3|wav|ogg|m4a|aac|flac|wma)$/)) {
      finalResourceType = "raw"; // Audio files as raw
    } else if (urlLower.match(/\.(apk|xapk)$/)) {
      finalResourceType = "raw"; // APK files as raw
    }
    
    // Override with explicit resource_type if provided and not "auto"
    if (resource_type && resource_type !== "auto") {
      finalResourceType = resource_type as "image" | "video" | "raw";
    }
    
    // Also check category to help determine type
    const categoryLower = (req.body.category || "").toLowerCase();
    if (categoryLower === "video" && finalResourceType !== "video") {
      // If category is video but we detected something else, force video type
      finalResourceType = "video";
    } else if (categoryLower === "image" && finalResourceType !== "image") {
      finalResourceType = "image";
    } else if (categoryLower === "audio" && finalResourceType === "video") {
      // If category is audio but we detected video, it's likely audio
      finalResourceType = "raw";
    }
    
    // Set default folder if not provided
    const uploadFolder = folder || "media-uploads";
    
    const result = await uploadToCloudinary(url, {
      server: server as CloudinaryServer,
      folder: uploadFolder,
      resource_type: finalResourceType,
      public_id,
    });

    // Normalize category - map form values to lowercase API values
    const normalizeCategory = (cat: string): string => {
      const normalized = cat.toLowerCase().trim();
      // Map common variations to standard categories
      if (normalized === "video" || normalized === "videos") return "video";
      if (normalized === "image" || normalized === "images" || normalized === "photo" || normalized === "photos") return "image";
      if (normalized === "audio" || normalized === "audios" || normalized === "sound" || normalized === "music") return "audio";
      if (normalized === "template" || normalized === "templates") return "template";
      if (normalized === "apk" || normalized === "apks" || normalized === "android" || normalized === "app") return "apk";
      return normalized; // Return as-is if unknown
    };

    // Detect APK files from URL (urlLower already defined above)
    const isApkFile = urlLower.endsWith(".apk") || urlLower.endsWith(".xapk");
    
    // Save media metadata to database
    const mediaTitle = title || `Media from ${new Date().toLocaleDateString()}`;
    const mediaCategory = category 
      ? normalizeCategory(category)
      : isApkFile 
        ? "apk" 
        : (finalResourceType === "image" ? "image" : finalResourceType === "video" ? "video" : finalResourceType === "raw" ? "audio" : "template");
    const mediaType = type || (isApkFile ? "Android APK" : finalResourceType.toUpperCase());
    const mediaTags = tags ? (typeof tags === "string" ? tags.split(",").map((tag: string) => tag.trim()) : tags) : [];
    const mediaIsPremium = isPremium === "true" || isPremium === true;
    const iconUrl = normalizeIconUrl(req.body.iconUrl);
    const featureScreenshots = parseFeatureScreenshots(req.body.featureScreenshots);
    const showScreenshots = parseShowScreenshots(req.body.showScreenshots);
    const isCreatorUpload = !!creatorId;

    // CRITICAL: For videos uploaded to Cloudinary, ensure the URL is playable
    // Cloudinary videos uploaded as "video" type are directly playable
    // For videos, use the secure_url directly - it's already in the correct format
    let finalFileUrl = result.secure_url;
    let finalPreviewUrl = previewUrl || result.secure_url;
    
    // For video category with video resource type, the URL is already playable
    // For images, both preview and file are the same
    // For audio, use the uploaded file URL
    if (mediaCategory === "video" && finalResourceType === "video") {
      // Video uploaded as "video" type is directly playable from Cloudinary
      finalFileUrl = result.secure_url;
      // Use custom preview URL if provided, otherwise use video URL (browsers can show first frame)
      finalPreviewUrl = previewUrl || result.secure_url;
    } else if (mediaCategory === "image" && finalResourceType === "image") {
      // Images work the same for both preview and file
      finalFileUrl = result.secure_url;
      finalPreviewUrl = previewUrl || result.secure_url;
    } else {
      // For audio and other types
      finalFileUrl = result.secure_url;
      finalPreviewUrl = previewUrl || result.secure_url;
    }

    const newMedia: Media = {
      id: Date.now().toString(),
      title: mediaTitle,
      description: description || `Uploaded from URL: ${url}`,
      category: mediaCategory,
      type: mediaType,
      fileSize: "Unknown",
      duration: undefined, // Duration will be detected client-side from video metadata
      previewUrl: finalPreviewUrl,
      fileUrl: finalFileUrl,
      tags: mediaTags,
      downloads: 0,
      views: 0,
      isPremium: mediaIsPremium,
      uploadedBy: creatorName || (req as any).user?.name || "Admin",
      uploadedByEmail: creatorEmail || (req as any).user?.email,
      creatorId: creatorId || undefined,
      uploadedDate: new Date().toISOString().split("T")[0],
      cloudinaryAccount: server === "server1" ? 1 : server === "server2" ? 2 : server === "server3" ? 3 : 1,
      iconUrl,
      featureScreenshots,
      showScreenshots,
      status: isCreatorUpload ? "pending" : "approved", // Creator uploads are pending, admin uploads are auto-approved
    };

    // Get current database and add new item
    const currentDatabase = await getMediaDatabase();
    currentDatabase.push(newMedia);

    // Save to database (KV on Vercel, file on localhost)
    await saveMediaDatabase(currentDatabase);
    
    // Verify data was saved (critical for persistence)
    try {
      const verifyDatabase = await getMediaDatabase();
      const savedCount = verifyDatabase.length;
      if (savedCount < currentDatabase.length) {
        console.error(`⚠️ Data persistence warning: Expected ${currentDatabase.length} items, found ${savedCount}`);
        // Retry save
        await saveMediaDatabase(currentDatabase);
        console.log("✅ Retry save completed");
      } else {
        console.log(`✅ Verified ${savedCount} items persisted to database`);
      }
    } catch (verifyError) {
      console.error("❌ Failed to verify data persistence:", verifyError);
    }

    // Trigger background sync to ensure Cloudinary and database stay in sync
    try {
      const { triggerSyncAfterUpload } = await import("../services/syncService.js");
      triggerSyncAfterUpload();
    } catch (syncError) {
      // Non-critical - just log
      console.log("Note: Could not trigger post-upload sync:", syncError);
    }

    res.json({
      success: true,
      file: {
        url: result.url,
        secure_url: result.secure_url,
        public_id: result.public_id,
        server: result.server,
        resource_type,
      },
      media: newMedia,
    });
  } catch (error: any) {
    console.error("URL upload error:", error);
    res.status(500).json({
      error: "URL upload failed",
      message: error.message || "An error occurred during URL upload",
    });
  }
};

export const handleAssetUpload: RequestHandler = async (req, res) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      return res.status(400).json({ error: "File is required" });
    }
    const { server = "auto", folder, resource_type = "auto", public_id } = req.body;
    let detectedResourceType: "image" | "video" | "raw" | "auto" = resource_type;
    if (resource_type === "auto") {
      if (file.mimetype.startsWith("image/")) {
        detectedResourceType = "image";
      } else if (file.mimetype.startsWith("video/")) {
        detectedResourceType = "video";
      } else {
        detectedResourceType = "raw";
      }
    }
    const result = await uploadToCloudinary(file.buffer, {
      server: server as CloudinaryServer,
      folder,
      resource_type: detectedResourceType,
      public_id,
    });
    res.json({
      success: true,
      url: result.url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      resourceType: detectedResourceType,
    });
  } catch (error: any) {
    console.error("Asset upload error:", error);
    res.status(500).json({ error: "Asset upload failed", message: error.message || "Unexpected error" });
  }
};


