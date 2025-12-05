/**
 * MongoDB Service Layer
 * Provides CRUD operations for all collections
 */

import { ObjectId } from 'mongodb';
import {
  getUsersCollection,
  getMediaCollection,
  getCreatorsCollection,
  getLogsCollection,
  getSettingsCollection,
  getPopupAdsCollection,
} from '../models/mongodb.js';

// Re-export collection getters for convenience
export { getUsersCollection, getMediaCollection, getCreatorsCollection, getLogsCollection, getSettingsCollection, getPopupAdsCollection };

// ==================== USERS ====================

export async function createUser(userData: any) {
  const collection = await getUsersCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  const result = await collection.insertOne({
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return result.insertedId;
}

export async function getUserById(id: string) {
  const collection = await getUsersCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  return collection.findOne({ _id: new ObjectId(id) });
}

export async function getUserByEmail(email: string) {
  const collection = await getUsersCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  return collection.findOne({ email });
}

export async function getUserByUid(uid: string) {
  const collection = await getUsersCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  return collection.findOne({ uid });
}

export async function updateUser(id: string, updates: any) {
  const collection = await getUsersCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...updates, updatedAt: new Date() } }
  );
  return result;
}

export async function deleteUser(id: string) {
  const collection = await getUsersCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  return collection.deleteOne({ _id: new ObjectId(id) });
}

export async function getAllUsers() {
  const collection = await getUsersCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  return collection.find({}).toArray();
}

// ==================== MEDIA ====================

export async function createMedia(mediaData: any) {
  const collection = await getMediaCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  const result = await collection.insertOne({
    ...mediaData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return result.insertedId;
}

export async function getMediaById(id: string) {
  const collection = await getMediaCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  // Try by MongoDB _id first, then by custom id field
  if (ObjectId.isValid(id)) {
    const byMongoId = await collection.findOne({ _id: new ObjectId(id) });
    if (byMongoId) return byMongoId;
  }
  
  return collection.findOne({ id });
}

export async function getAllMedia(filter: any = {}, sort: any = { uploadedDate: -1 }, limit?: number, skip?: number) {
  const collection = await getMediaCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  let query = collection.find(filter).sort(sort);
  
  if (skip) query = query.skip(skip);
  if (limit) query = query.limit(limit);
  
  return query.toArray();
}

export async function getMediaCount(filter: any = {}) {
  const collection = await getMediaCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  return collection.countDocuments(filter);
}

export async function updateMedia(id: string, updates: any) {
  const collection = await getMediaCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  // Try by MongoDB _id first, then by custom id field
  const filter = ObjectId.isValid(id) 
    ? { _id: new ObjectId(id) }
    : { id };
  
  const result = await collection.updateOne(
    filter,
    { $set: { ...updates, updatedAt: new Date() } }
  );
  return result;
}

export async function deleteMedia(id: string) {
  const collection = await getMediaCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  // Try by MongoDB _id first, then by custom id field
  const filter = ObjectId.isValid(id) 
    ? { _id: new ObjectId(id) }
    : { id };
  
  return collection.deleteOne(filter);
}

export async function replaceAllMedia(mediaArray: any[]) {
  const collection = await getMediaCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  // Delete all existing media
  await collection.deleteMany({});
  
  // Insert new media
  if (mediaArray.length > 0) {
    const documents = mediaArray.map(item => ({
      ...item,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    await collection.insertMany(documents);
  }
  
  return mediaArray.length;
}

// ==================== CREATORS ====================

export async function createCreator(creatorData: any) {
  const collection = await getCreatorsCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  const result = await collection.insertOne({
    ...creatorData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return result.insertedId;
}

export async function getCreatorById(id: string) {
  const collection = await getCreatorsCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  if (ObjectId.isValid(id)) {
    const byMongoId = await collection.findOne({ _id: new ObjectId(id) });
    if (byMongoId) return byMongoId;
  }
  
  return collection.findOne({ id });
}

export async function getCreatorByEmail(email: string) {
  const collection = await getCreatorsCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  return collection.findOne({ email });
}

export async function getAllCreators() {
  const collection = await getCreatorsCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  return collection.find({}).toArray();
}

export async function updateCreator(id: string, updates: any) {
  const collection = await getCreatorsCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  const filter = ObjectId.isValid(id) 
    ? { _id: new ObjectId(id) }
    : { id };
  
  const result = await collection.updateOne(
    filter,
    { $set: { ...updates, updatedAt: new Date() } }
  );
  return result;
}

export async function deleteCreator(id: string) {
  const collection = await getCreatorsCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  const filter = ObjectId.isValid(id) 
    ? { _id: new ObjectId(id) }
    : { id };
  
  return collection.deleteOne(filter);
}

// ==================== LOGS ====================

export async function createLog(logData: any) {
  const collection = await getLogsCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  const result = await collection.insertOne({
    ...logData,
    timestamp: new Date(),
  });
  return result.insertedId;
}

export async function getLogs(filter: any = {}, limit: number = 100) {
  const collection = await getLogsCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  return collection.find(filter).sort({ timestamp: -1 }).limit(limit).toArray();
}

// ==================== SETTINGS ====================

export async function getSettings() {
  const collection = await getSettingsCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  const settings = await collection.findOne({});
  return settings || {};
}

export async function updateSettings(updates: any) {
  const collection = await getSettingsCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  const result = await collection.updateOne(
    {},
    { $set: { ...updates, updatedAt: new Date() } },
    { upsert: true }
  );
  return result;
}

// ==================== POPUP ADS ====================

export async function getAllPopupAds() {
  const collection = await getPopupAdsCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  return collection.find({}).toArray();
}

export async function createPopupAd(adData: any) {
  const collection = await getPopupAdsCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  const result = await collection.insertOne({
    ...adData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return result.insertedId;
}

export async function updatePopupAd(id: string, updates: any) {
  const collection = await getPopupAdsCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  const filter = ObjectId.isValid(id) 
    ? { _id: new ObjectId(id) }
    : { id };
  
  const result = await collection.updateOne(
    filter,
    { $set: { ...updates, updatedAt: new Date() } }
  );
  return result;
}

export async function deletePopupAd(id: string) {
  const collection = await getPopupAdsCollection();
  if (!collection) throw new Error('MongoDB not connected');
  
  const filter = ObjectId.isValid(id) 
    ? { _id: new ObjectId(id) }
    : { id };
  
  return collection.deleteOne(filter);
}

