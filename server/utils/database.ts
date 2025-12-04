/**
 * Database abstraction layer
 * Supports both Vercel KV (Redis) for serverless environments and file storage for localhost
 */

import { promises as fs } from "fs";
import { join } from "path";
import { DATA_DIR } from "./dataPath.js";

// Lazy-load Upstash Redis (for Vercel KV/Upstash Redis)
let redis: any = null;
let redisInitialized = false;

async function getRedis() {
  if (redisInitialized) return redis;
  redisInitialized = true;
  
  // Check for Upstash Redis environment variables
  // Upstash Redis SDK reads from: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
  // Vercel KV uses: KV_URL (or STORAGE_URL if custom prefix) + KV_REST_API_URL + KV_REST_API_TOKEN
  const hasUpstashEnv = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
  const hasVercelKV = process.env.KV_URL || process.env.STORAGE_URL;
  const hasVercelKVFull = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
  
  if (hasUpstashEnv) {
    try {
      // Use Upstash Redis SDK (recommended for Upstash Redis)
      const { Redis } = await import("@upstash/redis");
      
      // Get environment variables (trim to remove any spaces)
      const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
      const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
      
      // Remove quotes if present (common mistake)
      const cleanUrl = url?.replace(/^["']|["']$/g, '');
      const cleanToken = token?.replace(/^["']|["']$/g, '');
      
      if (!cleanUrl || !cleanToken) {
        console.error("❌ Upstash Redis env vars are set but empty after cleaning");
        return null;
      }
      
      // Use explicit constructor instead of fromEnv() to ensure clean values
      redis = new Redis({
        url: cleanUrl,
        token: cleanToken,
      });
      
      // Test connection
      await redis.ping();
      console.log("✅ Upstash Redis connected successfully");
      return redis;
    } catch (error: any) {
      console.error("❌ Failed to initialize Upstash Redis:", error.message || error);
      console.error("   URL:", process.env.UPSTASH_REDIS_REST_URL ? "Set" : "Not set");
      console.error("   Token:", process.env.UPSTASH_REDIS_REST_TOKEN ? "Set" : "Not set");
      return null;
    }
  } else if (hasVercelKVFull) {
    try {
      // Try to use Upstash Redis SDK with Vercel KV env vars
      // Map Vercel KV env vars to Upstash format
      const { Redis } = await import("@upstash/redis");
      redis = new Redis({
        url: process.env.KV_REST_API_URL || process.env.STORAGE_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN || process.env.STORAGE_REST_API_TOKEN,
      });
      return redis;
    } catch (error) {
      // Fallback to @vercel/kv if Upstash SDK fails
      try {
        const kvModule = await import("@vercel/kv");
        redis = kvModule.kv;
        return redis;
      } catch (kvError) {
        console.log("Redis/KV not available, using file storage");
        return null;
      }
    }
  } else if (hasVercelKV) {
    // Try @vercel/kv as fallback
    try {
      const kvModule = await import("@vercel/kv");
      redis = kvModule.kv;
      return redis;
    } catch (kvError) {
      console.log("Redis/KV not available, using file storage");
      return null;
    }
  }
  return null;
}

/**
 * Determine if we should use Redis/KV storage
 * Use Redis/KV if:
 * 1. Upstash Redis env vars are set (UPSTASH_REDIS_REST_URL)
 * 2. OR Vercel KV env vars are set (KV_URL or STORAGE_URL)
 * 3. AND Redis client is available
 */
async function shouldUseKV(): Promise<boolean> {
  const redisClient = await getRedis();
  const hasUpstashEnv = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  const hasVercelKV = !!(process.env.KV_URL || process.env.STORAGE_URL);
  return !!(redisClient && (hasUpstashEnv || hasVercelKV));
}

/**
 * Generic database interface for storing JSON data
 */
export class Database<T> {
  private key: string;
  private defaultValue: T[];

  constructor(key: string, defaultValue: T[] = [] as T[]) {
    this.key = key;
    this.defaultValue = defaultValue;
  }

  /**
   * Load data from storage
   */
  async load(): Promise<T[]> {
    const useKV = await shouldUseKV();
    if (useKV) {
      try {
        const redisClient = await getRedis();
        if (!redisClient) throw new Error("Redis client not available");
        const data = await redisClient.get<T[]>(this.key);
        
        // If KV returns null/undefined, return empty array (not defaults)
        // This means the database is empty, not that there was an error
        if (data === null || data === undefined) {
          console.log(`KV key "${this.key}" is empty (new database)`);
          return [] as T[];
        }
        
        if (Array.isArray(data)) {
          console.log(`Loaded ${data.length} items from KV (${this.key})`);
          return data;
        }
        
        console.warn(`KV key "${this.key}" contains invalid data, returning empty array`);
        return [] as T[];
      } catch (error) {
        console.error(`❌ Error loading from KV (${this.key}):`, error);
        // On Vercel, don't fall back to file storage - throw error instead
        if (process.env.VERCEL) {
          throw new Error(`Failed to load from KV: ${error instanceof Error ? error.message : String(error)}`);
        }
        // Localhost: fallback to file storage
        return this.loadFromFile();
      }
    } else {
      // Check if we're on Vercel but KV is not configured
      if (process.env.VERCEL || process.env.VERCEL_ENV) {
        console.error(`⚠️  WARNING: Running on Vercel but KV_URL is not set! Data will not persist.`);
        console.error(`⚠️  Please set up Vercel KV: https://vercel.com/docs/storage/vercel-kv`);
        // Return empty array instead of defaults on Vercel without KV
        return [] as T[];
      }
      // File storage fallback (localhost only)
      return this.loadFromFile();
    }
  }

  /**
   * Save data to storage with retry logic
   */
  async save(data: T[]): Promise<void> {
    const useKV = await shouldUseKV();
    const isRender = !!process.env.RENDER;
    const isVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV);
    
    if (useKV) {
      // Retry logic for Redis/KV saves (up to 3 attempts)
      let lastError: Error | null = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const redisClient = await getRedis();
          if (!redisClient) throw new Error("Redis client not available");
          
          await redisClient.set(this.key, data);
          
          // Verify the save worked by reading it back
          const verify = await redisClient.get<T[]>(this.key);
          if (!verify || verify.length !== data.length) {
            throw new Error(`Verification failed: Expected ${data.length} items, got ${verify?.length || 0}`);
          }
          
          console.log(`✅ Saved ${data.length} items to Redis/KV (${this.key}) - verified`);
          return; // Success - exit
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.error(`❌ Error saving to KV (${this.key}) - Attempt ${attempt}/3:`, lastError.message);
          
          if (attempt < 3) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, attempt * 500));
            continue;
          }
        }
      }
      
      // All retries failed
      console.error(`❌ Failed to save to KV after 3 attempts (${this.key})`);
      
      // On Vercel/Render, don't fall back to file storage - throw error
      if (isVercel || isRender) {
        throw new Error(`Failed to save to KV after 3 retries: ${lastError?.message || "Unknown error"}`);
      }
      
      // Localhost: fallback to file storage
      console.log("⚠️  Falling back to file storage (localhost only)");
      await this.saveToFile(data);
    } else {
      // Check if we're on Vercel/Render but KV is not configured
      if (isVercel || isRender) {
        const errorMsg = `⚠️  CRITICAL: Cannot save data on ${isVercel ? "Vercel" : "Render"} without Redis/KV! Please set up Upstash Redis.`;
        console.error(errorMsg);
        console.error("⚠️  Your data will NOT persist. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.");
        throw new Error(errorMsg);
      }
      // File storage fallback (localhost only)
      await this.saveToFile(data);
    }
  }

  /**
   * Load from file (localhost fallback)
   */
  private async loadFromFile(): Promise<T[]> {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const filePath = join(DATA_DIR, `${this.key}.json`);
      const data = await fs.readFile(filePath, "utf-8");
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : this.defaultValue;
    } catch (error: any) {
      if (error.code === "ENOENT") {
        // File doesn't exist, save default and return it
        await this.saveToFile(this.defaultValue);
        return this.defaultValue;
      }
      console.error(`Error loading from file (${this.key}):`, error);
      return this.defaultValue;
    }
  }

  /**
   * Save to file (localhost fallback)
   */
  private async saveToFile(data: T[]): Promise<void> {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const filePath = join(DATA_DIR, `${this.key}.json`);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (error) {
      console.error(`Error saving to file (${this.key}):`, error);
      throw error;
    }
  }

  /**
   * Get all items
   */
  async getAll(): Promise<T[]> {
    return this.load();
  }

  /**
   * Get item by ID (assumes items have an 'id' property)
   */
  async getById(id: string): Promise<T | undefined> {
    const data = await this.load();
    return data.find((item: any) => item.id === id);
  }

  /**
   * Add item
   */
  async add(item: T): Promise<void> {
    const data = await this.load();
    data.push(item);
    await this.save(data);
  }

  /**
   * Update item by ID
   */
  async update(id: string, updates: Partial<T>): Promise<T | null> {
    const data = await this.load();
    const index = data.findIndex((item: any) => item.id === id);
    if (index === -1) return null;
    data[index] = { ...data[index], ...updates };
    await this.save(data);
    return data[index];
  }

  /**
   * Delete item by ID
   */
  async delete(id: string): Promise<boolean> {
    const data = await this.load();
    const index = data.findIndex((item: any) => item.id === id);
    if (index === -1) return false;
    data.splice(index, 1);
    await this.save(data);
    return true;
  }

  /**
   * Replace entire dataset
   */
  async replace(data: T[]): Promise<void> {
    await this.save(data);
  }
}

