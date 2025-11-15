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
export interface FeatureScreenshot {
  title?: string;
  description?: string;
  url: string;
}

export interface Media {
  id: string;
  title: string;
  description: string;
  category: "video" | "image" | "audio" | "template" | "apk";
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
  uploadedByEmail?: string;
  creatorId?: string;
  uploadedDate: string;
  cloudinaryAccount: number;
  iconUrl?: string;
  featureScreenshots?: FeatureScreenshot[];
  showScreenshots?: boolean;
}

export interface MediaUploadRequest {
  title: string;
  description: string;
  category: "video" | "image" | "audio" | "template" | "apk";
  type: string;
  tags: string[];
  isPremium: boolean;
  cloudinaryAccount?: "auto" | 1 | 2 | 3 | 4;
  previewUrl: string;
  fileUrl: string;
  iconUrl?: string;
  featureScreenshots?: FeatureScreenshot[];
  showScreenshots?: boolean;
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

// Creator Types
export type CreatorStatus = "pending" | "approved" | "rejected";

export interface CreatorProfile {
  id: string;
  firebaseUid?: string;
  name: string;
  email: string;
  status: CreatorStatus;
  bio?: string;
  portfolioUrl?: string;
  specialization?: string;
  message?: string;
  createdAt: string;
  updatedAt: string;
  lastRequestAt: string;
  storageBaseGb: number;
  storageBonusGb: number;
  storageBonusExpiresAt?: string;
  storageUsedBytes: number;
  storagePurchaseHistory?: CreatorStoragePurchase[];
}

export type CreatorStoragePaymentMethod = "auto" | "manual";
export type CreatorStoragePaymentStatus = "pending" | "completed" | "rejected";

export interface CreatorStoragePurchase {
  id: string;
  gb: number;
  months: number;
  pricePerGbTk: number;
  totalTk: number;
  purchasedAt: string;
  expiresAt: string;
  paymentMethod: CreatorStoragePaymentMethod;
  status: CreatorStoragePaymentStatus;
  reference?: string;
  senderNumber?: string;
  adminNote?: string;
}

export interface CreatorApplicationRequest {
  name: string;
  email: string;
  firebaseUid?: string;
  bio?: string;
  portfolioUrl?: string;
  specialization?: string;
  message?: string;
}

export interface CreatorListResponse {
  data: CreatorProfile[];
  total: number;
}

export interface CreatorStoragePurchaseRequest {
  creatorId: string;
  gb: number;
  months: number;
}

export interface CreatorStorageManualPaymentRequest extends CreatorStoragePurchaseRequest {
  transactionId: string;
  senderNumber: string;
}

export type AccountType = "user" | "creator";

export interface PlatformUser {
  id: string;
  firebaseUid?: string;
  name: string;
  email: string;
  accountType: AccountType;
  role: "user" | "admin";
  status: "pending" | "active" | "banned";
  emailVerified: boolean;
  downloads: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUsersResponse {
  data: PlatformUser[];
  total: number;
}

export interface PaymentSettings {
  bkashPersonal: string;
  bkashMerchant: string;
}

export interface BrandingSettings {
  faviconDataUrl?: string;
}

export interface SettingsStoreResponse {
  payment: PaymentSettings;
  branding: BrandingSettings;
  general: GeneralSettings;
}

export interface GeneralSettings {
  maintenanceMode: boolean;
}

// Example response type for /api/demo
export interface DemoResponse {
  message: string;
}
