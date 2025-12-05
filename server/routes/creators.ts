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

const CREATORS_DB_FILE = join(DATA_DIR, "creators-database.json");
const STORAGE_BASE_GB = 5;
const GB_IN_BYTES = 1024 * 1024 * 1024;
const STORAGE_PLAN_PRICING_TK: Record<number, number> = {
  1: 299,
  2: 399,
  4: 499,
  5: 599,
};
const STORAGE_DURATION_OPTIONS = [2, 4, 6, 8, 10, 12];

const DEFAULT_CREATORS: CreatorProfile[] = [
  {
    id: "creator-ava-martinez",
    name: "Ava Martinez",
    email: "ava@freemediabuzz.com",
    status: "approved",
    bio: "Award-winning colorist focusing on cinematic city loops and neon-lit portraits.",
    portfolioUrl: "https://avascope.studio",
    specialization: "Cinematic LUTs & 4K lifestyle packs",
    message: "Currently sharing a weekly drop of commercial-safe video loops.",
    createdAt: "2024-07-18T10:00:00.000Z",
    updatedAt: "2024-10-03T15:12:00.000Z",
    lastRequestAt: "2024-10-03T15:12:00.000Z",
    storageBaseGb: STORAGE_BASE_GB,
    storageBonusGb: 0,
    storageUsedBytes: 0,
  },
  {
    id: "creator-noah-sato",
    name: "Noah Sato",
    email: "noah@freemediabuzz.com",
    status: "pending",
    bio: "Motion designer submitting modular HUD templates for Premiere & After Effects.",
    portfolioUrl: "https://noahmakes.tv",
    specialization: "HUD templates & motion packs",
    message: "Uploading a sci-fi UI bundle for beta testers.",
    createdAt: "2024-09-02T09:30:00.000Z",
    updatedAt: "2024-11-10T08:45:00.000Z",
    lastRequestAt: "2024-11-10T08:45:00.000Z",
    storageBaseGb: STORAGE_BASE_GB,
    storageBonusGb: 0,
    storageUsedBytes: 0,
  },
  {
    id: "creator-lina-cho",
    name: "Lina Cho",
    email: "lina@freemediabuzz.com",
    status: "rejected",
    bio: "Indie producer focused on chillhop instrumentals and looping stems.",
    portfolioUrl: "https://linachomusic.com",
    specialization: "Lo-fi audio packs",
    message: "Resubmitting with cleared samples and new cover art.",
    createdAt: "2024-06-11T14:20:00.000Z",
    updatedAt: "2024-08-25T11:00:00.000Z",
    lastRequestAt: "2024-08-25T11:00:00.000Z",
    storageBaseGb: STORAGE_BASE_GB,
    storageBonusGb: 0,
    storageUsedBytes: 0,
  },
];

let creatorsDatabase: CreatorProfile[] = [];

