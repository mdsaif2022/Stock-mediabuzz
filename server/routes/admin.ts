import { RequestHandler } from "express";
import { AdminStats } from "@shared/api";

// Mock analytics data
const analyticsData = {
  totalUsers: 5234,
  totalMedia: 2456,
  totalDownloads: 168200,
  activeUsers: 892,
  topDownloads: [
    { id: "1", title: "Cinematic Urban Sunset", downloads: 12500 },
    { id: "2", title: "Professional Business Background", downloads: 8300 },
    { id: "3", title: "Upbeat Electronic Music", downloads: 5200 },
  ],
  topUsers: [
    { id: "1", name: "John Doe", downloads: 245 },
    { id: "2", name: "Jane Smith", downloads: 189 },
    { id: "3", name: "Mike Johnson", downloads: 156 },
  ],
};

// Get admin dashboard stats
export const getDashboardStats: RequestHandler = (req, res) => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const stats: AdminStats = analyticsData;
  res.json(stats);
};

// Get Cloudinary storage status
export const getCloudinaryStatus: RequestHandler = (req, res) => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  // Mock Cloudinary API response
  const cloudinaryStatus = {
    accounts: [
      { id: 1, used: 75, total: 100, percentage: 75 },
      { id: 2, used: 45, total: 100, percentage: 45 },
      { id: 3, used: 92, total: 100, percentage: 92 },
      { id: 4, used: 28, total: 100, percentage: 28 },
    ],
  };

  res.json(cloudinaryStatus);
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

  const { page = 1, pageSize = 20 } = req.query;

  const mockUsers = [
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      downloads: 245,
      role: "user",
      status: "active",
      joinedDate: "2024-01-15",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      downloads: 189,
      role: "user",
      status: "active",
      joinedDate: "2024-02-20",
    },
    {
      id: "3",
      name: "Mike Johnson",
      email: "mike@example.com",
      downloads: 156,
      role: "user",
      status: "active",
      joinedDate: "2024-03-10",
    },
  ];

  const pageNum = parseInt(page as string) || 1;
  const pageSizeNum = parseInt(pageSize as string) || 20;

  res.json({
    data: mockUsers,
    total: mockUsers.length,
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

// Helper functions to generate mock data
function generateDownloadTrend(period: string) {
  if (period === "week") {
    return [
      { date: "Mon", downloads: 400 },
      { date: "Tue", downloads: 600 },
      { date: "Wed", downloads: 800 },
      { date: "Thu", downloads: 1000 },
      { date: "Fri", downloads: 1200 },
      { date: "Sat", downloads: 900 },
      { date: "Sun", downloads: 1100 },
    ];
  }
  // Add more period logic as needed
  return [];
}

function generateAdMetrics(period: string) {
  return [
    { date: "Day 1", impressions: 4200, clicks: 324 },
    { date: "Day 2", impressions: 5100, clicks: 412 },
    { date: "Day 3", impressions: 4800, clicks: 388 },
  ];
}

function generateUserMetrics(period: string) {
  return [
    { date: "Day 1", newUsers: 45, activeUsers: 523 },
    { date: "Day 2", newUsers: 38, activeUsers: 541 },
    { date: "Day 3", newUsers: 52, activeUsers: 567 },
  ];
}
