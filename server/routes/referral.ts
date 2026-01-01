import { RequestHandler } from "express";
import { promises as fs } from "fs";
import { join } from "path";
import { DATA_DIR } from "../utils/dataPath.js";
import { isMongoDBAvailable } from "../utils/mongodb.js";
import * as mongoService from "../services/mongodbService.js";
import {
  SharePost,
  ReferralRecord,
  ShareRecord,
  ShareVisitor,
  WithdrawRequest,
  UserEarnings,
  CreateSharePostRequest,
  UpdateSharePostRequest,
  CreateWithdrawRequest,
  ShareLinkRequest,
  ShareLinkResponse,
  AuthUser,
} from "@shared/api";

const REFERRAL_DB_FILE = join(DATA_DIR, "referral-database.json");
const SHARE_POSTS_DB_FILE = join(DATA_DIR, "share-posts-database.json");
const SHARE_RECORDS_DB_FILE = join(DATA_DIR, "share-records-database.json");
const SHARE_VISITORS_DB_FILE = join(DATA_DIR, "share-visitors-database.json");
const WITHDRAW_REQUESTS_DB_FILE = join(DATA_DIR, "withdraw-requests-database.json");

// In-memory storage
let referralDatabase: ReferralRecord[] = [];
let sharePostsDatabase: SharePost[] = [];
let shareRecordsDatabase: ShareRecord[] = [];
let shareVisitorsDatabase: ShareVisitor[] = [];
let withdrawRequestsDatabase: WithdrawRequest[] = [];

// Helper: Generate unique referral code
function generateReferralCode(userId: string, email: string): string {
  const hash = `${userId}-${email}`.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const code = `REF${hash.toString(36).toUpperCase().slice(0, 8)}`;
  return code;
}

// Helper: Generate random coins (5-100)
function generateRandomCoins(): number {
  return Math.floor(Math.random() * 96) + 5; // 5 to 100
}

// Helper: Get client IP
function getClientIp(req: any): string {
  return req.ip || 
    req.headers['x-forwarded-for']?.split(',')[0] || 
    req.headers['x-real-ip'] || 
    req.connection?.remoteAddress || 
    'unknown';
}

// Load databases
async function loadReferralDatabase(): Promise<ReferralRecord[]> {
  const useMongo = await isMongoDBAvailable();
  
  if (useMongo) {
    try {
      const records = await mongoService.getAllReferrals();
      if (records.length > 0) {
        return records.map((r: any) => {
          const { _id, ...rest } = r;
          return { ...rest, id: rest.id || _id.toString() } as ReferralRecord;
        });
      }
    } catch (error) {
      console.error("❌ Error loading referrals from MongoDB:", error);
    }
  }
  
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(REFERRAL_DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error: any) {
    if (error.code === "ENOENT") return [];
    console.error("Error loading referral database:", error);
    return [];
  }
}

async function loadSharePostsDatabase(): Promise<SharePost[]> {
  const useMongo = await isMongoDBAvailable();
  
  if (useMongo) {
    try {
      const posts = await mongoService.getAllSharePosts();
      if (posts.length > 0) {
        return posts.map((p: any) => {
          const { _id, ...rest } = p;
          return { ...rest, id: rest.id || _id.toString() } as SharePost;
        });
      }
    } catch (error) {
      console.error("❌ Error loading share posts from MongoDB:", error);
    }
  }
  
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(SHARE_POSTS_DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error: any) {
    if (error.code === "ENOENT") return [];
    console.error("Error loading share posts database:", error);
    return [];
  }
}

async function loadShareRecordsDatabase(): Promise<ShareRecord[]> {
  const useMongo = await isMongoDBAvailable();
  
  if (useMongo) {
    try {
      const records = await mongoService.getAllShareRecords();
      if (records.length > 0) {
        return records.map((r: any) => {
          const { _id, ...rest } = r;
          return { ...rest, id: rest.id || _id.toString() } as ShareRecord;
        });
      }
    } catch (error) {
      console.error("❌ Error loading share records from MongoDB:", error);
    }
  }
  
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(SHARE_RECORDS_DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error: any) {
    if (error.code === "ENOENT") return [];
    console.error("Error loading share records database:", error);
    return [];
  }
}

async function loadShareVisitorsDatabase(): Promise<ShareVisitor[]> {
  const useMongo = await isMongoDBAvailable();
  
  if (useMongo) {
    try {
      const visitors = await mongoService.getAllShareVisitors();
      if (visitors.length > 0) {
        return visitors.map((v: any) => {
          const { _id, ...rest } = v;
          return { ...rest, id: rest.id || _id.toString() } as ShareVisitor;
        });
      }
    } catch (error) {
      console.error("❌ Error loading share visitors from MongoDB:", error);
    }
  }
  
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(SHARE_VISITORS_DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error: any) {
    if (error.code === "ENOENT") return [];
    console.error("Error loading share visitors database:", error);
    return [];
  }
}

async function loadWithdrawRequestsDatabase(): Promise<WithdrawRequest[]> {
  const useMongo = await isMongoDBAvailable();
  
  if (useMongo) {
    try {
      const requests = await mongoService.getAllWithdrawRequests();
      if (requests.length > 0) {
        return requests.map((r: any) => {
          const { _id, ...rest } = r;
          return { ...rest, id: rest.id || _id.toString() } as WithdrawRequest;
        });
      }
    } catch (error) {
      console.error("❌ Error loading withdraw requests from MongoDB:", error);
    }
  }
  
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(WITHDRAW_REQUESTS_DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error: any) {
    if (error.code === "ENOENT") return [];
    console.error("Error loading withdraw requests database:", error);
    return [];
  }
}