function refreshStorageState(creator: CreatorProfile): CreatorProfile {
  if (!creator) return creator;
  if (creator.storageBaseGb === undefined) creator.storageBaseGb = STORAGE_BASE_GB;
  if (creator.storageBonusGb === undefined) creator.storageBonusGb = 0;
  if (creator.storageUsedBytes === undefined) creator.storageUsedBytes = 0;
  if (creator.storageBonusExpiresAt) {
    const expires = new Date(creator.storageBonusExpiresAt);
    if (isNaN(expires.getTime()) || expires.getTime() <= Date.now()) {
      creator.storageBonusGb = 0;
      delete creator.storageBonusExpiresAt;
    }
  }
  if (!creator.storagePurchaseHistory) {
    creator.storagePurchaseHistory = [];
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
  console.log(`Seeded ${DEFAULT_CREATORS.length} default creator profiles`);
  return DEFAULT_CREATORS;
}

async function loadCreatorsDatabase(): Promise<CreatorProfile[]> {
  const useMongo = await isMongoDBAvailable();
  
  if (useMongo) {
    try {
      const creators = await mongoService.getAllCreators();
      if (creators.length > 0) {
        // Remove MongoDB _id and return as array
        return creators.map((creator: any) => {
          const { _id, ...rest } = creator;
          return refreshStorageState(rest as CreatorProfile);
        });
      }
      // If empty, seed default creators
      const seeded = await seedCreators();
      // Save to MongoDB
      for (const creator of seeded) {
        await mongoService.createCreator(creator);
      }
      return seeded;
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
    return await seedCreators();
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return await seedCreators();
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
          await collection.insertMany(data.map(creator => ({
            ...creator,
            createdAt: creator.createdAt ? new Date(creator.createdAt) : new Date(),
            updatedAt: creator.updatedAt ? new Date(creator.updatedAt) : new Date(),
            lastRequestAt: creator.lastRequestAt ? new Date(creator.lastRequestAt) : new Date(),
          })));
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

loadCreatorsDatabase()
  .then((loaded) => {
    creatorsDatabase = loaded.map((creator) => refreshStorageState(creator));
    console.log(`Loaded ${loaded.length} creator profiles`);
  })
  .catch((error) => {
    console.error("Failed to load creators database, using empty defaults:", error);
  });

export const createOrUpdateCreator: RequestHandler = async (req, res) => {
  const payload: CreatorApplicationRequest = req.body;

  if (!payload.email || !payload.name) {
    res.status(400).json({ error: "Name and email are required" });
    return;
  }

  const timestamp = new Date().toISOString();
  const emailLower = payload.email.toLowerCase();
  let creator = creatorsDatabase.find((c) => c.email.toLowerCase() === emailLower);

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
    creator.name = payload.name;
    creator.firebaseUid = payload.firebaseUid || creator.firebaseUid;
    creator.bio = payload.bio;
    creator.portfolioUrl = payload.portfolioUrl;
    creator.specialization = payload.specialization;
    creator.message = payload.message;
    creator.lastRequestAt = timestamp;
    creator.updatedAt = timestamp;
    if (creator.status === "rejected") {
      creator.status = "pending";
    }
  }

  try {
    await persistCreators();
    res.json(creator);
  } catch (error) {
    console.error("Failed to save creator profile:", error);
    res.status(500).json({ error: "Failed to save creator profile" });
  }
};

export const getCreatorStatus: RequestHandler = (req, res) => {
  const { email } = req.query;

  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const creator = getCreatorByEmail(email);
  res.json(creator || null);
};

export const getCreatorsAdmin: RequestHandler = (req, res) => {
  const response: CreatorListResponse = {
    data: creatorsDatabase.map((creator) => refreshStorageState(creator)),
    total: creatorsDatabase.length,
  };
  res.json(response);
};

export const updateCreatorStatus: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body as { status: CreatorStatus; notes?: string };

  if (!status || !["pending", "approved", "rejected"].includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const creator = getCreatorById(id);

  if (!creator) {
    res.status(404).json({ error: "Creator profile not found" });
    return;
  }

  creator.status = status;
  creator.message = notes || creator.message;
  creator.updatedAt = new Date().toISOString();

  try {
    await persistCreators();
    res.json(creator);
  } catch (error) {
    console.error("Failed to update creator profile:", error);
    res.status(500).json({ error: "Failed to update creator profile" });
  }
};

export const purchaseCreatorStorage: RequestHandler = async (req, res) => {
  const { creatorId, gb, months } = req.body as CreatorStoragePurchaseRequest;

  if (!creatorId || !gb || !months) {
    res.status(400).json({ error: "creatorId, gb, and months are required" });
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

  const creator = getCreatorById(creatorId);
  if (!creator) {
    res.status(404).json({ error: "Creator profile not found" });
    return;
  }

  const pricePerGb = STORAGE_PLAN_PRICING_TK[gb];
  const totalTk = pricePerGb * months;
  const now = new Date();
  const expiresAt = applyStorageBonus(creator, gb, months);
  creator.storagePurchaseHistory = creator.storagePurchaseHistory || [];
  const purchase: CreatorStoragePurchase = {
    id: `${Date.now()}`,
    gb,
    months,
    pricePerGbTk: pricePerGb,
    totalTk,
    purchasedAt: now.toISOString(),
    expiresAt,
    paymentMethod: "auto",
    status: "completed",
  };
  creator.storagePurchaseHistory.push(purchase);
  creator.updatedAt = now.toISOString();

  try {
    await persistCreators();
    res.json({
      creator,
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

  const creator = getCreatorById(creatorId);
  if (!creator) {
    res.status(404).json({ error: "Creator profile not found" });
    return;
  }

  const pricePerGb = STORAGE_PLAN_PRICING_TK[gb];
  const totalTk = pricePerGb * months;
  const now = new Date();

  const purchase: CreatorStoragePurchase = {
    id: `${Date.now()}`,
    gb,
    months,
    pricePerGbTk: pricePerGb,
    totalTk,
    purchasedAt: now.toISOString(),
    expiresAt: now.toISOString(),
    paymentMethod: "manual",
    status: "pending",
    reference: transactionId,
    senderNumber,
  };

  creator.storagePurchaseHistory = creator.storagePurchaseHistory || [];
  creator.storagePurchaseHistory.push(purchase);
  creator.updatedAt = now.toISOString();

  try {
    await persistCreators();
    res.json({
      creator,
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
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + months);
  creator.storageBonusGb = gb;
  creator.storageBonusExpiresAt = expiresAt.toISOString();
  creator.updatedAt = now.toISOString();
  return expiresAt.toISOString();
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

  const expiresAt = applyStorageBonus(creator, purchase.gb, purchase.months);
  purchase.status = "completed";
  purchase.expiresAt = expiresAt;
  purchase.adminNote = adminNote;

  try {
    await persistCreators();
    res.json({ creator, purchase });
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

