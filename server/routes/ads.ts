import { RequestHandler } from "express";
import { promises as fs } from "fs";
import { join } from "path";
import { DATA_DIR } from "../utils/dataPath.js";
import { isMongoDBAvailable } from "../utils/mongodb.js";
import * as mongoService from "../services/mongodbService.js";
import {
  Ad,
  AdViewRecord,
  CreateAdRequest,
  UpdateAdRequest,
  StartAdWatchRequest,
  StartAdWatchResponse,
  CompleteAdWatchRequest,
  CompleteAdWatchResponse,
  UserEarnings,
} from "@shared/api";

const ADS_DB_FILE = join(DATA_DIR, "ads-database.json");
const AD_VIEWS_DB_FILE = join(DATA_DIR, "ad-views-database.json");

// In-memory storage
let adsDatabase: Ad[] = [];
let adViewsDatabase: AdViewRecord[] = [];

// Active watch sessions (temporary, in-memory only)
interface WatchSession {
  watchId: string;
  userId: string;
  adId: string;
  startTime: number;
}

const activeWatchSessions = new Map<string, WatchSession>();

// Helper: Generate random coins between min and max
function generateRandomCoins(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


// Adsterra directlink ads list (for ad watching earning system)
const ADSTERRA_DIRECTLINKS = [
  "https://www.effectivegatecpm.com/hfy73qcy?key=e260bfac004e18965e13c7172696c1a3",
  "https://www.effectivegatecpm.com/ywhsa6yivz?key=bfec6a8bc15be21a9df294ff59815f8a",
  "https://www.effectivegatecpm.com/nt1fr8zua?key=ac0794fdc21673207b81cbf11e48786d",
  "https://www.effectivegatecpm.com/kbak28mme?key=4490d0846ff38b21b8e203adba4ee1e7",
  "https://www.effectivegatecpm.com/tjdzfszkgx?key=0857d1051a4e330c49332d384e8c7224",
  "https://www.effectivegatecpm.com/zm78tt82?key=8e75e688fb529c7e4e19b4023efde58a",
  "https://www.effectivegatecpm.com/xwkce5cqb5?key=a51fb8ac1e251487604903a450df3022",
  "https://www.effectivegatecpm.com/yjsx8070?key=d8d1ec71150dc79a9a16cfb5b6933aa6",
  "https://www.effectivegatecpm.com/yah4ti7k5?key=a021f0d4f330e7dd684090beb79fca53",
  "https://www.effectivegatecpm.com/ta0phpns?key=b5968cffaeae3f4ba4cc1b8d9f04627a",
  "https://www.effectivegatecpm.com/zzp52zmx?key=8f7d2827bbc3ed2e669873b5a864c6f9",
  "https://www.effectivegatecpm.com/pahd2aakkt?key=29cea4f7e122e7206cc4d7e17343fdc6",
  "https://www.effectivegatecpm.com/vvumg5fqg2?key=1cb75527f5edcd5929e57a06e1d27df6",
  "https://www.effectivegatecpm.com/byxrhrg3?key=c3543a8bba23c39fe33fc01d1ed4d260",
  "https://www.effectivegatecpm.com/ui2r75xv?key=8a6fef106b36cb213591cff574c778e2",
  "https://www.effectivegatecpm.com/msrc48a3?key=448ee3d229c4064ce805ee282a71254a",
  "https://www.effectivegatecpm.com/ycz1ni72n4?key=c807520bd1ea3746dc694effb2d3eebb",
  "https://www.effectivegatecpm.com/a51535dr?key=66e6ad1660b40bb8f64c42887ec8ebb4",
  "https://www.effectivegatecpm.com/b10fnb3rd?key=f923d62d96f4719b7797e881a42b8fb0",
];

// Helper: Create Adsterra ads from directlinks (for ad watching earning system)
function createAdsterraAds(): Ad[] {
  const usedNames = new Set<string>();
  return ADSTERRA_DIRECTLINKS.map((url, index) => ({
    id: `ADSTERRA-${index + 1}`,
    title: getRandomAdName(index, usedNames),
    adType: "adsterra" as const,
    adUrl: url,
    status: "active" as const,
    minCoins: 20,
    maxCoins: 80,
    watchDuration: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

// Helper: Get daily ad view count for user
async function getDailyAdViewCount(userId: string, userEmail?: string): Promise<number> {
  try {
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
    
    await loadAdViewsDatabase().then(data => { adViewsDatabase = data; });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Match by database ID or Firebase UID (for backward compatibility)
    return adViewsDatabase.filter(v => {
      try {
        const viewDate = new Date(v.createdAt);
        const isToday = viewDate >= today && viewDate < tomorrow;
        const vUserId = String(v.userId || '').trim();
        
        // Match by database ID
        const matchesDatabaseId = vUserId === actualUserId;
        // Match by Firebase UID (if different from database ID)
        const matchesFirebaseUid = vUserId === userId && userId !== actualUserId;
        
        return isToday && (matchesDatabaseId || matchesFirebaseUid);
      } catch (e) {
        return false;
      }
    }).length;
  } catch (error) {
    console.error("Error getting daily ad view count:", error);
    return 0;
  }
}

// Helper: Get today's total coins earned from ads for user
async function getTodayAdCoinsEarned(userId: string, userEmail?: string): Promise<number> {
  try {
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
      console.log(`[getTodayAdCoinsEarned] User ID converted - Input ID: ${userId}, Database ID: ${actualUserId}`);
    }
    
    await loadAdViewsDatabase().then(data => { adViewsDatabase = data; });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log(`[getTodayAdCoinsEarned] Checking for user ${actualUserId}${userId !== actualUserId ? ` (Firebase: ${userId})` : ''}, email: ${userEmail || 'N/A'}`);
    console.log(`[getTodayAdCoinsEarned] Today range: ${today.toISOString()} to ${tomorrow.toISOString()}`);
    console.log(`[getTodayAdCoinsEarned] Total ad views in database: ${adViewsDatabase.length}`);
    
    // Debug: Show all records that might match
    const allPossibleMatches = adViewsDatabase.filter(v => {
      const vUserId = String(v.userId || '').trim();
      return vUserId === actualUserId || vUserId === userId || 
             (userEmail && users.some(u => String(u.id) === vUserId && u.email?.toLowerCase() === userEmail?.toLowerCase()));
    });
    console.log(`[getTodayAdCoinsEarned] Found ${allPossibleMatches.length} total ad views that might belong to this user`);
    allPossibleMatches.forEach(v => {
      const viewDate = new Date(v.createdAt);
      const isToday = viewDate >= today && viewDate < tomorrow;
      console.log(`[getTodayAdCoinsEarned]   - Record: userId=${v.userId}, coins=${v.coinsEarned}, status=${v.status}, completed=${v.completed}, date=${v.createdAt}, isToday=${isToday}`);
    });
    
    // Match by database ID, Firebase UID, or user lookup (similar to earnings calculation)
    const todayViews = adViewsDatabase.filter(v => {
      try {
        const viewDate = new Date(v.createdAt);
        const isToday = viewDate >= today && viewDate < tomorrow;
        
        const vUserId = String(v.userId || '').trim();
        
        // Match by database ID
        const matchesDatabaseId = vUserId === actualUserId;
        
        // Match by Firebase UID (if different from database ID)
        const matchesFirebaseUid = vUserId === userId && userId !== actualUserId;
        
        // Try to find the user by the userId stored in the record
        let matchesByUserLookup = false;
        if (!matchesDatabaseId && !matchesFirebaseUid) {
          const recordUser = users.find(u => 
            String(u.id) === vUserId || 
            String(u.firebaseUid || '') === vUserId ||
            (userEmail && u.email?.toLowerCase() === userEmail?.toLowerCase() && String(u.id) === vUserId)
          );
          matchesByUserLookup = recordUser?.id === actualUserId || (recordUser && userEmail && recordUser.email?.toLowerCase() === userEmail?.toLowerCase());
        }
        
        const matches = matchesDatabaseId || matchesFirebaseUid || matchesByUserLookup;
        
        // Count any view with coins earned today - if coins were earned, it should count
        // This is more lenient than checking status, since coinsEarned > 0 means coins were actually awarded
        const hasCoins = (v.coinsEarned || 0) > 0;
        
        // Count if: today + matches user + has coins
        const shouldCount = isToday && matches && hasCoins;
        
        if (shouldCount) {
          console.log(`[getTodayAdCoinsEarned] ✓ COUNTING: recordUserId=${vUserId}, coins=${v.coinsEarned}, status=${v.status}, completed=${v.completed}, date=${v.createdAt}`);
        } else if (isToday && matches && !hasCoins) {
          console.log(`[getTodayAdCoinsEarned] ✗ Matches user and today but no coins: recordUserId=${vUserId}, coins=${v.coinsEarned}, status=${v.status}`);
        } else if (matches && hasCoins && !isToday) {
          console.log(`[getTodayAdCoinsEarned] ⚠ Has coins but not today: recordUserId=${vUserId}, coins=${v.coinsEarned}, date=${v.createdAt}, today=${today.toISOString()}`);
        } else if (isToday && hasCoins && !matches) {
          console.log(`[getTodayAdCoinsEarned] ⚠ Has coins today but user doesn't match: recordUserId=${vUserId}, actualUserId=${actualUserId}, userId=${userId}, coins=${v.coinsEarned}`);
        }
        
        return shouldCount;
      } catch (e) {
        console.warn(`[getTodayAdCoinsEarned] Error processing view record:`, e, v);
        return false;
      }
    });
    
    const totalCoins = todayViews.reduce((sum, v) => sum + (v.coinsEarned || 0), 0);
    console.log(`[getTodayAdCoinsEarned] User ${actualUserId} - Today's coins: ${totalCoins} from ${todayViews.length} matching records`);
    
    return totalCoins;
  } catch (error) {
    console.error("Error getting today's ad coins earned:", error);
    return 0;
  }
}

// Helper: Get ad IDs that user has watched in the last 24 hours (completed views)
async function getWatchedAdIds(userId: string, userEmail?: string): Promise<Set<string>> {
  try {
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
    
    // Always reload from database to get latest data
    await loadAdViewsDatabase().then(data => { adViewsDatabase = data; });
    
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const watchedAdIds = new Set<string>();
    
    // Debug: Count all records that might match this user
    const allPossibleMatches = adViewsDatabase.filter(v => {
      const vUserId = String(v.userId || '').trim();
      return vUserId === actualUserId || vUserId === userId || 
             (userEmail && users.some(u => String(u.id) === vUserId && u.email?.toLowerCase() === userEmail?.toLowerCase()));
    });
    console.log(`[getWatchedAdIds] Found ${allPossibleMatches.length} total ad views that might belong to user ${actualUserId}${userId !== actualUserId ? ` (Firebase: ${userId})` : ''}`);
    
    adViewsDatabase.forEach(v => {
      try {
        const vUserIdStr = String(v.userId || '').trim();
        
        // Match by database ID
        const matchesDatabaseId = vUserIdStr === actualUserId;
        // Match by Firebase UID (if different from database ID)
        const matchesFirebaseUid = vUserIdStr === userId && userId !== actualUserId;
        // Try user lookup
        let matchesByUserLookup = false;
        if (!matchesDatabaseId && !matchesFirebaseUid) {
          const recordUser = users.find(u => 
            String(u.id) === vUserIdStr || 
            String(u.firebaseUid || '') === vUserIdStr
          );
          matchesByUserLookup = recordUser?.id === actualUserId || (recordUser && userEmail && recordUser.email?.toLowerCase() === userEmail?.toLowerCase());
        }
        
        const matches = matchesDatabaseId || matchesFirebaseUid || matchesByUserLookup;
        if (!matches) {
          return;
        }
        
        const viewDate = new Date(v.createdAt);
        const isWithin24Hours = viewDate >= twentyFourHoursAgo;
        
        // More flexible checking for completed and status
        const isCompleted = v.completed === true || (typeof v.completed === 'string' && String(v.completed).toLowerCase() === 'true');
        const isApproved = v.status === "approved" || (typeof v.status === 'string' && String(v.status).toLowerCase() === 'approved');
        const hasValidAdId = v.adId && String(v.adId).trim() !== '';
        
        // Only count completed views (watched for 15 seconds) within last 24 hours
        if (isWithin24Hours && isCompleted && isApproved && hasValidAdId) {
          const adIdTrimmed = String(v.adId).trim();
          watchedAdIds.add(adIdTrimmed);
          console.log(`[getWatchedAdIds] ✓ Adding watched ad: ${adIdTrimmed} for user ${actualUserId}`);
        }
      } catch (e) {
        // Skip invalid entries
        console.warn("Skipping invalid ad view record:", e, v);
      }
    });
    
    // Debug logging
    console.log(`[getWatchedAdIds] User ${actualUserId} has watched ${watchedAdIds.size} unique ads in last 24h:`, Array.from(watchedAdIds));
    
    return watchedAdIds;
  } catch (error) {
    console.error("Error getting watched ad IDs:", error);
    return new Set<string>();
  }
}

// Helper: Generate random ad names
function getRandomAdName(index: number, usedNames: Set<string>): string {
  const adNames = [
    "Premium Offer",
    "Special Deal",
    "Exclusive Promotion",
    "Limited Time Offer",
    "Best Value Deal",
    "Hot Deal",
    "Flash Sale",
    "Mega Discount",
    "Super Savings",
    "Amazing Offer",
    "Great Opportunity",
    "Fantastic Deal",
    "Incredible Savings",
    "Top Offer",
    "Prime Deal",
    "Elite Promotion",
    "Ultimate Offer",
    "Power Deal",
    "Max Savings",
    "Pro Offer",
    "Gold Deal",
    "Platinum Offer",
    "Diamond Deal",
    "VIP Offer",
    "Premium Deal",
    "Exclusive Deal",
    "Special Offer",
    "Bonus Deal",
    "Extra Savings",
    "Super Deal",
    "Champion Offer",
    "Winner Deal",
    "Star Promotion",
    "Hero Offer",
    "Legend Deal",
    "Master Offer",
    "Expert Deal",
    "Guru Promotion",
    "Ace Offer",
    "Elite Deal",
  ];
  
  // Filter out already used names
  const availableNames = adNames.filter(name => !usedNames.has(name));
  
  // If all names are used, allow reuse but add a number
  if (availableNames.length === 0) {
    const randomName = adNames[Math.floor(Math.random() * adNames.length)];
    return `${randomName} ${index + 1}`;
  }
  
  // Pick a random name from available ones
  const randomIndex = Math.floor(Math.random() * availableNames.length);
  const selectedName = availableNames[randomIndex];
  usedNames.add(selectedName);
  
  return selectedName;
}


// Load ads database
async function loadAdsDatabase(): Promise<Ad[]> {
  const useMongo = await isMongoDBAvailable();
  
  if (useMongo) {
    try {
      const ads = await mongoService.getAllAds();
      if (ads.length > 0) {
        return ads.map((ad: any) => {
          const { _id, ...rest } = ad;
          return rest as Ad;
        });
      }
    } catch (error) {
      console.error("❌ Error loading ads from MongoDB:", error);
    }
  }
  
  // Fallback to file storage
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(ADS_DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [];
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return [];
    }
    console.error("Error loading ads database:", error);
    return [];
  }
}

// Save ads database
async function saveAdsDatabase(data: Ad[]): Promise<void> {
  const useMongo = await isMongoDBAvailable();
  
  if (useMongo) {
    try {
      // Delete all existing ads and recreate
      await mongoService.deleteAllAds();
      for (const ad of data) {
        await mongoService.createAd(ad);
      }
      return;
    } catch (error) {
      console.error("❌ Error saving ads to MongoDB:", error);
    }
  }
  
  // Fallback to file storage
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(ADS_DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// Load ad views database
export async function loadAdViewsDatabase(): Promise<AdViewRecord[]> {
  const useMongo = await isMongoDBAvailable();
  
  if (useMongo) {
    try {
      const views = await mongoService.getAllAdViews();
      if (views.length > 0) {
        return views.map((view: any) => {
          const { _id, ...rest } = view;
          return rest as AdViewRecord;
        });
      }
    } catch (error) {
      console.error("❌ Error loading ad views from MongoDB:", error);
    }
  }
  
  // Fallback to file storage
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(AD_VIEWS_DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [];
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return [];
    }
    console.error("Error loading ad views database:", error);
    return [];
  }
}

// Save ad views database
async function saveAdViewsDatabase(data: AdViewRecord[]): Promise<void> {
  const useMongo = await isMongoDBAvailable();
  
  if (useMongo) {
    try {
      // Delete all existing ad views and recreate
      await mongoService.deleteAllAdViews();
      for (const view of data) {
        await mongoService.createAdView(view);
      }
      return;
    } catch (error) {
      console.error("❌ Error saving ad views to MongoDB:", error);
    }
  }
  
  // Fallback to file storage
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(AD_VIEWS_DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// Load databases on startup
import { isBuildTime } from "../utils/buildCheck.js";

if (!isBuildTime()) {
  loadAdsDatabase()
    .then((loaded) => {
      adsDatabase = loaded;
      console.log(`Loaded ${loaded.length} ads`);
    })
    .catch((error) => {
      console.error("Failed to load ads database:", error);
    });

  loadAdViewsDatabase()
    .then((loaded) => {
      adViewsDatabase = loaded;
      console.log(`Loaded ${loaded.length} ad view records`);
    })
    .catch((error) => {
      console.error("Failed to load ad views database:", error);
    });
}

// Get available ads (active only)
export const getAvailableAds: RequestHandler = async (req, res) => {
  console.log("[getAvailableAds] Request received");
  console.log("[getAvailableAds] Request method:", req.method);
  console.log("[getAvailableAds] Request URL:", req.url);
  console.log("[getAvailableAds] Request headers:", JSON.stringify(req.headers, null, 2));
  
  try {
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;
    console.log(`[getAvailableAds] User ID: ${userId || 'not logged in'}, Email: ${userEmail || 'N/A'}`);
    
    // Load ads database with error handling
    let adsLoaded = false;
    try {
      const loadedAds = await loadAdsDatabase();
      adsDatabase = loadedAds; 
      adsLoaded = true;
      console.log(`[getAvailableAds] Loaded ${loadedAds.length} ads from database`);
    } catch (loadError: any) {
      console.error("[getAvailableAds] Error loading ads database:", loadError?.message || loadError);
      console.error("[getAvailableAds] Error stack:", loadError?.stack);
      // Continue with empty array
      adsDatabase = [];
    }
    
    // Get collaboration ads from database (even if loading failed, use empty array)
    const collaborationAds = (adsLoaded ? adsDatabase : []).filter(ad => ad.status === "active" && ad.adType === "collaboration");
    
    // Create Adsterra direct link ads (for ad watching earning system)
    const adsterraAds = createAdsterraAds();
    
    // Combine both types
    const allAds = [...adsterraAds, ...collaborationAds];
    
    // Get ads that user has watched in the last 24 hours (with error handling)
    let watchedAdIds = new Set<string>();
    if (userId) {
      try {
        watchedAdIds = await getWatchedAdIds(userId, userEmail);
      } catch (watchedError) {
        console.error("Error getting watched ad IDs:", watchedError);
        // Continue with empty set - user can watch all ads
      }
    }
    
    // Add watched status to ads (but still show them with message)
    const availableAds = allAds.map(ad => {
      // Only mark as watched if the exact adId matches (case-sensitive, trimmed)
      const adIdToCheck = String(ad.id).trim();
      const isWatched = watchedAdIds.has(adIdToCheck);
      
      return {
        ...ad,
        isWatched: Boolean(isWatched), // Ensure it's a boolean
        canWatch: !isWatched,
      };
    });
    
    // Check daily limit and today's earnings (with error handling)
    let dailyCount = 0;
    let dailyLimit = 25;
    let todayCoinsEarned = 0;
    if (userId) {
      try {
        console.log(`[getAvailableAds] User: ${userId}, Email: ${userEmail || 'N/A'}`);
        dailyCount = await getDailyAdViewCount(userId, userEmail);
        todayCoinsEarned = await getTodayAdCoinsEarned(userId, userEmail);
        console.log(`[getAvailableAds] Daily count: ${dailyCount}, Today coins earned: ${todayCoinsEarned}`);
      } catch (earningsError) {
        console.error("Error getting daily count/earnings:", earningsError);
        // Continue with default values (0)
      }
    }
    
    const responseData = { 
      data: availableAds, 
      total: availableAds.length,
      dailyCount,
      dailyLimit,
      todayCoinsEarned,
      canWatchMore: dailyCount < dailyLimit
    };
    console.log(`[getAvailableAds] Success: Returning ${availableAds.length} ads`);
    console.log(`[getAvailableAds] Response data:`, JSON.stringify(responseData, null, 2));
    return res.status(200).json(responseData);
  } catch (error: any) {
    console.error("[getAvailableAds] Error getting ads (catch all):", error);
    console.error("[getAvailableAds] Error stack:", error?.stack);
    
    // Return response even on error - always return valid JSON with 200 status
    // This prevents the client from showing an error when we can still show Adsterra ads
    try {
      // Try to at least return Adsterra direct link ads even on error
      const adsterraAds = createAdsterraAds();
      console.log(`[getAvailableAds] Fallback: Returning ${adsterraAds.length} Adsterra ads`);
      return res.status(200).json({ 
        data: adsterraAds.map(ad => ({
          ...ad,
          isWatched: false,
          canWatch: true,
        })), 
        total: adsterraAds.length,
        dailyCount: 0,
        dailyLimit: 25,
        todayCoinsEarned: 0,
        canWatchMore: true
      });
    } catch (fallbackError) {
      console.error("[getAvailableAds] Error in fallback response:", fallbackError);
      // Last resort - return empty but valid response with 200 status
      // Even if everything fails, return 200 so client doesn't show error
      return res.status(200).json({ 
        error: "Failed to load ads. Please try again later.",
        data: [], 
        total: 0,
        dailyCount: 0,
        dailyLimit: 25,
        todayCoinsEarned: 0,
        canWatchMore: true
      });
    }
  }
};

// Start ad watch session
export const startAdWatch: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

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

    // Check daily limit (use actualUserId for consistency)
    const dailyCount = await getDailyAdViewCount(actualUserId);
    if (dailyCount >= 25) {
      res.status(400).json({ error: "Daily limit reached. You can watch 25 ads per day. Please come back tomorrow." });
      return;
    }

    const { adId }: StartAdWatchRequest = req.body;

    if (!adId) {
      res.status(400).json({ error: "Ad ID is required" });
      return;
    }

    // Check if user has watched this ad in the last 24 hours (use actualUserId for consistency)
    const watchedAdIds = await getWatchedAdIds(actualUserId);
    if (watchedAdIds.has(adId)) {
      res.status(400).json({ error: "You have already watched this ad. Please try again after 24 hours." });
      return;
    }

    await loadAdsDatabase().then(data => { adsDatabase = data; });

    // Find ad from database (includes Adsterra direct link ads)
    let ad: Ad | undefined;
    if (adId.startsWith("ADSTERRA-")) {
      const adsterraAds = createAdsterraAds();
      ad = adsterraAds.find(a => a.id === adId);
    } else {
      ad = adsDatabase.find(a => a.id === adId && a.status === "active");
    }

    if (!ad) {
      res.status(404).json({ error: "Ad not found or inactive" });
      return;
    }

    // Generate unique watch ID
    const watchId = `WATCH${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Store watch session - use actualUserId for consistency
    activeWatchSessions.set(watchId, {
      watchId,
      userId: actualUserId, // Store database ID for consistent matching
      adId,
      startTime: Date.now(),
    });

    const message = ad.adType === "adsterra" 
      ? "Ad watch session started. Watch for 15 seconds and click once in the ad to earn coins."
      : "Ad watch session started. Watch for 15 seconds to earn coins.";

    const response: StartAdWatchResponse = {
      watchId,
      ad,
      message,
    };

    res.json(response);
  } catch (error: any) {
    console.error("Error starting ad watch:", error);
    res.status(500).json({ error: error.message || "Failed to start ad watch" });
  }
};

// Complete ad watch and reward coins
export const completeAdWatch: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

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
      console.log(`[Ad Watch Complete] User ID converted - Input ID: ${userId}, Database ID: ${actualUserId}`);
    }

    // Check daily limit (use actualUserId for consistency)
    const dailyCount = await getDailyAdViewCount(actualUserId);
    if (dailyCount >= 25) {
      res.status(400).json({ error: "Daily limit reached. You can watch 25 ads per day. Please come back tomorrow." });
      return;
    }

    const { watchId, watchDuration, clicked }: CompleteAdWatchRequest = req.body;

    if (!watchId || watchDuration === undefined) {
      res.status(400).json({ error: "Watch ID and duration are required" });
      return;
    }

    // Get watch session
    const session = activeWatchSessions.get(watchId);
    if (!session) {
      res.status(404).json({ error: "Watch session not found or expired" });
      return;
    }

    // Verify user owns this session - session.userId should now be actualUserId from startAdWatch
    // But we still check both for backward compatibility with old sessions
    if (session.userId !== actualUserId && session.userId !== userId) {
      res.status(403).json({ error: "Unauthorized access to this watch session" });
      return;
    }

    // Remove session
    activeWatchSessions.delete(watchId);

    await loadAdsDatabase().then(data => { adsDatabase = data; });
    await loadAdViewsDatabase().then(data => { adViewsDatabase = data; });

    // Check if it's an Adsterra direct link ad (for ad watching earning system)
    let ad: Ad | undefined;
    if (session.adId.startsWith("ADSTERRA-")) {
      const adsterraAds = createAdsterraAds();
      ad = adsterraAds.find(a => a.id === session.adId);
    } else {
      ad = adsDatabase.find(a => a.id === session.adId);
    }

    if (!ad) {
      res.status(404).json({ error: "Ad not found" });
      return;
    }

    const requiredDuration = ad.watchDuration || 15;
    // Ensure watchDuration is a number for comparison - handle both number and string
    let watchDurationNum = 0;
    if (typeof watchDuration === 'number') {
      watchDurationNum = watchDuration;
    } else if (typeof watchDuration === 'string') {
      watchDurationNum = parseFloat(watchDuration) || 0;
    } else {
      watchDurationNum = Number(watchDuration) || 0;
    }
    
    // Simple >= comparison - if user watched required duration or more, they qualify
    // Be lenient: if they watched 14.5+ seconds, count it as meeting the requirement
    const watchedEnough = watchDurationNum >= (requiredDuration - 0.5);
    
    // For Adsterra direct link ads, require both watch time AND click
    // For collaboration ads, only watch time is required
    const completed = ad.adType === "adsterra" 
      ? (watchedEnough && clicked === true)
      : watchedEnough;
    
    // Debug logging with detailed info
    console.log(`[Ad Watch Complete] User: ${actualUserId}${userId !== actualUserId ? ` (Firebase UID: ${userId})` : ''}, Ad: ${session.adId}`);
    console.log(`  - Watch Duration (raw): ${watchDuration} (type: ${typeof watchDuration})`);
    console.log(`  - Watch Duration (num): ${watchDurationNum}s`);
    console.log(`  - Required Duration: ${requiredDuration}s`);
    console.log(`  - Watched Enough: ${watchedEnough} (${watchDurationNum} >= ${requiredDuration - 0.5})`);
    console.log(`  - Clicked: ${clicked}`);
    console.log(`  - Ad Type: ${ad.adType}`);
    console.log(`  - Completed: ${completed}`);

    let coinsEarned = 0;
    if (completed) {
      // Generate random coins: Adsterra direct link ads 20-80, Collaboration 10-80
      const minCoins = ad.adType === "adsterra" ? 20 : (ad.minCoins || 10);
      const maxCoins = ad.maxCoins || 80;
      coinsEarned = generateRandomCoins(minCoins, maxCoins);
    }

    // Create ad view record - use actualUserId (database ID) for proper matching
    const adViewRecord: AdViewRecord = {
      id: `ADV${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      userId: String(actualUserId), // Use database ID for consistent matching
      adId: String(session.adId).trim(), // Ensure adId is a string and trimmed
      coinsEarned,
      watchDuration: watchDurationNum, // Use the numeric value
      completed: Boolean(completed), // Ensure it's a boolean
      clicked: Boolean(clicked || false),
      createdAt: new Date().toISOString(),
      status: completed ? "approved" : "rejected", // Auto-approve if completed, reject if not
    };
    
    // Debug logging
    console.log(`[Ad View Record] Created:`, {
      userId: adViewRecord.userId,
      firebaseUid: userId !== actualUserId ? userId : undefined,
      adId: adViewRecord.adId,
      completed: adViewRecord.completed,
      status: adViewRecord.status,
      coinsEarned: adViewRecord.coinsEarned
    });

    adViewsDatabase.push(adViewRecord);
    await saveAdViewsDatabase(adViewsDatabase);
    
    // Reload database to ensure it's saved
    await loadAdViewsDatabase().then(data => { adViewsDatabase = data; });
    
    // Verify the record was saved
    const savedRecord = adViewsDatabase.find(r => r.id === adViewRecord.id);
    if (savedRecord) {
      console.log(`[Ad View Record] Verified saved:`, {
        id: savedRecord.id,
        userId: savedRecord.userId,
        adId: savedRecord.adId,
        completed: savedRecord.completed,
        status: savedRecord.status
      });
    } else {
      console.error(`[Ad View Record] ERROR: Record was not saved!`, adViewRecord);
    }

    let message = "";
    if (completed) {
      message = `Congratulations! You earned ${coinsEarned} coins for watching the ad.`;
    } else if (ad.adType === "adsterra") {
      if (!watchedEnough && !clicked) {
        message = `You need to watch for at least ${requiredDuration} seconds AND click once in the ad to earn coins. You watched for ${watchDurationNum} seconds.`;
      } else if (!watchedEnough) {
        message = `You need to watch for at least ${requiredDuration} seconds. You watched for ${watchDurationNum} seconds.`;
      } else if (!clicked) {
        message = `You watched for ${watchDurationNum} seconds, but you need to click once in the ad to earn coins.`;
      } else {
        // Fallback - shouldn't happen
        message = `You need to watch for at least ${requiredDuration} seconds to earn coins. You watched for ${Math.floor(watchDurationNum)} seconds.`;
      }
    } else {
      // For collaboration ads
      if (completed) {
        message = `Congratulations! You earned ${coinsEarned} coins for watching the ad.`;
      } else {
        message = `You need to watch the ad for at least ${requiredDuration} seconds to earn coins. You watched for ${Math.floor(watchDurationNum)} seconds.`;
      }
    }

    const response: CompleteAdWatchResponse = {
      success: completed,
      coinsEarned,
      message,
    };

    console.log(`[Ad Watch] User ${actualUserId}${userId !== actualUserId ? ` (Firebase UID: ${userId})` : ''} ${completed ? 'completed' : 'incomplete'} watch for ad ${session.adId}. Duration: ${watchDuration}s, Coins: ${coinsEarned}`);

    res.json(response);
  } catch (error: any) {
    console.error("Error completing ad watch:", error);
    res.status(500).json({ error: error.message || "Failed to complete ad watch" });
  }
};

// Get user's ad view history
export const getUserAdHistory: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await loadAdViewsDatabase().then(data => { adViewsDatabase = data; });

    const userViews = adViewsDatabase.filter(v => v.userId === userId);
    
    // Enrich with ad information
    await loadAdsDatabase().then(data => { adsDatabase = data; });
    const enrichedViews = userViews.map(view => {
      const ad = adsDatabase.find(a => a.id === view.adId);
      return {
        ...view,
        adTitle: ad?.title || "Unknown Ad",
      };
    });

    res.json({ data: enrichedViews, total: enrichedViews.length });
  } catch (error: any) {
    console.error("Error getting ad history:", error);
    res.status(500).json({ error: error.message || "Failed to get ad history" });
  }
};

// ==================== ADMIN ENDPOINTS ====================

// Get all ads (admin)
export const getAllAds: RequestHandler = async (req, res) => {
  try {
    await loadAdsDatabase().then(data => { adsDatabase = data; });
    res.json({ data: adsDatabase, total: adsDatabase.length });
  } catch (error: any) {
    console.error("Error getting all ads:", error);
    res.status(500).json({ error: error.message || "Failed to get ads" });
  }
};

// Create ad (admin)
export const createAd: RequestHandler = async (req, res) => {
  try {
    const payload: CreateAdRequest = req.body;

    if (!payload.title || !payload.adUrl) {
      res.status(400).json({ error: "Title and ad URL are required" });
      return;
    }

    await loadAdsDatabase().then(data => { adsDatabase = data; });

    const newAd: Ad = {
      id: `AD${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      title: payload.title,
      adType: payload.adType || "collaboration",
      adUrl: payload.adUrl,
      status: payload.status || "active",
      minCoins: payload.minCoins || 1,
      maxCoins: payload.maxCoins || 50,
      watchDuration: payload.watchDuration || 15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    adsDatabase.push(newAd);
    await saveAdsDatabase(adsDatabase);

    res.json({ message: "Ad created successfully", ad: newAd });
  } catch (error: any) {
    console.error("Error creating ad:", error);
    res.status(500).json({ error: error.message || "Failed to create ad" });
  }
};

// Update ad (admin)
export const updateAd: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updates: UpdateAdRequest = req.body;

    await loadAdsDatabase().then(data => { adsDatabase = data; });

    const adIndex = adsDatabase.findIndex(a => a.id === id);
    if (adIndex === -1) {
      res.status(404).json({ error: "Ad not found" });
      return;
    }

    adsDatabase[adIndex] = {
      ...adsDatabase[adIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await saveAdsDatabase(adsDatabase);

    res.json({ message: "Ad updated successfully", ad: adsDatabase[adIndex] });
  } catch (error: any) {
    console.error("Error updating ad:", error);
    res.status(500).json({ error: error.message || "Failed to update ad" });
  }
};

// Delete ad (admin)
export const deleteAd: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    await loadAdsDatabase().then(data => { adsDatabase = data; });

    const adIndex = adsDatabase.findIndex(a => a.id === id);
    if (adIndex === -1) {
      res.status(404).json({ error: "Ad not found" });
      return;
    }

    adsDatabase.splice(adIndex, 1);
    await saveAdsDatabase(adsDatabase);

    res.json({ message: "Ad deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting ad:", error);
    res.status(500).json({ error: error.message || "Failed to delete ad" });
  }
};

// Get all ad views (admin)
export const getAllAdViews: RequestHandler = async (req, res) => {
  try {
    await loadAdViewsDatabase().then(data => { adViewsDatabase = data; });
    
    // Enrich with user and ad information
    const { getUsersDatabase } = await import("./users.js");
    const users = await getUsersDatabase();
    await loadAdsDatabase().then(data => { adsDatabase = data; });
    
    const enrichedViews = adViewsDatabase.map(view => {
      // Match user by database ID or Firebase UID (for backward compatibility)
      const user = users.find(u => 
        u.id === view.userId || 
        u.firebaseUid === view.userId ||
        String(u.id) === String(view.userId) ||
        String(u.firebaseUid || '') === String(view.userId)
      );
      const ad = adsDatabase.find(a => a.id === view.adId);
      return {
        ...view,
        userName: user?.name || "Unknown",
        userEmail: user?.email || "Unknown",
        userDatabaseId: user?.id || view.userId, // Show the database ID for reference
        adTitle: ad?.title || "Unknown Ad",
      };
    });

    res.json({ data: enrichedViews, total: enrichedViews.length });
  } catch (error: any) {
    console.error("Error getting all ad views:", error);
    res.status(500).json({ error: error.message || "Failed to get ad views" });
  }
};

// Update ad view status (admin)
export const updateAdViewStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    await loadAdViewsDatabase().then(data => { adViewsDatabase = data; });

    const viewIndex = adViewsDatabase.findIndex(v => v.id === id);
    if (viewIndex === -1) {
      res.status(404).json({ error: "Ad view not found" });
      return;
    }

    adViewsDatabase[viewIndex] = {
      ...adViewsDatabase[viewIndex],
      status,
      adminNote,
    };

    await saveAdViewsDatabase(adViewsDatabase);

    res.json({ message: "Ad view status updated", view: adViewsDatabase[viewIndex] });
  } catch (error: any) {
    console.error("Error updating ad view status:", error);
    res.status(500).json({ error: error.message || "Failed to update ad view status" });
  }
};