// Save databases
async function saveReferralDatabase(data: ReferralRecord[]): Promise<void> {
  const useMongo = await isMongoDBAvailable();
  
  if (useMongo) {
    try {
      // Clear and save to MongoDB
      const existing = await mongoService.getAllReferrals();
      for (const item of existing) {
        await mongoService.deleteReferral((item as any)._id.toString());
      }
      for (const item of data) {
        await mongoService.createReferral(item);
      }
      return;
    } catch (error) {
      console.error("❌ Error saving referrals to MongoDB:", error);
    }
  }
  
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(REFERRAL_DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

async function saveSharePostsDatabase(data: SharePost[]): Promise<void> {
  const useMongo = await isMongoDBAvailable();
  
  if (useMongo) {
    try {
      const existing = await mongoService.getAllSharePosts();
      for (const item of existing) {
        await mongoService.deleteSharePost((item as any)._id.toString());
      }
      for (const item of data) {
        await mongoService.createSharePost(item);
      }
      return;
    } catch (error) {
      console.error("❌ Error saving share posts to MongoDB:", error);
    }
  }
  
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(SHARE_POSTS_DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

async function saveShareRecordsDatabase(data: ShareRecord[]): Promise<void> {
  const useMongo = await isMongoDBAvailable();
  
  if (useMongo) {
    try {
      const existing = await mongoService.getAllShareRecords();
      for (const item of existing) {
        await mongoService.deleteShareRecord((item as any)._id.toString());
      }
      for (const item of data) {
        await mongoService.createShareRecord(item);
      }
      return;
    } catch (error) {
      console.error("❌ Error saving share records to MongoDB:", error);
    }
  }
  
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(SHARE_RECORDS_DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

async function saveShareVisitorsDatabase(data: ShareVisitor[]): Promise<void> {
  const useMongo = await isMongoDBAvailable();
  
  if (useMongo) {
    try {
      const existing = await mongoService.getAllShareVisitors();
      for (const item of existing) {
        await mongoService.deleteShareVisitor((item as any)._id.toString());
      }
      for (const item of data) {
        await mongoService.createShareVisitor(item);
      }
      return;
    } catch (error) {
      console.error("❌ Error saving share visitors to MongoDB:", error);
    }
  }
  
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(SHARE_VISITORS_DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

async function saveWithdrawRequestsDatabase(data: WithdrawRequest[]): Promise<void> {
  const useMongo = await isMongoDBAvailable();
  
  if (useMongo) {
    try {
      const existing = await mongoService.getAllWithdrawRequests();
      for (const item of existing) {
        await mongoService.deleteWithdrawRequest((item as any)._id.toString());
      }
      for (const item of data) {
        await mongoService.createWithdrawRequest(item);
      }
      return;
    } catch (error) {
      console.error("❌ Error saving withdraw requests to MongoDB:", error);
    }
  }
  
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(WITHDRAW_REQUESTS_DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// Initialize on startup
import { isBuildTime } from "../utils/buildCheck.js";
if (!isBuildTime()) {
  Promise.all([
    loadReferralDatabase().then(data => { referralDatabase = data; }),
    loadSharePostsDatabase().then(data => { sharePostsDatabase = data; }),
    loadShareRecordsDatabase().then(data => { shareRecordsDatabase = data; }),
    loadShareVisitorsDatabase().then(data => { shareVisitorsDatabase = data; }),
    loadWithdrawRequestsDatabase().then(data => { withdrawRequestsDatabase = data; }),
  ]).then(() => {
    console.log(`Loaded referral system databases: ${referralDatabase.length} referrals, ${sharePostsDatabase.length} share posts, ${shareRecordsDatabase.length} share records`);
  });
}

// ==================== USER ENDPOINTS ====================

// Get user referral link and code
export const getUserReferralInfo: RequestHandler = async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;
  const email = req.user.email;
  
  // Get or generate referral code
  const { getUsersDatabase } = await import("./users.js");
  const users = await getUsersDatabase();
  const user = users.find(u => u.id === userId || u.email === email);
  
  let referralCode = (user as any)?.referralCode;
  if (!referralCode) {
    referralCode = generateReferralCode(userId, email);
    // Update user with referral code (would need to update users route)
  }

  // Return just the referral code - client will construct the full URL using current origin
  // This ensures the link always uses the correct domain
  res.json({
    referralCode,
    referralLink: `/signup?ref=${referralCode}`, // Relative path - client will prepend origin
  });
};

// Get user earnings
export const getUserEarnings: RequestHandler = async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;
  const userEmail = req.user.email?.toLowerCase();
  
  console.log(`[getUserEarnings] Request from user: ${userEmail} (ID: ${userId})`);
  
  // Reload databases to ensure we have the latest data (important after admin adds coins)
  await Promise.all([
    loadReferralDatabase().then(data => { referralDatabase = data; }),
    loadShareRecordsDatabase().then(data => { shareRecordsDatabase = data; }),
    loadWithdrawRequestsDatabase().then(data => { withdrawRequestsDatabase = data; }),
  ]);
  
  // Find the actual user in database to get their database ID (might be different from Firebase UID)
  const { getUsersDatabase } = await import("./users.js");
  const users = await getUsersDatabase();
  const dbUser = users.find(u => {
    const dbEmail = u.email?.toLowerCase();
    return (
      u.id === userId || 
      u.firebaseUid === userId ||
      (userEmail && dbEmail === userEmail)
    );
  });
  
  const actualUserId = dbUser?.id || userId;
  
  if (dbUser && dbUser.id !== userId) {
    console.log(`[getUserEarnings] User ID mismatch - Firebase UID: ${userId}, Database ID: ${dbUser.id}, using database ID`);
  }
  
  // Calculate earnings with fresh data - match by actual database user ID
  const referralCoins = referralDatabase
    .filter(r => r.referrerId === actualUserId && r.status === "approved")
    .reduce((sum, r) => sum + r.coinsEarned, 0);
  
  const adminPostShareCoins = shareRecordsDatabase
    .filter(s => s.userId === actualUserId && s.shareType === "admin_post" && s.status === "approved")
    .reduce((sum, s) => sum + s.coinsEarned, 0);
  
  const randomShareCoins = shareRecordsDatabase
    .filter(s => s.userId === actualUserId && s.shareType === "normal_link" && s.status === "approved")
    .reduce((sum, s) => sum + s.coinsEarned, 0);
  
  const shareCoins = adminPostShareCoins + randomShareCoins;
  const totalCoins = referralCoins + shareCoins;
  
  // CRITICAL: Match withdrawals by database ID OR Firebase UID to handle migration issues
  // Some withdrawals might be saved with Firebase UID, others with database ID
  const userWithdrawRequests = withdrawRequestsDatabase.filter(w => {
    const matchesDatabaseId = w.userId === actualUserId;
    const matchesFirebaseUid = w.userId === userId && userId !== actualUserId;
    return matchesDatabaseId || matchesFirebaseUid;
  });
  
  console.log(`[getUserEarnings] Found ${userWithdrawRequests.length} total withdraw requests for user (database ID: ${actualUserId}, Firebase UID: ${userId})`);
  userWithdrawRequests.forEach(w => {
    console.log(`  - Request ${w.id}: ${w.coins} coins, status: ${w.status}, userId: ${w.userId}`);
  });
  
  const pendingWithdraw = userWithdrawRequests
    .filter(w => w.status === "pending")
    .reduce((sum, w) => sum + w.coins, 0);
  
  // CRITICAL: Subtract both pending AND approved withdrawals from available coins
  // Approved withdrawals should permanently reduce available balance
  const approvedWithdraw = userWithdrawRequests
    .filter(w => w.status === "approved")
    .reduce((sum, w) => sum + w.coins, 0);
  
  const rejectedWithdraw = userWithdrawRequests
    .filter(w => w.status === "rejected")
    .reduce((sum, w) => sum + w.coins, 0);
  
  const totalWithdrawn = pendingWithdraw + approvedWithdraw;
  const availableCoins = totalCoins - totalWithdrawn;
  
  console.log(`[getUserEarnings] Calculated earnings for ${userEmail}:`, {
    actualUserId,
    firebaseUid: userId,
    adminPostShareCoins,
    randomShareCoins,
    totalCoins,
    pendingWithdraw,
    approvedWithdraw,
    rejectedWithdraw,
    totalWithdrawn,
    availableCoins,
    matchingShareRecords: shareRecordsDatabase.filter(s => s.userId === actualUserId && s.status === "approved").length
  });

  const earnings: UserEarnings = {
    totalCoins,
    referralCoins,
    shareCoins,
    adminPostShareCoins,
    randomShareCoins,
    pendingWithdraw,
    availableCoins,
  };

  res.json(earnings);
};

// Get active share posts
export const getActiveSharePosts: RequestHandler = async (req, res) => {
  const activePosts = sharePostsDatabase.filter(p => p.status === "active");
  res.json({ data: activePosts });
};

// Create share link
export const createShareLink: RequestHandler = async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;
  const { shareType, sharePostId, shareLink }: ShareLinkRequest = req.body;

  if (!shareType || !shareLink) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  if (shareType === "admin_post" && !sharePostId) {
    res.status(400).json({ error: "sharePostId required for admin_post type" });
    return;
  }

  // Validate admin post exists and is active
  if (shareType === "admin_post") {
    const post = sharePostsDatabase.find(p => p.id === sharePostId && p.status === "active");
    if (!post) {
      res.status(400).json({ error: "Invalid or inactive share post" });
      return;
    }
  }

  // Generate share code
  const shareCode = `SHARE${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const shareUrl = `${req.protocol}://${req.get('host')}/signup?share=${shareCode}`;

  // Create share record
  const shareRecord: ShareRecord = {
    id: shareCode,
    userId,
    shareType,
    sharePostId: shareType === "admin_post" ? sharePostId : undefined,
    shareLink,
    coinsEarned: 0,
    registrationCount: 0,
    createdAt: new Date().toISOString(),
    status: "pending",
  };

  shareRecordsDatabase.push(shareRecord);
  await saveShareRecordsDatabase(shareRecordsDatabase);

  const response: ShareLinkResponse = {
    shareUrl,
    shareCode,
    message: "Share link created successfully",
  };

  res.json(response);
};

// Get share history
export const getShareHistory: RequestHandler = async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;
  const userEmail = req.user.email;
  
  // Reload database to ensure fresh data
  await loadShareRecordsDatabase().then(data => { shareRecordsDatabase = data; });
  
  // Find the actual user in database to get their database ID
  const { getUsersDatabase } = await import("./users.js");
  const users = await getUsersDatabase();
  const dbUser = users.find(u => {
    const dbEmail = u.email?.toLowerCase();
    return (
      u.id === userId || 
      u.firebaseUid === userId ||
      (userEmail && dbEmail === userEmail?.toLowerCase())
    );
  });
  
  const actualUserId = dbUser?.id || userId;
  
  const userShares = shareRecordsDatabase
    .filter(s => s.userId === actualUserId) // Match by database ID
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ data: userShares });
};

// Get referral history
export const getReferralHistory: RequestHandler = async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;
  const userEmail = req.user.email;
  
  // Reload database to ensure fresh data
  await loadReferralDatabase().then(data => { referralDatabase = data; });
  
  // Find the actual user in database to get their database ID
  const { getUsersDatabase } = await import("./users.js");
  const users = await getUsersDatabase();
  const dbUser = users.find(u => {
    const dbEmail = u.email?.toLowerCase();
    return (
      u.id === userId || 
      u.firebaseUid === userId ||
      (userEmail && dbEmail === userEmail?.toLowerCase())
    );
  });
  
  const actualUserId = dbUser?.id || userId;
  
  const userReferrals = referralDatabase
    .filter(r => r.referrerId === actualUserId) // Match by database ID
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ data: userReferrals });
};

// Create withdraw request
export const createWithdrawRequest: RequestHandler = async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;
  const userEmail = req.user.email;
  const { coins, bkashNumber }: CreateWithdrawRequest = req.body;

  console.log(`[createWithdrawRequest] Request from user: ${userEmail} (ID: ${userId}), coins: ${coins}`);

  if (!coins || !bkashNumber) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  if (coins < 5000) {
    res.status(400).json({ error: "Minimum withdraw is 5000 coins" });
    return;
  }

  // Find the actual user in database to get their database ID
  const { getUsersDatabase } = await import("./users.js");
  const users = await getUsersDatabase();
  const dbUser = users.find(u => {
    const dbEmail = u.email?.toLowerCase();
    return (
      u.id === userId || 
      u.firebaseUid === userId ||
      (userEmail && dbEmail === userEmail?.toLowerCase())
    );
  });
  
  const actualUserId = dbUser?.id || userId;
  
  if (dbUser && dbUser.id !== userId) {
    console.log(`[createWithdrawRequest] User ID mismatch - Firebase UID: ${userId}, Database ID: ${actualUserId}, using database ID`);
  }

  // Reload withdraw requests database
  await loadWithdrawRequestsDatabase().then(data => { withdrawRequestsDatabase = data; });

  // Check available coins - pass email to ensure correct user ID lookup
  const earnings = await getUserEarningsData(userId, userEmail);
  console.log(`[createWithdrawRequest] Available coins: ${earnings.availableCoins}, requested: ${coins}`);
  
  if (earnings.availableCoins < coins) {
    res.status(400).json({ 
      error: "Insufficient coins",
      available: earnings.availableCoins,
      requested: coins
    });
    return;
  }

  // Check for pending requests using database ID
  const hasPending = withdrawRequestsDatabase.some(
    w => w.userId === actualUserId && w.status === "pending"
  );
  if (hasPending) {
    res.status(400).json({ error: "You already have a pending withdraw request" });
    return;
  }

  const amountBdt = (coins / 5000) * 100; // 5000 coins = 100 BDT

  const withdrawRequest: WithdrawRequest = {
    id: `WDR${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    userId: actualUserId, // Use database ID, not Firebase UID
    coins,
    amountBdt,
    bkashNumber,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  withdrawRequestsDatabase.push(withdrawRequest);
  await saveWithdrawRequestsDatabase(withdrawRequestsDatabase);
  
  // Reload to sync in-memory database
  await loadWithdrawRequestsDatabase().then(data => { withdrawRequestsDatabase = data; });

  console.log(`[createWithdrawRequest] ✅ Withdraw request created: ${withdrawRequest.id} for user ${actualUserId}`);

  res.json({ message: "Withdraw request created successfully", request: withdrawRequest });
};

// Get withdraw history
export const getWithdrawHistory: RequestHandler = async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;
  const userEmail = req.user.email;
  
  // Reload database to ensure fresh data
  await loadWithdrawRequestsDatabase().then(data => { withdrawRequestsDatabase = data; });
  
  // Find the actual user in database to get their database ID
  const { getUsersDatabase } = await import("./users.js");
  const users = await getUsersDatabase();
  const dbUser = users.find(u => {
    const dbEmail = u.email?.toLowerCase();
    return (
      u.id === userId || 
      u.firebaseUid === userId ||
      (userEmail && dbEmail === userEmail?.toLowerCase())
    );
  });
  
  const actualUserId = dbUser?.id || userId;
  
  // CRITICAL: Match withdrawals by database ID OR Firebase UID to handle migration issues
  // Some withdrawals might be saved with Firebase UID, others with database ID
  const userWithdraws = withdrawRequestsDatabase
    .filter(w => {
      const matchesDatabaseId = w.userId === actualUserId;
      const matchesFirebaseUid = w.userId === userId && userId !== actualUserId;
      return matchesDatabaseId || matchesFirebaseUid;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  console.log(`[getWithdrawHistory] Found ${userWithdraws.length} withdraw requests for user (database ID: ${actualUserId}, Firebase UID: ${userId})`);
  userWithdraws.forEach(w => {
    console.log(`  - Request ${w.id}: ${w.coins} coins, status: ${w.status}, userId: ${w.userId}`);
  });

  res.json({ data: userWithdraws });
};

// Track share visitor
export const trackShareVisitor: RequestHandler = async (req, res) => {
  const { shareCode } = req.query;
  
  if (!shareCode || typeof shareCode !== "string") {
    res.status(400).json({ error: "Invalid share code" });
    return;
  }

  const shareRecord = shareRecordsDatabase.find(s => s.id === shareCode);
  if (!shareRecord) {
    res.status(404).json({ error: "Share link not found" });
    return;
  }

  const visitorIp = getClientIp(req);
  const userAgent = req.headers['user-agent'] || 'unknown';

  // Check if this IP already visited this share link
  const existingVisitor = shareVisitorsDatabase.find(
    v => v.shareRecordId === shareCode && v.visitorIp === visitorIp && !v.registered
  );

  if (!existingVisitor) {
    const visitor: ShareVisitor = {
      id: `VIS${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      shareRecordId: shareCode,
      visitorIp,
      visitorUserAgent: userAgent,
      visitedAt: new Date().toISOString(),
      registered: false,
    };

    shareVisitorsDatabase.push(visitor);
    await saveShareVisitorsDatabase(shareVisitorsDatabase);
  }

  res.json({ message: "Visitor tracked" });
};

