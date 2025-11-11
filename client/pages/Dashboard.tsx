import Layout from "@/components/Layout";
import { User, Download, Star, Settings, LogOut } from "lucide-react";

export default function Dashboard() {
  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4">
        <div className="container mx-auto">
          {/* Header */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6 md:p-8 mb-8">
            <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Welcome, Creator!</h1>
                  <p className="text-muted-foreground">Manage your downloads and profile</p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-muted-foreground text-sm">Total Downloads</p>
                  <p className="text-3xl font-bold mt-2">245</p>
                </div>
                <Download className="w-8 h-8 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">+15 this month</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-muted-foreground text-sm">Favorites</p>
                  <p className="text-3xl font-bold mt-2">23</p>
                </div>
                <Star className="w-8 h-8 text-accent" />
              </div>
              <p className="text-xs text-muted-foreground">Bookmarked items</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-muted-foreground text-sm">Account Status</p>
                  <p className="text-3xl font-bold mt-2">Active</p>
                </div>
                <User className="w-8 h-8 text-secondary" />
              </div>
              <p className="text-xs text-muted-foreground">Member since 2024</p>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Recent Downloads */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-border overflow-hidden">
                <div className="p-6 border-b border-border">
                  <h2 className="text-xl font-bold">Recent Downloads</h2>
                </div>
                <div className="divide-y divide-border">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold">Cinematic Urban Sunset Video</h3>
                          <p className="text-sm text-muted-foreground mt-1">Video • 4K • Downloaded on Dec {item}, 2024</p>
                        </div>
                        <button className="text-primary hover:text-accent transition-colors">
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Account Settings */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Account Settings</h3>
                </div>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 rounded text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Edit Profile
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Change Password
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Email Preferences
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border border-primary/20 p-6">
                <h3 className="font-semibold mb-4">Quick Tips</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
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
