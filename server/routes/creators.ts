import { RequestHandler } from "express";
import {
  CreatorApplicationRequest,
  CreatorListResponse,
  CreatorProfile,
  CreatorStatus,
  CreatorStorageManualPaymentRequest,
  CreatorStoragePurchase,
  CreatorStoragePurchaseRequest,
} from "@shared/api";
import { promises as fs } from "fs";
import { join } from "path";
import { DATA_DIR } from "../utils/dataPath.js";
import { isMongoDBAvailable } from "../utils/mongodb.js";
import * as mongoService from "../services/mongodbService.js";
import { generateDeviceFingerprint, getDeviceId } from "../utils/deviceFingerprint.js";
import { loadSettings } from "./settings.js";

// Lazy import email service to avoid loading nodemailer during Vite config evaluation
async function sendAdminMail(subject: string, templateName: string, variables: any) {
  const { sendAdminMail: sendMail } = await import("../services/emailService.js");
  return sendMail(subject, templateName, variables);
}

const CREATORS_DB_FILE = join(DATA_DIR, "creators-database.json");
const STORAGE_BASE_GB = 1; // Changed from 5 GB to 1 GB free storage for creator accounts
const GB_IN_BYTES = 1024 * 1024 * 1024;
const STORAGE_PLAN_PRICING_TK: Record<number, number> = {
  1: 299,
  2: 399,
  4: 499,
  5: 599,
};
const STORAGE_DURATION_OPTIONS = [2, 4, 6, 8, 10, 12];

// No default demo creators - only real data
const DEFAULT_CREATORS: CreatorProfile[] = [];

let creatorsDatabase: CreatorProfile[] = [];

function refreshStorageState(creator: CreatorProfile): CreatorProfile {
  if (!creator) return creator;
  // MIGRATION: Update existing creators from 5 GB to 1 GB free storage
  if (creator.storageBaseGb === undefined || creator.storageBaseGb === 5) {
    creator.storageBaseGb = STORAGE_BASE_GB; // Now 1 GB
    // Note: If creator was using more than 1 GB, they should purchase additional storage
  }
  if (creator.storageBonusGb === undefined) creator.storageBonusGb = 0;
  if (creator.storageUsedBytes === undefined) creator.storageUsedBytes = 0;
  // CRITICAL: Ensure purchase history is always an array
  if (!Array.isArray(creator.storagePurchaseHistory)) {
    creator.storagePurchaseHistory = [];
  }
  
  // Formula: total_storage = free_storage + sum(purchased_storage_list)
  // Step 1: Get all completed purchases from the array
  const now = new Date();
  let totalBonusGb = 0;
  let latestExpiresAt: Date | null = null;
  
  const completedPurchases = creator.storagePurchaseHistory.filter(
    (purchase) => purchase.status === "completed"
  );
  
  // Step 2: Sum all active purchases (each purchase is a separate entry in the array)
  for (const purchase of completedPurchases) {
    if (purchase.expiresAt) {
      const expiresAt = new Date(purchase.expiresAt);
      if (!isNaN(expiresAt.getTime()) && expiresAt.getTime() > now.getTime()) {
        // Purchase is still active - add it to the sum
        totalBonusGb += purchase.gb;
        if (!latestExpiresAt || expiresAt.getTime() > latestExpiresAt.getTime()) {
          latestExpiresAt = expiresAt;
        }
      }
    }
  }
  
  // Step 3: Calculate total = base + sum of all purchases
  const baseGb = creator.storageBaseGb || STORAGE_BASE_GB;
  
  // Update bonus storage and expiration based on active purchases
  if (totalBonusGb > 0 && latestExpiresAt) {
    creator.storageBonusGb = totalBonusGb;
    creator.storageBonusExpiresAt = latestExpiresAt.toISOString();
  } else {
    // No active purchases
    creator.storageBonusGb = 0;
    delete creator.storageBonusExpiresAt;
  }
  
  return creator;
}

function getActiveBonusGb(creator: CreatorProfile): number {
  refreshStorageState(creator);
  return creator.storageBonusExpiresAt ? creator.storageBonusGb : 0;
}

function getTotalStorageQuotaBytes(creator: CreatorProfile): number {
  const activeBonus = getActiveBonusGb(creator);
  return (creator.storageBaseGb + activeBonus) * GB_IN_BYTES;
}

export function getCreatorById(id: string): CreatorProfile | undefined {
  const creator = creatorsDatabase.find((c) => c.id === id);
  return creator ? refreshStorageState(creator) : undefined;
}

export function getCreatorByEmail(email: string): CreatorProfile | undefined {
  const creator = creatorsDatabase.find((c) => c.email.toLowerCase() === email.toLowerCase());
  return creator ? refreshStorageState(creator) : undefined;
}

async function persistCreators() {
  await saveCreatorsDatabase(creatorsDatabase);
}

export async function incrementCreatorStorageUsage(creatorId: string, bytes: number): Promise<void> {
  if (!bytes) return;
  const creator = getCreatorById(creatorId);
  if (!creator) return;
  creator.storageUsedBytes += bytes;
  creator.updatedAt = new Date().toISOString();
  await persistCreators();
}

export function canCreatorConsumeStorage(
  creatorId: string,
  bytes: number
): { allowed: boolean; remainingBytes: number; quotaBytes: number; creator?: CreatorProfile } {
  const creator = getCreatorById(creatorId);
  if (!creator) {
    return { allowed: false, remainingBytes: 0, quotaBytes: 0 };
  }
  const quotaBytes = getTotalStorageQuotaBytes(creator);
  const remaining = quotaBytes - creator.storageUsedBytes;
  return { allowed: remaining >= bytes, remainingBytes: Math.max(remaining, 0), quotaBytes, creator };
}

async function seedCreators(): Promise<CreatorProfile[]> {
  await saveCreatorsDatabase(DEFAULT_CREATORS);
  return DEFAULT_CREATORS;
}