// Helper function to get user earnings data
async function getUserEarningsData(userId: string, userEmail?: string): Promise<UserEarnings> {
  // Reload databases to ensure we have the latest data
  await Promise.all([
    loadReferralDatabase().then(data => { referralDatabase = data; }),
    loadShareRecordsDatabase().then(data => { shareRecordsDatabase = data; }),
    loadWithdrawRequestsDatabase().then(data => { withdrawRequestsDatabase = data; }),
  ]);
  
  // Find the actual user in database to get their database ID (might be different from Firebase UID)
  const { getUsersDatabase } = await import("./users.js");
  const users = await getUsersDatabase();
  const dbUser = users.find(u => {
    const dbEmail = u.email?.toLowerCase();
    return (
      u.id === userId || 
      u.firebaseUid === userId ||
      (userEmail && dbEmail === userEmail?.toLowerCase())
    );
  });
  
  const actualUserId = dbUser?.id || userId;
  
  if (dbUser && dbUser.id !== userId) {
    console.log(`[getUserEarningsData] User ID mismatch - Input ID: ${userId}, Database ID: ${dbUser.id}, using database ID`);
  }
  
  // Calculate earnings with fresh data - match by actual database user ID
  // Include both pending and approved - users get coins immediately, but admins can still reject
  const referralCoins = referralDatabase
    .filter(r => r.referrerId === actualUserId && (r.status === "approved" || r.status === "pending"))
    .reduce((sum, r) => sum + r.coinsEarned, 0);
  
  const adminPostShareCoins = shareRecordsDatabase
    .filter(s => s.userId === actualUserId && s.shareType === "admin_post" && (s.status === "approved" || s.status === "pending"))
    .reduce((sum, s) => sum + s.coinsEarned, 0);
  
  const randomShareCoins = shareRecordsDatabase
    .filter(s => s.userId === actualUserId && s.shareType === "normal_link" && (s.status === "approved" || s.status === "pending"))
    .reduce((sum, s) => sum + s.coinsEarned, 0);
  
  const shareCoins = adminPostShareCoins + randomShareCoins;
  const totalCoins = referralCoins + shareCoins;
  
  // CRITICAL: Match withdrawals by database ID OR Firebase UID to handle migration issues
  // Some withdrawals might be saved with Firebase UID, others with database ID
  const userWithdrawRequests = withdrawRequestsDatabase.filter(w => {
    const matchesDatabaseId = w.userId === actualUserId;
    const matchesFirebaseUid = w.userId === userId && userId !== actualUserId;
    return matchesDatabaseId || matchesFirebaseUid;
  });
  
  const pendingWithdraw = userWithdrawRequests
    .filter(w => w.status === "pending")
    .reduce((sum, w) => sum + w.coins, 0);
  
  // CRITICAL: Subtract both pending AND approved withdrawals from available coins
  // Approved withdrawals should permanently reduce available balance
  const approvedWithdraw = userWithdrawRequests
    .filter(w => w.status === "approved")
    .reduce((sum, w) => sum + w.coins, 0);
  
  const totalWithdrawn = pendingWithdraw + approvedWithdraw;
  const availableCoins = totalCoins - totalWithdrawn;

  return {
    totalCoins,
    referralCoins,
    shareCoins,
    adminPostShareCoins,
    randomShareCoins,
    pendingWithdraw,
    availableCoins,
  };
}

