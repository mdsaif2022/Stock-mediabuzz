import { RequestHandler } from "express";
import { AdminUsersResponse, PlatformUser } from "@shared/api";
import { promises as fs } from "fs";
import { join } from "path";
import { DATA_DIR } from "../utils/dataPath.js";

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
  {
    id: "user-demo",
    name: "Demo Member",
    email: "demo@freemediabuzz.com",
    accountType: "user",
    role: "user",
    status: "active",
    emailVerified: true,
    downloads: 12,
    createdAt: "2024-02-15T12:00:00.000Z",
    updatedAt: "2024-02-20T08:00:00.000Z",
  },
];

let usersDatabase: PlatformUser[] = [];

async function saveUsersDatabase(data: PlatformUser[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(USERS_DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

async function seedUsers(): Promise<PlatformUser[]> {
  await saveUsersDatabase(DEFAULT_USERS);
  console.log(`Seeded ${DEFAULT_USERS.length} default platform users`);
  return DEFAULT_USERS;
}

async function loadUsersDatabase(): Promise<PlatformUser[]> {
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

loadUsersDatabase()
  .then((loaded) => {
    usersDatabase = loaded;
    console.log(`Loaded ${loaded.length} platform users`);
  })
  .catch((error) => {
    console.error("Failed to load users database, using empty defaults:", error);
  });

type RegisterUserPayload = {
  email: string;
  name: string;
  accountType?: PlatformUser["accountType"];
  emailVerified?: boolean;
  firebaseUid?: string;
};

export const registerUser: RequestHandler = async (req, res) => {
  const { email, name, accountType, emailVerified = false, firebaseUid }: RegisterUserPayload = req.body;

  if (!email || !name) {
    res.status(400).json({ error: "Name and email are required" });
    return;
  }

  const emailLower = email.toLowerCase();
  const timestamp = new Date().toISOString();
  let user = usersDatabase.find((u) => u.email.toLowerCase() === emailLower);

  const normalizedAccountType = accountType ?? user?.accountType ?? "user";

  if (!user) {
    user = {
      id: Date.now().toString(),
      email,
      name,
      accountType: normalizedAccountType,
      role: "user",
      status: emailVerified ? "active" : "pending",
      emailVerified,
      downloads: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      firebaseUid,
    };
    usersDatabase.push(user);
  } else {
    user.name = name;
    user.accountType = normalizedAccountType;
    user.emailVerified = emailVerified;
    user.firebaseUid = firebaseUid || user.firebaseUid;
    user.updatedAt = timestamp;
    if (emailVerified && user.status === "pending") {
      user.status = "active";
    }
  }

  try {
    await saveUsersDatabase(usersDatabase);
    res.json(user);
  } catch (error) {
    console.error("Failed to save platform user:", error);
    res.status(500).json({ error: "Failed to save user profile" });
  }
};

export const getUsersAdmin: RequestHandler = (_req, res) => {
  const response: AdminUsersResponse = {
    data: usersDatabase,
    total: usersDatabase.length,
  };
  res.json(response);
};