async function loadCreatorsDatabase(): Promise<CreatorProfile[]> {
  const useMongo = await isMongoDBAvailable();
  
  if (useMongo) {
    try {
      const creators = await mongoService.getAllCreators();
      if (creators.length > 0) {
        // Remove MongoDB _id and return as array
        // CRITICAL: Ensure storagePurchaseHistory array is preserved when loading
        return creators.map((creator: any) => {
          const { _id, ...rest } = creator;
          
          // Ensure purchase history is an array (MongoDB should preserve it, but validate)
          if (!Array.isArray(rest.storagePurchaseHistory)) {
            rest.storagePurchaseHistory = rest.storagePurchaseHistory ? [rest.storagePurchaseHistory] : [];
          }
          
          const refreshed = refreshStorageState(rest as CreatorProfile);
          return refreshed;
        });
      }
      // CRITICAL FIX: Only seed default creators if this appears to be a fresh install
      // Check if there's any uploaded media from creators - if yes, don't seed (data was lost)
      // Only seed if truly empty and no creator activity exists
      const { getMediaDatabase } = await import("./media.js");
      try {
        const mediaDatabase = await getMediaDatabase();
        const hasCreatorUploads = mediaDatabase.some((media) => 
          media.creatorId || (media.uploadedByEmail && !media.uploadedByEmail.includes("freemediabuzz.com"))
        );
        if (!hasCreatorUploads) {
          // No creator uploads found - safe to seed defaults (first install)
          console.log("[Creators] No creator uploads found - seeding default demo creators (first install)");
          const seeded = await seedCreators();
          for (const creator of seeded) {
            await mongoService.createCreator(creator);
          }
          return seeded;
        } else {
          // Creator uploads exist but creators database is empty - DO NOT SEED
          // This indicates data loss, not a fresh install
          console.warn("[Creators] ⚠️ Creator uploads found but creators database is empty - skipping auto-seed to prevent data loss");
          return [];
        }
      } catch (mediaError) {
        console.error("❌ Error checking media database:", mediaError);
        // If we can't check media, err on the side of caution - don't seed
        return [];
      }
    } catch (error) {
      console.error("❌ Error loading from MongoDB:", error);
      // Fallback to file storage
    }
  }
  
  // Fallback to file storage
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(CREATORS_DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((creator: CreatorProfile) => refreshStorageState(creator));
    }
    // CRITICAL FIX: Check for creator uploads before seeding
    const { getMediaDatabase } = await import("./media.js");
    try {
      const mediaDatabase = await getMediaDatabase();
      const hasCreatorUploads = mediaDatabase.some((media) => 
        media.creatorId || (media.uploadedByEmail && !media.uploadedByEmail.includes("freemediabuzz.com"))
      );
      if (!hasCreatorUploads) {
        // No creator uploads - safe to seed (first install)
        return await seedCreators();
      } else {
        // Creator uploads exist - DO NOT SEED (data loss scenario)
        return [];
      }
    } catch (mediaError) {
      console.error("❌ Error checking media database:", mediaError);
      return [];
    }
  } catch (error: any) {
    if (error.code === "ENOENT") {
      // File doesn't exist - check if this is truly a first install
      const { getMediaDatabase } = await import("./media.js");
      try {
        const mediaDatabase = await getMediaDatabase();
        const hasCreatorUploads = mediaDatabase.some((media) => 
          media.creatorId || (media.uploadedByEmail && !media.uploadedByEmail.includes("freemediabuzz.com"))
        );
        if (!hasCreatorUploads) {
          // No creator uploads - safe to seed (first install)
          return await seedCreators();
        } else {
          // Creator uploads exist - DO NOT SEED (data loss scenario)
          return [];
        }
      } catch (mediaError) {
        console.error("❌ Error checking media database:", mediaError);
        return [];
      }
    }
    console.error("Error loading creators database:", error);
    return [];
  }
}

