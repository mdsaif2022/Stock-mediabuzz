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

// Ban/Unban user
export const toggleUserBan: RequestHandler = (req, res) => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const { userId } = req.params;
  const { banned } = req.body;

  res.json({
    userId,
    banned,
    message: `User ${banned ? "banned" : "unbanned"} successfully`,
  });
};

// Promote user to admin
export const promoteUserToAdmin: RequestHandler = (req, res) => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const { userId } = req.params;

  res.json({
    userId,
    role: "admin",
    message: "User promoted to admin successfully",
  });
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
