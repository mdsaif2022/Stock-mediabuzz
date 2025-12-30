import AdminLayout from "@/components/AdminLayout";
import { Save, Upload, X, Loader2, Smartphone, Download } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { AppSettings } from "@shared/api";

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
    autoPaymentEnabled: true,
  });
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [paymentMessage, setPaymentMessage] = useState("");

  const [faviconPreview, setFaviconPreview] = useState<string>("");
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [brandingStatus, setBrandingStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [brandingMessage, setBrandingMessage] = useState("");

  const [generalSettings, setGeneralSettings] = useState({
    maintenanceMode: false,
  });
  const [generalStatus, setGeneralStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [generalMessage, setGeneralMessage] = useState("");

  const [appSettings, setAppSettings] = useState<AppSettings>({
    appName: "",
    appVersion: "",
    appDescription: "",
    apkUrl: "",
    xapkUrl: "",
    appIcon: "",
    downloadEnabled: false,
    playStoreUrl: "",
    appStoreUrl: "",
  });
  const [appStatus, setAppStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [appMessage, setAppMessage] = useState("");
  const [apkUploading, setApkUploading] = useState(false);
  const [xapkUploading, setXapkUploading] = useState(false);
  const [iconUploading, setIconUploading] = useState(false);
  const apkInputRef = useRef<HTMLInputElement>(null);
  const xapkInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/settings/payment"),
      apiFetch("/api/settings/branding"),
      apiFetch("/api/settings/general"),
      apiFetch("/api/settings/app"),
    ])
      .then(async ([paymentRes, brandingRes, generalRes, appRes]) => {
        if (paymentRes.ok) {
          const data = await paymentRes.json();
          setPaymentSettings({
            bkashPersonal: data?.bkashPersonal || "",
            bkashMerchant: data?.bkashMerchant || "",
            autoPaymentEnabled: typeof data?.autoPaymentEnabled === "boolean" ? data.autoPaymentEnabled : true,
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
          if (branding?.logo) {
            setLogoPreview(branding.logo);
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

        if (appRes.ok) {
          const app = await appRes.json();
          setAppSettings({
            appName: app?.appName || "",
            appVersion: app?.appVersion || "",
            appDescription: app?.appDescription || "",
            apkUrl: app?.apkUrl || "",
            xapkUrl: app?.xapkUrl || "",
            appIcon: app?.appIcon || "",
            downloadEnabled: typeof app?.downloadEnabled === "boolean" ? app.downloadEnabled : false,
            playStoreUrl: app?.playStoreUrl || "",
            appStoreUrl: app?.appStoreUrl || "",
          });
        } else {
          setAppMessage("Unable to load app settings.");
          setAppStatus("error");
        }
      })
      .catch(() => {
        setPaymentMessage("Unable to load payment settings.");
        setPaymentStatus("error");
        setBrandingMessage("Unable to load branding settings.");
        setBrandingStatus("error");
        setGeneralMessage("Unable to load general settings.");
        setGeneralStatus("error");
        setAppMessage("Unable to load app settings.");
        setAppStatus("error");
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

  const handleLogoUpload = async (file: File) => {
    if (!file) return;
    
    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      setBrandingStatus("error");
      setBrandingMessage("Invalid file type. Please upload PNG, JPG, or SVG.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setBrandingStatus("error");
      setBrandingMessage("File size must be less than 5MB.");
      return;
    }

    setLogoUploading(true);
    setBrandingMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "site-assets");
      formData.append("resource_type", "image");
      formData.append("public_id", "site-logo");
      formData.append("server", "auto");

      const uploadResponse = await apiFetch("/api/upload/asset", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload logo");
      }

      const uploadData = await uploadResponse.json();
      console.log("Upload response:", uploadData);
      
      if (uploadData.secureUrl || uploadData.secure_url || uploadData.url) {
        const logoUrl = uploadData.secureUrl || uploadData.secure_url || uploadData.url;
        setLogoPreview(logoUrl);
        setBrandingStatus("success");
        setBrandingMessage("Logo uploaded successfully. Click 'Save Branding' to save changes.");
      } else {
        console.error("Upload data missing URL:", uploadData);
        throw new Error("No URL returned from upload. Response: " + JSON.stringify(uploadData));
      }
    } catch (error: any) {
      console.error("Logo upload error:", error);
      setBrandingStatus("error");
      const errorMessage = error.message || "Failed to upload logo.";
      setBrandingMessage(errorMessage);
      // Show error details if available
      if (error.response) {
        error.response.json().then((errData: any) => {
          setBrandingMessage(errorMessage + " Details: " + (errData.message || errData.error || ""));
        }).catch(() => {});
      }
    } finally {
      setLogoUploading(false);
    }
  };

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleLogoUpload(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview("");
    setBrandingMessage("");
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  const handleBrandingSave = async () => {
    setBrandingStatus("saving");
    setBrandingMessage("");
    try {
      // Always save both favicon and logo (empty string if not set)
      const response = await apiFetch("/api/settings/branding", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          faviconDataUrl: faviconPreview || "",
          logo: logoPreview || "",
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Failed to update branding settings");
      }
      const saved = await response.json();
      // Update preview with saved values to ensure sync
      if (saved.logo) setLogoPreview(saved.logo);
      setBrandingStatus("success");
      setBrandingMessage("Branding settings saved successfully. Logo will appear in the header.");
    } catch (error: any) {
      console.error("Save branding error:", error);
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

  const handleApkUpload = async (file: File) => {
    if (!file) return;
    
    // Validate file type
    const validTypes = [".apk", "application/vnd.android.package-archive"];
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".apk") && !validTypes.includes(file.type)) {
      setAppStatus("error");
      setAppMessage("Invalid file type. Please upload an APK file.");
      return;
    }

    // Validate file size (max 200MB)
    if (file.size > 200 * 1024 * 1024) {
      setAppStatus("error");
      setAppMessage("File size must be less than 200MB.");
      return;
    }

    setApkUploading(true);
    setAppMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "app-files");
      formData.append("resource_type", "raw");
      formData.append("server", "auto");

      const uploadResponse = await apiFetch("/api/upload/file", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload APK");
      }

      const uploadData = await uploadResponse.json();
      const apkUrl = uploadData.secureUrl || uploadData.secure_url || uploadData.url;
      
      if (apkUrl) {
        setAppSettings((prev) => ({ ...prev, apkUrl }));
        setAppStatus("success");
        setAppMessage("APK uploaded successfully. Click 'Save App Settings' to save changes.");
      } else {
        throw new Error("No URL returned from upload");
      }
    } catch (error: any) {
      console.error("APK upload error:", error);
      setAppStatus("error");
      setAppMessage(error.message || "Failed to upload APK.");
    } finally {
      setApkUploading(false);
      if (apkInputRef.current) {
        apkInputRef.current.value = "";
      }
    }
  };

  const handleXapkUpload = async (file: File) => {
    if (!file) return;
    
    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xapk")) {
      setAppStatus("error");
      setAppMessage("Invalid file type. Please upload an XAPK file.");
      return;
    }

    // Validate file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      setAppStatus("error");
      setAppMessage("File size must be less than 500MB.");
      return;
    }

    setXapkUploading(true);
    setAppMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "app-files");
      formData.append("resource_type", "raw");
      formData.append("server", "auto");

      const uploadResponse = await apiFetch("/api/upload/file", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload XAPK");
      }

      const uploadData = await uploadResponse.json();
      const xapkUrl = uploadData.secureUrl || uploadData.secure_url || uploadData.url;
      
      if (xapkUrl) {
        setAppSettings((prev) => ({ ...prev, xapkUrl }));
        setAppStatus("success");
        setAppMessage("XAPK uploaded successfully. Click 'Save App Settings' to save changes.");
      } else {
        throw new Error("No URL returned from upload");
      }
    } catch (error: any) {
      console.error("XAPK upload error:", error);
      setAppStatus("error");
      setAppMessage(error.message || "Failed to upload XAPK.");
    } finally {
      setXapkUploading(false);
      if (xapkInputRef.current) {
        xapkInputRef.current.value = "";
      }
    }
  };

  const handleAppIconUpload = async (file: File) => {
    if (!file) return;
    
    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setAppStatus("error");
      setAppMessage("Invalid file type. Please upload PNG or JPG.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAppStatus("error");
      setAppMessage("File size must be less than 5MB.");
      return;
    }

    setIconUploading(true);
    setAppMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "app-assets");
      formData.append("resource_type", "image");
      formData.append("public_id", "app-icon");
      formData.append("server", "auto");

      const uploadResponse = await apiFetch("/api/upload/asset", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload app icon");
      }

      const uploadData = await uploadResponse.json();
      const iconUrl = uploadData.secureUrl || uploadData.secure_url || uploadData.url;
      
      if (iconUrl) {
        setAppSettings((prev) => ({ ...prev, appIcon: iconUrl }));
        setAppStatus("success");
        setAppMessage("App icon uploaded successfully. Click 'Save App Settings' to save changes.");
      } else {
        throw new Error("No URL returned from upload");
      }
    } catch (error: any) {
      console.error("App icon upload error:", error);
      setAppStatus("error");
      setAppMessage(error.message || "Failed to upload app icon.");
    } finally {
      setIconUploading(false);
      if (iconInputRef.current) {
        iconInputRef.current.value = "";
      }
    }
  };

  const handleAppSave = async () => {
    setAppStatus("saving");
    setAppMessage("");
    try {
      const response = await apiFetch("/api/settings/app", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appSettings),
      });
      if (!response.ok) {
        throw new Error("Failed to update app settings");
      }
      setAppStatus("success");
      setAppMessage("App settings updated successfully.");
    } catch (error: any) {
      setAppStatus("error");
      setAppMessage(error.message || "Failed to save app settings.");
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
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-slate-50 dark:bg-slate-800/50">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Enable Auto Payment</label>
                <p className="text-xs text-muted-foreground">
                  When enabled, creators can use the bKash merchant number for automatic payment processing.
                </p>
              </div>
              <Switch
                checked={paymentSettings.autoPaymentEnabled}
                onCheckedChange={(checked) => setPaymentSettings((prev) => ({ ...prev, autoPaymentEnabled: checked }))}
              />
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
                  className="w-full px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="01XXXXXXXXX"
                  disabled={!paymentSettings.autoPaymentEnabled}
                />
              </div>
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
              <p className="text-sm text-muted-foreground">Upload a custom browser icon (favicon) and site logo.</p>
            </div>
            <button
              onClick={handleBrandingSave}
              disabled={brandingStatus === "saving"}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              {brandingStatus === "saving" ? "Saving..." : "Save Branding"}
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
          {/* Site Logo Upload */}
          <div className="border-t border-border pt-4 mt-4">
            <h4 className="text-base font-semibold mb-3">Site Logo</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a logo that will appear next to the site title in the header. Recommended: PNG, JPG, or SVG (max 5MB).
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                  onChange={handleLogoFileChange}
                  className="hidden"
                  id="logo-upload"
                  disabled={logoUploading}
                />
                <label
                  htmlFor="logo-upload"
                  className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-lg cursor-pointer transition-colors ${
                    logoUploading
                      ? "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800"
                      : "hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {logoUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-sm font-medium">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm font-medium">Choose Logo File</span>
                    </>
                  )}
                </label>
              </div>
              <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground min-w-[120px]">
                <span>Preview</span>
                <div className="relative w-24 h-16 rounded-lg border border-dashed border-border flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                  {logoPreview ? (
                    <>
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="max-w-full max-h-full object-contain"
                      />
                      <button
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90 transition-colors"
                        title="Remove logo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground text-center px-2">No logo</span>
                  )}
                </div>
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

        {/* App Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Official App Management
              </h3>
              <p className="text-sm text-muted-foreground">
                Upload and manage your official app files (APK/XAPK) and configure download links.
              </p>
            </div>
            <button
              onClick={handleAppSave}
              disabled={appStatus === "saving"}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold disabled:opacity-50"
            >
              {appStatus === "saving" ? "Saving..." : "Save App Settings"}
            </button>
          </div>

          <div className="space-y-6">
            {/* Enable/Disable Download */}
            <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div>
                <label className="text-sm font-medium">Enable App Download</label>
                <p className="text-xs text-muted-foreground">
                  Show "Get Our App" button in the header when enabled
                </p>
              </div>
              <Switch
                checked={appSettings.downloadEnabled}
                onCheckedChange={(checked) =>
                  setAppSettings((prev) => ({ ...prev, downloadEnabled: checked }))
                }
              />
            </div>

            {/* App Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">App Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">App Name</label>
                  <input
                    type="text"
                    value={appSettings.appName}
                    onChange={(e) => setAppSettings((prev) => ({ ...prev, appName: e.target.value }))}
                    placeholder="My App"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">App Version</label>
                  <input
                    type="text"
                    value={appSettings.appVersion}
                    onChange={(e) => setAppSettings((prev) => ({ ...prev, appVersion: e.target.value }))}
                    placeholder="1.0.0"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">App Description</label>
                <textarea
                  value={appSettings.appDescription}
                  onChange={(e) => setAppSettings((prev) => ({ ...prev, appDescription: e.target.value }))}
                  placeholder="Brief description of your app"
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* App Icon */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">App Icon</h4>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    ref={iconInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAppIconUpload(file);
                    }}
                    className="hidden"
                    id="app-icon-upload"
                    disabled={iconUploading}
                  />
                  <label
                    htmlFor="app-icon-upload"
                    className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-lg cursor-pointer transition-colors ${
                      iconUploading
                        ? "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800"
                        : "hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {iconUploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-sm font-medium">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm font-medium">Upload App Icon</span>
                      </>
                    )}
                  </label>
                </div>
                {appSettings.appIcon && (
                  <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground min-w-[120px]">
                    <span>Preview</span>
                    <div className="relative w-24 h-24 rounded-lg border border-dashed border-border flex items-center justify-center bg-slate-50 dark:bg-slate-900 overflow-hidden">
                      <img
                        src={appSettings.appIcon}
                        alt="App icon preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* APK Upload */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">APK File</h4>
              <div className="flex flex-col gap-4">
                <div>
                  <input
                    ref={apkInputRef}
                    type="file"
                    accept=".apk,application/vnd.android.package-archive"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleApkUpload(file);
                    }}
                    className="hidden"
                    id="apk-upload"
                    disabled={apkUploading}
                  />
                  <label
                    htmlFor="apk-upload"
                    className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-lg cursor-pointer transition-colors ${
                      apkUploading
                        ? "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800"
                        : "hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {apkUploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-sm font-medium">Uploading APK...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm font-medium">Upload APK File (max 200MB)</span>
                      </>
                    )}
                  </label>
                </div>
                {appSettings.apkUrl && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
                    <p className="text-xs text-green-900 dark:text-green-200 mb-1">APK uploaded successfully</p>
                    <a
                      href={appSettings.apkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-700 dark:text-green-300 hover:underline break-all"
                    >
                      {appSettings.apkUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* XAPK Upload */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">XAPK File</h4>
              <div className="flex flex-col gap-4">
                <div>
                  <input
                    ref={xapkInputRef}
                    type="file"
                    accept=".xapk"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleXapkUpload(file);
                    }}
                    className="hidden"
                    id="xapk-upload"
                    disabled={xapkUploading}
                  />
                  <label
                    htmlFor="xapk-upload"
                    className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-lg cursor-pointer transition-colors ${
                      xapkUploading
                        ? "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800"
                        : "hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {xapkUploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-sm font-medium">Uploading XAPK...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm font-medium">Upload XAPK File (max 500MB)</span>
                      </>
                    )}
                  </label>
                </div>
                {appSettings.xapkUrl && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
                    <p className="text-xs text-green-900 dark:text-green-200 mb-1">XAPK uploaded successfully</p>
                    <a
                      href={appSettings.xapkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-700 dark:text-green-300 hover:underline break-all"
                    >
                      {appSettings.xapkUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Store Links */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Store Links (Optional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Google Play Store URL</label>
                  <input
                    type="url"
                    value={appSettings.playStoreUrl}
                    onChange={(e) => setAppSettings((prev) => ({ ...prev, playStoreUrl: e.target.value }))}
                    placeholder="https://play.google.com/store/apps/..."
                    className="w-full px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Apple App Store URL</label>
                  <input
                    type="url"
                    value={appSettings.appStoreUrl}
                    onChange={(e) => setAppSettings((prev) => ({ ...prev, appStoreUrl: e.target.value }))}
                    placeholder="https://apps.apple.com/app/..."
                    className="w-full px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {appMessage && (
            <p
              className={`text-sm ${
                appStatus === "error" ? "text-destructive" : appStatus === "success" ? "text-green-600" : "text-muted-foreground"
              }`}
            >
              {appMessage}
            </p>
          )}
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