async function saveCreatorsDatabase(data: CreatorProfile[]): Promise<void> {
  const useMongo = await isMongoDBAvailable();
  
  if (useMongo) {
    try {
      // Replace all creators in MongoDB
      const collection = await mongoService.getCreatorsCollection();
      if (collection) {
        await collection.deleteMany({});
        if (data.length > 0) {
          // CRITICAL: Ensure storagePurchaseHistory array is preserved when saving
          await collection.insertMany(data.map(creator => {
            // Ensure purchase history is an array before saving
            const purchaseHistory = Array.isArray(creator.storagePurchaseHistory) 
              ? creator.storagePurchaseHistory 
              : [];
            
            console.log(`[saveCreatorsDatabase] Saving creator ${creator.email} with ${purchaseHistory.length} purchases in history`);
            
            return {
              ...creator,
              storagePurchaseHistory: purchaseHistory, // Explicitly preserve the array
              createdAt: creator.createdAt ? new Date(creator.createdAt) : new Date(),
              updatedAt: creator.updatedAt ? new Date(creator.updatedAt) : new Date(),
              lastRequestAt: creator.lastRequestAt ? new Date(creator.lastRequestAt) : new Date(),
            };
          }));
        }
        return;
      }
    } catch (error) {
      console.error("❌ Error saving to MongoDB:", error);
      // Fallback to file storage
    }
  }
  
  // Fallback to file storage
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(CREATORS_DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// Load creators database on startup (skip during build)
import { isBuildTime } from "../utils/buildCheck.js";

if (!isBuildTime()) {
  loadCreatorsDatabase()
    .then((loaded) => {
      creatorsDatabase = loaded.map((creator) => refreshStorageState(creator));
      console.log(`Loaded ${loaded.length} creator profiles`);
    })
    .catch((error) => {
      console.error("Failed to load creators database, using empty defaults:", error);
    });
}

export const createOrUpdateCreator: RequestHandler = async (req, res) => {
  const payload: CreatorApplicationRequest = req.body;

  if (!payload.email || !payload.name) {
    res.status(400).json({ error: "Name and email are required" });
    return;
  }

  const timestamp = new Date().toISOString();
  const emailLower = payload.email.toLowerCase();
  
  // CRITICAL FIX: First check MongoDB for the latest creator data to preserve admin-approved status
  const useMongo = await isMongoDBAvailable();
  let existingCreatorFromDB: any = null;
  let preservedStatus: CreatorStatus | undefined = undefined;
  
  if (useMongo) {
    try {
      existingCreatorFromDB = await mongoService.getCreatorByEmail(emailLower);
      if (existingCreatorFromDB) {
        // Preserve the status from MongoDB (especially "approved" status set by admin)
        preservedStatus = existingCreatorFromDB.status as CreatorStatus;
      }
    } catch (error) {
      console.error("Error fetching creator from MongoDB:", error);
    }
  }
  
  let creator = creatorsDatabase.find((c) => c.email.toLowerCase() === emailLower);

  const isNewCreator = !creator;
  
  if (!creator) {
    creator = {
      id: Date.now().toString(),
      email: payload.email,
      name: payload.name,
      firebaseUid: payload.firebaseUid,
      bio: payload.bio,
      portfolioUrl: payload.portfolioUrl,
      specialization: payload.specialization,
      message: payload.message,
      status: "pending",
      createdAt: timestamp,
      updatedAt: timestamp,
      lastRequestAt: timestamp,
      storageBaseGb: STORAGE_BASE_GB,
      storageBonusGb: 0,
      storageUsedBytes: 0,
      storagePurchaseHistory: [],
    };
    creatorsDatabase.push(creator);
  } else {
    refreshStorageState(creator);
    // CRITICAL FIX: Preserve status from MongoDB if it exists (especially "approved")
    // Only allow status change from "rejected" to "pending" for resubmission
    const currentStatus = preservedStatus || creator.status;
    
    creator.name = payload.name;
    creator.firebaseUid = payload.firebaseUid || creator.firebaseUid;
    creator.bio = payload.bio;
    creator.portfolioUrl = payload.portfolioUrl;
    creator.specialization = payload.specialization;
    creator.message = payload.message;
    creator.lastRequestAt = timestamp;
    creator.updatedAt = timestamp;
    
    // CRITICAL: Status preservation logic
    // 1. If status is "approved", NEVER change it (permanent until admin changes it)
    // 2. Only allow status change from "rejected" to "pending" for resubmission
    // 3. Otherwise, preserve the existing status
    if (currentStatus === "approved") {
      // Approved status is permanent - never change it
      creator.status = "approved";
    } else if (currentStatus === "rejected") {
      // Allow resubmission after rejection
      creator.status = "pending";
    } else if (currentStatus) {
      // Preserve any other status (pending stays pending)
      creator.status = currentStatus;
    }
    // If no status exists, it will remain as whatever was in the creator object
  }

  try {
    if (useMongo) {
      try {
        // Check if creator exists in MongoDB
        const existingCreator = existingCreatorFromDB || await mongoService.getCreatorByEmail(emailLower);
        
        if (!existingCreator) {
          // Create new creator
          await mongoService.createCreator(creator);
          
          // Send email notification to admin
          try {
            await sendAdminMail(
              `New Creator Signup: ${creator.name}`,
              'creatorSignup',
              {
                name: creator.name,
                email: creator.email,
                date: new Date(creator.createdAt).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                status: creator.status,
              }
            );
          } catch (emailError) {
            console.error('Failed to send creator signup email:', emailError);
            // Don't fail the request if email fails
          }
        } else {
          // Update existing creator - CRITICAL: Preserve status from database
          // NEVER change status from "approved" to anything else unless explicitly changed by admin
          const statusToSave = preservedStatus === "approved" ? "approved" : (preservedStatus || creator.status);
          
          await mongoService.updateCreator(existingCreator._id.toString(), {
            name: creator.name,
            bio: creator.bio,
            portfolioUrl: creator.portfolioUrl,
            specialization: creator.specialization,
            message: creator.message,
            status: statusToSave, // Use preserved status (approved stays approved)
            firebaseUid: creator.firebaseUid,
            updatedAt: creator.updatedAt,
            lastRequestAt: creator.lastRequestAt,
          });
          // Update the in-memory creator object with the preserved status
          creator.status = statusToSave;
        }
        
        // CRITICAL FIX: Update only the specific creator in memory instead of reloading all
        // This prevents approved status from being overwritten by stale data
        const creatorIndex = creatorsDatabase.findIndex((c) => c.id === creator.id || c.email.toLowerCase() === emailLower);
        if (creatorIndex !== -1) {
          // Update existing creator in memory - CRITICAL: Preserve status if it's approved
          const existingStatus = creatorsDatabase[creatorIndex].status;
          if (existingStatus === "approved" || creator.status === "approved") {
            // If either the existing or new status is approved, keep it approved
            creatorsDatabase[creatorIndex] = { ...creator, status: "approved" };
          } else {
            // Otherwise, use the new status
            creatorsDatabase[creatorIndex] = creator;
          }
          // Always refresh storage state
          refreshStorageState(creatorsDatabase[creatorIndex]);
        } else {
          // Add new creator to memory
          creatorsDatabase.push(creator);
          refreshStorageState(creator);
        }
        
        // Send email notification for new creator signup (MongoDB)
        if (isNewCreator) {
          try {
            await sendAdminMail(
              `New Creator Signup: ${creator.name}`,
              'creatorSignup',
              {
                name: creator.name,
                email: creator.email,
                date: new Date(creator.createdAt).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                status: creator.status,
              }
            );
          } catch (emailError) {
            console.error('Failed to send creator signup email:', emailError);
            // Don't fail the request if email fails
          }
        }
      } catch (mongoError) {
        console.error("❌ Error saving to MongoDB:", mongoError);
        // Fallback to file storage
        await persistCreators();
        
        // Send email notification for new creator signup (fallback to file storage)
        if (isNewCreator) {
          try {
            await sendAdminMail(
              `New Creator Signup: ${creator.name}`,
              'creatorSignup',
              {
                name: creator.name,
                email: creator.email,
                date: new Date(creator.createdAt).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                status: creator.status,
              }
            );
          } catch (emailError) {
            console.error('Failed to send creator signup email:', emailError);
            // Don't fail the request if email fails
          }
        }
      }
    } else {
      await persistCreators();
      
      // Send email notification for new creator signup (file storage)
      if (isNewCreator) {
        try {
          await sendAdminMail(
            `New Creator Signup: ${creator.name}`,
            'creatorSignup',
            {
              name: creator.name,
              email: creator.email,
              date: new Date(creator.createdAt).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              status: creator.status,
            }
          );
        } catch (emailError) {
          console.error('Failed to send creator signup email:', emailError);
          // Don't fail the request if email fails
        }
      }
    }
    
    res.json(creator);
  } catch (error) {
    console.error("Failed to save creator profile:", error);
    res.status(500).json({ error: "Failed to save creator profile" });
  }
};

export const getCreatorStatus: RequestHandler = async (req, res) => {
  const { email } = req.query;

  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  // CRITICAL FIX: Reload fresh data from database instead of using stale in-memory cache
  // This ensures we always have the latest creator profile data
  try {
    const useMongo = await isMongoDBAvailable();
    let creator: CreatorProfile | undefined;
    
    if (useMongo) {
      try {
        const mongoCreators = await mongoService.getAllCreators();
        const emailLower = email.toLowerCase();
        const found = mongoCreators.find((c: any) => {
          const creatorEmail = (c.email || '').toLowerCase();
          return creatorEmail === emailLower;
        });
        if (found) {
          const { _id, ...rest } = found;
          creator = { ...rest, id: rest.id || _id.toString() } as CreatorProfile;
          
          // MIGRATION: Update 5 GB to 1 GB if needed
          if (creator.storageBaseGb === 5) {
            creator.storageBaseGb = STORAGE_BASE_GB; // 1 GB
            creator.updatedAt = new Date().toISOString();
            // Save migration to database
            try {
              await mongoService.updateCreator(found._id.toString(), {
                storageBaseGb: STORAGE_BASE_GB,
                updatedAt: creator.updatedAt,
              });
            } catch (migError) {
              console.error(`[Creators] ❌ Error migrating creator ${emailLower}:`, migError);
            }
          }
          
          // Update in-memory cache with fresh data
          const index = creatorsDatabase.findIndex((c) => c.email.toLowerCase() === emailLower);
          if (index !== -1) {
            creatorsDatabase[index] = creator;
          } else {
            creatorsDatabase.push(creator);
          }
        }
      } catch (error) {
        console.error("❌ Error fetching creator from MongoDB:", error);
      }
    }
    
    // Fallback to file storage if not found in MongoDB
    if (!creator) {
      try {
        const allCreators = await loadCreatorsDatabase();
        const emailLower = email.toLowerCase();
        creator = allCreators.find((c) => c.email.toLowerCase() === emailLower);
        if (creator) {
          // MIGRATION: Update 5 GB to 1 GB if needed (file storage)
          if (creator.storageBaseGb === 5) {
            creator.storageBaseGb = STORAGE_BASE_GB; // 1 GB
            creator.updatedAt = new Date().toISOString();
            // Save migration to file storage
            try {
              await persistCreators();
            } catch (migError) {
              console.error(`[Creators] ❌ Error migrating creator ${emailLower}:`, migError);
            }
          }
          
          // Update in-memory cache
          const index = creatorsDatabase.findIndex((c) => c.email.toLowerCase() === emailLower);
          if (index !== -1) {
            creatorsDatabase[index] = creator;
          } else {
            creatorsDatabase.push(creator);
          }
        }
      } catch (error) {
        console.error("❌ Error loading creators from file:", error);
      }
    }
    
    // Final fallback to in-memory cache
    if (!creator) {
      creator = getCreatorByEmail(email);
    }
    
    if (creator) {
      // Check if migration is needed (5 GB -> 1 GB)
      const needsMigration = creator.storageBaseGb === 5;
      const refreshedCreator = refreshStorageState(creator);
      
      // If migration occurred, save the updated profile back to database
      if (needsMigration && refreshedCreator.storageBaseGb === 1) {
        try {
          const useMongo = await isMongoDBAvailable();
          const index = creatorsDatabase.findIndex((c) => c.email.toLowerCase() === email.toLowerCase());
          if (index !== -1) {
            creatorsDatabase[index] = refreshedCreator;
          }
          
          // Persist the migration to database
          if (useMongo) {
            try {
              const mongoCreators = await mongoService.getAllCreators();
              const emailLower = email.toLowerCase();
              const mongoCreator = mongoCreators.find((c: any) => {
                const creatorEmail = (c.email || '').toLowerCase();
                return creatorEmail === emailLower;
              });
              if (mongoCreator) {
                await mongoService.updateCreator(mongoCreator._id.toString(), {
                  storageBaseGb: 1,
                  updatedAt: new Date().toISOString(),
                });
              }
            } catch (mongoError) {
              console.error("❌ Error saving migration to MongoDB:", mongoError);
            }
          }
          
          // Also save to file storage if not using MongoDB
          await persistCreators();
        } catch (migrationError) {
          console.error("❌ Error persisting storage migration:", migrationError);
        }
      }
      
      res.json(refreshedCreator);
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error("❌ Error in getCreatorStatus:", error);
    // Fallback to in-memory cache on error
    const creator = getCreatorByEmail(email);
    res.json(creator ? refreshStorageState(creator) : null);
  }
};

export const getCreatorsAdmin: RequestHandler = async (req, res) => {
  try {
    // Always fetch fresh data from database to ensure latest creators are shown
    const useMongo = await isMongoDBAvailable();
    
    let creators: CreatorProfile[] = [];
    
    if (useMongo) {
      try {
        const mongoCreators = await mongoService.getAllCreators();
        creators = mongoCreators.map((creator: any) => {
          const { _id, ...rest } = creator;
          return {
            ...rest,
            id: rest.id || _id.toString(),
          } as CreatorProfile;
        });
      } catch (error) {
        console.error("❌ Error fetching creators from MongoDB:", error);
        // Fallback to in-memory database
        creators = creatorsDatabase;
      }
    } else {
      // Load from file storage
      try {
        creators = await loadCreatorsDatabase();
        // Update in-memory database
        creatorsDatabase = creators;
      } catch (error) {
        console.error("❌ Error loading creators from file:", error);
        // Fallback to in-memory database
        creators = creatorsDatabase;
      }
    }
    
    // Refresh storage state for all creators
    const refreshedCreators = creators.map((creator) => refreshStorageState(creator));
    
    const response: CreatorListResponse = {
      data: refreshedCreators,
      total: refreshedCreators.length,
    };
    res.json(response);
  } catch (error) {
    console.error("❌ Error in getCreatorsAdmin:", error);
    // Fallback to in-memory database
    const response: CreatorListResponse = {
      data: creatorsDatabase.map((creator) => refreshStorageState(creator)),
      total: creatorsDatabase.length,
    };
    res.json(response);
  }
};

export const updateCreatorStatus: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body as { status: CreatorStatus; notes?: string };

  if (!status || !["pending", "approved", "rejected"].includes(status)) {
    res.status(400).json({ error: "Invalid status. Must be 'pending', 'approved', or 'rejected'" });
    return;
  }

  // First, reload fresh data to ensure we have the latest
  const useMongo = await isMongoDBAvailable();
  let creator: CreatorProfile | undefined;
  
  if (useMongo) {
    try {
      const mongoCreators = await mongoService.getAllCreators();
      const found = mongoCreators.find((c: any) => c.id === id || c._id?.toString() === id);
      if (found) {
        const { _id, ...rest } = found;
        creator = { ...rest, id: rest.id || _id.toString() } as CreatorProfile;
      }
    } catch (error) {
      console.error("❌ Error fetching creator from MongoDB:", error);
    }
  }
  
  // Fallback to in-memory database if not found in MongoDB
  if (!creator) {
    creator = creatorsDatabase.find((c) => c.id === id);
  }
  
  if (!creator) {
    res.status(404).json({ error: "Creator not found" });
    return;
  }
  
  // Update the creator status
  creator.status = status;
  creator.updatedAt = new Date().toISOString();
  if (notes) {
    creator.message = notes;
  }
  
  // Update in-memory database
  const index = creatorsDatabase.findIndex((c) => c.id === id);
  if (index !== -1) {
    creatorsDatabase[index] = creator;
  } else {
    creatorsDatabase.push(creator);
  }
  
  // Save to database
  try {
    // Save to MongoDB if available
    if (useMongo) {
      try {
        const mongoCreators = await mongoService.getAllCreators();
        const mongoCreator = mongoCreators.find((c: any) => c.id === id || c._id?.toString() === id);
        if (mongoCreator) {
          await mongoService.updateCreator(mongoCreator._id.toString(), {
            status,
            updatedAt: creator.updatedAt,
            ...(notes && { message: notes }),
          });
        } else {
          // Creator not in MongoDB, create it
          await mongoService.createCreator(creator);
        }
      } catch (mongoError) {
        console.error("❌ Error updating creator in MongoDB:", mongoError);
        // Fallback to file storage
        await saveCreatorsDatabase(creatorsDatabase);
      }
    } else {
      // Save to file storage
      await saveCreatorsDatabase(creatorsDatabase);
    }
    
    res.json({ success: true, creator: refreshStorageState(creator) });
  } catch (error) {
    console.error("Failed to update creator status:", error);
    res.status(500).json({ error: "Failed to update creator status" });
  }
};

export const purchaseCreatorStorage: RequestHandler = async (req, res) => {
  const { creatorId, gb, months } = req.body as CreatorStoragePurchaseRequest;

  if (!creatorId || !gb || !months) {
    res.status(400).json({ error: "creatorId, gb, and months are required" });
    return;
  }

  const settings = await loadSettings();
  if (!settings.payment.autoPaymentEnabled) {
    res.status(403).json({
      error: "Auto payment is disabled. Please use manual payment and wait for admin approval.",
    });
    return;
  }

  if (!STORAGE_PLAN_PRICING_TK[gb]) {
    res.status(400).json({ error: "Invalid storage plan selected" });
    return;
  }

  if (!STORAGE_DURATION_OPTIONS.includes(months)) {
    res.status(400).json({ error: "Invalid duration selected" });
    return;
  }

  // Get creator - ensure we have the latest data from database
  let creator = getCreatorById(creatorId);
  if (!creator) {
    res.status(404).json({ error: "Creator profile not found" });
    return;
  }
  
  // CRITICAL: Reload fresh data from database to ensure we have ALL existing purchases
  // This prevents losing previous purchases when adding a new one
  const useMongo = await isMongoDBAvailable();
  if (useMongo) {
    try {
      const allCreators = await mongoService.getAllCreators();
      const dbCreator = allCreators.find((c: any) => c.id === creatorId || c.email === creator.email);
      if (dbCreator) {
        const { _id, ...rest } = dbCreator;
        // Ensure purchase history is an array
        if (!Array.isArray(rest.storagePurchaseHistory)) {
          rest.storagePurchaseHistory = rest.storagePurchaseHistory ? [rest.storagePurchaseHistory] : [];
        }
        creator = refreshStorageState({ ...rest, id: rest.id || _id.toString() } as CreatorProfile);
        // Update in-memory cache with fresh data
        const index = creatorsDatabase.findIndex((c) => c.id === creatorId);
        if (index !== -1) {
          creatorsDatabase[index] = creator;
        }
      }
    } catch (reloadError) {
      console.error(`[Storage Purchase] Error reloading from MongoDB before purchase:`, reloadError);
    }
  }
  
  // CRITICAL: Ensure purchase history array exists and is an array
  if (!Array.isArray(creator.storagePurchaseHistory)) {
    creator.storagePurchaseHistory = [];
  }

  const pricePerGb = STORAGE_PLAN_PRICING_TK[gb];
  const totalTk = pricePerGb * months;
  const now = new Date();
  
  // Calculate expiration date for the new purchase
  const newExpiresAt = new Date(now);
  newExpiresAt.setMonth(newExpiresAt.getMonth() + months);
  
  // Create new purchase entry - each purchase is stored as a separate entry in the array
  const purchase: CreatorStoragePurchase = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID with timestamp + random
    gb,
    months,
    pricePerGbTk: pricePerGb,
    totalTk,
    purchasedAt: now.toISOString(),
    expiresAt: newExpiresAt.toISOString(), // Each purchase has its own expiration date
    paymentMethod: "auto",
    status: "completed",
  };
  
  // Add purchase to history array - this is a separate entry, never overwrites existing ones
  creator.storagePurchaseHistory.push(purchase);
  
  // Now recalculate total storage from ALL purchases in the array
  // Formula: total_storage = free_storage + sum(all_active_purchases)
  refreshStorageState(creator);
  
  creator.updatedAt = now.toISOString();
  
  // Update the creator in the in-memory database array
  const index = creatorsDatabase.findIndex((c) => c.id === creatorId);
  if (index !== -1) {
    creatorsDatabase[index] = creator;
  }

  try {
    // Save to database
    await persistCreators();
    
    // Reload creator from database to ensure we have the latest data
    // This is especially important for MongoDB to ensure data consistency
    const useMongo = await isMongoDBAvailable();
    if (useMongo) {
      try {
        const reloadedCreators = await mongoService.getAllCreators();
        const reloadedCreator = reloadedCreators.find((c: any) => c.id === creatorId || c.email === creator.email);
        if (reloadedCreator) {
          const { _id, ...rest } = reloadedCreator;
          const refreshed = refreshStorageState({ ...rest, id: rest.id || _id.toString() } as CreatorProfile);
          // Update in-memory cache
          const index = creatorsDatabase.findIndex((c) => c.id === creatorId);
          if (index !== -1) {
            creatorsDatabase[index] = refreshed;
            creator = refreshed;
          }
        }
      } catch (reloadError) {
        console.error(`[Storage Purchase] Error reloading from MongoDB:`, reloadError);
      }
    }
    
    // Send email notification to admin
    try {
      await sendAdminMail(
        `New Creator Order: ${creator.name} - ৳${totalTk}`,
        'newOrder',
        {
          orderId: purchase.id,
          name: creator.name,
          email: creator.email,
          amount: totalTk.toLocaleString('en-US'),
          date: now.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          status: purchase.status,
          statusClass: purchase.status === 'completed' ? 'status-completed' : 'status-pending',
          storagePlan: gb.toString(),
          duration: months.toString(),
          paymentMethod: purchase.paymentMethod,
          isManualPayment: false,
        }
      );
    } catch (emailError) {
      console.error('Failed to send order email:', emailError);
      // Don't fail the request if email fails
    }
    
    // Return refreshed creator with correct storage totals calculated from all purchases
    res.json({
      creator: refreshStorageState(creator),
      purchase,
    });
  } catch (error) {
    console.error("Failed to update storage plan:", error);
    res.status(500).json({ error: "Failed to update storage plan" });
  }
};

export const purchaseCreatorStorageManual: RequestHandler = async (req, res) => {
  const { creatorId, gb, months, transactionId, senderNumber } = req.body as CreatorStorageManualPaymentRequest;

  if (!creatorId || !gb || !months || !transactionId || !senderNumber) {
    res.status(400).json({ error: "creatorId, gb, months, transactionId, and senderNumber are required" });
    return;
  }

  if (!STORAGE_PLAN_PRICING_TK[gb]) {
    res.status(400).json({ error: "Invalid storage plan selected" });
    return;
  }

  if (!STORAGE_DURATION_OPTIONS.includes(months)) {
    res.status(400).json({ error: "Invalid duration selected" });
    return;
  }

  // Get creator - ensure we have the latest data from database
  let creator = getCreatorById(creatorId);
  if (!creator) {
    res.status(404).json({ error: "Creator profile not found" });
    return;
  }
  
  // CRITICAL: Reload fresh data from database to ensure we have ALL existing purchases
  // This prevents losing previous purchases when adding a new one
  const useMongo = await isMongoDBAvailable();
  if (useMongo) {
    try {
      const allCreators = await mongoService.getAllCreators();
      const dbCreator = allCreators.find((c: any) => c.id === creatorId || c.email === creator.email);
      if (dbCreator) {
        const { _id, ...rest } = dbCreator;
        // Ensure purchase history is an array
        if (!Array.isArray(rest.storagePurchaseHistory)) {
          rest.storagePurchaseHistory = rest.storagePurchaseHistory ? [rest.storagePurchaseHistory] : [];
        }
        creator = refreshStorageState({ ...rest, id: rest.id || _id.toString() } as CreatorProfile);
        // Update in-memory cache with fresh data
        const index = creatorsDatabase.findIndex((c) => c.id === creatorId);
        if (index !== -1) {
          creatorsDatabase[index] = creator;
        }
      }
    } catch (reloadError) {
      console.error(`[Storage Purchase Manual] Error reloading from MongoDB before purchase:`, reloadError);
    }
  }
  
  // CRITICAL: Ensure purchase history array exists and is an array
  if (!Array.isArray(creator.storagePurchaseHistory)) {
    creator.storagePurchaseHistory = [];
  }

  const pricePerGb = STORAGE_PLAN_PRICING_TK[gb];
  const totalTk = pricePerGb * months;
  const now = new Date();

  const purchase: CreatorStoragePurchase = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    gb,
    months,
    pricePerGbTk: pricePerGb,
    totalTk,
    purchasedAt: now.toISOString(),
    expiresAt: now.toISOString(), // Will be set when admin approves
    paymentMethod: "manual",
    status: "pending", // Requires admin approval
    reference: transactionId,
    senderNumber,
  };

  // Add purchase to history array - this is a separate entry, never overwrites existing ones
  creator.storagePurchaseHistory.push(purchase);
  creator.updatedAt = now.toISOString();
  
  // Update the creator in the in-memory database array
  const index = creatorsDatabase.findIndex((c) => c.id === creatorId);
  if (index !== -1) {
    creatorsDatabase[index] = creator;
  }

  try {
    // Save to database
    await persistCreators();
    
    // Reload creator from database to ensure we have the latest data
    // This is especially important for MongoDB to ensure data consistency
    if (useMongo) {
      try {
        const reloadedCreators = await mongoService.getAllCreators();
        const reloadedCreator = reloadedCreators.find((c: any) => c.id === creatorId || c.email === creator.email);
        if (reloadedCreator) {
          const { _id, ...rest } = reloadedCreator;
          const refreshed = refreshStorageState({ ...rest, id: rest.id || _id.toString() } as CreatorProfile);
          // Update in-memory cache
          const index = creatorsDatabase.findIndex((c) => c.id === creatorId);
          if (index !== -1) {
            creatorsDatabase[index] = refreshed;
            creator = refreshed;
          }
        }
      } catch (reloadError) {
        console.error(`[Storage Purchase Manual] Error reloading from MongoDB:`, reloadError);
      }
    }
    
    // Send email notification to admin for manual payment
    try {
      await sendAdminMail(
        `New Creator Order (Manual Payment): ${creator.name} - ৳${totalTk}`,
        'newOrder',
        {
          orderId: purchase.id,
          name: creator.name,
          email: creator.email,
          amount: totalTk.toLocaleString('en-US'),
          date: now.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          status: purchase.status,
          statusClass: 'status-pending',
          storagePlan: gb.toString(),
          duration: months.toString(),
          paymentMethod: 'Manual (bKash)',
          transactionId: transactionId,
          senderNumber: senderNumber,
          isManualPayment: true,
        }
      );
    } catch (emailError) {
      console.error('Failed to send order email:', emailError);
      // Don't fail the request if email fails
    }
    
    // Return refreshed creator with correct storage totals calculated from all purchases
    res.json({
      creator: refreshStorageState(creator),
      purchase,
      message: "Manual payment submitted. Admin review required before storage is added.",
    });
  } catch (error) {
    console.error("Failed to submit manual storage plan:", error);
    res.status(500).json({ error: "Failed to submit manual storage plan" });
  }
};

