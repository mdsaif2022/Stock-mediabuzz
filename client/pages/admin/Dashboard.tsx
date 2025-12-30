import AdminLayout from "@/components/AdminLayout";
import { Download, Users, FileText, TrendingUp, Activity, AlertCircle, Loader2 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { AdminStats } from "@shared/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cloudinaryStatus, setCloudinaryStatus] = useState<any>(null);

  useEffect(() => {
    fetchStats();
    fetchCloudinaryStatus();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await apiFetch("/api/admin/stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCloudinaryStatus = async () => {
    try {
      const response = await apiFetch("/api/admin/cloudinary-status");
      const data = await response.json();
      setCloudinaryStatus(data);
    } catch (error) {
      console.error("Failed to fetch cloudinary status:", error);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  const downloadData: { date: string; downloads: number }[] = [];
  const mediaTypeData: { name: string; value: number; color: string }[] = [];
  const topDownloads = stats?.topDownloads || [];
  const topUsers = stats?.topUsers || [];
  const cloudinaryAccounts = cloudinaryStatus?.accounts || [];
  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">Welcome back! Here's your platform overview.</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm truncate">Total Users</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{stats?.totalUsers?.toLocaleString() || 0}</p>
              </div>
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0 ml-2" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm truncate">Total Media</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{stats?.totalMedia?.toLocaleString() || 0}</p>
              </div>
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-secondary flex-shrink-0 ml-2" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm truncate">Total Downloads</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{stats?.totalDownloads?.toLocaleString() || 0}</p>
              </div>
              <Download className="w-6 h-6 sm:w-8 sm:h-8 text-accent flex-shrink-0 ml-2" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm truncate">Active Users (7d)</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{stats?.activeUsers?.toLocaleString() || 0}</p>
              </div>
              <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0 ml-2" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {downloadData.length > 0 || mediaTypeData.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Download Trend */}
            {downloadData.length > 0 && (
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-lg border border-border p-4 sm:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Download Trends</h3>
                <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                  <LineChart data={downloadData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
                    <Line type="monotone" dataKey="downloads" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Media Type Distribution */}
            {mediaTypeData.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-4 sm:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Media Distribution</h3>
                <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                  <PieChart>
                    <Pie
                      data={mediaTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {mediaTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : null}

        {/* Top Downloads and Users */}
        {(topDownloads.length > 0 || topUsers.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Top Downloads */}
            {topDownloads.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-4 sm:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Top Downloaded Media</h3>
                <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto -mx-2 sm:mx-0 px-2 sm:px-0">
                  {topDownloads.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 rounded-lg gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{index + 1}. {item.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.category || item.type}</p>
                      </div>
                      <p className="font-semibold text-primary text-xs sm:text-sm flex-shrink-0">{(item.downloads || 0).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Active Users */}
            {topUsers.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-4 sm:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Top Active Users</h3>
                <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto -mx-2 sm:mx-0 px-2 sm:px-0">
                  {topUsers.map((user, index) => (
                    <div key={user.id} className="flex items-center justify-between p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 rounded-lg gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{index + 1}. {user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <p className="font-semibold text-accent text-xs sm:text-sm flex-shrink-0">{user.downloads}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cloud Storage Status */}
        {cloudinaryAccounts.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-bold">Cloud Storage Status</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {cloudinaryAccounts.map((cloud: any, index: number) => (
                <div key={cloud.id || index} className="min-w-0">
                  <p className="font-medium text-xs sm:text-sm mb-2 truncate">{cloud.name || `Server ${index + 1}`}</p>
                  <div className="w-full h-2.5 sm:h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        cloud.percentage > 80
                          ? "bg-destructive"
                          : cloud.percentage > 60
                            ? "bg-accent"
                            : "bg-primary"
                      }`}
                      style={{ width: `${cloud.percentage || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {cloud.used}GB / {cloud.total}GB
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
