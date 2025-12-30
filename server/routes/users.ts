import { RequestHandler } from "express";
import { AdminUsersResponse, PlatformUser } from "@shared/api";
import { promises as fs } from "fs";
import { join } from "path";
import { DATA_DIR } from "../utils/dataPath.js";
import { isMongoDBAvailable } from "../utils/mongodb.js";
import * as mongoService from "../services/mongodbService.js";

const USERS_DB_FILE = join(DATA_DIR, "users-database.json");

const DEFAULT_USERS: PlatformUser[] = [
  {
    id: "user-admin",
    name: "Admin User",
    email: "admin@freemediabuzz.com",
    accountType: "user",
    role: "admin",
    status: "active",
    emailVerified: true,
    downloads: 0,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
];

let usersDatabase: PlatformUser[] = [];

async function saveUsersDatabase(data: PlatformUser[]): Promise<void> {
  const useMongo = await isMongoDBAvailable();
  
  if (useMongo) {
    try {
      // Get all existing users and replace them
      const existingUsers = await mongoService.getAllUsers();
      
      // Delete all existing users
      for (const user of existingUsers) {
        await mongoService.deleteUser((user as any)._id.toString());
      }
      
      // Insert new users
      for (const user of data) {
        await mongoService.createUser({
          ...user,
          createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
          updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date(),
        });
      }
      return;
    } catch (error) {
      console.error("❌ Error saving to MongoDB:", error);
      // Fallback to file storage
    }
  }
  
  // Fallback to file storage
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(USERS_DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

async function seedUsers(): Promise<PlatformUser[]> {
  await saveUsersDatabase(DEFAULT_USERS);
  console.log(`Seeded ${DEFAULT_USERS.length} default platform users`);
  return DEFAULT_USERS;
}

export async function getUsersDatabase(): Promise<PlatformUser[]> {
  const useMongo = await isMongoDBAvailable();
  
  if (useMongo) {
    try {
      const users = await mongoService.getAllUsers();
      if (users.length > 0) {
        // Remove MongoDB _id and return as array
        return users.map((user: any) => {
          const { _id, ...rest } = user;
          return rest as PlatformUser;
        });
      }
      // If empty, seed default users
      const seeded = await seedUsers();
      // Save to MongoDB
      for (const user of seeded) {
        await mongoService.createUser(user);
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
    const data = await fs.readFile(USERS_DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return await seedUsers();
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return await seedUsers();
    }
    console.error("Error loading users database:", error);
    return [];
  }
}

// Load users database on startup (skip during build)
import { isBuildTime } from "../utils/buildCheck.js";

if (!isBuildTime()) {
  getUsersDatabase()
    .then((loaded) => {
      usersDatabase = loaded;
      console.log(`Loaded ${loaded.length} platform users`);
    })
    .catch((error) => {
      console.error("Failed to load users database, using empty defaults:", error);
    });
}

type RegisterUserPayload = {
  email: string;
  name: string;
  accountType?: PlatformUser["accountType"];
  emailVerified?: boolean;
  firebaseUid?: string;
  referralCode?: string;
  shareCode?: string;
};

// Helper: Generate unique referral code
function generateReferralCode(userId: string, email: string): string {
  const hash = `${userId}-${email}`.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const code = `REF${hash.toString(36).toUpperCase().slice(0, 8)}`;
  return code;
}

export const registerUser: RequestHandler = async (req, res) => {
  const { email, name, accountType, emailVerified = false, firebaseUid, referralCode, shareCode }: RegisterUserPayload = req.body;

  if (!email || !name) {
    res.status(400).json({ error: "Name and email are required" });
    return;
  }

  const emailLower = email.toLowerCase();
  const timestamp = new Date().toISOString();
  let user = usersDatabase.find((u) => u.email.toLowerCase() === emailLower);
  const isNewUser = !user;

  const normalizedAccountType = accountType ?? user?.accountType ?? "user";
  
  // Check if this is the admin email
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@freemediabuzz.com").toLowerCase();
  const isAdminEmail = emailLower === adminEmail;

  if (!user) {
    const userId = Date.now().toString();
    const userReferralCode = generateReferralCode(userId, email);
    user = {
      id: userId,
      email,
      name,
      accountType: normalizedAccountType,
      role: isAdminEmail ? "admin" : "user", // Set admin role if email matches
      status: emailVerified ? "active" : "pending",
      emailVerified,
      downloads: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      firebaseUid,
      referralCode: userReferralCode,
    } as any;
    usersDatabase.push(user);
    console.log(`[Users] ✅ New user created: ${user.email} (${user.accountType}, role: ${user.role})`);
  } else {
    // Update existing user - preserve admin role if it exists, or grant it if email matches admin
    if (isAdminEmail && user.role !== "admin") {
      user.role = "admin";
      console.log(`[Users] ⚠️ Upgraded user to admin: ${user.email}`);
    }
    user.name = name;
    user.accountType = normalizedAccountType;
    user.emailVerified = emailVerified;
    user.firebaseUid = firebaseUid || user.firebaseUid;
    user.updatedAt = timestamp;
    if (emailVerified && user.status === "pending") {
      user.status = "active";
    }
    // Generate referral code if user doesn't have one
    if (!(user as any).referralCode) {
      (user as any).referralCode = generateReferralCode(user.id, email);
    }
    console.log(`[Users] ✅ User updated: ${user.email}`);
  }

  try {
    const useMongo = await isMongoDBAvailable();
    
    if (useMongo) {
      try {
        // Check if user exists in MongoDB
        const existingUser = await mongoService.getUserByEmail(emailLower);
        
        if (!existingUser) {
          // Create new user
          await mongoService.createUser({
            ...user,
            uid: firebaseUid,
          });
          console.log(`[Users] ✅ New user saved to MongoDB: ${user.email}`);
        } else {
          // Update existing user
          await mongoService.updateUser(existingUser._id.toString(), {
            name: user.name,
            accountType: user.accountType,
            emailVerified: user.emailVerified,
            firebaseUid: firebaseUid || existingUser.firebaseUid,
            status: user.status,
            updatedAt: user.updatedAt,
          });
          console.log(`[Users] ✅ User updated in MongoDB: ${user.email}`);
        }
        // Reload users from MongoDB to sync in-memory database
        const allUsers = await mongoService.getAllUsers();
        usersDatabase = allUsers.map((u: any) => {
          const { _id, ...rest } = u;
          return { ...rest, id: rest.id || _id.toString() } as PlatformUser;
        });
      } catch (mongoError) {
        console.error("❌ Error saving to MongoDB:", mongoError);
        // Fallback to file storage
        await saveUsersDatabase(usersDatabase);
      }
    } else {
      await saveUsersDatabase(usersDatabase);
    }
    
    // Process referral and share for new users immediately
    // No need to wait for email verification - referrals are marked as pending anyway
    if (isNewUser && (referralCode || shareCode)) {
      try {
        console.log(`[Users] Processing referral/share for new user ${user.id}: referralCode=${referralCode}, shareCode=${shareCode}`);
        const { processReferralSignup } = await import("./referral.js");
        const userIp = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0] || req.headers['x-real-ip']?.toString() || 'unknown';
        await processReferralSignup(user.id, email, referralCode, shareCode, userIp);
        console.log(`[Users] ✅ Referral/share processing completed for user ${user.id}`);
      } catch (error) {
        console.error(`[Users] ❌ Error processing referral/share for user ${user.id}:`, error);
        // Don't fail registration if referral processing fails
      }
    }
    
    res.json(user);
  } catch (error) {
    console.error("Failed to save platform user:", error);
    res.status(500).json({ error: "Failed to save user profile" });
  }
};

export const getUsersAdmin: RequestHandler = async (_req, res) => {
  try {
    // Always fetch fresh data from database to ensure latest users are shown
    const useMongo = await isMongoDBAvailable();
    
    let users: PlatformUser[] = [];
    
    if (useMongo) {
      try {
        const mongoUsers = await mongoService.getAllUsers();
        users = mongoUsers.map((user: any) => {
          const { _id, ...rest } = user;
          return {
            ...rest,
            id: rest.id || _id.toString(),
          } as PlatformUser;
        });
      } catch (error) {
        console.error("❌ Error fetching users from MongoDB:", error);
        // Fallback to in-memory database
        users = usersDatabase;
      }
    } else {
      // Load from file storage
      try {
        users = await getUsersDatabase();
        // Update in-memory database
        usersDatabase = users;
      } catch (error) {
        console.error("❌ Error loading users from file:", error);
        // Fallback to in-memory database
        users = usersDatabase;
      }
    }
    
    const response: AdminUsersResponse = {
      data: users,
      total: users.length,
    };
    res.json(response);
  } catch (error) {
    console.error("❌ Error in getUsersAdmin:", error);
    // Fallback to in-memory database
    const response: AdminUsersResponse = {
      data: usersDatabase,
      total: usersDatabase.length,
    };
    res.json(response);
  }
};