function applyStorageBonus(creator: CreatorProfile, gb: number, months: number): string {
  const now = new Date();
  const newExpiresAt = new Date(now);
  newExpiresAt.setMonth(newExpiresAt.getMonth() + months);
  
  // Refresh storage state to ensure we have current values
  refreshStorageState(creator);
  
  // Check if there's existing active bonus storage
  const existingExpiresAt = creator.storageBonusExpiresAt 
    ? new Date(creator.storageBonusExpiresAt) 
    : null;
  
  const hasActiveBonus = existingExpiresAt && existingExpiresAt.getTime() > now.getTime();
  const existingBonusGb = hasActiveBonus ? (creator.storageBonusGb || 0) : 0;
  
  // Add the new storage to existing bonus (accumulate multiple purchases)
  creator.storageBonusGb = existingBonusGb + gb;
  
  // Set expiration to the latest date (either existing or new)
  // This ensures creators get the full benefit of all their purchases
  if (hasActiveBonus && existingExpiresAt && existingExpiresAt.getTime() > newExpiresAt.getTime()) {
    // Existing bonus expires later, keep that expiration
    creator.storageBonusExpiresAt = existingExpiresAt.toISOString();
  } else {
    // New purchase expires later or no existing bonus, use new expiration
    creator.storageBonusExpiresAt = newExpiresAt.toISOString();
  }
  
  creator.updatedAt = now.toISOString();
  console.log(`[Storage] Applied ${gb} GB bonus to creator ${creator.email}. Total bonus: ${creator.storageBonusGb} GB, expires: ${creator.storageBonusExpiresAt}`);
  return creator.storageBonusExpiresAt;
}

