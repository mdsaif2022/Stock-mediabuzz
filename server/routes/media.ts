import { RequestHandler } from "express";
import { Media, MediaResponse, MediaUploadRequest } from "@shared/api";

// Mock database
const mediaDatabase: Media[] = [
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
];

// Get all media with pagination and filtering
export const getMedia: RequestHandler = (req, res) => {
  const { page = 1, pageSize = 20, category, search } = req.query;

  let filtered = [...mediaDatabase];

  if (category) {
    filtered = filtered.filter((m) => m.category === category);
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
export const createMedia: RequestHandler = (req, res) => {
  const { title, description, category, type, tags, isPremium, previewUrl, fileUrl }: MediaUploadRequest = req.body;

  if (!title || !category || !fileUrl) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const newMedia: Media = {
    id: Date.now().toString(),
    title,
    description,
    category,
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
  };

  mediaDatabase.push(newMedia);
  res.status(201).json(newMedia);
};

// Update media (admin only)
export const updateMedia: RequestHandler = (req, res) => {
  const { id } = req.params;
  const media = mediaDatabase.find((m) => m.id === id);

  if (!media) {
    res.status(404).json({ error: "Media not found" });
    return;
  }

  Object.assign(media, req.body);
  res.json(media);
};

// Delete media (admin only)
export const deleteMedia: RequestHandler = (req, res) => {
  const { id } = req.params;
  const index = mediaDatabase.findIndex((m) => m.id === id);

  if (index === -1) {
    res.status(404).json({ error: "Media not found" });
    return;
  }

  mediaDatabase.splice(index, 1);
  res.json({ message: "Media deleted successfully" });
};

// Get trending media
export const getTrendingMedia: RequestHandler = (req, res) => {
  const trending = [...mediaDatabase]
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 10);

  res.json(trending);
};
