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
  referralCode?: string;
  totalCoins?: number;
  referralCoins?: number;
  shareCoins?: number;
  emailVerified?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  referralCode?: string;
  sharePostId?: string;
  shareLink?: string;
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
  category: "video" | "image" | "audio" | "template" | "apk" | "aivideogenerator";
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
  status?: "pending" | "approved" | "rejected";
  rejectedReason?: string;
}

export interface MediaUploadRequest {
  title: string;
  description: string;
  category: "video" | "image" | "audio" | "template" | "apk" | "aivideogenerator";
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
  deviceFingerprint?: string; // Device fingerprint to prevent multiple accounts from same device
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
  autoPaymentEnabled: boolean;
}

export interface BrandingSettings {
  faviconDataUrl?: string;
  logo?: string;
}

export interface SettingsStoreResponse {
  payment: PaymentSettings;
  branding: BrandingSettings;
  general: GeneralSettings;
  app: AppSettings;
}

export interface GeneralSettings {
  maintenanceMode: boolean;
}

export interface AppSettings {
  appName?: string;
  appVersion?: string;
  appDescription?: string;
  apkUrl?: string;
  xapkUrl?: string;
  appIcon?: string;
  downloadEnabled: boolean;
  playStoreUrl?: string;
  appStoreUrl?: string;
}

// Referral & Sharing System Types
export interface SharePost {
  id: string;
  title: string;
  url: string;
  coinValue: number;
  status: "active" | "inactive";
  imageUrl?: string;
  videoUrl?: string;
  showAsPopup?: boolean; // Enable this share post to show as pop-up ad
  showDelay?: number; // Delay in milliseconds before showing (default: 2000)
  closeAfter?: number; // Auto-close after X milliseconds (optional)
  maxDisplays?: number; // Maximum number of times to show to the same user (optional)
  createdAt: string;
  updatedAt: string;
}

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referredId: string;
  coinsEarned: number;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
}

export interface ShareRecord {
  id: string;
  userId: string;
  shareType: "admin_post" | "normal_link";
  sharePostId?: string;
  shareLink: string;
  coinsEarned: number;
  registrationCount: number;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
}

export interface ShareVisitor {
  id: string;
  shareRecordId: string;
  visitorIp: string;
  visitorUserAgent?: string;
  visitedAt: string;
  registered: boolean;
  registeredUserId?: string;
}

export interface WithdrawRequest {
  id: string;
  userId: string;
  coins: number;
  amountBdt: number;
  bkashNumber: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  processedAt?: string;
  adminNote?: string;
}

export interface UserEarnings {
  totalCoins: number;
  referralCoins: number;
  shareCoins: number;
  adminPostShareCoins: number;
  randomShareCoins: number;
  adViewCoins: number;
  pendingWithdraw: number;
  availableCoins: number;
}

export interface CreateSharePostRequest {
  title: string;
  url: string;
  coinValue: number;
  status?: "active" | "inactive";
  imageUrl?: string;
  videoUrl?: string;
  showAsPopup?: boolean;
  showDelay?: number;
  closeAfter?: number;
  maxDisplays?: number;
}

export interface UpdateSharePostRequest {
  title?: string;
  url?: string;
  coinValue?: number;
  status?: "active" | "inactive";
  imageUrl?: string;
  videoUrl?: string;
  showAsPopup?: boolean;
  showDelay?: number;
  closeAfter?: number;
  maxDisplays?: number;
}

export interface CreateWithdrawRequest {
  coins: number;
  bkashNumber: string;
}

export interface ShareLinkRequest {
  shareType: "admin_post" | "normal_link";
  sharePostId?: string;
  shareLink: string;
}

export interface ShareLinkResponse {
  shareUrl: string;
  shareCode: string;
  message: string;
}


// Pop-up Ad Types
export interface PopupAd {
  id: string;
  title: string;
  description?: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  buttonText?: string;
  buttonLink?: string;
  targetPages: string[]; // Array of route paths where the ad should appear (e.g., ["/", "/browse", "/categories"])
  isActive: boolean;
  clicks: number;
  impressions: number;
  createdAt: string;
  updatedAt: string;
  showDelay?: number; // Delay in milliseconds before showing the pop-up (default: 2000)
  closeAfter?: number; // Auto-close after X milliseconds (optional)
  maxDisplays?: number; // Maximum number of times to show to the same user (optional, tracked via localStorage)
}

export interface PopupAdCreateRequest {
  title: string;
  description?: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  buttonText?: string;
  buttonLink?: string;
  targetPages: string[];
  isActive: boolean;
  showDelay?: number;
  closeAfter?: number;
  maxDisplays?: number;
}

export interface PopupAdUpdateRequest extends Partial<PopupAdCreateRequest> {
  id: string;
}

export interface PopupAdResponse {
  data: PopupAd[];
  total: number;
}

// Ad Watching System Types
export interface Ad {
  id: string;
  title: string;
  adType: "adsterra" | "collaboration";
  adUrl: string;
  adsterraId?: string; // For Adsterra ads
  status: "active" | "inactive";
  minCoins: number; // Minimum coins (1)
  maxCoins: number; // Maximum coins (50)
  watchDuration: number; // Required watch duration in seconds (15)
  createdAt: string;
  updatedAt: string;
  isWatched?: boolean; // Whether user has watched this ad in last 24 hours
  canWatch?: boolean; // Whether user can watch this ad now
}

export interface AdViewRecord {
  id: string;
  userId: string;
  adId: string;
  coinsEarned: number;
  watchDuration: number; // Actual watch duration in seconds
  completed: boolean; // Whether user watched full 15 seconds
  clicked: boolean; // Whether user clicked (required for Adsterra ads)
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
}

export interface CreateAdRequest {
  title: string;
  adType: "adsterra" | "collaboration";
  adUrl: string;
  adsterraId?: string;
  status?: "active" | "inactive";
  minCoins?: number;
  maxCoins?: number;
  watchDuration?: number;
}

export interface UpdateAdRequest {
  title?: string;
  adType?: "adsterra" | "collaboration";
  adUrl?: string;
  adsterraId?: string;
  status?: "active" | "inactive";
  minCoins?: number;
  maxCoins?: number;
  watchDuration?: number;
}

export interface StartAdWatchRequest {
  adId: string;
}

export interface StartAdWatchResponse {
  watchId: string;
  ad: Ad;
  message: string;
}

export interface CompleteAdWatchRequest {
  watchId: string;
  watchDuration: number; // Actual watch duration in seconds
  clicked?: boolean; // Whether user clicked (required for Adsterra ads)
}

export interface CompleteAdWatchResponse {
  success: boolean;
  coinsEarned: number;
  message: string;
}

export interface PopupAdImpressionRequest {
  adId: string;
}

// AI Video Generation Types
export interface AIVideoGenerateRequest {
  prompt: string;
  duration?: number;
  style?: string;
  aspectRatio?: string;
}

export interface AIVideoGenerateResponse {
  success: boolean;
  video: AIGeneratedVideo;
  message: string;
}

export interface AIGeneratedVideo {
  id: string;
  userId?: string;
  prompt: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  status: "processing" | "completed" | "failed";
  duration?: number;
  style?: string;
  aspectRatio?: string;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}

export interface AIVideoStatusResponse {
  success: boolean;
  video: AIGeneratedVideo;
}

export interface AIVideoHistoryResponse {
  success: boolean;
  videos: AIGeneratedVideo[];
  total: number;
}