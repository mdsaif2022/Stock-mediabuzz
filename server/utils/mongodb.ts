/**
 * MongoDB connection utility
 * Handles connection to MongoDB Atlas and provides database operations
 */

import { MongoClient, Db, Collection, ServerApiVersion } from 'mongodb';

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let mongoInitialized = false;

/**
 * Get MongoDB connection string from environment variables or use default
 */
function getMongoUri(): string | null {
  // Check for MongoDB URI in environment variables first
  const uri = process.env.MONGODB_URI?.trim();
  
  if (uri) {
    // Remove quotes if present
    return uri.replace(/^["']|["']$/g, '');
  }
  
  // Fallback: construct from individual components if provided
  const username = process.env.MONGODB_USERNAME?.trim();
  const password = process.env.MONGODB_PASSWORD?.trim();
  const cluster = process.env.MONGODB_CLUSTER?.trim();
  const database = process.env.MONGODB_DATABASE?.trim() || 'stockmediabuzz';
  
  if (username && password && cluster) {
    return `mongodb+srv://${username}:${password}@${cluster}/?retryWrites=true&w=majority&appName=Cluster0`;
  }
  
  // Default connection string (hardcoded as fallback)
  const defaultUri = "mongodb+srv://mdh897046_db_user:bpRUzw0GmmJp7iFa@cluster0.cnqz5cm.mongodb.net/?appName=Cluster0";
  console.log("📝 Using default MongoDB connection string");
  return defaultUri;
}

/**
 * Initialize MongoDB connection
 */
export async function initializeMongoDB(): Promise<Db | null> {
  if (mongoInitialized) {
    return mongoDb;
  }
  mongoInitialized = true;
  
  const uri = getMongoUri();
  
  if (!uri) {
    console.log("📝 MongoDB URI not found in environment variables");
    console.log("   Set MONGODB_URI or MONGODB_USERNAME + MONGODB_PASSWORD + MONGODB_CLUSTER");
    return null;
  }
  
  try {
    console.log("🔄 Attempting to connect to MongoDB...");
    
    // Create MongoClient with Stable API version
    mongoClient = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
    
    // Connect to MongoDB
    await mongoClient.connect();
    
    // Test connection with ping
    await mongoClient.db("admin").command({ ping: 1 });
    console.log("✅ MongoDB Connected Successfully!");
    
    // Get database name from URI or use default
    const dbName = process.env.MONGODB_DATABASE?.trim() || 'stockmediabuzz';
    mongoDb = mongoClient.db(dbName);
    
    console.log(`✅ Using MongoDB database: ${dbName}`);
    console.log("✅ MongoDB connection cached for reuse");
    
    return mongoDb;
  } catch (error: any) {
    console.error("❌ Failed to connect to MongoDB:", error.message || error);
    mongoClient = null;
    mongoDb = null;
    return null;
  }
}

/**
 * Get MongoDB database instance
 */
export async function getMongoDB(): Promise<Db | null> {
  if (!mongoDb) {
    return await initializeMongoDB();
  }
  return mongoDb;
}

/**
 * Get MongoDB collection
 */
export async function getCollection<T>(collectionName: string): Promise<Collection<T> | null> {
  const db = await getMongoDB();
  if (!db) {
    return null;
  }
  return db.collection<T>(collectionName);
}

/**
 * Check if MongoDB is available
 */
export async function isMongoDBAvailable(): Promise<boolean> {
  const db = await getMongoDB();
  return db !== null;
}

/**
 * Close MongoDB connection
 */
export async function closeMongoDB(): Promise<void> {
  if (mongoClient) {
    try {
      await mongoClient.close();
      console.log("✅ MongoDB connection closed");
    } catch (error) {
      console.error("❌ Error closing MongoDB connection:", error);
    }
    mongoClient = null;
    mongoDb = null;
    mongoInitialized = false;
  }
}

/**
 * Test MongoDB connection
 */
export async function testMongoDBConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const db = await getMongoDB();
    if (!db) {
      return {
        success: false,
        message: "MongoDB not configured (MONGODB_URI not set)"
      };
    }
    
    // Test with ping
    await db.admin().ping();
    
    return {
      success: true,
      message: "✅ MongoDB connected and working"
    };
  } catch (error: any) {
    return {
      success: false,
      message: `❌ MongoDB connection failed: ${error.message || error}`
    };
  }
}