export const getManualStoragePayments: RequestHandler = (_req, res) => {
  const records = creatorsDatabase.flatMap((creator) =>
    (creator.storagePurchaseHistory || [])
      .filter((purchase) => purchase.paymentMethod === "manual")
      .map((purchase) => ({
        creatorId: creator.id,
        creatorName: creator.name,
        creatorEmail: creator.email,
        purchase,
      }))
  );

  res.json(records);
};

// Get ALL purchase history (both auto and manual) for all creators
export const getAllStoragePurchases: RequestHandler = (_req, res) => {
  try {
    // Get all purchases from all creators
    const records = creatorsDatabase.flatMap((creator) => {
      const purchases = creator.storagePurchaseHistory || [];
      return purchases.map((purchase) => ({
        creatorId: creator.id,
        creatorName: creator.name,
        creatorEmail: creator.email,
        purchase,
      }));
    });

    // Sort all records by purchase date, newest first
    records.sort((a, b) => {
      const dateA = new Date(a.purchase.purchasedAt).getTime();
      const dateB = new Date(b.purchase.purchasedAt).getTime();
      return dateB - dateA;
    });

    res.json(records);
  } catch (error: any) {
    console.error("[getAllStoragePurchases] ❌ Error:", error);
    res.status(500).json({ error: "Failed to load purchase history", message: error.message });
  }
};

