import { RequestHandler } from "express";
import { Media, MediaResponse, MediaUploadRequest } from "@shared/api";
import { promises as fs } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the data file
const DATA_DIR = join(__dirname, "../data");
const MEDIA_DB_FILE = join(DATA_DIR, "media-database.json");

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

// Default initial data
const DEFAULT_MEDIA: Media[] = [
  {
    id: "1",
    title: "Cinematic Urban Sunset",
    description: "A stunning 4K video of an urban sunset with beautiful golden and orange hues",
    category: "video",
    type: "4K",
    fileSize: "1.2 GB",
    duration: "00:45",
    previewUrl: "https://via.placeholder.com/1280x720?text=Urban+Sunset",
    fileUrl: "https://cloudinary.example.com/media/1",
    tags: ["sunset", "urban", "4k", "cinematic"],
    downloads: 12500,
    views: 45300,
    isPremium: false,
    uploadedBy: "CreativeStudio Pro",
    uploadedDate: "2024-11-15",
    cloudinaryAccount: 1,
  },
  {
    id: "2",
    title: "Professional Business Background",
    description: "High-quality business background image perfect for presentations",
      category: "image",
      type: "5K",
      fileSize: "2.4 MB",
      previewUrl: "https://via.placeholder.com/1280x720?text=Business+BG",
      fileUrl: "https://cloudinary.example.com/media/2",
      tags: ["business", "professional", "background"],
      downloads: 8300,
      views: 24500,
      isPremium: true,
      uploadedBy: "DesignHub",
      uploadedDate: "2024-11-14",
      cloudinaryAccount: 2,
    },
    {
      id: "3",
      title: "Sample Android App",
      description: "Example APK file for testing - download and install on your Android device",
      category: "apk",
      type: "Android APK",
      fileSize: "15.2 MB",
      previewUrl: "https://via.placeholder.com/1280x720?text=Android+APK",
      fileUrl: "https://cloudinary.example.com/media/3",
      tags: ["android", "app", "apk"],
      downloads: 5200,
      views: 15200,
      isPremium: false,
      uploadedBy: "App Developer",
      uploadedDate: "2024-11-16",
      cloudinaryAccount: 1,
    iconUrl: "https://via.placeholder.com/160x160?text=App+Icon",
    featureScreenshots: [
      {
        title: "Home Screen",
        description: "Clean landing view of the sample app",
        url: "https://via.placeholder.com/800x450?text=Screenshot+1",
      },
      {
        title: "Detail Screen",
        description: "Showcases the modern UI layout",
        url: "https://via.placeholder.com/800x450?text=Screenshot+2",
      },
    ],
    showScreenshots: true,
    },
  ];

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

// Load media database from file
async function loadMediaDatabase(): Promise<Media[]> {
  try {
    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Try to read existing file
    const data = await fs.readFile(MEDIA_DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : DEFAULT_MEDIA;
  } catch (error: any) {
    // File doesn't exist or is invalid, return default data
    if (error.code === "ENOENT") {
      // Save default data to file
      await saveMediaDatabase(DEFAULT_MEDIA);
      return DEFAULT_MEDIA;
    }
    console.error("Error loading media database:", error);
    return DEFAULT_MEDIA;
  }
}

// Save media database to file
async function saveMediaDatabase(data: Media[]): Promise<void> {
  try {
    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Write to file
    await fs.writeFile(MEDIA_DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving media database:", error);
    throw error;
  }
}

// Initialize mediaDatabase - start with default data, load async
let mediaDatabase: Media[] = [...DEFAULT_MEDIA];
// Load database from file on startup
loadMediaDatabase()
  .then((loaded) => {
    mediaDatabase = loaded;
    console.log(`Loaded ${loaded.length} media items from database`);
  })
  .catch((error) => {
    console.error("Failed to load media database, using defaults:", error);
  });

// Export mediaDatabase for use in upload handler
export { mediaDatabase, saveMediaDatabase };

// Get all media with pagination and filtering
export const getMedia: RequestHandler = (req, res) => {
  const { page = 1, pageSize = 20, category, search, sort = "latest" } = req.query as {
    page?: string | number;
    pageSize?: string | number;
    category?: string;
    search?: string;
    sort?: "latest" | "popular" | "views";
  };

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
export const getMediaById: RequestHandler = (req, res) => {
  const { id } = req.params;
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

// Delete media (admin only)
export const deleteMedia: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const index = mediaDatabase.findIndex((m) => m.id === id);

  if (index === -1) {
    res.status(404).json({ error: "Media not found" });
    return;
  }

  mediaDatabase.splice(index, 1);

  try {
    await saveMediaDatabase(mediaDatabase);
    res.json({ message: "Media deleted successfully" });
  } catch (error) {
    console.error("Failed to save media:", error);
    res.status(500).json({ error: "Failed to save media" });
  }
};

// Get trending media
export const getTrendingMedia: RequestHandler = (req, res) => {
  const trending = [...mediaDatabase]
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 10);

  res.json(trending);
};

export const getCategorySummary: RequestHandler = (_req, res) => {
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
