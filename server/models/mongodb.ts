/**
 * MongoDB Models and Collections
 * Defines collection names and provides type-safe access to MongoDB collections
 */

import { Collection, Db } from 'mongodb';
import { getMongoDB } from '../utils/mongodb.js';

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  MEDIA: 'media',
  CREATORS: 'creators',
  LOGS: 'logs',
  SETTINGS: 'settings',
  POPUP_ADS: 'popup_ads',
  REFERRALS: 'referrals',
  SHARE_POSTS: 'share_posts',
  SHARE_RECORDS: 'share_records',
  SHARE_VISITORS: 'share_visitors',
  WITHDRAW_REQUESTS: 'withdraw_requests',
  ADS: 'ads',
  AD_VIEWS: 'ad_views',
} as const;

/**
 * Get a MongoDB collection by name
 */
export async function getCollection<T>(collectionName: string): Promise<Collection<T> | null> {
  const db = await getMongoDB();
  if (!db) {
    return null;
  }
  return db.collection<T>(collectionName);
}

/**
 * Get Users collection
 */
export async function getUsersCollection() {
  return getCollection(COLLECTIONS.USERS);
}

/**
 * Get Media collection
 */
export async function getMediaCollection() {
  return getCollection(COLLECTIONS.MEDIA);
}

/**
 * Get Creators collection
 */
export async function getCreatorsCollection() {
  return getCollection(COLLECTIONS.CREATORS);
}

/**
 * Get Logs collection
 */
export async function getLogsCollection() {
  return getCollection(COLLECTIONS.LOGS);
}

/**
 * Get Settings collection
 */
export async function getSettingsCollection() {
  return getCollection(COLLECTIONS.SETTINGS);
}

/**
 * Get Popup Ads collection
 */
export async function getPopupAdsCollection() {
  return getCollection(COLLECTIONS.POPUP_ADS);
}

/**
 * Get Referrals collection
 */
export async function getReferralsCollection() {
  return getCollection(COLLECTIONS.REFERRALS);
}

/**
 * Get Share Posts collection
 */
export async function getSharePostsCollection() {
  return getCollection(COLLECTIONS.SHARE_POSTS);
}

/**
 * Get Share Records collection
 */
export async function getShareRecordsCollection() {
  return getCollection(COLLECTIONS.SHARE_RECORDS);
}

/**
 * Get Share Visitors collection
 */
export async function getShareVisitorsCollection() {
  return getCollection(COLLECTIONS.SHARE_VISITORS);
}

/**
 * Get Withdraw Requests collection
 */
export async function getWithdrawRequestsCollection() {
  return getCollection(COLLECTIONS.WITHDRAW_REQUESTS);
}

/**
 * Get Ads collection
 */
export async function getAdsCollection() {
  return getCollection(COLLECTIONS.ADS);
}

/**
 * Get Ad Views collection
 */
export async function getAdViewsCollection() {
  return getCollection(COLLECTIONS.AD_VIEWS);
}

/**
 * Create indexes for collections (for better performance)
 */
export async function createIndexes() {
  try {
    const db = await getMongoDB();
    if (!db) {
      console.log("⚠️  Cannot create indexes - MongoDB not connected");
      return;
    }

    // Users collection indexes
    const usersCollection = db.collection(COLLECTIONS.USERS);
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await usersCollection.createIndex({ uid: 1 }, { unique: true });
    console.log("✅ Created indexes for users collection");

    // Media collection indexes
    const mediaCollection = db.collection(COLLECTIONS.MEDIA);
    await mediaCollection.createIndex({ id: 1 }, { unique: true });
    await mediaCollection.createIndex({ fileUrl: 1 });
    await mediaCollection.createIndex({ category: 1 });
    await mediaCollection.createIndex({ uploadedDate: -1 });
    await mediaCollection.createIndex({ downloads: -1 });
    await mediaCollection.createIndex({ views: -1 });
    console.log("✅ Created indexes for media collection");

    // Creators collection indexes
    const creatorsCollection = db.collection(COLLECTIONS.CREATORS);
    await creatorsCollection.createIndex({ email: 1 }, { unique: true });
    await creatorsCollection.createIndex({ userId: 1 });
    console.log("✅ Created indexes for creators collection");

    // Logs collection indexes
    const logsCollection = db.collection(COLLECTIONS.LOGS);
    await logsCollection.createIndex({ timestamp: -1 });
    await logsCollection.createIndex({ type: 1 });
    console.log("✅ Created indexes for logs collection");

    console.log("✅ All MongoDB indexes created successfully");
  } catch (error: any) {
    console.error("❌ Error creating indexes:", error.message || error);
    // Don't throw - indexes are optional for functionality
  }
}