// Delete a storage purchase (admin only)
export const deleteStoragePurchase: RequestHandler = async (req, res) => {
  try {
    const { creatorId, purchaseId } = req.params;
    const { reason } = req.body as { reason?: string };
    
    if (!creatorId || !purchaseId) {
      res.status(400).json({ error: "Missing creatorId or purchaseId" });
      return;
    }

    const creator = getCreatorById(creatorId);
    if (!creator) {
      res.status(404).json({ error: "Creator profile not found" });
      return;
    }

    if (!Array.isArray(creator.storagePurchaseHistory)) {
      creator.storagePurchaseHistory = [];
    }

    const purchaseIndex = creator.storagePurchaseHistory.findIndex(
      (p) => p.id === purchaseId
    );

    if (purchaseIndex === -1) {
      res.status(404).json({ error: "Purchase not found" });
      return;
    }

    const purchase = creator.storagePurchaseHistory[purchaseIndex];

    // Remove purchase from history
    creator.storagePurchaseHistory.splice(purchaseIndex, 1);

    // Recalculate storage after deletion
    refreshStorageState(creator);

    creator.updatedAt = new Date().toISOString();

    // Update in-memory cache
    const index = creatorsDatabase.findIndex((c) => c.id === creatorId);
    if (index !== -1) {
      creatorsDatabase[index] = creator;
    }

    await persistCreators();

    res.json({
      success: true,
      creator: refreshStorageState(creator),
      deletedPurchase: purchase,
      message: `Purchase deleted. Creator storage recalculated.`,
    });
  } catch (error: any) {
    console.error("[deleteStoragePurchase] ❌ Error:", error);
    res.status(500).json({ error: "Failed to delete purchase", message: error.message });
  }
};