/**
 * Initialize Redis/KV connection (for Vercel/Upstash)
 */
export async function initializeKV() {
  const redisClient = await getRedis();
  const isVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV);
  const hasUpstashEnv = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  const hasVercelKV = !!(process.env.KV_URL || process.env.STORAGE_URL);
  
  if (redisClient && (hasUpstashEnv || hasVercelKV)) {
    try {
      // Test connection by setting a test key
      await redisClient.set("__test__", "ok");
      await redisClient.del("__test__");
      const redisType = hasUpstashEnv ? "Upstash Redis" : "Vercel KV";
      console.log(`✅ Connected to ${redisType} - Data will persist`);
    } catch (error) {
      console.error("❌ Failed to connect to Redis/KV:", error);
      if (isVercel) {
        console.error("⚠️  CRITICAL: On Vercel but Redis/KV connection failed! Data will not persist.");
        console.error("⚠️  Please check your Upstash Redis configuration in Vercel Dashboard.");
      } else {
        console.log("⚠️  Falling back to file storage");
      }
    }
  } else {
    if (isVercel) {
      console.error("⚠️  ⚠️  ⚠️  WARNING: Running on Vercel but Redis/KV is not configured!");
      console.error("⚠️  Your data will NOT persist. Please set up Upstash Redis:");
      console.error("⚠️  1. Go to Vercel Dashboard → Marketplace → Upstash Redis");
      console.error("⚠️  2. Add to your project");
      console.error("⚠️  3. Redeploy");
    } else {
      console.log("📁 Using file storage (localhost mode)");
    }
  }
}

