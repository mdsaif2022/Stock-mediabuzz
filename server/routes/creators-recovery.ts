import { RequestHandler } from "express";
import { CreatorProfile } from "@shared/api";
import { getMediaDatabase } from "./media.js";
import { isMongoDBAvailable } from "../utils/mongodb.js";
import * as mongoService from "../services/mongodbService.js";
import { promises as fs } from "fs";
import { join } from "path";
import { DATA_DIR } from "../utils/dataPath.js";
import { getCreatorByEmail } from "./creators.js";

const STORAGE_BASE_GB = 1; // Changed from 5 GB to 1 GB free storage for creator accounts
const CREATORS_DB_FILE = join(DATA_DIR, "creators-database.json");

// Recovery endpoint to restore lost creator accounts from uploaded media
export const recoverCreatorAccounts: RequestHandler = async (req, res) => {
  try {
    // Get all media items to find creators
    const mediaDatabase = await getMediaDatabase();
    
    // Find unique creator emails and IDs from uploaded media
    const creatorMap = new Map<string, { 
      email: string; 
      name: string; 
      creatorId?: string;
      uploadedDate?: string;
    }>();
    
    mediaDatabase.forEach((media) => {
      if (media.uploadedByEmail && 
          media.uploadedByEmail.toLowerCase() !== "admin" && 
          !media.uploadedByEmail.includes("freemediabuzz.com")) {
        const emailLower = media.uploadedByEmail.toLowerCase();
        if (!creatorMap.has(emailLower)) {
          creatorMap.set(emailLower, {
            email: media.uploadedByEmail,
            name: media.uploadedBy || media.uploadedByEmail,
            creatorId: media.creatorId,
            uploadedDate: media.uploadedDate,
          });
        } else {
          // Update with more recent data if available
          const existing = creatorMap.get(emailLower)!;
          if (media.creatorId && !existing.creatorId) {
            existing.creatorId = media.creatorId;
          }
          if (media.uploadedDate && (!existing.uploadedDate || media.uploadedDate > existing.uploadedDate)) {
            existing.uploadedDate = media.uploadedDate;
          }
        }
      }
    });
    
    const recoveredCreators: CreatorProfile[] = [];
    const useMongo = await isMongoDBAvailable();
    
    // Create creator profiles for each recovered email
    for (const [emailLower, data] of creatorMap.entries()) {
      // Check if creator already exists
      let existingCreator: CreatorProfile | undefined;
      
      if (useMongo) {
        try {
          const mongoCreator = await mongoService.getCreatorByEmail(emailLower);
          if (mongoCreator) {
            const { _id, ...rest } = mongoCreator;
            existingCreator = { ...rest, id: rest.id || _id.toString() } as CreatorProfile;
          }
        } catch (error) {
          console.error(`Error checking MongoDB for ${emailLower}:`, error);
        }
      }
      
      // Also check file storage and in-memory cache
      if (!existingCreator) {
        existingCreator = getCreatorByEmail(data.email);
      }
      
      // If creator doesn't exist, create a recovery profile
      if (!existingCreator) {
        const recoveredCreator: CreatorProfile = {
          id: data.creatorId || Date.now().toString() + Math.random().toString(36).substr(2, 9),
          email: data.email,
          name: data.name,
          status: "pending", // Set to pending so admin can review
          createdAt: data.uploadedDate || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastRequestAt: new Date().toISOString(),
          storageBaseGb: STORAGE_BASE_GB,
          storageBonusGb: 0,
          storageUsedBytes: 0,
        };
        
        // Save recovered creator
        if (useMongo) {
          try {
            await mongoService.createCreator(recoveredCreator);
          } catch (error) {
            console.error(`Error saving recovered creator to MongoDB:`, error);
            // Fallback to file storage
            try {
              await fs.mkdir(DATA_DIR, { recursive: true });
              let existingCreators: CreatorProfile[] = [];
              try {
                const data = await fs.readFile(CREATORS_DB_FILE, "utf-8");
                existingCreators = JSON.parse(data);
              } catch {
                // File doesn't exist yet, that's fine
              }
              existingCreators.push(recoveredCreator);
              await fs.writeFile(CREATORS_DB_FILE, JSON.stringify(existingCreators, null, 2), "utf-8");
            } catch (fileError) {
              console.error(`Error saving recovered creator to file:`, fileError);
            }
          }
        } else {
          // File storage only
          try {
            await fs.mkdir(DATA_DIR, { recursive: true });
            let existingCreators: CreatorProfile[] = [];
            try {
              const data = await fs.readFile(CREATORS_DB_FILE, "utf-8");
              existingCreators = JSON.parse(data);
            } catch {
              // File doesn't exist yet, that's fine
            }
            existingCreators.push(recoveredCreator);
            await fs.writeFile(CREATORS_DB_FILE, JSON.stringify(existingCreators, null, 2), "utf-8");
          } catch (fileError) {
            console.error(`Error saving recovered creator to file:`, fileError);
          }
        }
        
        recoveredCreators.push(recoveredCreator);
      }
    }
    
    res.json({
      success: true,
      message: `Recovered ${recoveredCreators.length} creator account(s) from uploaded media`,
      recovered: recoveredCreators.map(c => ({
        email: c.email,
        name: c.name,
        status: c.status,
      })),
      totalFound: creatorMap.size,
    });
  } catch (error: any) {
    console.error("❌ Error recovering creator accounts:", error);
    res.status(500).json({
      error: "Failed to recover creator accounts",
      message: error.message,
    });
  }
};

