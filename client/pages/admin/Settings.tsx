import AdminLayout from "@/components/AdminLayout";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

async function resizeImageToPng(dataUrl: string, size = 64): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.fillStyle = "transparent";
      ctx.fillRect(0, 0, size, size);

      const scale = Math.min(size / image.width, size / image.height);
      const scaledWidth = image.width * scale;
      const scaledHeight = image.height * scale;
      const offsetX = (size - scaledWidth) / 2;
      const offsetY = (size - scaledHeight) / 2;

      ctx.drawImage(image, offsetX, offsetY, scaledWidth, scaledHeight);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => reject(new Error("Unable to load image"));
    image.src = dataUrl;
  });
}

export default function AdminSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState({
    bkashPersonal: "",
    bkashMerchant: "",
  });
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [paymentMessage, setPaymentMessage] = useState("");

  const [faviconPreview, setFaviconPreview] = useState<string>("");
  const [brandingStatus, setBrandingStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [brandingMessage, setBrandingMessage] = useState("");

  const [generalSettings, setGeneralSettings] = useState({
    maintenanceMode: false,
  });
  const [generalStatus, setGeneralStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [generalMessage, setGeneralMessage] = useState("");

  useEffect(() => {
    Promise.all([apiFetch("/api/settings/payment"), apiFetch("/api/settings/branding"), apiFetch("/api/settings/general")])
      .then(async ([paymentRes, brandingRes, generalRes]) => {
        if (paymentRes.ok) {
          const data = await paymentRes.json();
          setPaymentSettings({
            bkashPersonal: data?.bkashPersonal || "",
            bkashMerchant: data?.bkashMerchant || "",
          });
        } else {
          setPaymentMessage("Unable to load payment settings.");
          setPaymentStatus("error");
        }

        if (brandingRes.ok) {
          const branding = await brandingRes.json();
          if (branding?.faviconDataUrl) {
            setFaviconPreview(branding.faviconDataUrl);
          }
        } else {
          setBrandingMessage("Unable to load branding settings.");
          setBrandingStatus("error");
        }

        if (generalRes.ok) {
          const general = await generalRes.json();
          setGeneralSettings({
            maintenanceMode: !!general?.maintenanceMode,
          });
        } else {
          setGeneralMessage("Unable to load general settings.");
          setGeneralStatus("error");
        }
      })
      .catch(() => {
        setPaymentMessage("Unable to load payment settings.");
        setPaymentStatus("error");
        setBrandingMessage("Unable to load branding settings.");
        setBrandingStatus("error");
        setGeneralMessage("Unable to load general settings.");
        setGeneralStatus("error");
      });
  }, []);

  const handlePaymentSave = async () => {
    setPaymentStatus("saving");
    setPaymentMessage("");
    try {
      const response = await apiFetch("/api/settings/payment", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentSettings),
      });
      if (!response.ok) {
        throw new Error("Failed to update payment settings");
      }
      setPaymentStatus("success");
      setPaymentMessage("Payment information updated.");
    } catch (error: any) {
      setPaymentStatus("error");
      setPaymentMessage(error.message || "Failed to save payment settings.");
    }
  };

  const handleFaviconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resizeImageToPng(result)
        .then((resized) => setFaviconPreview(resized))
        .catch(() => {
          setBrandingStatus("error");
          setBrandingMessage("Failed to process image. Please try a different file.");
        });
    };
    reader.readAsDataURL(file);
  };

  const handleBrandingSave = async () => {
    setBrandingStatus("saving");
    setBrandingMessage("");
    try {
      const response = await apiFetch("/api/settings/branding", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ faviconDataUrl: faviconPreview }),
      });
      if (!response.ok) {
        throw new Error("Failed to update branding settings");
      }
      setBrandingStatus("success");
      setBrandingMessage("Browser icon updated.");
    } catch (error: any) {
      setBrandingStatus("error");
      setBrandingMessage(error.message || "Failed to save branding settings.");
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
  };

  const handleGeneralSave = async () => {
    setGeneralStatus("saving");
    setGeneralMessage("");
    try {
      const response = await apiFetch("/api/settings/general", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(generalSettings),
      });
      if (!response.ok) {
        throw new Error("Failed to update general settings");
      }
      setGeneralStatus("success");
      setGeneralMessage(
        generalSettings.maintenanceMode ? "Maintenance mode enabled." : "Maintenance mode disabled."
      );
    } catch (error: any) {
      setGeneralStatus("error");
      setGeneralMessage(error.message || "Failed to save general settings.");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage site configuration and preferences</p>
        </div>

        {/* Payment Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <div>
              <h3 className="text-lg font-bold">Payment Settings</h3>
              <p className="text-sm text-muted-foreground">
                Update the bKash numbers shown to creators when purchasing storage.
              </p>
            </div>
            <button
              onClick={handlePaymentSave}
              disabled={paymentStatus === "saving"}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold disabled:opacity-50"
            >
              {paymentStatus === "saving" ? "Saving..." : "Save Payment Info"}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">bKash Personal (Send Money)</label>
              <input
                type="tel"
                value={paymentSettings.bkashPersonal}
                onChange={(e) => setPaymentSettings((prev) => ({ ...prev, bkashPersonal: e.target.value }))}
                className="w-full px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">bKash Merchant (Auto Payment)</label>
              <input
                type="tel"
                value={paymentSettings.bkashMerchant}
                onChange={(e) => setPaymentSettings((prev) => ({ ...prev, bkashMerchant: e.target.value }))}
                className="w-full px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="01XXXXXXXXX"
              />
            </div>
          </div>
          {paymentMessage && (
            <p
              className={`mt-4 text-sm ${
                paymentStatus === "error" ? "text-destructive" : paymentStatus === "success" ? "text-green-600" : "text-muted-foreground"
              }`}
            >
              {paymentMessage}
            </p>
          )}
        </div>

        {/* Branding */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-lg font-bold">Branding</h3>
              <p className="text-sm text-muted-foreground">Upload a custom browser icon (favicon) for the site.</p>
            </div>
            <button
              onClick={handleBrandingSave}
              disabled={brandingStatus === "saving"}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              {brandingStatus === "saving" ? "Saving..." : "Save Browser Icon"}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <label className="flex-1 text-sm font-medium flex flex-col gap-2">
              Upload icon (PNG, 32x32 recommended)
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/x-icon"
                onChange={handleFaviconChange}
                className="w-full px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800"
              />
            </label>
            <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>Preview</span>
              <div className="w-12 h-12 rounded-lg border border-dashed border-border flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                {faviconPreview ? (
                  <img src={faviconPreview} alt="Favicon preview" className="w-8 h-8 object-contain" />
                ) : (
                  <span className="text-xs text-muted-foreground">No icon</span>
                )}
              </div>
            </div>
          </div>
          {brandingMessage && (
            <p
              className={`text-sm ${
                brandingStatus === "error" ? "text-destructive" : brandingStatus === "success" ? "text-green-600" : "text-muted-foreground"
              }`}
            >
              {brandingMessage}
            </p>
          )}
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

        {/* General Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-lg font-bold">General Settings</h3>
              <p className="text-sm text-muted-foreground">Toggle Maintenance Mode to temporarily lock the user site.</p>
            </div>
            <button
              onClick={handleGeneralSave}
              disabled={generalStatus === "saving"}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold disabled:opacity-50"
            >
              {generalStatus === "saving" ? "Saving..." : "Save General Settings"}
            </button>
          </div>
          <div className="space-y-3">
            <label className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium">Maintenance Mode</span>
              <input
                type="checkbox"
                checked={generalSettings.maintenanceMode}
                onChange={(e) =>
                  setGeneralSettings((prev) => ({ ...prev, maintenanceMode: e.target.checked }))
                }
                className="w-4 h-4 rounded border-border"
              />
            </label>
          </div>
          {generalMessage && (
            <p
              className={`text-sm ${
                generalStatus === "error" ? "text-destructive" : generalStatus === "success" ? "text-green-600" : "text-muted-foreground"
              }`}
            >
              {generalMessage}
            </p>
          )}
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
