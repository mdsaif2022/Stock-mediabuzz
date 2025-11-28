import { RequestHandler } from "express";
import {
  PopupAd,
  PopupAdCreateRequest,
  PopupAdUpdateRequest,
  PopupAdResponse,
  PopupAdImpressionRequest,
} from "@shared/api";
import { promises as fs } from "fs";
import { join } from "path";
import { DATA_DIR } from "../utils/dataPath.js";

// Path to the data file (persistent across builds)
const POPUP_ADS_DB_FILE = join(DATA_DIR, "popup-ads-database.json");

const DEFAULT_POPUP_ADS: PopupAd[] = [];

// Load pop-up ads database from file
async function loadPopupAdsDatabase(): Promise<PopupAd[]> {
  try {
    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Try to read existing file
    const data = await fs.readFile(POPUP_ADS_DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : DEFAULT_POPUP_ADS;
  } catch (error: any) {
    // File doesn't exist or is invalid, return default data
    if (error.code === "ENOENT") {
      // Save default data to file
      await savePopupAdsDatabase(DEFAULT_POPUP_ADS);
      return DEFAULT_POPUP_ADS;
    }
    console.error("Error loading pop-up ads database:", error);
    return DEFAULT_POPUP_ADS;
  }
}

// Save pop-up ads database to file
async function savePopupAdsDatabase(data: PopupAd[]): Promise<void> {
  try {
    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Write to file
    await fs.writeFile(POPUP_ADS_DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving pop-up ads database:", error);
    throw error;
  }
}

// Initialize popupAdsDatabase - start with default data, load async
let popupAdsDatabase: PopupAd[] = [...DEFAULT_POPUP_ADS];

// Load database on startup
loadPopupAdsDatabase()
  .then((loaded) => {
    popupAdsDatabase = loaded;
    console.log(`Loaded ${popupAdsDatabase.length} pop-up ads from database`);
  })
  .catch((error) => {
    console.error("Failed to load pop-up ads database:", error);
  });

// GET /api/popup-ads - Get all pop-up ads (with optional filtering by route)
export const getPopupAds: RequestHandler = async (req, res) => {
  try {
    await loadPopupAdsDatabase().then((loaded) => {
      popupAdsDatabase = loaded;
    });

    const { route } = req.query;
    let filteredAds = [...popupAdsDatabase];

    // If route is provided, filter ads that target this route
    if (route && typeof route === "string") {
      filteredAds = popupAdsDatabase.filter((ad) => {
        if (!ad.isActive) return false;
        
        // Check for exact match
        if (ad.targetPages.includes(route)) return true;
        
        // Check for wildcard (all pages)
        if (ad.targetPages.includes("*") || ad.targetPages.includes("all")) return true;
        
        // Check for pattern matches
        for (const targetPage of ad.targetPages) {
          // Pattern: /browse/*/* matches only media detail pages (e.g., /browse/video/123)
          if (targetPage === "/browse/*/*") {
            // Match routes like /browse/category/id (exactly 2 segments after /browse/)
            const parts = route.split("/").filter(Boolean);
            if (parts.length === 3 && parts[0] === "browse") {
              return true;
            }
          }
          // Pattern: routes ending with /* match any route starting with that prefix
          else if (targetPage.endsWith("/*")) {
            const prefix = targetPage.slice(0, -2); // Remove "/*" suffix
            // Only match if route has additional path segments (not the exact prefix)
            if (route.startsWith(prefix + "/") && route !== prefix) {
              return true;
            }
          }
        }
        
        return false;
      });
    }

    // Sort by createdAt (newest first)
    filteredAds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const response: PopupAdResponse = {
      data: filteredAds,
      total: filteredAds.length,
    };

    res.json(response);
  } catch (error: any) {
    console.error("Error fetching pop-up ads:", error);
    res.status(500).json({ error: "Failed to fetch pop-up ads" });
  }
};

// GET /api/popup-ads/:id - Get a specific pop-up ad
export const getPopupAdById: RequestHandler = async (req, res) => {
  try {
    await loadPopupAdsDatabase().then((loaded) => {
      popupAdsDatabase = loaded;
    });

    const { id } = req.params;
    const ad = popupAdsDatabase.find((a) => a.id === id);

    if (!ad) {
      res.status(404).json({ error: "Pop-up ad not found" });
      return;
    }

    res.json(ad);
  } catch (error: any) {
    console.error("Error fetching pop-up ad:", error);
    res.status(500).json({ error: "Failed to fetch pop-up ad" });
  }
};

// POST /api/popup-ads - Create a new pop-up ad
export const createPopupAd: RequestHandler = async (req, res) => {
  try {
    await loadPopupAdsDatabase().then((loaded) => {
      popupAdsDatabase = loaded;
    });

    const createData: PopupAdCreateRequest = req.body;

    // Validate required fields
    if (!createData.title || !createData.mediaUrl || !createData.mediaType) {
      res.status(400).json({ error: "Missing required fields: title, mediaUrl, and mediaType are required" });
      return;
    }

    if (!createData.targetPages || !Array.isArray(createData.targetPages) || createData.targetPages.length === 0) {
      res.status(400).json({ error: "targetPages must be a non-empty array" });
      return;
    }

    // Create new ad
    const newAd: PopupAd = {
      id: `popup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: createData.title,
      description: createData.description,
      mediaType: createData.mediaType,
      mediaUrl: createData.mediaUrl,
      buttonText: createData.buttonText,
      buttonLink: createData.buttonLink,
      targetPages: createData.targetPages,
      isActive: createData.isActive ?? true,
      clicks: 0,
      impressions: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      showDelay: createData.showDelay ?? 2000,
      closeAfter: createData.closeAfter,
      maxDisplays: createData.maxDisplays,
    };

    popupAdsDatabase.push(newAd);
    await savePopupAdsDatabase(popupAdsDatabase);

    res.status(201).json(newAd);
  } catch (error: any) {
    console.error("Error creating pop-up ad:", error);
    res.status(500).json({ error: "Failed to create pop-up ad" });
  }
};

// PUT /api/popup-ads/:id - Update a pop-up ad
export const updatePopupAd: RequestHandler = async (req, res) => {
  try {
    await loadPopupAdsDatabase().then((loaded) => {
      popupAdsDatabase = loaded;
    });

    const { id } = req.params;
    const updateData: Partial<PopupAdUpdateRequest> = req.body;

    const adIndex = popupAdsDatabase.findIndex((a) => a.id === id);

    if (adIndex === -1) {
      res.status(404).json({ error: "Pop-up ad not found" });
      return;
    }

    // Update ad (preserve id, clicks, impressions, createdAt)
    const existingAd = popupAdsDatabase[adIndex];
    const updatedAd: PopupAd = {
      ...existingAd,
      ...updateData,
      id: existingAd.id, // Never change the ID
      clicks: existingAd.clicks, // Preserve clicks
      impressions: existingAd.impressions, // Preserve impressions
      createdAt: existingAd.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString(),
    };

    popupAdsDatabase[adIndex] = updatedAd;
    await savePopupAdsDatabase(popupAdsDatabase);

    res.json(updatedAd);
  } catch (error: any) {
    console.error("Error updating pop-up ad:", error);
    res.status(500).json({ error: "Failed to update pop-up ad" });
  }
};

// DELETE /api/popup-ads/:id - Delete a pop-up ad
export const deletePopupAd: RequestHandler = async (req, res) => {
  try {
    await loadPopupAdsDatabase().then((loaded) => {
      popupAdsDatabase = loaded;
    });

    const { id } = req.params;
    const adIndex = popupAdsDatabase.findIndex((a) => a.id === id);

    if (adIndex === -1) {
      res.status(404).json({ error: "Pop-up ad not found" });
      return;
    }

    popupAdsDatabase.splice(adIndex, 1);
    await savePopupAdsDatabase(popupAdsDatabase);

    res.json({ message: "Pop-up ad deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting pop-up ad:", error);
    res.status(500).json({ error: "Failed to delete pop-up ad" });
  }
};

// POST /api/popup-ads/:id/impression - Track an impression
export const trackImpression: RequestHandler = async (req, res) => {
  try {
    await loadPopupAdsDatabase().then((loaded) => {
      popupAdsDatabase = loaded;
    });

    const { id } = req.params;
    const adIndex = popupAdsDatabase.findIndex((a) => a.id === id);

    if (adIndex === -1) {
      res.status(404).json({ error: "Pop-up ad not found" });
      return;
    }

    popupAdsDatabase[adIndex].impressions += 1;
    popupAdsDatabase[adIndex].updatedAt = new Date().toISOString();
    await savePopupAdsDatabase(popupAdsDatabase);

    res.json({ message: "Impression tracked successfully" });
  } catch (error: any) {
    console.error("Error tracking impression:", error);
    res.status(500).json({ error: "Failed to track impression" });
  }
};

// POST /api/popup-ads/:id/click - Track a click
export const trackClick: RequestHandler = async (req, res) => {
  try {
    await loadPopupAdsDatabase().then((loaded) => {
      popupAdsDatabase = loaded;
    });

    const { id } = req.params;
    const adIndex = popupAdsDatabase.findIndex((a) => a.id === id);

    if (adIndex === -1) {
      res.status(404).json({ error: "Pop-up ad not found" });
      return;
    }

    popupAdsDatabase[adIndex].clicks += 1;
    popupAdsDatabase[adIndex].updatedAt = new Date().toISOString();
    await savePopupAdsDatabase(popupAdsDatabase);

    res.json({ message: "Click tracked successfully" });
  } catch (error: any) {
    console.error("Error tracking click:", error);
    res.status(500).json({ error: "Failed to track click" });
  }
};

