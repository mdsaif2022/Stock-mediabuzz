import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Media } from "@shared/api";
import { apiFetch } from "@/lib/api";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Upload,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Smartphone,
  X,
  ShieldCheck,
  History,
  Calendar,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

const categoryOptions = [
  { label: "Video", value: "video" },
  { label: "Image", value: "image" },
  { label: "Audio", value: "audio" },
  { label: "Template", value: "template" },
  { label: "APK / App", value: "apk" },
  { label: "AI Video Generator", value: "aivideogenerator" },
];

type UploadCategory = typeof categoryOptions[number]["value"];

interface FeatureScreenshotDraft {
  id: string;
  title: string;
  description: string;
  url: string;
  uploading?: boolean;
}

export default function CreatorDashboard() {
  const { currentUser, loading, creatorProfile, creatorLoading, refreshCreatorProfile } = useAuth();
  const navigate = useNavigate();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    category: "video" as UploadCategory,
    type: "",
    description: "",
    tags: "",
    isPremium: false,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState("");
  const [purchaseError, setPurchaseError] = useState("");
  const [selectedPlanGb, setSelectedPlanGb] = useState(1);
  const [selectedMonths, setSelectedMonths] = useState(2);
  const [manualTxnId, setManualTxnId] = useState("");
  const [manualSender, setManualSender] = useState("");
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");
  const [accessRequestLoading, setAccessRequestLoading] = useState(false);
  const [accessRequestMessage, setAccessRequestMessage] = useState("");
  const [accessRequestError, setAccessRequestError] = useState("");
  const [paymentSettings, setPaymentSettings] = useState({
    bkashPersonal: "01783083659",
    bkashMerchant: "01918998687",
  });
  const [creatorStats, setCreatorStats] = useState<{
    totalUploads: number;
    lastUploadDate: string | null;
  }>({
    totalUploads: 0,
    lastUploadDate: null,
  });
  const iconInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const [appIcon, setAppIcon] = useState<{ url: string; uploading: boolean } | null>(null);
  const [featureScreenshots, setFeatureScreenshots] = useState<FeatureScreenshotDraft[]>([]);
  const [showScreenshotsToggle, setShowScreenshotsToggle] = useState(true);

  const status = creatorProfile?.status ?? "none";
  const isApproved = status === "approved";
  const isPending = status === "pending";

  // Reset APK-specific fields when category changes
  useEffect(() => {
    if (uploadForm.category !== "apk") {
      setAppIcon(null);
      setFeatureScreenshots([]);
      setShowScreenshotsToggle(true);
    }
  }, [uploadForm.category]);

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate("/login?redirect=creator");
    }
  }, [currentUser, loading, navigate]);

  useEffect(() => {
    if (currentUser?.email) {
      refreshCreatorProfile(currentUser.email).catch(() => {});
    }
  }, [currentUser?.email, refreshCreatorProfile]);

  const loadCreatorStats = useCallback(async () => {
    if (!creatorProfile?.id) return;
    try {
      setStatsLoading(true);
      setStatsError("");
      const response = await apiFetch("/api/media");
      if (!response.ok) {
        throw new Error("Failed to load uploads");
      }
      const payload = await response.json();
      const items: Media[] = Array.isArray(payload) ? payload : payload.data || [];
      const creatorItems = items.filter((item) => item.creatorId === creatorProfile.id);
      const lastUploadDate =
        creatorItems.length > 0
          ? creatorItems
              .map((item) => item.uploadedDate)
              .filter(Boolean)
              .sort((a, b) => new Date(b || "").getTime() - new Date(a || "").getTime())[0] || null
          : null;
      setCreatorStats({
        totalUploads: creatorItems.length,
        lastUploadDate,
      });
    } catch (error: any) {
      setStatsError(error.message || "Failed to load stats");
    } finally {
      setStatsLoading(false);
    }
  }, [creatorProfile?.id]);

  useEffect(() => {
    loadCreatorStats();
  }, [loadCreatorStats]);

  useEffect(() => {
    apiFetch("/api/settings/payment")
      .then((res) => res.json())
      .then((data) => {
        if (data?.bkashPersonal && data?.bkashMerchant) {
          setPaymentSettings({
            bkashPersonal: data.bkashPersonal,
            bkashMerchant: data.bkashMerchant,
          });
        }
      })
      .catch(() => {
        // ignore errors, keep defaults
      });
  }, []);


  const handleCreatorAccessRequest = async () => {
    if (!currentUser?.email) return;
    setAccessRequestLoading(true);
    setAccessRequestError("");
    setAccessRequestMessage("");
    try {
      const response = await apiFetch("/api/creators", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: currentUser.email,
          name: currentUser.displayName || currentUser.email,
          firebaseUid: currentUser.uid,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Unable to register creator profile");
      }
      setAccessRequestMessage("Your creator profile request has been sent! Check back shortly.");
      await refreshCreatorProfile(currentUser.email);
    } catch (error: any) {
      setAccessRequestError(error.message || "Failed to submit request.");
    } finally {
      setAccessRequestLoading(false);
    }
  };

  const statusBadge = useMemo(() => {
    if (creatorLoading) {
      return (
        <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          Checking status
        </span>
      );
    }

    if (!creatorProfile) {
      return (
        <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Sparkles className="w-3 h-3" />
          Not Enabled
        </span>
      );
    }

    if (isApproved) {
      return (
        <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
          <CheckCircle2 className="w-3 h-3" />
          Verified
        </span>
      );
    }

    if (isPending) {
      return (
        <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
          <Loader2 className="w-3 h-3 animate-spin" />
          Pending
        </span>
      );
    }

    if (status === "rejected") {
      return (
        <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200">
          <AlertTriangle className="w-3 h-3" />
          Needs Attention
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <Sparkles className="w-3 h-3" />
        Status Unknown
      </span>
    );
  }, [creatorLoading, creatorProfile, isApproved, isPending, status]);

  const STORAGE_PLANS = [
    { gb: 1, price: 299 },
    { gb: 2, price: 399 },
    { gb: 4, price: 499 },
    { gb: 5, price: 599 },
  ];

  const STORAGE_DURATION_OPTIONS = [2, 4, 6, 8, 10, 12];

  const storageUsedGb = creatorProfile ? creatorProfile.storageUsedBytes / 1024 ** 3 : 0;
  const manualPurchases = (creatorProfile?.storagePurchaseHistory || []).filter(
    (purchase) => purchase.paymentMethod === "manual"
  );
  const pendingManualPurchase = manualPurchases.find((purchase) => purchase.status === "pending");
  const rejectedManualPurchases = manualPurchases.filter((purchase) => purchase.status === "rejected");

  const bonusActive =
    creatorProfile?.storageBonusExpiresAt && new Date(creatorProfile.storageBonusExpiresAt) > new Date();
  const bonusGb = bonusActive ? creatorProfile?.storageBonusGb ?? 0 : 0;
  // MIGRATION: Override any existing 5 GB base storage to 1 GB (new policy)
  // This ensures the UI shows 1 GB even if database hasn't migrated yet
  const baseGb = (creatorProfile?.storageBaseGb === 5 ? 1 : creatorProfile?.storageBaseGb) ?? 1; // Changed from 5 GB to 1 GB free storage
  const totalStorageGb = baseGb + bonusGb;
  const remainingGb = Math.max(totalStorageGb - storageUsedGb, 0);
  const storagePercent = totalStorageGb > 0 ? Math.min(100, (storageUsedGb / totalStorageGb) * 100) : 0;

  const handleStoragePurchase = async () => {
    if (!creatorProfile?.id) {
      setPurchaseError("Creator profile not found.");
      return;
    }
    setPurchaseLoading(true);
    setPurchaseError("");
    setPurchaseSuccess("");
    try {
      if (!manualSender || !manualTxnId) {
        setPurchaseError("Enter the bKash number you sent from and the transaction ID.");
        setPurchaseLoading(false);
        return;
      }
      const response = await apiFetch("/api/creators/storage/purchase/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creatorId: creatorProfile.id,
          gb: selectedPlanGb,
          months: selectedMonths,
          senderNumber: manualSender,
          transactionId: manualTxnId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update storage plan");
      }

      const plan = STORAGE_PLANS.find((p) => p.gb === selectedPlanGb);
      const total = plan ? plan.price * selectedMonths : 0;

      setPurchaseSuccess(
        `Manual payment submitted (৳${total}). Storage will activate after admin verifies your bKash transaction.`
      );
      setManualSender("");
      setManualTxnId("");
    } catch (error: any) {
      setPurchaseError(error.message || "Failed to update storage plan.");
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const validFiles: File[] = [];
    Array.from(files).forEach((file) => {
      if (file.size > 100 * 1024 * 1024) {
        setUploadError(`File ${file.name} exceeds 100MB limit.`);
      } else {
        validFiles.push(file);
      }
    });
    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAssetFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("server", "auto");
    const response = await apiFetch("/api/upload/asset", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || "Failed to upload asset");
    }
    return data.secureUrl || data.url;
  };

  const handleIconFiles = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];
    setAppIcon({ url: "", uploading: true });
    try {
      const uploadedUrl = await uploadAssetFile(file);
      setAppIcon({ url: uploadedUrl, uploading: false });
    } catch (error: any) {
      console.error("Icon upload failed:", error);
      setAppIcon(null);
      setUploadError(error.message || "Failed to upload icon");
    } finally {
      if (iconInputRef.current) {
        iconInputRef.current.value = "";
      }
    }
  };

  const generateTempId = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  };

  const handleScreenshotFiles = async (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      const tempId = generateTempId();
      setFeatureScreenshots((prev) => [
        ...prev,
        {
          id: tempId,
          title: file.name.replace(/\.[^/.]+$/, ""),
          description: "",
          url: "",
          uploading: true,
        },
      ]);
      try {
        const uploadedUrl = await uploadAssetFile(file);
        setFeatureScreenshots((prev) =>
          prev.map((shot) => (shot.id === tempId ? { ...shot, url: uploadedUrl, uploading: false } : shot))
        );
      } catch (error: any) {
        console.error("Screenshot upload failed:", error);
        setFeatureScreenshots((prev) => prev.filter((shot) => shot.id !== tempId));
        setUploadError(error.message || "Failed to upload screenshot");
      }
    }
    if (screenshotInputRef.current) {
      screenshotInputRef.current.value = "";
    }
  };

  const updateScreenshotField = (id: string, field: "title" | "description", value: string) => {
    setFeatureScreenshots((prev) =>
      prev.map((shot) => (shot.id === id ? { ...shot, [field]: value } : shot))
    );
  };

  const removeScreenshot = (id: string) => {
    setFeatureScreenshots((prev) => prev.filter((shot) => shot.id !== id));
  };

  const serializeScreenshots = () =>
    featureScreenshots
      .filter((shot) => shot.url && !shot.uploading)
      .map((shot) => ({
        title: shot.title?.trim() || undefined,
        description: shot.description?.trim() || undefined,
        url: shot.url,
      }));

  const getFileIcon = (category: UploadCategory) => {
    switch (category) {
      case "video":
        return Video;
      case "image":
        return ImageIcon;
      case "audio":
        return Music;
      case "apk":
        return Smartphone;
      default:
        return FileText;
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFiles.length) {
      setUploadError("Please select at least one file to upload.");
      return;
    }
    if (!uploadForm.title) {
      setUploadError("Please provide a title for your upload.");
      return;
    }

    setUploading(true);
    setUploadError("");
    setUploadMessage("");

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("title", uploadForm.title);
      formData.append("description", uploadForm.description);
      formData.append("category", uploadForm.category);
      formData.append("type", uploadForm.type);
      formData.append("tags", uploadForm.tags);
      formData.append("isPremium", JSON.stringify(uploadForm.isPremium));
      formData.append("creatorName", currentUser?.displayName || currentUser?.email || "Creator");
      formData.append("creatorEmail", currentUser?.email || "");
      if (creatorProfile?.id) {
        formData.append("creatorId", creatorProfile.id);
      }
      formData.append("server", "auto");

      // Add APK-specific fields
      if (uploadForm.category === "apk") {
        if (appIcon?.url) {
          formData.append("iconUrl", appIcon.url);
        }
        formData.append("showScreenshots", showScreenshotsToggle ? "true" : "false");
        const serializedScreens = serializeScreenshots();
        if (serializedScreens.length > 0) {
          formData.append("featureScreenshots", JSON.stringify(serializedScreens));
        }
      }

      // detect resource type from first file
      const firstFile = selectedFiles[0];
      let resourceType = "auto";
      if (firstFile.type.startsWith("image/")) resourceType = "image";
      else if (firstFile.type.startsWith("video/")) resourceType = "video";
      else if (firstFile.type.startsWith("audio/")) resourceType = "raw";
      else if (
        firstFile.name.toLowerCase().endsWith(".apk") ||
        firstFile.name.toLowerCase().endsWith(".xapk") ||
        firstFile.type === "application/vnd.android.package-archive"
      )
        resourceType = "raw";
      formData.append("resource_type", resourceType);

      const response = await apiFetch("/api/upload/file", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.error ||
            error.message ||
            (error.remainingBytes === 0
              ? "Storage limit reached. Please upgrade your plan."
              : "Upload failed")
        );
      }

      const result = await response.json();
      setUploadMessage(`Uploaded ${result.files.length} file(s). We'll review and publish them shortly.`);
      setSelectedFiles([]);
      setUploadForm((prev) => ({
        ...prev,
        title: "",
        description: "",
        type: "",
        tags: "",
        isPremium: false,
      }));
    } catch (error: any) {
      setUploadError(error.message || "Failed to upload files. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const creatorName = currentUser?.displayName || currentUser?.email || "Creator";

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 sm:py-12 px-4 sm:px-6">
        <div className="container mx-auto max-w-5xl space-y-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Creator Portal</p>
                <h1 className="text-3xl font-bold">Welcome back, {creatorName} 👋</h1>
              </div>
              {statusBadge}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border border-border bg-white dark:bg-slate-900">
                <p className="text-xs text-muted-foreground mb-1">Account Status</p>
                <p className="font-semibold capitalize">{isApproved ? "Approved" : status}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {isApproved ? "You can upload new media anytime." : "Waiting for admin review."}
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-white dark:bg-slate-900">
                <p className="text-xs text-muted-foreground mb-1">Uploads</p>
                <p className="font-semibold">{isApproved ? "Unlimited" : "Locked"}</p>
                <p className="text-xs text-muted-foreground mt-2">Upload limit: 100MB per file</p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-white dark:bg-slate-900">
                <p className="text-xs text-muted-foreground mb-1">Last Update</p>
                <p className="font-semibold">
                  {creatorProfile?.updatedAt ? new Date(creatorProfile.updatedAt).toLocaleDateString() : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-2">Admin will contact you via email</p>
              </div>
            </div>
          </div>

          {creatorProfile && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Submission stats</p>
                  <h3 className="text-xl font-semibold mt-1">Your uploads overview</h3>
                  <p className="text-xs text-muted-foreground">
                    Track how many assets you’ve published and when admins last reviewed your account.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      loadCreatorStats();
                      if (currentUser?.email) {
                        refreshCreatorProfile(currentUser.email).catch(() => {});
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Loader2 className={`w-3 h-3 ${statsLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>
              </div>
              {statsError && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {statsError}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border border-border bg-slate-50 dark:bg-slate-900/40">
                  <p className="text-xs text-muted-foreground mb-1">Total uploads</p>
                  <p className="text-2xl font-semibold">
                    {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : creatorStats.totalUploads}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Published on FreeMediaBuzz</p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-slate-50 dark:bg-slate-900/40">
                  <p className="text-xs text-muted-foreground mb-1">Pending reviews</p>
                  <p className="text-2xl font-semibold">
                    {creatorProfile.status === "pending" ? "Awaiting approval" : "0"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {creatorProfile.status === "pending"
                      ? "Admin team is reviewing your creator access."
                      : "All uploads approved."}
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-slate-50 dark:bg-slate-900/40">
                  <p className="text-xs text-muted-foreground mb-1">Last review</p>
                  <p className="text-2xl font-semibold">
                    {creatorStats.lastUploadDate
                      ? new Date(creatorStats.lastUploadDate).toLocaleDateString()
                      : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {creatorStats.lastUploadDate ? "Most recent published upload" : "No uploads yet"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {creatorProfile && pendingManualPurchase && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/40 rounded-2xl p-6 space-y-2">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-100 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Manual payment under review
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-100">
                We received your bKash send-money request ({pendingManualPurchase.senderNumber}). Admins are verifying
                transaction ID <span className="font-semibold">{pendingManualPurchase.reference}</span>. Storage will be
                added as soon as it is approved.
              </p>
            </div>
          )}

          {creatorProfile && rejectedManualPurchases.length > 0 && (
            <div className="bg-destructive/5 border border-destructive/30 rounded-2xl p-6 space-y-3">
              <p className="text-sm font-semibold text-destructive">Manual payment could not be verified</p>
              {rejectedManualPurchases.slice(-2).map((purchase) => (
                <div key={purchase.id} className="text-sm bg-white/60 dark:bg-slate-900/40 rounded-lg border border-destructive/20 p-3">
                  <p>
                    Transaction <span className="font-semibold">{purchase.reference}</span> from{" "}
                    <span className="font-semibold">{purchase.senderNumber}</span> was rejected.
                  </p>
                  {purchase.adminNote && <p className="text-xs text-muted-foreground mt-1">Reason: {purchase.adminNote}</p>}
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Please double-check the transaction details and submit a new request if needed.
              </p>
            </div>
          )}

          {creatorProfile && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Storage usage</p>
                  <h3 className="text-2xl font-semibold mt-1">
                    {storageUsedGb.toFixed(2)} GB / {totalStorageGb.toFixed(2)} GB
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {remainingGb <= 0
                      ? "Storage exhausted. Upgrade to continue uploading."
                      : `${remainingGb.toFixed(2)} GB remaining`}
                  </p>
                  {bonusActive && creatorProfile.storageBonusExpiresAt && (
                    <p className="text-xs text-primary mt-1">
                      +{creatorProfile.storageBonusGb} GB bonus until{" "}
                      {new Date(creatorProfile.storageBonusExpiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Includes complimentary 1GB tier.</p>
                  <p>Upgrade to unlock more uploads each month.</p>
                </div>
              </div>
              <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    remainingGb <= 0 ? "bg-destructive" : "bg-gradient-to-r from-primary to-accent"
                  }`}
                  style={{ width: `${Math.min(storagePercent, 100)}%` }}
                ></div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/40 border border-dashed border-border rounded-xl p-4 space-y-4" data-storage-upgrade>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold">Upgrade storage</p>
                    <p className="text-xs text-muted-foreground">
                      Select plan (৳/month) and duration in months. Billing is simulated for now.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                    1GB free tier included
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="text-sm font-medium flex flex-col gap-2">
                    Plan
                    <select
                      className="rounded-lg border border-border bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                      value={selectedPlanGb}
                      onChange={(e) => setSelectedPlanGb(Number(e.target.value))}
                    >
                      {STORAGE_PLANS.map((plan) => (
                        <option key={plan.gb} value={plan.gb}>
                          {plan.gb} GB (৳{plan.price}/month)
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium flex flex-col gap-2">
                    Duration
                    <select
                      className="rounded-lg border border-border bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                      value={selectedMonths}
                      onChange={(e) => setSelectedMonths(Number(e.target.value))}
                    >
                      {STORAGE_DURATION_OPTIONS.map((monthsOption) => (
                        <option key={monthsOption} value={monthsOption}>
                          {monthsOption} months
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="text-sm font-medium">
                    Total due
                    <p className="text-2xl font-semibold mt-1">
                      ৳
                      {(
                        (STORAGE_PLANS.find((plan) => plan.gb === selectedPlanGb)?.price || 0) * selectedMonths
                      ).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Manual renewal. No auto-charge.</p>
                  </div>
                </div>

                <div className="rounded-lg border border-amber-300 bg-amber-50/60 dark:bg-amber-900/20 p-3 text-xs text-amber-800 dark:text-amber-100 space-y-2">
                  <p className="font-semibold">Manual payment steps</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>
                      Send <span className="font-semibold">৳{(STORAGE_PLANS.find((p) => p.gb === selectedPlanGb)?.price || 0) * selectedMonths}</span>{" "}
                      via <strong>Send Money</strong> to personal bKash number{" "}
                      <span className="font-semibold">{paymentSettings.bkashPersonal}</span>.
                    </li>
                    <li>Enter the bKash number you sent from and the transaction ID below.</li>
                    <li>Admin will verify the payment and activate the extra storage.</li>
                  </ol>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    <label className="text-sm font-medium flex flex-col gap-1">
                      Your bKash number
                      <input
                        type="tel"
                        value={manualSender}
                        onChange={(e) => setManualSender(e.target.value)}
                        placeholder="e.g., 01XXXXXXXXX"
                        className="rounded-lg border border-border px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </label>
                    <label className="text-sm font-medium flex flex-col gap-1">
                      Transaction ID
                      <input
                        type="text"
                        value={manualTxnId}
                        onChange={(e) => setManualTxnId(e.target.value)}
                        placeholder="e.g., B9X123ABC"
                        className="rounded-lg border border-border px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                      />
                    </label>
                  </div>
                </div>

                {purchaseError && (
                  <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                    {purchaseError}
                  </p>
                )}
                {purchaseSuccess && (
                  <p className="text-sm text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                    {purchaseSuccess}
                  </p>
                )}

                <button
                  onClick={handleStoragePurchase}
                  disabled={purchaseLoading}
                  className="w-full md:w-auto px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-primary to-accent text-white flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {purchaseLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Buy storage
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Storage Purchase History */}
          {creatorProfile && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <History className="w-4 h-4 text-primary" />
                    Storage Purchase History
                  </div>
                  <h3 className="text-xl font-semibold">Complete Purchase History</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    View all your storage purchases, expiry dates, and renewal options
                  </p>
                </div>
              </div>

              {!creatorProfile.storagePurchaseHistory || creatorProfile.storagePurchaseHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No storage purchases yet</p>
                  <p className="text-xs mt-1">Your purchases will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {creatorProfile.storagePurchaseHistory
                    .sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime())
                    .map((purchase) => {
                      const purchaseDate = new Date(purchase.purchasedAt);
                      const expiryDate = purchase.expiresAt ? new Date(purchase.expiresAt) : null;
                      const now = new Date();
                      const isExpired = expiryDate ? expiryDate < now : false;
                      const isActive = purchase.status === "completed" && !isExpired;
                      const daysUntilExpiry = expiryDate
                        ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                        : null;
                      const showRenewButton = expiryDate && daysUntilExpiry !== null && daysUntilExpiry <= 3 && isActive;

                      // Calculate duration in days
                      const durationDays = purchase.months * 30;

                      return (
                        <div
                          key={purchase.id}
                          className={`rounded-lg border p-4 ${
                            isExpired
                              ? "opacity-60 border-muted bg-slate-50 dark:bg-slate-900/40"
                              : isActive
                              ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10"
                              : "border-border"
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Storage Amount</p>
                                <p className="font-semibold text-sm">{purchase.gb} GB</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Duration</p>
                                <p className="font-semibold text-sm">
                                  {durationDays} days / {purchase.months} month{purchase.months !== 1 ? "s" : ""}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Purchase Date</p>
                                <p className="font-semibold text-sm flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {purchaseDate.toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Expiry Date</p>
                                <p
                                  className={`font-semibold text-sm flex items-center gap-1 ${
                                    isExpired ? "text-destructive" : ""
                                  }`}
                                >
                                  <Clock className="w-3 h-3" />
                                  {expiryDate
                                    ? expiryDate.toLocaleDateString("en-GB", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })
                                    : "N/A"}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={`px-3 py-1 text-xs rounded-full font-semibold ${
                                  isActive
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : isExpired
                                    ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                    : purchase.status === "pending"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                }`}
                              >
                                {isActive ? "Active" : isExpired ? "Expired" : purchase.status}
                              </span>
                              {showRenewButton && (
                                <button
                                  onClick={() => {
                                    // Scroll to upgrade section
                                    const upgradeSection = document.querySelector('[data-storage-upgrade]');
                                    if (upgradeSection) {
                                      upgradeSection.scrollIntoView({ behavior: "smooth", block: "start" });
                                    }
                                  }}
                                  className="px-3 py-1.5 text-xs rounded-lg border border-primary text-primary hover:bg-primary/10 transition-colors flex items-center gap-1"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  Renew Storage
                                </button>
                              )}
                              {daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 3 && isActive && (
                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                  Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? "s" : ""}
                                </p>
                              )}
                            </div>
                          </div>
                          {purchase.paymentMethod === "manual" && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-xs text-muted-foreground">
                                Payment Method: <span className="font-semibold">Manual (bKash)</span>
                                {purchase.reference && (
                                  <>
                                    {" "}
                                    • Transaction ID: <span className="font-mono">{purchase.reference}</span>
                                  </>
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {!creatorProfile ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-border p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-10 h-10 text-primary flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-semibold">Admin-managed creator access</h2>
                  <p className="text-sm text-muted-foreground">
                    Creator profiles are provisioned directly from the admin panel. Reach out to an admin and they will enable uploads for your account.
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-border/60 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">What happens next?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Your existing login works as usual.</li>
                  <li>An admin verifies your details and toggles creator access.</li>
                  <li>Once verified, the upload studio below unlocks automatically.</li>
                </ul>
              </div>
              {accessRequestMessage && (
                <p className="text-sm text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                  {accessRequestMessage}
                </p>
              )}
              {accessRequestError && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {accessRequestError}
                </p>
              )}
              <button
                onClick={handleCreatorAccessRequest}
                disabled={accessRequestLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                {accessRequestLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting request...
                  </>
                ) : (
                  <>
                    Request creator access
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : isPending ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-amber-300 p-6 sm:p-8 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Verification in progress</h2>
                  <p className="text-sm text-muted-foreground">An admin is reviewing your creator access. You'll be notified once it's approved.</p>
                </div>
              </div>
              <button
                onClick={() => currentUser?.email && refreshCreatorProfile(currentUser.email)}
                className="self-start px-4 py-2 text-sm rounded-lg border border-border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <Loader2 className="w-4 h-4" />
                Refresh Status
              </button>
            </div>
          ) : status === "rejected" ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-destructive/40 p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-10 h-10 text-destructive" />
                <div>
                  <h2 className="text-xl font-semibold">Creator access needs attention</h2>
                  <p className="text-sm text-muted-foreground">
                    Admins have paused your creator uploads. Please follow up with the team for next steps.
                  </p>
                </div>
              </div>
              {creatorProfile?.message && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  <p className="font-semibold mb-1">Latest note</p>
                  <p>{creatorProfile.message}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => currentUser?.email && refreshCreatorProfile(currentUser.email)}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm"
                >
                  <Loader2 className="w-4 h-4" />
                  Recheck status
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Upload Studio</p>
                  <h2 className="text-2xl font-semibold">Share your next drop</h2>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CloudUploadIcon />
                  Review time: under 6 hours
                </div>
              </div>

              {uploadError && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 text-destructive px-4 py-2 text-sm">
                  {uploadError}
                </div>
              )}
              {uploadMessage && (
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300 px-4 py-2 text-sm">
                  {uploadMessage}
                </div>
              )}

              <div className="border border-dashed border-border rounded-xl p-6 bg-slate-50 dark:bg-slate-900/40 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="font-semibold">Drag & drop files</p>
                  <p className="text-sm text-muted-foreground">
                    Supported: images, videos, audio, templates, APK/XAPK (max 100MB per file)
                  </p>
                  <label
                    htmlFor="creator-files"
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold cursor-pointer"
                  >
                    Select files
                    <input
                      id="creator-files"
                      type="file"
                      className="hidden"
                      multiple
                      onChange={(e) => handleFileSelect(e.target.files)}
                      accept="image/*,video/*,audio/*,application/vnd.android.package-archive,.apk,.xapk"
                    />
                  </label>
                </div>
                {selectedFiles.length > 0 && (
                  <div className="mt-4 text-left space-y-2 max-h-60 overflow-auto">
                    {selectedFiles.map((file, index) => {
                      const Icon = getFileIcon(uploadForm.category);
                      return (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between rounded-lg border border-border bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4 text-primary" />
                            <div className="max-w-[200px] truncate">
                              <p className="font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <form className="space-y-4" onSubmit={handleUploadSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Title</label>
                    <input
                      type="text"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm((prev) => ({ ...prev, title: e.target.value }))}
                      required
                      placeholder="Name your upload"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Category</label>
                    <select
                      value={uploadForm.category}
                      onChange={(e) =>
                        setUploadForm((prev) => ({ ...prev, category: e.target.value as UploadCategory }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-border bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    >
                      {categoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Resolution / Format</label>
                    <input
                      type="text"
                      value={uploadForm.type}
                      onChange={(e) => setUploadForm((prev) => ({ ...prev, type: e.target.value }))}
                      placeholder="e.g., 4K, PSD, APK 1.2.0"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Tags</label>
                    <input
                      type="text"
                      value={uploadForm.tags}
                      onChange={(e) => setUploadForm((prev) => ({ ...prev, tags: e.target.value }))}
                      placeholder="cinematic, ui kit, chill"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
                    placeholder="What makes this upload special?"
                  />
                </div>
                {uploadForm.category === "apk" && (
                  <div className="space-y-4 rounded-lg border border-dashed border-border p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="flex-1 space-y-3">
                        <label className="block text-sm font-medium">App Icon</label>
                        <p className="text-xs text-muted-foreground">
                          Upload a square icon (PNG/JPG). Recommended size 512x512.
                        </p>
                        <div
                          onClick={() => iconInputRef.current?.click()}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleIconFiles(e.dataTransfer.files);
                          }}
                          className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary transition-colors"
                        >
                          {appIcon?.url ? (
                            <div className="relative">
                              <img
                                src={appIcon.url}
                                alt="App icon preview"
                                className="w-20 h-20 rounded-2xl object-cover border border-border"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAppIcon(null);
                                }}
                                className="absolute -top-2 -right-2 bg-white text-destructive rounded-full p-1 shadow"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <ImageIcon className="w-8 h-8 text-muted-foreground" />
                              <p className="text-sm font-semibold">Drag & drop or click to upload</p>
                            </>
                          )}
                          {appIcon?.uploading && <p className="text-xs text-muted-foreground">Uploading icon...</p>}
                          <input
                            ref={iconInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleIconFiles(e.target.files)}
                          />
                        </div>
                      </div>
                      <div className="flex-1 space-y-3">
                        <label className="block text-sm font-medium">Display Screenshots</label>
                        <p className="text-xs text-muted-foreground">
                          Toggle to control whether screenshots appear on the user download page.
                        </p>
                        <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold">Show screenshots</p>
                            <p className="text-xs text-muted-foreground">
                              Users will see these screenshots below the download button.
                            </p>
                          </div>
                          <Switch checked={showScreenshotsToggle} onCheckedChange={setShowScreenshotsToggle} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium">Feature Screenshots</h4>
                          <p className="text-xs text-muted-foreground">
                            Upload multiple screenshots to showcase app features.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => screenshotInputRef.current?.click()}
                          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <Upload className="w-4 h-4" />
                          Upload Images
                        </button>
                        <input
                          ref={screenshotInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleScreenshotFiles(e.target.files)}
                        />
                      </div>
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleScreenshotFiles(e.dataTransfer.files);
                        }}
                        className="border-2 border-dashed border-border rounded-xl p-4 min-h-[100px] flex flex-col items-center justify-center gap-2"
                      >
                        {featureScreenshots.length === 0 ? (
                          <>
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Drag & drop screenshots here or click Upload Images</p>
                          </>
                        ) : (
                          <div className="w-full space-y-3">
                            {featureScreenshots.map((shot) => (
                              <div key={shot.id} className="flex gap-3 p-3 border border-border rounded-lg">
                                {shot.url ? (
                                  <img src={shot.url} alt={shot.title} className="w-20 h-20 object-cover rounded-lg" />
                                ) : (
                                  <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                                    {shot.uploading ? (
                                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                    ) : (
                                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                    )}
                                  </div>
                                )}
                                <div className="flex-1 space-y-2">
                                  <input
                                    type="text"
                                    value={shot.title}
                                    onChange={(e) => updateScreenshotField(shot.id, "title", e.target.value)}
                                    placeholder="Screenshot title (optional)"
                                    className="w-full px-2 py-1 text-sm rounded border border-border bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                                  />
                                  <textarea
                                    value={shot.description}
                                    onChange={(e) => updateScreenshotField(shot.id, "description", e.target.value)}
                                    placeholder="Description (optional)"
                                    rows={2}
                                    className="w-full px-2 py-1 text-sm rounded border border-border bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeScreenshot(shot.id)}
                                  className="text-muted-foreground hover:text-destructive transition-colors"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={uploadForm.isPremium}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, isPremium: e.target.checked }))}
                    className="w-4 h-4 rounded border-border"
                  />
                  Offer as premium download
                </label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    All uploads are reviewed by moderators before they go live.
                  </p>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-semibold flex items-center gap-2 disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        Publish Upload
                        <Upload className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function CloudUploadIcon() {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
      <Upload className="w-4 h-4" />
      Smart CDN
    </span>
  );
}