// Freeze/unfreeze creator account (admin only)
export const freezeCreatorAccount: RequestHandler = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const { frozen, reason } = req.body as { frozen: boolean; reason?: string };

    const creator = getCreatorById(creatorId);
    if (!creator) {
      res.status(404).json({ error: "Creator profile not found" });
      return;
    }

    // Use "rejected" status as frozen, or add a frozen flag
    // For now, we'll use "rejected" status to freeze the account
    if (frozen) {
      creator.status = "rejected";
    } else {
    // Unfreeze - restore to previous status
    // CRITICAL: Check MongoDB for the original status before it was frozen
    // If we can't determine, default to "pending" (safer than assuming approved)
    let originalStatus: CreatorStatus = "pending";
    
    if (useMongo) {
      try {
        const originalCreator = await mongoService.getCreatorById(creatorId);
        if (originalCreator && originalCreator.status) {
          // If they were approved before, restore to approved
          // Otherwise, check if they have uploads
          if (originalCreator.status === "approved") {
            originalStatus = "approved";
          } else {
            const { getMediaDatabase } = await import("./media.js");
            const mediaDatabase = await getMediaDatabase();
            const hasUploads = mediaDatabase.some((media) => media.creatorId === creatorId);
            originalStatus = hasUploads ? "approved" : "pending";
          }
        } else {
          // No original status found, check uploads
          const { getMediaDatabase } = await import("./media.js");
          const mediaDatabase = await getMediaDatabase();
          const hasUploads = mediaDatabase.some((media) => media.creatorId === creatorId);
          originalStatus = hasUploads ? "approved" : "pending";
        }
      } catch (error) {
        console.error("Error checking original status:", error);
        // Fallback: check uploads
        const { getMediaDatabase } = await import("./media.js");
        const mediaDatabase = await getMediaDatabase();
        const hasUploads = mediaDatabase.some((media) => media.creatorId === creatorId);
        originalStatus = hasUploads ? "approved" : "pending";
      }
    } else {
      // File storage fallback
      const { getMediaDatabase } = await import("./media.js");
      const mediaDatabase = await getMediaDatabase();
      const hasUploads = mediaDatabase.some((media) => media.creatorId === creatorId);
      originalStatus = hasUploads ? "approved" : "pending";
    }
    
    creator.status = originalStatus;
    }

    creator.updatedAt = new Date().toISOString();

    // Update in-memory cache
    const index = creatorsDatabase.findIndex((c) => c.id === creatorId);
    if (index !== -1) {
      creatorsDatabase[index] = creator;
    }

    await persistCreators();

    res.json({
      success: true,
      creator: refreshStorageState(creator),
      message: frozen 
        ? `Creator account frozen. They can no longer upload or purchase storage.` 
        : `Creator account unfrozen.`,
    });
  } catch (error: any) {
    console.error("[freezeCreatorAccount] ❌ Error:", error);
    res.status(500).json({ error: "Failed to freeze/unfreeze creator", message: error.message });
  }
};

