import { RequestHandler } from "express";
import { AdminStats } from "@shared/api";

// Get admin dashboard stats
export const getDashboardStats: RequestHandler = async (req, res) => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  try {
    // Fetch real data from databases
    const { getMediaDatabase } = await import("./media.js");
    const { getUsersDatabase } = await import("./users.js");
    const { loadCreatorsDatabase } = await import("./creators.js");
    
    const media = await getMediaDatabase();
    const users = await getUsersDatabase();
    const creators = await loadCreatorsDatabase();
    
    // Calculate real stats
    const totalUsers = users.length;
    const totalMedia = media.length;
    const totalDownloads = 0; // TODO: Implement download tracking
    const activeUsers = 0; // TODO: Implement active user tracking
    
    // Get top downloads (if download tracking exists)
    const topDownloads: any[] = [];
    
    // Get top users (if download tracking exists)
    const topUsers: any[] = [];
    
    const stats: AdminStats = {
      totalUsers,
      totalMedia,
      totalDownloads,
      activeUsers,
      topDownloads,
      topUsers,
    };
    
    res.json(stats);
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    // Return empty stats on error
    const stats: AdminStats = {
      totalUsers: 0,
      totalMedia: 0,
      totalDownloads: 0,
      activeUsers: 0,
      topDownloads: [],
      topUsers: [],
    };
    res.json(stats);
  }
};

// Get Cloudinary storage status
export const getCloudinaryStatus: RequestHandler = async (req, res) => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  try {
    // Fetch real Cloudinary status if available
    const { getCloudinaryAccounts } = await import("../config/cloudinary.js");
    const accounts = await getCloudinaryAccounts();
    
    res.json({ accounts: accounts || [] });
  } catch (error) {
    console.error("Error fetching Cloudinary status:", error);
    res.json({ accounts: [] });
  }
};

// Get analytics data
export const getAnalyticsData: RequestHandler = (req, res) => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const { period = "week" } = req.query;

  // Generate mock analytics based on period
  const data = {
    period,
    downloadTrend: generateDownloadTrend(period as string),
    adMetrics: generateAdMetrics(period as string),
    userMetrics: generateUserMetrics(period as string),
  };

  res.json(data);
};

// Get user management data
export const getUsersData: RequestHandler = (req, res) => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  // This endpoint should fetch from real users database
  // For now, return empty array - users are managed via /api/admin/users
  const { page = 1, pageSize = 20 } = req.query;
  const pageNum = parseInt(page as string) || 1;
  const pageSizeNum = parseInt(pageSize as string) || 20;

  res.json({
    data: [],
    total: 0,
    page: pageNum,
    pageSize: pageSizeNum,
  });
};

// Ban/Unban/Approve user
export const toggleUserBan: RequestHandler = async (req, res) => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const { userId } = req.params;
  const { status } = req.body; // status: "active" | "banned" | "pending"

  try {
    const { getUsersDatabase } = await import("./users.js");
    const { isMongoDBAvailable } = await import("../utils/mongodb.js");
    const mongoService = await import("../services/mongodbService.js");
    
    const users = await getUsersDatabase();
    console.log(`[toggleUserBan] Looking for user with ID: ${userId}`);
    console.log(`[toggleUserBan] Total users in database: ${users.length}`);
    
    const user = users.find((u) => {
      const matchesId = u.id === userId;
      const matchesFirebaseUid = u.firebaseUid === userId;
      const matchesEmail = u.email?.toLowerCase() === userId.toLowerCase();
      return matchesId || matchesFirebaseUid || matchesEmail;
    });
    
    if (!user) {
      console.log(`[toggleUserBan] User not found. Searched for: ${userId}`);
      console.log(`[toggleUserBan] Available user IDs (first 5):`, users.slice(0, 5).map(u => ({ id: u.id, firebaseUid: u.firebaseUid, email: u.email })));
      res.status(404).json({ error: "User not found" });
      return;
    }
    
    console.log(`[toggleUserBan] Found user: ${user.email} (ID: ${user.id}, FirebaseUID: ${user.firebaseUid})`);

    // Determine new status
    const newStatus = status || (user.status === "banned" ? "active" : user.status === "pending" ? "active" : "banned");
    user.status = newStatus;
    user.updatedAt = new Date().toISOString();

    // Update in database
    const useMongo = await isMongoDBAvailable();
    if (useMongo) {
      try {
        // Find user in MongoDB
        const mongoUsers = await mongoService.default.getAllUsers();
        const mongoUser = mongoUsers.find((u: any) => 
          (u.id && (u.id === userId || u.id === user.id)) || 
          (u.firebaseUid && (u.firebaseUid === userId || u.firebaseUid === user.firebaseUid)) ||
          u._id.toString() === userId
        );
        if (mongoUser) {
          await mongoService.default.updateUser(mongoUser._id.toString(), {
            status: newStatus,
            updatedAt: user.updatedAt,
          });
          console.log(`[Admin] ✅ Updated user ${userId} status to ${newStatus} in MongoDB`);
        }
      } catch (mongoError) {
        console.error("❌ Error updating user in MongoDB:", mongoError);
        // Continue with file storage fallback
      }
    }

    // Update in file storage
    const { promises: fs } = await import("fs");
    const { join } = await import("path");
    const { DATA_DIR } = await import("../utils/dataPath.js");
    const USERS_DB_FILE = join(DATA_DIR, "users-database.json");
    
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(USERS_DB_FILE, JSON.stringify(users, null, 2), "utf-8");
    } catch (fileError) {
      console.error("❌ Error saving to file:", fileError);
    }

    res.json({
      userId,
      status: newStatus,
      message: `User status updated to ${newStatus} successfully`,
    });
  } catch (error: any) {
    console.error("Error updating user status:", error);
    res.status(500).json({ error: error.message || "Failed to update user status" });
  }
};

