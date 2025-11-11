import AdminLayout from "@/components/AdminLayout";
import { Save, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function AdminSettings() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage site configuration and preferences</p>
        </div>

        {/* Site Information */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6">
          <h3 className="text-lg font-bold mb-4">Site Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Site Name</label>
              <input
                type="text"
                defaultValue="FreeMediaBuzz"
                className="w-full px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Site Logo URL</label>
              <input
                type="url"
                placeholder="https://..."
                className="w-full px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Site Description</label>
              <textarea
                defaultValue="Free stock media for creators, developers, and businesses. Download videos, images, audio, and templates without limits."
                className="w-full px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6">
          <h3 className="text-lg font-bold mb-4">Contact Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Support Email</label>
              <input
                type="email"
                defaultValue="support@freemediabuzz.com"
                className="w-full px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contact Email</label>
              <input
                type="email"
                defaultValue="contact@freemediabuzz.com"
                className="w-full px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <input
                type="text"
                placeholder="Your address"
                className="w-full px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6">
          <h3 className="text-lg font-bold mb-4">Social Links</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Twitter</label>
              <input
                type="url"
                placeholder="https://twitter.com/..."
                className="w-full px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Facebook</label>
              <input
                type="url"
                placeholder="https://facebook.com/..."
                className="w-full px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">GitHub</label>
              <input
                type="url"
                placeholder="https://github.com/..."
                className="w-full px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Instagram</label>
              <input
                type="url"
                placeholder="https://instagram.com/..."
                className="w-full px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Adsterra Settings */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-4">Adsterra Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                Adsterra Script ID
              </label>
              <input
                type="text"
                defaultValue="adsterra-12345-script"
                className="w-full px-4 py-2 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-900 dark:text-blue-200">Enable Ad Placements</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-blue-300" />
                  <span className="text-sm text-blue-900 dark:text-blue-200">Header Banner</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-blue-300" />
                  <span className="text-sm text-blue-900 dark:text-blue-200">Sidebar Ads</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-blue-300" />
                  <span className="text-sm text-blue-900 dark:text-blue-200">Popunder</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-blue-300" />
                  <span className="text-sm text-blue-900 dark:text-blue-200">Interstitial</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Cloudinary Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6">
          <h3 className="text-lg font-bold mb-4">Cloudinary Integration</h3>
          <div className="bg-slate-50 dark:bg-slate-800 border border-border rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold mb-1">API Keys are secure</p>
                <p className="text-muted-foreground">
                  Your Cloudinary API keys are stored securely. Never share them publicly.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <label className="block text-sm font-medium mb-2">Cloudinary Account {i} API Key</label>
                <input
                  type="password"
                  placeholder="••••••••••••••••"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            ))}
          </div>
        </div>

        {/* General Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6">
          <h3 className="text-lg font-bold mb-4">General Settings</h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium">Enable Registrations</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium">Email Verification Required</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium">Enable Download Limits</span>
              <input type="checkbox" className="w-4 h-4 rounded border-border" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium">Maintenance Mode</span>
              <input type="checkbox" className="w-4 h-4 rounded border-border" />
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
          <button className="px-6 py-3 border border-border rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Reset
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
