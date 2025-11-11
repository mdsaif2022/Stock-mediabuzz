/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

// Authentication Types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

// Media Types
export interface Media {
  id: string;
  title: string;
  description: string;
  category: "video" | "image" | "audio" | "template";
  type: string;
  fileSize: string;
  duration?: string;
  previewUrl: string;
  fileUrl: string;
  tags: string[];
  downloads: number;
  views: number;
  isPremium: boolean;
  uploadedBy: string;
  uploadedDate: string;
  cloudinaryAccount: number;
}

export interface MediaUploadRequest {
  title: string;
  description: string;
  category: "video" | "image" | "audio" | "template";
  type: string;
  tags: string[];
  isPremium: boolean;
  cloudinaryAccount?: "auto" | 1 | 2 | 3 | 4;
  previewUrl: string;
  fileUrl: string;
}

export interface MediaResponse {
  data: Media[];
  total: number;
  page: number;
  pageSize: number;
}

// Cloudinary Types
export interface CloudinaryAccount {
  id: number;
  used: number;
  total: number;
  percentage: number;
}

export interface CloudinaryStatusResponse {
  accounts: CloudinaryAccount[];
}

// Admin Types
export interface AdminStats {
  totalUsers: number;
  totalMedia: number;
  totalDownloads: number;
  activeUsers: number;
  topDownloads: Media[];
  topUsers: Array<{ id: string; name: string; downloads: number }>;
}

// Download Types
export interface DownloadRequest {
  mediaId: string;
  userId: string;
}

export interface DownloadResponse {
  downloadUrl: string;
  expiresAt: string;
}

// Example response type for /api/demo
export interface DemoResponse {
  message: string;
}
