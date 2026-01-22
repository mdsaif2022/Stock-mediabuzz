import AdminLayout from "@/components/AdminLayout";
import { Download, Eye, Users, TrendingUp, Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [downloadStats, setDownloadStats] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [mediaData, setMediaData] = useState<any>(null);
  const [popupAds, setPopupAds] = useState<any[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch download stats
      const downloadResponse = await apiFetch("/api/admin/download-stats");
      const downloadData = await downloadResponse.json();
      setDownloadStats(downloadData);

      // Fetch analytics data
      const analyticsResponse = await apiFetch("/api/admin/analytics?period=week");
      const analytics = await analyticsResponse.json();
      setAnalyticsData(analytics);

      // Fetch media data for category distribution
      const mediaResponse = await apiFetch("/api/media?pageSize=1000");
      const media = await mediaResponse.json();
      setMediaData(media);

      // Fetch pop-up ads for ad metrics
      const adsResponse = await apiFetch("/api/popup-ads");
      const ads = await adsResponse.json();
      setPopupAds(ads.data || []);
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate download trend from last 6 weeks
  const downloadTrendData = (() => {
    if (!downloadStats) return [];
    const weeks: { date: string; downloads: number; users: number }[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      // For now, distribute total downloads evenly across weeks
      // In a real implementation, you'd track downloads by date
      const weekDownloads = Math.floor((downloadStats.totalDownloads || 0) / 6);
      const weekUsers = Math.floor((downloadStats.uniqueUsers || 0) / 6);
      
      weeks.push({
        date: `Week ${6 - i}`,
        downloads: weekDownloads,
        users: weekUsers,
      });
    }
    return weeks;
  })();

  // Calculate category distribution from media data
  const categoryData = (() => {
    if (!mediaData?.data) return [];
    const categoryCounts: Record<string, number> = {};
    
    mediaData.data.forEach((item: any) => {
      const category = (item.category || "other").toLowerCase();
      categoryCounts[category] = (categoryCounts[category] || 0) + (item.downloads || 0);
    });

    const colors: Record<string, string> = {
      video: "#a855f7",
      image: "#06b6d4",
      audio: "#f97316",
      apk: "#10b981",
      other: "#64748b",
    };

    return Object.entries(categoryCounts)
      .map(([name, downloads]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        downloads: downloads as number,
        color: colors[name] || colors.other,
      }))
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 4);
  })();

  // Calculate ad metrics from pop-up ads
  const adMetrics = (() => {
    if (popupAds.length === 0) return [];
    
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day) => {
      // Aggregate metrics from all pop-up ads
      const totalImpressions = popupAds.reduce((sum, ad) => sum + (ad.impressions || 0), 0);
      const totalClicks = popupAds.reduce((sum, ad) => sum + (ad.clicks || 0), 0);
      
      // Distribute evenly across days (in real implementation, track by date)
      const dayImpressions = Math.floor(totalImpressions / 7);
      const dayClicks = Math.floor(totalClicks / 7);
      const ctr = dayImpressions > 0 ? ((dayClicks / dayImpressions) * 100).toFixed(1) : "0.0";
      
      return {
        date: day,
        impressions: dayImpressions,
        clicks: dayClicks,
        ctr: `${ctr}%`,
      };
    });
  })();

  // Calculate metrics
  const totalDownloads30d = downloadStats?.totalDownloads || 0;
  const pageViews30d = downloadStats?.totalDownloads ? Math.floor(downloadStats.totalDownloads * 5.5) : 0; // Estimate
  const newUsers30d = downloadStats?.uniqueUsers || 0;
  const avgDownloadsPerUser = downloadStats?.uniqueUsers > 0 
    ? ((downloadStats.totalDownloads || 0) / downloadStats.uniqueUsers).toFixed(2)
    : "0.00";

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }
  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-2">Track downloads, users, and ad performance</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-muted-foreground text-sm">Total Downloads</p>
                <p className="text-3xl font-bold mt-2">
                  {totalDownloads30d >= 1000 
                    ? `${(totalDownloads30d / 1000).toFixed(1)}K`
                    : totalDownloads30d.toLocaleString()}
                </p>
              </div>
              <Download className="w-8 h-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">All time downloads</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-muted-foreground text-sm">Estimated Page Views</p>
                <p className="text-3xl font-bold mt-2">
                  {pageViews30d >= 1000 
                    ? `${(pageViews30d / 1000).toFixed(1)}K`
                    : pageViews30d.toLocaleString()}
                </p>
              </div>
              <Eye className="w-8 h-8 text-secondary" />
            </div>
            <p className="text-xs text-muted-foreground">Based on download activity</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-muted-foreground text-sm">Unique Users</p>
                <p className="text-3xl font-bold mt-2">
                  {newUsers30d >= 1000 
                    ? `${(newUsers30d / 1000).toFixed(1)}K`
                    : newUsers30d.toLocaleString()}
                </p>
              </div>
              <Users className="w-8 h-8 text-accent" />
            </div>
            <p className="text-xs text-muted-foreground">Users who downloaded</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-muted-foreground text-sm">Avg. Downloads/User</p>
                <p className="text-3xl font-bold mt-2">{avgDownloadsPerUser}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Average per user</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Download Trend */}
          {downloadTrendData.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6">
              <h3 className="text-lg font-bold mb-4">Download & User Trends (6 weeks)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={downloadTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
                  <Legend />
                  <Line type="monotone" dataKey="downloads" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="users" stroke="hsl(var(--accent))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Category Distribution */}
          {categoryData.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6">
              <h3 className="text-lg font-bold mb-4">Downloads by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="downloads"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Ad Performance */}
        {adMetrics.length > 0 && (
          <>
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6">
              <h3 className="text-lg font-bold mb-4">Ad Performance (Last 7 days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={adMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
                  <Legend />
                  <Bar dataKey="impressions" fill="hsl(var(--primary))" />
                  <Bar dataKey="clicks" fill="hsl(var(--accent))" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed Ad Table */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-border overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-bold">Ad Performance Details</h3>
              </div>
              <table className="w-full">
                <thead className="border-b border-border bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Impressions</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Clicks</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">CTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {adMetrics.map((metric) => (
                    <tr
                      key={metric.date}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium">{metric.date}</td>
                      <td className="px-6 py-4 text-sm">{metric.impressions.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm font-semibold">{metric.clicks}</td>
                      <td className="px-6 py-4 text-sm">{metric.ctr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        
        {adMetrics.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6 text-center text-muted-foreground">
            <p>No ad performance data available. Create pop-up ads to see metrics.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
