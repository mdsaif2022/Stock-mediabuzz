import { RequestHandler } from "express";
import { CreatorProfile } from "@shared/api";
import { isMongoDBAvailable } from "../utils/mongodb.js";
import * as mongoService from "../services/mongodbService.js";
import { promises as fs } from "fs";
import { join } from "path";
import { DATA_DIR } from "../utils/dataPath.js";

const CREATORS_DB_FILE = join(DATA_DIR, "creators-database.json");

// One-time migration endpoint to update all existing creator profiles from 5 GB to 1 GB
export const migrateStorageTo1GB: RequestHandler = async (req, res) => {
  try {
    const useMongo = await isMongoDBAvailable();
    let updatedCount = 0;
    let creators: CreatorProfile[] = [];
    
    if (useMongo) {
      try {
        const mongoCreators = await mongoService.getAllCreators();
        creators = mongoCreators.map((creator: any) => {
          const { _id, ...rest } = creator;
          return { ...rest, id: rest.id || _id.toString() } as CreatorProfile;
        });
      } catch (error) {
        console.error("❌ Error loading creators from MongoDB:", error);
        return res.status(500).json({ error: "Failed to load creators from MongoDB" });
      }
    } else {
      // File storage
      try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        const data = await fs.readFile(CREATORS_DB_FILE, "utf-8");
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          creators = parsed;
        }
      } catch (error: any) {
        if (error.code !== "ENOENT") {
          console.error("❌ Error loading creators from file:", error);
          return res.status(500).json({ error: "Failed to load creators from file" });
        }
      }
    }
    
    // Migrate all creators with 5 GB to 1 GB
    for (const creator of creators) {
      if (creator.storageBaseGb === 5) {
        creator.storageBaseGb = 1;
        creator.updatedAt = new Date().toISOString();
        updatedCount++;
        
        // Save to database
        if (useMongo) {
          try {
            const mongoCreators = await mongoService.getAllCreators();
            const mongoCreator = mongoCreators.find((c: any) => {
              return (c.id === creator.id || c._id?.toString() === creator.id) ||
                     (c.email && creator.email && c.email.toLowerCase() === creator.email.toLowerCase());
            });
            if (mongoCreator) {
              await mongoService.updateCreator(mongoCreator._id.toString(), {
                storageBaseGb: 1,
                updatedAt: creator.updatedAt,
              });
              console.log(`[Migration] ✅ Updated creator ${creator.email} from 5 GB to 1 GB`);
            }
          } catch (error) {
            console.error(`[Migration] ❌ Error updating creator ${creator.email}:`, error);
          }
        }
      }
    }
    
    // Save to file storage if not using MongoDB
    if (!useMongo) {
      try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.writeFile(CREATORS_DB_FILE, JSON.stringify(creators, null, 2), "utf-8");
      } catch (error) {
        console.error("❌ Error saving creators to file:", error);
        return res.status(500).json({ error: "Failed to save creators to file" });
      }
    }
    
    res.json({
      success: true,
      message: `Migrated ${updatedCount} creator profile(s) from 5 GB to 1 GB free storage`,
      updatedCount,
      totalCreators: creators.length,
    });
  } catch (error: any) {
    console.error("❌ Error migrating creator storage:", error);
    res.status(500).json({
      error: "Failed to migrate creator storage",
      message: error.message,
    });
  }
};