// Promote user to admin
export const promoteUserToAdmin: RequestHandler = async (req, res) => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const { userId } = req.params;

  try {
    const { getUsersDatabase } = await import("./users.js");
    const { isMongoDBAvailable } = await import("../utils/mongodb.js");
    const mongoService = await import("../services/mongodbService.js");
    
    const users = await getUsersDatabase();
    console.log(`[promoteUserToAdmin] Looking for user with ID: ${userId}`);
    
    const user = users.find((u) => {
      const matchesId = u.id === userId;
      const matchesFirebaseUid = u.firebaseUid === userId;
      const matchesEmail = u.email?.toLowerCase() === userId.toLowerCase();
      return matchesId || matchesFirebaseUid || matchesEmail;
    });
    
    if (!user) {
      console.log(`[promoteUserToAdmin] User not found. Searched for: ${userId}`);
      res.status(404).json({ error: "User not found" });
      return;
    }
    
    console.log(`[promoteUserToAdmin] Found user: ${user.email} (ID: ${user.id}, FirebaseUID: ${user.firebaseUid})`);

    user.role = "admin";
    user.updatedAt = new Date().toISOString();

    // Update in database
    const useMongo = await isMongoDBAvailable();
    if (useMongo) {
      try {
        const mongoUsers = await mongoService.default.getAllUsers();
        const mongoUser = mongoUsers.find((u: any) => 
          (u.id && (u.id === userId || u.id === user.id)) || 
          (u.firebaseUid && (u.firebaseUid === userId || u.firebaseUid === user.firebaseUid)) ||
          u._id.toString() === userId
        );
        if (mongoUser) {
          await mongoService.default.updateUser(mongoUser._id.toString(), {
            role: "admin",
            updatedAt: user.updatedAt,
          });
          console.log(`[Admin] ✅ Promoted user ${userId} to admin in MongoDB`);
        }
      } catch (mongoError) {
        console.error("❌ Error updating user in MongoDB:", mongoError);
      }
    }

    // Update in file storage
    const { promises: fs } = await import("fs");
    const { join } = await import("path");
    const { DATA_DIR } = await import("../utils/dataPath.js");
    const USERS_DB_FILE = join(DATA_DIR, "users-database.json");
    
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(USERS_DB_FILE, JSON.stringify(users, null, 2), "utf-8");
    } catch (fileError) {
      console.error("❌ Error saving to file:", fileError);
    }

    res.json({
      userId,
      role: "admin",
      message: "User promoted to admin successfully",
    });
  } catch (error: any) {
    console.error("Error promoting user to admin:", error);
    res.status(500).json({ error: error.message || "Failed to promote user to admin" });
  }
};

// Helper functions to generate real data
function generateDownloadTrend(period: string) {
  // TODO: Implement real download trend tracking
  return [];
}

function generateAdMetrics(period: string) {
  // TODO: Implement real ad metrics tracking
  return [];
}

function generateUserMetrics(period: string) {
  // TODO: Implement real user metrics tracking
  return [];
}