// Process referral on signup (called from auth route)
export async function processReferralSignup(
  newUserId: string,
  newUserEmail: string,
  referralCode?: string,
  shareCode?: string,
  userIp?: string
): Promise<void> {
  // Reload databases to ensure we have the latest data
  await Promise.all([
    loadReferralDatabase().then(data => { referralDatabase = data; }),
    loadShareRecordsDatabase().then(data => { shareRecordsDatabase = data; }),
    loadSharePostsDatabase().then(data => { sharePostsDatabase = data; }),
    loadShareVisitorsDatabase().then(data => { shareVisitorsDatabase = data; }),
  ]);
  
  console.log(`[processReferralSignup] Processing signup for user: ${newUserEmail} (ID: ${newUserId})`);
  console.log(`[processReferralSignup] Referral code: ${referralCode || 'none'}, Share code: ${shareCode || 'none'}`);
  
  // Process referral
  if (referralCode) {
    const { getUsersDatabase } = await import("./users.js");
    const users = await getUsersDatabase();
    const referrer = users.find((u: any) => u.referralCode === referralCode);
    
    if (!referrer) {
      console.log(`[Referral] Referrer not found for code: ${referralCode}`);
      return;
    }

    console.log(`[Referral] Found referrer: ${referrer.email} (${referrer.id}) for code: ${referralCode}`);
    
    // Check for duplicate referral - check if this user was already referred by this referrer
    const existingReferral = referralDatabase.find(
      r => r.referredId === newUserId && r.referrerId === referrer.id
    );

    if (existingReferral) {
      console.log(`[Referral] Duplicate referral detected for user ${newUserId} by referrer ${referrer.id}`);
      return;
    }

    // Check IP if provided to prevent self-referrals
    if (userIp && userIp !== 'unknown') {
      const { getUsersDatabase: getUsers } = await import("./users.js");
      const allUsers = await getUsers();
      const sameIpUser = allUsers.find((u: any) => u.lastIp === userIp && u.id !== newUserId);
      if (sameIpUser && sameIpUser.id === referrer.id) {
        console.log(`[Referral] Self-referral detected (same IP: ${userIp})`);
        return;
      }
    }

    const referralRecord: ReferralRecord = {
      id: `REF${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      referrerId: referrer.id,
      referredId: newUserId,
      coinsEarned: 100, // Fixed 100 coins
      createdAt: new Date().toISOString(),
      status: "pending", // Admin can approve/reject
    };

    referralDatabase.push(referralRecord);
    await saveReferralDatabase(referralDatabase);
    console.log(`[Referral] ✅ Created referral record: ${referralRecord.id} for referrer ${referrer.id}, referred user ${newUserId}`);
  }

  // Process share
  if (shareCode) {
    const shareRecord = shareRecordsDatabase.find(s => s.id === shareCode);
    if (shareRecord) {
      // Check if user already registered from this share
      const existingRegistration = shareVisitorsDatabase.find(
        v => v.shareRecordId === shareCode && v.registeredUserId === newUserId
      );

      if (!existingRegistration) {
        // Mark visitor as registered
        const visitor = shareVisitorsDatabase.find(
          v => v.shareRecordId === shareCode && !v.registered
        );
        if (visitor) {
          visitor.registered = true;
          visitor.registeredUserId = newUserId;
          await saveShareVisitorsDatabase(shareVisitorsDatabase);
        }

        // Calculate coins
        let coinsEarned = 0;
        if (shareRecord.shareType === "admin_post" && shareRecord.sharePostId) {
          const post = sharePostsDatabase.find(p => p.id === shareRecord.sharePostId);
          coinsEarned = post ? post.coinValue : 0;
        } else {
          // Random coins (5-100)
          coinsEarned = generateRandomCoins();
        }

        // Update share record
        shareRecord.registrationCount += 1;
        shareRecord.coinsEarned += coinsEarned;
        shareRecord.status = "pending"; // Admin can approve/reject
        await saveShareRecordsDatabase(shareRecordsDatabase);
      }
    }
  }
}

// ==================== ADMIN ENDPOINTS ====================

// Helper function to check if user is admin
async function checkAdminAccess(req: any): Promise<boolean> {
  if (!req.user) {
    console.log("[checkAdminAccess] ❌ No user in request");
    return false;
  }
  
  try {
    const { getUsersDatabase } = await import("./users.js");
    const users = await getUsersDatabase();
    
    // Check admin email from environment variable
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@freemediabuzz.com").toLowerCase();
    const userEmail = req.user.email?.toLowerCase();
    const userId = req.user.id;
    
    console.log("[checkAdminAccess] Checking access for:", { 
      userId: userId, 
      userEmail: req.user.email,
      userName: req.user.name,
      adminEmail: adminEmail,
      totalUsersInDB: users.length
    });
    
    // First check: If user's email matches admin email, grant access immediately
    if (userEmail && userEmail === adminEmail) {
      console.log("[checkAdminAccess] ✅ Admin access granted via email match");
      return true;
    }
    
    // Second check: Look up user in database by multiple methods
    // Try matching by: email (most reliable), Firebase UID, or database ID
    const user = users.find(u => {
      const dbEmail = u.email?.toLowerCase();
      const dbId = u.id;
      const dbFirebaseUid = (u as any).firebaseUid;
      
      // Match by email (most reliable)
      if (userEmail && dbEmail && dbEmail === userEmail) {
        return true;
      }
      
      // Match by Firebase UID if it exists
      if (userId && dbFirebaseUid && dbFirebaseUid === userId) {
        return true;
      }
      
      // Match by database ID
      if (userId && dbId && dbId === userId) {
        return true;
      }
      
      return false;
    });
    
    if (user) {
      console.log("[checkAdminAccess] Found user in database:", { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        firebaseUid: (user as any).firebaseUid,
        accountType: user.accountType
      });
      
      if (user.role === "admin") {
        console.log("[checkAdminAccess] ✅ Admin access granted via database role");
        return true;
      } else {
        console.log("[checkAdminAccess] ❌ User found but not admin. Role:", user.role);
        
        // Double-check: If email matches admin email but role is not admin, grant access anyway
        // (This handles cases where the role wasn't set properly during registration)
        if (userEmail && userEmail === adminEmail) {
          console.log("[checkAdminAccess] ✅ Admin access granted (email matches admin, role needs update)");
          // Note: Role will be updated on next user registration/update
          return true;
        }
      }
    } else {
      console.log("[checkAdminAccess] ❌ User not found in database");
      console.log("[checkAdminAccess] Searching criteria:", {
        searchedEmail: userEmail,
        searchedId: userId,
        availableEmails: users.map(u => u.email),
        availableIds: users.map(u => ({ id: u.id, firebaseUid: (u as any).firebaseUid }))
      });
      
      // If email matches admin email but user not in DB, grant access anyway
      if (userEmail && userEmail === adminEmail) {
        console.log("[checkAdminAccess] ✅ Admin access granted (email matches admin, user not yet in DB)");
        return true;
      }
    }
    
    console.log("[checkAdminAccess] ❌ Final decision: Access denied");
    return false;
  } catch (error) {
    console.error("[checkAdminAccess] ❌ Error checking admin access:", error);
    if (error instanceof Error) {
      console.error("[checkAdminAccess] Error stack:", error.stack);
    }
    return false;
  }
}

// Get all share posts
// Note: Admin access check removed - admin panel authentication is handled at the route level
export const getAllSharePosts: RequestHandler = async (req, res) => {
  res.json({ data: sharePostsDatabase });
};

// Get active share posts that should show as pop-ups (public endpoint)
export const getActiveSharePostsForPopup: RequestHandler = async (req, res) => {
  await loadSharePostsDatabase().then(data => { sharePostsDatabase = data; });
  
  const activeSharePosts = sharePostsDatabase.filter(
    (post) => post.status === "active" && post.showAsPopup && (post.imageUrl || post.videoUrl)
  );
  
  res.json({ data: activeSharePosts });
};

// Create share post
// Note: Admin access check removed - admin panel authentication is handled at the route level
export const createSharePost: RequestHandler = async (req, res) => {
  const { title, url, coinValue, status = "active", imageUrl, videoUrl, showAsPopup, showDelay, closeAfter, maxDisplays }: CreateSharePostRequest = req.body;

  if (!title || !url || !coinValue) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const sharePost: SharePost = {
    id: `POST${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    title,
    url,
    coinValue,
    status,
    imageUrl,
    videoUrl,
    showAsPopup: showAsPopup || false,
    showDelay: showDelay || 2000,
    closeAfter,
    maxDisplays,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  sharePostsDatabase.push(sharePost);
  await saveSharePostsDatabase(sharePostsDatabase);

  res.json({ message: "Share post created successfully", post: sharePost });
};

// Update share post
// Note: Admin access check removed - admin panel authentication is handled at the route level
export const updateSharePost: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const updates: UpdateSharePostRequest = req.body;

  const postIndex = sharePostsDatabase.findIndex(p => p.id === id);
  if (postIndex === -1) {
    res.status(404).json({ error: "Share post not found" });
    return;
  }

  sharePostsDatabase[postIndex] = {
    ...sharePostsDatabase[postIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await saveSharePostsDatabase(sharePostsDatabase);

  res.json({ message: "Share post updated successfully", post: sharePostsDatabase[postIndex] });
};

// Delete share post
// Note: Admin access check removed - admin panel authentication is handled at the route level
export const deleteSharePost: RequestHandler = async (req, res) => {
  const { id } = req.params;

  sharePostsDatabase = sharePostsDatabase.filter(p => p.id !== id);
  await saveSharePostsDatabase(sharePostsDatabase);

  res.json({ message: "Share post deleted successfully" });
};

// Get all referrals
export const getAllReferrals: RequestHandler = async (req, res) => {
  console.log("[getAllReferrals] Request received - fetching all referrals");

  try {
    // Reload database to ensure fresh data
    await loadReferralDatabase().then(data => { referralDatabase = data; });
    // Enrich referrals with user information
    const { getUsersDatabase } = await import("./users.js");
    const users = await getUsersDatabase();
    
    const enrichedReferrals = referralDatabase.map(referral => {
      const referrer = users.find(u => u.id === referral.referrerId);
      const referred = users.find(u => u.id === referral.referredId);
      return {
        ...referral,
        referrerName: referrer?.name || "Unknown",
        referrerEmail: referrer?.email || "Unknown",
        referredName: referred?.name || "Unknown",
        referredEmail: referred?.email || "Unknown",
      };
    });

    res.json({ data: enrichedReferrals });
  } catch (error) {
    console.error("Error getting referrals:", error);
    res.json({ data: referralDatabase });
  }
};

// Approve/reject referral
export const updateReferralStatus: RequestHandler = async (req, res) => {
  console.log("[updateReferralStatus] Request received");

  // Reload database to ensure fresh data
  await loadReferralDatabase().then(data => { referralDatabase = data; });

  const { id } = req.params;
  const { status, adminNote } = req.body;

  console.log(`[updateReferralStatus] Updating referral ${id} to status: ${status}`);

  if (!status || !["pending", "approved", "rejected"].includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const referralIndex = referralDatabase.findIndex(r => r.id === id);
  if (referralIndex === -1) {
    res.status(404).json({ error: "Referral not found" });
    return;
  }

  referralDatabase[referralIndex] = {
    ...referralDatabase[referralIndex],
    status,
    adminNote,
  };

  await saveReferralDatabase(referralDatabase);
  
  // Reload to ensure data is persisted
  await loadReferralDatabase().then(data => { referralDatabase = data; });

  console.log(`[updateReferralStatus] ✅ Referral ${id} updated to ${status}`);
  res.json({ message: "Referral status updated", referral: referralDatabase[referralIndex] });
};

// Get all share records
export const getAllShareRecords: RequestHandler = async (req, res) => {
  console.log("[getAllShareRecords] Request received - fetching all share records");

  try {
    // Reload database to ensure fresh data
    await loadShareRecordsDatabase().then(data => { shareRecordsDatabase = data; });
    // Enrich share records with user information
    const { getUsersDatabase } = await import("./users.js");
    const users = await getUsersDatabase();
    
    const enrichedRecords = shareRecordsDatabase.map(record => {
      const user = users.find(u => u.id === record.userId);
      return {
        ...record,
        userName: user?.name || "Unknown",
        userEmail: user?.email || "Unknown",
      };
    });

    res.json({ data: enrichedRecords });
  } catch (error) {
    console.error("Error getting share records:", error);
    res.json({ data: shareRecordsDatabase });
  }
};

// Approve/reject share record
export const updateShareRecordStatus: RequestHandler = async (req, res) => {
  console.log("[updateShareRecordStatus] Request received");

  // Reload database to ensure fresh data
  await loadShareRecordsDatabase().then(data => { shareRecordsDatabase = data; });

  const { id } = req.params;
  const { status, adminNote } = req.body;

  console.log(`[updateShareRecordStatus] Updating share record ${id} to status: ${status}`);

  if (!status || !["pending", "approved", "rejected"].includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const recordIndex = shareRecordsDatabase.findIndex(r => r.id === id);
  if (recordIndex === -1) {
    res.status(404).json({ error: "Share record not found" });
    return;
  }

  shareRecordsDatabase[recordIndex] = {
    ...shareRecordsDatabase[recordIndex],
    status,
    adminNote,
  };

  await saveShareRecordsDatabase(shareRecordsDatabase);
  
  // Reload to ensure data is persisted
  await loadShareRecordsDatabase().then(data => { shareRecordsDatabase = data; });

  console.log(`[updateShareRecordStatus] ✅ Share record ${id} updated to ${status}`);
  res.json({ message: "Share record status updated", record: shareRecordsDatabase[recordIndex] });
};

// Get all withdraw requests
export const getAllWithdrawRequests: RequestHandler = async (req, res) => {
  console.log("[getAllWithdrawRequests] Request received - fetching all withdraw requests");

  try {
    // Reload database to ensure fresh data
    await loadWithdrawRequestsDatabase().then(data => { 
      withdrawRequestsDatabase = data;
      console.log(`[getAllWithdrawRequests] Loaded ${data.length} withdraw requests from database`);
    });
    
    // Enrich withdraw requests with user information
    const { getUsersDatabase } = await import("./users.js");
    const users = await getUsersDatabase();
    console.log(`[getAllWithdrawRequests] Found ${users.length} users in database`);
    
    const enrichedRequests = withdrawRequestsDatabase.map(request => {
      // Match user by database ID or Firebase UID
      const user = users.find(u => 
        u.id === request.userId || 
        u.firebaseUid === request.userId
      );
      
      if (!user) {
        console.log(`[getAllWithdrawRequests] ⚠️ User not found for request ${request.id}, userId: ${request.userId}`);
      }
      
      return {
        ...request,
        userName: user?.name || "Unknown",
        userEmail: user?.email || "Unknown",
      };
    });

    console.log(`[getAllWithdrawRequests] ✅ Returning ${enrichedRequests.length} enriched withdraw requests`);
    res.json({ data: enrichedRequests });
  } catch (error) {
    console.error("[getAllWithdrawRequests] ❌ Error getting withdraw requests:", error);
    res.json({ data: withdrawRequestsDatabase || [] });
  }
};

// Approve/reject withdraw request
export const updateWithdrawRequestStatus: RequestHandler = async (req, res) => {
  console.log("[updateWithdrawRequestStatus] Request received");

  // Reload database to ensure fresh data
  await loadWithdrawRequestsDatabase().then(data => { withdrawRequestsDatabase = data; });

  const { id } = req.params;
  const { status, adminNote } = req.body;

  console.log(`[updateWithdrawRequestStatus] Updating request ${id} to status: ${status}`);

  if (!status || !["pending", "approved", "rejected"].includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const requestIndex = withdrawRequestsDatabase.findIndex(w => w.id === id);
  if (requestIndex === -1) {
    res.status(404).json({ error: "Withdraw request not found" });
    return;
  }

  withdrawRequestsDatabase[requestIndex] = {
    ...withdrawRequestsDatabase[requestIndex],
    status,
    adminNote,
    processedAt: status !== "pending" ? new Date().toISOString() : undefined,
  };

  await saveWithdrawRequestsDatabase(withdrawRequestsDatabase);
  
  // Reload to ensure data is persisted
  await loadWithdrawRequestsDatabase().then(data => { withdrawRequestsDatabase = data; });

  console.log(`[updateWithdrawRequestStatus] ✅ Request ${id} updated to ${status}`);
  res.json({ message: "Withdraw request status updated", request: withdrawRequestsDatabase[requestIndex] });
};

// Get all share visitors
export const getAllShareVisitors: RequestHandler = async (req, res) => {
  const isAdmin = await checkAdminAccess(req);
  if (!isAdmin) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.json({ data: shareVisitorsDatabase });
};

// Admin endpoint: Add coins to a user (for testing/admin purposes)
// Note: Admin access check removed - admin panel authentication is handled at the route level
export const addUserCoins: RequestHandler = async (req, res) => {
  console.log("[addUserCoins] Request received - processing add coins request");

  const { email, coins, note } = req.body;

  console.log("[addUserCoins] Request body:", { email, coins, note, coinsType: typeof coins });

  // Handle coins as string from form (convert to number)
  const coinsAmount = typeof coins === 'string' ? parseInt(coins, 10) : typeof coins === 'number' ? coins : parseInt(String(coins || '0'), 10);

  if (!email || !coinsAmount || isNaN(coinsAmount) || coinsAmount <= 0) {
    res.status(400).json({ 
      error: "Valid email and positive coins amount are required",
      received: { email, coins, coinsAmount, coinsType: typeof coins }
    });
    return;
  }

  try {
    // Find user by email
    const { getUsersDatabase } = await import("./users.js");
    const users = await getUsersDatabase();
    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      res.status(404).json({ error: "User not found with that email" });
      return;
    }

    // Reload share records database
    await loadShareRecordsDatabase().then(data => { shareRecordsDatabase = data; });

    // Create an approved share record to grant coins
    const shareRecord: ShareRecord = {
      id: `ADMIN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      userId: user.id,
      shareType: "admin_post",
      shareLink: "admin-grant",
      coinsEarned: coinsAmount,
      registrationCount: 0,
      createdAt: new Date().toISOString(),
      status: "approved", // Automatically approved
      adminNote: note || `Admin grant of ${coinsAmount} coins`,
    };

    shareRecordsDatabase.push(shareRecord);
    await saveShareRecordsDatabase(shareRecordsDatabase);
    
    // Reload to ensure in-memory database is synced
    await loadShareRecordsDatabase().then(data => { shareRecordsDatabase = data; });

    console.log(`[Admin] ✅ Granted ${coinsAmount} coins to user ${email}`);
    console.log(`[Admin] User database ID: ${user.id}`);
    console.log(`[Admin] User Firebase UID: ${user.firebaseUid || 'N/A'}`);
    console.log(`[Admin] Share record created:`, {
      id: shareRecord.id,
      userId: shareRecord.userId,
      coinsEarned: shareRecord.coinsEarned,
      status: shareRecord.status,
      shareType: shareRecord.shareType
    });

    res.json({
      success: true,
      message: `Successfully added ${coinsAmount} coins to ${email}`,
      shareRecord,
      userInfo: {
        databaseId: user.id,
        firebaseUid: user.firebaseUid,
        email: user.email
      }
    });
  } catch (error: any) {
    console.error("[Admin] Error adding coins to user:", error);
    res.status(500).json({ error: error.message || "Failed to add coins to user" });
  }
};

