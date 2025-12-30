import Layout from "@/components/Layout";
import { User, Download, Star, Settings, LogOut, Sparkles, Loader2, DollarSign } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { currentUser, logout, creatorProfile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-6 sm:py-8 px-4 sm:px-6">
        <div className="container mx-auto">
          {/* Header */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 shadow-sm">
            <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    Welcome, {currentUser?.displayName || currentUser?.email || "Creator"}!
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground">Manage your downloads and profile</p>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3 w-full md:w-auto flex-wrap">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm sm:text-base touch-manipulation justify-center flex-1 md:flex-none"
                >
                  <User className="w-4 h-4 flex-shrink-0" />
                  Profile
                </Link>
                <Link
                  to="/earnings"
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-primary/40 rounded-lg text-sm sm:text-base touch-manipulation justify-center flex-1 md:flex-none text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                >
                  <DollarSign className="w-4 h-4 flex-shrink-0" />
                  Earnings
                </Link>
                <Link
                  to="/creator"
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-primary/40 rounded-lg text-sm sm:text-base touch-manipulation justify-center flex-1 md:flex-none text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                >
                  <Sparkles className="w-4 h-4 flex-shrink-0" />
                  {creatorProfile
                    ? creatorProfile.status === "approved"
                      ? "Creator Studio"
                      : "Creator Status"
                    : "Become a Creator"}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm sm:text-base touch-manipulation w-full md:w-auto justify-center"
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Creator Status Banner */}
          {creatorProfile && creatorProfile.status !== "approved" && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-400/30 rounded-lg p-4 sm:p-5 mb-6 sm:mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800/40 flex items-center justify-center text-amber-700 dark:text-amber-200">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <p className="font-semibold">
                    {creatorProfile.status === "pending"
                      ? "Your creator access is under review"
                      : "Creator access requires updates"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {creatorProfile.status === "pending"
                      ? "You can keep downloading as a user. Check the creator portal for the latest updates."
                      : "Please visit the creator portal to view the latest admin note."}
                  </p>
                </div>
              </div>
              <Link
                to="/creator"
                className="inline-flex items-center justify-center rounded-lg border border-amber-300 text-amber-800 dark:text-amber-100 px-4 py-2 text-sm font-medium hover:bg-amber-100/50 transition-colors"
              >
                View creator status
              </Link>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <div className="flex-1 min-w-0">
                  <p className="text-muted-foreground text-xs sm:text-sm">Total Downloads</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">0</p>
                </div>
                <Download className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0 ml-2" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <div className="flex-1 min-w-0">
                  <p className="text-muted-foreground text-xs sm:text-sm">Favorites</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">0</p>
                </div>
                <Star className="w-6 h-6 sm:w-8 sm:h-8 text-accent flex-shrink-0 ml-2" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <div className="flex-1 min-w-0">
                  <p className="text-muted-foreground text-xs sm:text-sm">Account Status</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">Active</p>
                </div>
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-secondary flex-shrink-0 ml-2" />
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Recent Downloads */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-border overflow-hidden shadow-sm">
                <div className="p-4 sm:p-6 border-b border-border">
                  <h2 className="text-lg sm:text-xl font-bold">Recent Downloads</h2>
                </div>
                <div className="divide-y divide-border">
                  <div className="p-4 sm:p-6 text-center text-muted-foreground">
                    <p className="text-sm">No recent downloads</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4 sm:space-y-6">
              {/* Account Settings */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-4 sm:p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                  <h3 className="font-semibold text-sm sm:text-base">Account Settings</h3>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Link
                    to="/profile"
                    className="block w-full text-left px-3 py-2 rounded text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors touch-manipulation"
                  >
                    Edit Profile
                  </Link>
                  <button className="w-full text-left px-3 py-2 rounded text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors touch-manipulation">
                    Change Password
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors touch-manipulation">
                    Email Preferences
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border border-primary/20 p-4 sm:p-6">
                <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Quick Tips</h3>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <li>✓ Create collections to organize your downloads</li>
                  <li>✓ Follow your favorite creators</li>
                  <li>✓ Enable notifications for new uploads</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
