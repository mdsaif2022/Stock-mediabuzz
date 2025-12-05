/**
 * Automatic Cloudinary sync service
 * Handles automatic syncing on startup and periodic background syncing
 */

import { performCloudinarySync } from "../routes/media.js";

// Track sync state
let isSyncing = false;
let lastSyncTime: Date | null = null;
let syncError: string | null = null;
let syncStats: any = null;

/**
 * Perform a sync operation
 */
async function performSync(): Promise<{ success: boolean; stats?: any; error?: string }> {
  if (isSyncing) {
    console.log("⏳ Sync already in progress, skipping...");
    return { success: false, error: "Sync already in progress" };
  }

  isSyncing = true;
  syncError = null;

  try {
    console.log("🔄 Starting automatic Cloudinary sync...");
    const result = await performCloudinarySync();

    if (result.success) {
      lastSyncTime = new Date();
      syncStats = result.stats || result;
      console.log(`✅ Automatic sync completed successfully at ${lastSyncTime.toISOString()}`);
      console.log(`   Stats: ${syncStats.newItemsAdded || 0} new items, ${syncStats.totalInDatabase || 0} total`);
      return { success: true, stats: syncStats };
    } else {
      const errorMsg = result.error || result.message || "Unknown sync error";
      syncError = errorMsg;
      console.error(`❌ Automatic sync failed: ${errorMsg}`);
      
      // Check if it's a Redis connection issue
      if (errorMsg.includes("Redis") || errorMsg.includes("KV") || errorMsg.includes("persist")) {
        console.error("⚠️  ⚠️  ⚠️  CRITICAL: Redis/KV connection issue detected!");
        console.error("⚠️  Data cannot be saved. Check Render logs for Redis connection errors.");
        console.error("⚠️  Fix Redis connection to enable automatic data persistence.");
      }
      
      return { success: false, error: errorMsg };
    }
  } catch (error: any) {
    const errorMsg = error.message || "Unexpected sync error";
    syncError = errorMsg;
    console.error(`❌ Automatic sync error: ${errorMsg}`);
    return { success: false, error: errorMsg };
  } finally {
    isSyncing = false;
  }
}

/**
 * Initialize automatic syncing
 * - Syncs on startup (with delay to allow server to initialize)
 * - Sets up periodic sync (every hour by default)
 */
export function initializeAutoSync() {
  // Default to 5 minutes for faster recovery on Render (was 15, originally 60)
  // This helps recover data quickly when Redis connection is restored
  const syncIntervalMinutes = parseInt(process.env.AUTO_SYNC_INTERVAL_MINUTES || "5", 10);
  const enableStartupSync = process.env.AUTO_SYNC_ON_STARTUP !== "false"; // Default: true
  const startupSyncDelay = parseInt(process.env.AUTO_SYNC_STARTUP_DELAY_SECONDS || "30", 10); // Default: 30 seconds

  console.log("🔧 Auto-sync service configuration:");
  console.log(`   Startup sync: ${enableStartupSync ? "✅ Enabled" : "❌ Disabled"}`);
  console.log(`   Startup delay: ${startupSyncDelay} seconds`);
  console.log(`   Periodic sync: Every ${syncIntervalMinutes} minutes (fast recovery mode)`);

  // Sync on startup (after delay to allow database/KV to initialize)
  if (enableStartupSync) {
    setTimeout(() => {
      console.log("🚀 Performing startup sync...");
      performSync().catch((error) => {
        console.error("❌ Startup sync failed:", error);
      });
    }, startupSyncDelay * 1000);
  }

  // Set up periodic sync
  const intervalMs = syncIntervalMinutes * 60 * 1000;
  setInterval(() => {
    console.log(`⏰ Periodic sync triggered (every ${syncIntervalMinutes} minutes)`);
    performSync().catch((error) => {
      console.error("❌ Periodic sync failed:", error);
    });
  }, intervalMs);

  console.log(`✅ Auto-sync service initialized`);
}

/**
 * Get sync status
 */
export function getSyncStatus() {
  return {
    isSyncing,
    lastSyncTime: lastSyncTime?.toISOString() || null,
    syncError,
    syncStats,
  };
}

/**
 * Manually trigger a sync (for testing/admin)
 */
export async function triggerManualSync(): Promise<{ success: boolean; stats?: any; error?: string }> {
  return performSync();
}

/**
 * Trigger sync after upload (non-blocking)
 * This ensures newly uploaded files are immediately synced
 */
export function triggerSyncAfterUpload() {
  // Don't wait for sync to complete - run in background
  setTimeout(() => {
    console.log("🔄 Triggering sync after upload...");
    performSync().catch((error) => {
      console.error("❌ Post-upload sync failed:", error);
      // Don't throw - this is a background operation
    });
  }, 2000); // Wait 2 seconds for upload to complete
}

