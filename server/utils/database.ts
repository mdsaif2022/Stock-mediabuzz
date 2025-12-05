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
  
  // Debug: Log all environment variables that start with UPSTASH or REDIS
  if (process.env.RENDER || process.env.VERCEL) {
    const redisVars = Object.keys(process.env)
      .filter(key => key.includes('UPSTASH') || key.includes('REDIS') || key.includes('KV'))
      .reduce((acc, key) => {
        acc[key] = process.env[key] ? `${process.env[key]?.substring(0, 20)}...` : 'not set';
        return acc;
      }, {} as Record<string, string>);
    console.log("🔍 Redis-related environment variables:", redisVars);
  }
  
  const hasUpstashEnv = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!hasUpstashEnv) {
    console.log("⚠️  Upstash Redis env vars not found:");
    console.log("   UPSTASH_REDIS_REST_URL:", process.env.UPSTASH_REDIS_REST_URL ? "Set" : "NOT SET");
    console.log("   UPSTASH_REDIS_REST_TOKEN:", process.env.UPSTASH_REDIS_REST_TOKEN ? "Set" : "NOT SET");
  }
  const hasVercelKV = process.env.KV_URL || process.env.STORAGE_URL;
  const hasVercelKVFull = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
  
  if (hasUpstashEnv) {
    try {
      console.log("🔄 Attempting to connect to Upstash Redis...");
      
      // Get environment variables (trim to remove any spaces)
      const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
      let token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
      
      // ALTERNATIVE SOLUTION 1: Support base64 encoded token
      // If token is base64 encoded, decode it
      if (token && process.env.UPSTASH_REDIS_REST_TOKEN_B64 === "true") {
        try {
          console.log("   🔓 Detected base64 encoded token, decoding...");
          token = Buffer.from(token, 'base64').toString('utf-8');
          console.log(`   ✅ Token decoded, new length: ${token.length}`);
        } catch (decodeError) {
          console.error("   ❌ Failed to decode base64 token:", decodeError);
        }
      }
      
      // ALTERNATIVE SOLUTION 2: Support split token (if truncated)
      // If token is split into two parts, combine them
      const tokenPart1 = process.env.UPSTASH_REDIS_REST_TOKEN_PART1?.trim();
      const tokenPart2 = process.env.UPSTASH_REDIS_REST_TOKEN_PART2?.trim();
      if (tokenPart1 && tokenPart2) {
        console.log("   🔗 Detected split token, combining parts...");
        token = tokenPart1 + tokenPart2;
        console.log(`   ✅ Token combined, total length: ${token.length}`);
      }
      
      // Warn if token seems too short
      if (token && token.length < 70) {
        console.error("⚠️  WARNING: Token length is suspiciously short!");
        console.error(`   Token length: ${token.length} (Upstash tokens are usually ~80 characters)`);
        console.error(`   Token preview: ${token.substring(0, 20)}...`);
        console.error("   ⚠️  Token may be truncated or incorrect. Check in Render Dashboard.");
        console.error("   💡 SOLUTION: Try using base64 encoding or split token method (see ALTERNATIVE_SOLUTIONS.md)");
      }
      
      // Remove quotes if present (common mistake)
      const cleanUrl = url?.replace(/^["']|["']$/g, '');
      const cleanToken = token?.replace(/^["']|["']$/g, '');
      
      if (!cleanUrl || !cleanToken) {
        console.error("❌ Upstash Redis env vars are set but empty after cleaning");
        console.error("   URL after clean:", cleanUrl ? "Has value" : "Empty");
        console.error("   Token after clean:", cleanToken ? "Has value" : "Empty");
        return null;
      }
      
      console.log("   URL:", cleanUrl.substring(0, 40) + "...");
      console.log("   Token:", cleanToken.substring(0, 15) + "...");
      
      // Use Upstash Redis SDK (recommended for Upstash Redis)
      let Redis;
      try {
        const redisModule = await import("@upstash/redis");
        Redis = redisModule.Redis;
        if (!Redis) {
          throw new Error("Redis class not found in @upstash/redis module");
        }
        console.log("   ✅ @upstash/redis package loaded");
      } catch (importError: any) {
        console.error("❌ Failed to import @upstash/redis package");
        console.error("   Error:", importError.message || importError);
        console.error("   Error code:", importError.code);
        if (importError.code === "MODULE_NOT_FOUND") {
          console.error("   ⚠️  Package not installed! Run: pnpm add @upstash/redis");
          console.error("   ⚠️  Then commit and push to trigger redeploy");
        }
        return null;
      }
      
      // Use explicit constructor instead of fromEnv() to ensure clean values
      console.log("   Creating Redis client...");
      try {
        redis = new Redis({
          url: cleanUrl,
          token: cleanToken,
        });
        console.log("   ✅ Redis client created");
      } catch (createError: any) {
        console.error("❌ Failed to create Redis client");
        console.error("   Error:", createError.message || String(createError));
        throw createError;
      }
      
      // Test connection with detailed error handling
      console.log("   Testing connection (ping)...");
      console.log(`   Using URL: ${cleanUrl.substring(0, 50)}...`);
      console.log(`   Using Token: ${cleanToken.substring(0, 20)}... (length: ${cleanToken.length})`);
      try {
        const pingResult = await redis.ping();
        console.log("✅ Upstash Redis connected successfully!");
        console.log("   Ping result:", pingResult);
        return redis;
      } catch (pingError: any) {
        console.error("❌ Redis ping failed");
        console.error("   Error message:", pingError.message || String(pingError));
        console.error("   Error code:", pingError.code);
        console.error("   Error status:", pingError.status);
        console.error("   Error name:", pingError.name);
        console.error("   Error type:", pingError.constructor?.name || typeof pingError);
        
        // Log full error object for debugging
        if (pingError.response) {
          console.error("   Response status:", pingError.response.status);
          console.error("   Response statusText:", pingError.response.statusText);
          if (pingError.response.data) {
            console.error("   Response data:", JSON.stringify(pingError.response.data).substring(0, 200));
          }
        }
        
        // Log the actual values being used (truncated for security)
        console.error("   Attempted connection with:");
        console.error(`      URL: ${cleanUrl.substring(0, 50)}...`);
        console.error(`      Token length: ${cleanToken.length} ${cleanToken.length < 70 ? "⚠️ (Too short!)" : ""}`);
        console.error(`      Token preview: ${cleanToken.substring(0, 20)}...${cleanToken.substring(cleanToken.length - 10)}`);
        
        // Check for common errors
        if (pingError.message?.includes("Unauthorized") || pingError.status === 401 || pingError.response?.status === 401) {
          console.error("   ⚠️  Authentication failed - check your token is correct");
          console.error("   ⚠️  Verify token in Upstash console: https://console.upstash.com/");
          console.error("   ⚠️  Make sure you copied the full token (no spaces, no quotes)");
        }
        if (pingError.message?.includes("Invalid URL") || pingError.message?.includes("ENOTFOUND") || pingError.code === "ENOTFOUND") {
          console.error("   ⚠️  URL is invalid or unreachable - check your URL is correct");
          console.error("   ⚠️  URL should be: https://eternal-blowfish-28190.upstash.io");
        }
        if (pingError.message?.includes("fetch") || pingError.message?.includes("network") || pingError.message?.includes("ECONNREFUSED")) {
          console.error("   ⚠️  Network error - check connectivity to Upstash");
          console.error("   ⚠️  Check if Upstash is accessible from Render");
        }
        if (pingError.message?.includes("timeout") || pingError.code === "ETIMEDOUT") {
          console.error("   ⚠️  Connection timeout - Upstash may be slow or unreachable");
        }
        
        throw pingError; // Re-throw to be caught by outer catch
      }
    } catch (error: any) {
      console.error("❌ Failed to initialize Upstash Redis");
      console.error("   Error:", error.message || String(error));
      console.error("   Error type:", error.constructor?.name || typeof error);
      console.error("   Error code:", error.code);
      console.error("   Error status:", error.status);
      if (error.stack) {
        console.error("   Stack trace:", error.stack.split('\n').slice(0, 5).join('\n'));
      }
      
      const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
      const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
      const cleanUrl = url?.replace(/^["']|["']$/g, '');
      const cleanToken = token?.replace(/^["']|["']$/g, '');
      
      console.error("   URL:", cleanUrl ? `${cleanUrl.substring(0, 30)}...` : "Not set");
      console.error("   Token:", cleanToken ? `${cleanToken.substring(0, 10)}...` : "Not set");
      console.error("   URL length:", cleanUrl?.length || 0);
      console.error("   Token length:", cleanToken?.length || 0);
      
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
  const shouldUse = !!(redisClient && (hasUpstashEnv || hasVercelKV));
  
  if (hasUpstashEnv && !redisClient) {
    console.log("⚠️  Upstash env vars detected but Redis client is null - connection may have failed");
  }
  
  return shouldUse;
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
        console.error("⚠️  Current status:");
        console.error("   - Has env vars:", !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN));
        console.error("   - Redis client:", await getRedis() ? "Available" : "NULL (connection failed)");
        console.error("⚠️  Check Render logs above for Redis connection errors!");
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
  const isVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV);
  const isRender = !!process.env.RENDER;
  const hasUpstashEnv = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  const hasVercelKV = !!(process.env.KV_URL || process.env.STORAGE_URL);
  
  console.log("🔧 Initializing KV/Redis connection...");
  console.log(`   Environment: ${isVercel ? "Vercel" : isRender ? "Render" : "Localhost"}`);
  console.log(`   Has Upstash env vars: ${hasUpstashEnv}`);
  console.log(`   Has Vercel KV vars: ${hasVercelKV}`);
  
  const redisClient = await getRedis();
  
  console.log(`   Redis client result: ${redisClient ? "✅ Connected" : "❌ Null (connection failed)"}`);
  
  if (redisClient && (hasUpstashEnv || hasVercelKV)) {
    try {
      // Test connection by setting a test key
      console.log("🧪 Testing Redis connection...");
      await redisClient.set("__test__", "ok");
      const testValue = await redisClient.get("__test__");
      await redisClient.del("__test__");
      
      if (testValue === "ok") {
        const redisType = hasUpstashEnv ? "Upstash Redis" : "Vercel KV";
        console.log(`✅ Connected to ${redisType} - Data will persist`);
        return;
      } else {
        throw new Error("Test value mismatch");
      }
    } catch (error: any) {
      console.error("❌ Failed to connect to Redis/KV");
      console.error("   Error:", error.message || String(error));
      if (error.stack) {
        console.error("   Stack:", error.stack);
      }
      
      if (isVercel) {
        console.error("⚠️  CRITICAL: On Vercel but Redis/KV connection failed! Data will not persist.");
        console.error("⚠️  Please check your Upstash Redis configuration in Vercel Dashboard.");
      } else if (isRender) {
        console.error("⚠️  CRITICAL: On Render but Redis/KV connection failed! Data will not persist.");
        console.error("⚠️  Please check:");
        console.error("   1. UPSTASH_REDIS_REST_URL is correct");
        console.error("   2. UPSTASH_REDIS_REST_TOKEN is correct");
        console.error("   3. Upstash database is active at https://console.upstash.com/");
        console.error("   4. Network connectivity to Upstash");
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
    } else if (isRender) {
      console.error("⚠️  ⚠️  ⚠️  WARNING: Running on Render but Redis/KV is not configured!");
      console.error("⚠️  Your data will NOT persist. Please set up Upstash Redis:");
      console.error("⚠️  1. Add UPSTASH_REDIS_REST_URL to Render environment variables");
      console.error("⚠️  2. Add UPSTASH_REDIS_REST_TOKEN to Render environment variables");
      console.error("⚠️  3. Redeploy service");
    } else {
      console.log("📁 Using file storage (localhost mode)");
    }
  }
}