// Extend or modify creator storage validity (admin only)
export const extendCreatorStorage: RequestHandler = async (req, res) => {
  try {
    const { creatorId, purchaseId } = req.params;
    const { newExpiryDate, additionalMonths, reason } = req.body as {
      newExpiryDate?: string;
      additionalMonths?: number;
      reason?: string;
    };

    const creator = getCreatorById(creatorId);
    if (!creator) {
      res.status(404).json({ error: "Creator profile not found" });
      return;
    }

    if (!Array.isArray(creator.storagePurchaseHistory)) {
      creator.storagePurchaseHistory = [];
    }

    const purchase = creator.storagePurchaseHistory.find((p) => p.id === purchaseId);
    if (!purchase) {
      res.status(404).json({ error: "Purchase not found" });
      return;
    }

    if (purchase.status !== "completed") {
      res.status(400).json({ error: "Can only extend completed purchases" });
      return;
    }

    let newExpiry: Date;
    if (newExpiryDate) {
      newExpiry = new Date(newExpiryDate);
      if (isNaN(newExpiry.getTime())) {
        res.status(400).json({ error: "Invalid expiry date format" });
        return;
      }
    } else if (additionalMonths) {
      const currentExpiry = purchase.expiresAt ? new Date(purchase.expiresAt) : new Date();
      newExpiry = new Date(currentExpiry);
      newExpiry.setMonth(newExpiry.getMonth() + additionalMonths);
    } else {
      res.status(400).json({ error: "Must provide either newExpiryDate or additionalMonths" });
      return;
    }

    purchase.expiresAt = newExpiry.toISOString();
    if (additionalMonths) {
      purchase.months += additionalMonths;
    }

    // Recalculate storage state
    refreshStorageState(creator);
    creator.updatedAt = new Date().toISOString();

    // Update in-memory cache
    const index = creatorsDatabase.findIndex((c) => c.id === creatorId);
    if (index !== -1) {
      creatorsDatabase[index] = creator;
    }

    await persistCreators();

    res.json({
      success: true,
      creator: refreshStorageState(creator),
      purchase,
      message: `Storage validity extended successfully.`,
    });
  } catch (error: any) {
    console.error("[extendCreatorStorage] ❌ Error:", error);
    res.status(500).json({ error: "Failed to extend storage", message: error.message });
  }
};

export const approveManualStoragePayment: RequestHandler = async (req, res) => {
  const { creatorId, purchaseId } = req.params;
  const { adminNote } = req.body as { adminNote?: string };

  const creator = getCreatorById(creatorId);
  if (!creator) {
    res.status(404).json({ error: "Creator profile not found" });
    return;
  }

  const purchase = (creator.storagePurchaseHistory || []).find(
    (entry) => entry.id === purchaseId && entry.paymentMethod === "manual"
  );

  if (!purchase) {
    res.status(404).json({ error: "Purchase record not found" });
    return;
  }

  if (purchase.status !== "pending") {
    res.status(400).json({ error: "Purchase already processed" });
    return;
  }

  // Mark purchase as completed
  purchase.status = "completed";
  purchase.adminNote = adminNote;
  
  // Update expiration date for this purchase
  const now = new Date();
  const purchaseExpiresAt = new Date(now);
  purchaseExpiresAt.setMonth(purchaseExpiresAt.getMonth() + purchase.months);
  purchase.expiresAt = purchaseExpiresAt.toISOString();
  
  // Recalculate total storage from ALL completed purchases (including this newly approved one)
  refreshStorageState(creator);

  try {
    await persistCreators();
    res.json({ creator: refreshStorageState(creator), purchase });
  } catch (error) {
    console.error("Failed to approve manual storage plan:", error);
    res.status(500).json({ error: "Failed to approve manual storage plan" });
  }
};

export const rejectManualStoragePayment: RequestHandler = async (req, res) => {
  const { creatorId, purchaseId } = req.params;
  const { adminNote } = req.body as { adminNote?: string };

  const creator = getCreatorById(creatorId);
  if (!creator) {
    res.status(404).json({ error: "Creator profile not found" });
    return;
  }

  const purchase = (creator.storagePurchaseHistory || []).find(
    (entry) => entry.id === purchaseId && entry.paymentMethod === "manual"
  );

  if (!purchase) {
    res.status(404).json({ error: "Purchase record not found" });
    return;
  }

  if (purchase.status !== "pending") {
    res.status(400).json({ error: "Purchase already processed" });
    return;
  }

  purchase.status = "rejected";
  purchase.adminNote = adminNote;

  try {
    await persistCreators();
    res.json({ creator, purchase });
  } catch (error) {
    console.error("Failed to reject manual storage plan:", error);
    res.status(500).json({ error: "Failed to reject manual storage plan" });
  }
};

