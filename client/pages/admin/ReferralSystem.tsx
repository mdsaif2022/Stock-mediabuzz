import AdminLayout from "@/components/AdminLayout";
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { apiFetch } from "@/lib/api";
import { SharePost, ReferralRecord, ShareRecord, WithdrawRequest, Ad, AdViewRecord, CreateAdRequest } from "@shared/api";
import { Plus, Edit, Trash2, Check, X, DollarSign, Users, Share2, ExternalLink, Copy, CheckCircle, XCircle, Clock, Image as ImageIcon, Video, Upload, X as XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminReferralSystem() {
  const [activeTab, setActiveTab] = useState<"share-posts" | "referrals" | "shares" | "withdraws" | "ads">("share-posts");
  const [sharePosts, setSharePosts] = useState<SharePost[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [shareRecords, setShareRecords] = useState<ShareRecord[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [adViews, setAdViews] = useState<AdViewRecord[]>([]);
  const [showAddAdModal, setShowAddAdModal] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [adFormData, setAdFormData] = useState<CreateAdRequest>({
    title: "",
    adType: "collaboration",
    adUrl: "",
    status: "active",
    minCoins: 1,
    maxCoins: 50,
    watchDuration: 15,
  });
  const [loading, setLoading] = useState(true);
  const [showAddPostModal, setShowAddPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState<SharePost | null>(null);
  const [formData, setFormData] = useState({ 
    title: "", 
    url: "", 
    coinValue: 100, 
    status: "active" as "active" | "inactive", 
    imageUrl: "", 
    videoUrl: "",
    showAsPopup: false,
    showDelay: 2000,
    closeAfter: undefined as number | undefined,
    maxDisplays: undefined as number | undefined
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [videoPreview, setVideoPreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "share-posts") {
        const res = await apiFetch("/api/admin/share-posts");
        const data = await res.json();
        setSharePosts(data.data || []);
      } else if (activeTab === "referrals") {
        const res = await apiFetch("/api/admin/referrals");
        const data = await res.json();
        setReferrals(data.data || []);
      } else if (activeTab === "shares") {
        const res = await apiFetch("/api/admin/share-records");
        const data = await res.json();
        setShareRecords(data.data || []);
      } else if (activeTab === "withdraws") {
        const res = await apiFetch("/api/admin/withdraw-requests");
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: "Failed to fetch withdraw requests" }));
          throw new Error(errorData.error || "Failed to fetch withdraw requests");
        }
        const data = await res.json();
        console.log("Withdraw requests data:", data);
        setWithdrawRequests(data.data || []);
      } else if (activeTab === "ads") {
        const [adsRes, viewsRes] = await Promise.all([
          apiFetch("/api/admin/ads"),
          apiFetch("/api/admin/ad-views"),
        ]);
        const adsData = await adsRes.json();
        const viewsData = await viewsRes.json();
        setAds(adsData.data || []);
        setAdViews(viewsData.data || []);
      }
    } catch (error: any) {
      console.error("Failed to fetch data:", error);
      alert(`Failed to load data: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      throw new Error(data?.message || "Failed to upload file");
    }
    return data.secureUrl || data.url;
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const uploadedUrl = await uploadAssetFile(file);
      setFormData({ ...formData, imageUrl: uploadedUrl });
      setImagePreview(uploadedUrl);
      setImageFile(null);
    } catch (error: any) {
      console.error("Image upload failed:", error);
      alert(error.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleVideoUpload = async (file: File) => {
    setUploadingVideo(true);
    try {
      const uploadedUrl = await uploadAssetFile(file);
      setFormData({ ...formData, videoUrl: uploadedUrl });
      setVideoPreview(uploadedUrl);
      setVideoFile(null);
    } catch (error: any) {
      console.error("Video upload failed:", error);
      alert(error.message || "Failed to upload video");
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const handleCreatePost = async () => {
    if (!formData.title || !formData.url || !formData.coinValue) {
      alert("Please fill in all required fields");
      return;
    }

    // Upload image if selected
    let imageUrl = formData.imageUrl;
    if (imageFile) {
      try {
        setUploadingImage(true);
        imageUrl = await uploadAssetFile(imageFile);
      } catch (error: any) {
        alert(error.message || "Failed to upload image");
        return;
      } finally {
        setUploadingImage(false);
      }
    }

    // Upload video if selected
    let videoUrl = formData.videoUrl;
    if (videoFile) {
      try {
        setUploadingVideo(true);
        videoUrl = await uploadAssetFile(videoFile);
      } catch (error: any) {
        alert(error.message || "Failed to upload video");
        return;
      } finally {
        setUploadingVideo(false);
      }
    }
    
    try {
      const response = await apiFetch("/api/admin/share-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, imageUrl, videoUrl }),
      });
      if (response.ok) {
        alert("Share post created successfully!");
        setShowAddPostModal(false);
        resetForm();
        fetchData();
      } else {
        const error = await response.json();
        alert(`Failed to create share post: ${error.error || "Unknown error"}`);
      }
    } catch (error: any) {
      console.error("Failed to create post:", error);
      alert(`Failed to create share post: ${error.message || "Unknown error"}`);
    }
  };

  const resetForm = () => {
    setFormData({ 
      title: "", 
      url: "", 
      coinValue: 100, 
      status: "active" as "active" | "inactive", 
      imageUrl: "", 
      videoUrl: "",
      showAsPopup: false,
      showDelay: 2000,
      closeAfter: undefined,
      maxDisplays: undefined
    });
    setImageFile(null);
    setVideoFile(null);
    setImagePreview("");
    setVideoPreview("");
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;
    if (!formData.title || !formData.url || !formData.coinValue) {
      alert("Please fill in all required fields");
      return;
    }

    // Upload image if new file selected
    let imageUrl = formData.imageUrl;
    if (imageFile) {
      try {
        setUploadingImage(true);
        imageUrl = await uploadAssetFile(imageFile);
      } catch (error: any) {
        alert(error.message || "Failed to upload image");
        return;
      } finally {
        setUploadingImage(false);
      }
    }

    // Upload video if new file selected
    let videoUrl = formData.videoUrl;
    if (videoFile) {
      try {
        setUploadingVideo(true);
        videoUrl = await uploadAssetFile(videoFile);
      } catch (error: any) {
        alert(error.message || "Failed to upload video");
        return;
      } finally {
        setUploadingVideo(false);
      }
    }
    
    try {
      const response = await apiFetch(`/api/admin/share-posts/${editingPost.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, imageUrl, videoUrl }),
      });
      if (response.ok) {
        alert("Share post updated successfully!");
        setEditingPost(null);
        resetForm();
        setShowAddPostModal(false);
        fetchData();
      } else {
        const error = await response.json();
        alert(`Failed to update share post: ${error.error || "Unknown error"}`);
      }
    } catch (error: any) {
      console.error("Failed to update post:", error);
      alert(`Failed to update share post: ${error.message || "Unknown error"}`);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this share post? This action cannot be undone.")) return;
    try {
      const response = await apiFetch(`/api/admin/share-posts/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        alert("Share post deleted successfully!");
        fetchData();
      } else {
        const error = await response.json();
        alert(`Failed to delete share post: ${error.error || "Unknown error"}`);
      }
    } catch (error: any) {
      console.error("Failed to delete post:", error);
      alert(`Failed to delete share post: ${error.message || "Unknown error"}`);
    }
  };

  const handleUpdateStatus = async (
    type: "referral" | "share" | "withdraw",
    id: string,
    status: "approved" | "rejected",
    note?: string
  ) => {
    if (!confirm(`Are you sure you want to ${status} this ${type}?`)) return;
    
    try {
      const endpoint = type === "referral" 
        ? `/api/admin/referrals/${id}`
        : type === "share"
        ? `/api/admin/share-records/${id}`
        : `/api/admin/withdraw-requests/${id}`;
      
      const response = await apiFetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote: note || "" }),
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} ${status} successfully!`);
        fetchData();
      } else {
        const error = await response.json();
        alert(`Failed to update status: ${error.error || "Unknown error"}`);
      }
    } catch (error: any) {
      console.error("Failed to update status:", error);
      alert(`Failed to update status: ${error.message || "Unknown error"}`);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("Copied to clipboard!");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Referral & Sharing System</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab("share-posts")}
            className={cn(
              "px-4 py-2 font-medium transition-colors",
              activeTab === "share-posts"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Share Posts
          </button>
          <button
            onClick={() => setActiveTab("referrals")}
            className={cn(
              "px-4 py-2 font-medium transition-colors",
              activeTab === "referrals"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Referrals
          </button>
          <button
            onClick={() => setActiveTab("shares")}
            className={cn(
              "px-4 py-2 font-medium transition-colors",
              activeTab === "shares"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Share Records
          </button>
          <button
            onClick={() => setActiveTab("withdraws")}
            className={cn(
              "px-4 py-2 font-medium transition-colors",
              activeTab === "withdraws"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Withdraw Requests
          </button>
          <button
            onClick={() => setActiveTab("ads")}
            className={cn(
              "px-4 py-2 font-medium transition-colors",
              activeTab === "ads"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Ads
          </button>
        </div>

        {/* Share Posts Tab */}
        {activeTab === "share-posts" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setEditingPost(null);
                  resetForm();
                  setShowAddPostModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
                Add Share Post
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : sharePosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No share posts found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '10%' }}>Preview</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '20%' }}>Title</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '25%' }}>URL</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '10%' }}>Coin Value</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '10%' }}>Status</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '10%' }}>Pop-up</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '10%' }}>Created</th>
                      <th className="px-4 py-3 text-right text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '5%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sharePosts.map((post) => (
                      <tr key={post.id} className="border-b border-border hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="px-4 py-3" style={{ width: '10%' }}>
                          {post.imageUrl ? (
                            <img src={post.imageUrl} alt={post.title} className="w-16 h-16 object-cover rounded" />
                          ) : post.videoUrl ? (
                            <video src={post.videoUrl} className="w-16 h-16 object-cover rounded" muted />
                          ) : (
                            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-slate-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 truncate" style={{ width: '20%' }} title={post.title}>{post.title}</td>
                        <td className="px-4 py-3" style={{ width: '25%' }}>
                          <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 min-w-0">
                            <span className="truncate block">{post.url}</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ width: '10%' }}>{post.coinValue} coins</td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ width: '10%' }}>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs",
                            post.status === "active" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                          )}>
                            {post.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ width: '10%' }}>
                          {post.showAsPopup ? (
                            <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 flex items-center gap-1 w-fit">
                              <Share2 className="w-3 h-3" />
                              Enabled
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ width: '10%' }}>{new Date(post.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap" style={{ width: '5%' }}>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingPost(post);
                                setFormData({ 
                                  title: post.title, 
                                  url: post.url, 
                                  coinValue: post.coinValue, 
                                  status: post.status, 
                                  imageUrl: post.imageUrl || "", 
                                  videoUrl: post.videoUrl || "",
                                  showAsPopup: post.showAsPopup || false,
                                  showDelay: post.showDelay || 2000,
                                  closeAfter: post.closeAfter,
                                  maxDisplays: post.maxDisplays
                                });
                                setImagePreview(post.imageUrl || "");
                                setVideoPreview(post.videoUrl || "");
                                setImageFile(null);
                                setVideoFile(null);
                                setShowAddPostModal(true);
                              }}
                              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === "referrals" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : referrals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No referrals found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '25%' }}>Referrer</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '25%' }}>Referred User</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '10%' }}>Coins</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '15%' }}>Status</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '15%' }}>Date</th>
                      <th className="px-4 py-3 text-right text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '10%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((ref: any) => (
                      <tr key={ref.id} className="border-b border-border hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="px-4 py-3" style={{ width: '25%' }}>
                          <div className="font-medium truncate" title={ref.referrerName || ref.referrerId}>{ref.referrerName || ref.referrerId}</div>
                          <div className="text-sm text-muted-foreground truncate" title={ref.referrerEmail || ref.referrerId}>{ref.referrerEmail || ref.referrerId}</div>
                        </td>
                        <td className="px-4 py-3" style={{ width: '25%' }}>
                          <div className="font-medium truncate" title={ref.referredName || ref.referredId}>{ref.referredName || ref.referredId}</div>
                          <div className="text-sm text-muted-foreground truncate" title={ref.referredEmail || ref.referredId}>{ref.referredEmail || ref.referredId}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ width: '10%' }}>{ref.coinsEarned} coins</td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ width: '15%' }}>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs",
                            ref.status === "approved" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                            ref.status === "rejected" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          )}>
                            {ref.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ width: '15%' }}>{new Date(ref.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap" style={{ width: '10%' }}>
                          <div className="flex justify-end gap-2">
                            {ref.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus("referral", ref.id, "approved")}
                                  className="p-2 hover:bg-green-100 dark:hover:bg-green-900 rounded text-green-600 dark:text-green-400"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus("referral", ref.id, "rejected")}
                                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Share Records Tab */}
        {activeTab === "shares" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : shareRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No share records found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '20%' }}>User</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '12%' }}>Type</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '25%' }}>Link</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '10%' }}>Registrations</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '10%' }}>Coins</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '10%' }}>Status</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '10%' }}>Date</th>
                      <th className="px-4 py-3 text-right text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '3%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shareRecords.map((record: any) => (
                      <tr key={record.id} className="border-b border-border hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="px-4 py-3" style={{ width: '20%' }}>
                          <div className="font-medium truncate" title={record.userName || record.userId}>{record.userName || record.userId}</div>
                          <div className="text-sm text-muted-foreground truncate" title={record.userEmail || record.userId}>{record.userEmail || record.userId}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ width: '12%' }}>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs",
                            record.shareType === "admin_post" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                            "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                          )}>
                            {record.shareType === "admin_post" ? "Admin Post" : "Normal Link"}
                          </span>
                        </td>
                        <td className="px-4 py-3" style={{ width: '25%' }}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate block" title={record.shareLink}>{record.shareLink}</span>
                            <button onClick={() => copyToClipboard(record.shareLink)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded flex-shrink-0">
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ width: '10%' }}>{record.registrationCount}</td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ width: '10%' }}>{record.coinsEarned} coins</td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ width: '10%' }}>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs",
                            record.status === "approved" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                            record.status === "rejected" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          )}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ width: '10%' }}>{new Date(record.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap" style={{ width: '3%' }}>
                          <div className="flex justify-end gap-2">
                            {record.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus("share", record.id, "approved")}
                                  className="p-2 hover:bg-green-100 dark:hover:bg-green-900 rounded text-green-600 dark:text-green-400"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus("share", record.id, "rejected")}
                                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Withdraw Requests Tab */}
        {activeTab === "withdraws" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : withdrawRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No withdraw requests found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '25%' }}>User</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '12%' }}>Coins</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '12%' }}>Amount (BDT)</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '15%' }}>bKash Number</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '12%' }}>Status</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '12%' }}>Date</th>
                      <th className="px-4 py-3 text-right text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '12%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawRequests.map((request: any) => (
                      <tr key={request.id} className="border-b border-border hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="px-4 py-3" style={{ width: '25%' }}>
                          <div className="font-medium truncate" title={request.userName || request.userId}>{request.userName || request.userId}</div>
                          <div className="text-sm text-muted-foreground truncate" title={request.userEmail || request.userId}>{request.userEmail || request.userId}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ width: '12%' }}>{request.coins.toLocaleString()} coins</td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ width: '12%' }}>{request.amountBdt.toFixed(2)} BDT</td>
                        <td className="px-4 py-3 truncate" style={{ width: '15%' }} title={request.bkashNumber}>{request.bkashNumber}</td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ width: '12%' }}>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs",
                            request.status === "approved" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                            request.status === "rejected" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          )}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ width: '12%' }}>{new Date(request.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap" style={{ width: '12%' }}>
                          <div className="flex justify-end gap-2">
                            {request.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus("withdraw", request.id, "approved")}
                                  className="p-2 hover:bg-green-100 dark:hover:bg-green-900 rounded text-green-600 dark:text-green-400"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus("withdraw", request.id, "rejected")}
                                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Ads Tab */}
        {activeTab === "ads" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setEditingAd(null);
                  setAdFormData({
                    title: "",
                    adType: "collaboration",
                    adUrl: "",
                    status: "active",
                    minCoins: 1,
                    maxCoins: 50,
                    watchDuration: 15,
                  });
                  setShowAddAdModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
                Add Ad
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <>
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4">Ads</h2>
                  {ads.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No ads found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="px-4 py-3 text-left">Title</th>
                            <th className="px-4 py-3 text-left">Type</th>
                            <th className="px-4 py-3 text-left">Coins</th>
                            <th className="px-4 py-3 text-left">Duration</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ads.map((ad) => (
                            <tr key={ad.id} className="border-b border-border">
                              <td className="px-4 py-3">{ad.title}</td>
                              <td className="px-4 py-3">
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-xs",
                                  ad.adType === "adsterra"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                )}>
                                  {ad.adType}
                                </span>
                              </td>
                              <td className="px-4 py-3">{ad.minCoins}-{ad.maxCoins}</td>
                              <td className="px-4 py-3">{ad.watchDuration}s</td>
                              <td className="px-4 py-3">
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-xs",
                                  ad.status === "active"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                                )}>
                                  {ad.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingAd(ad);
                                      setAdFormData({
                                        title: ad.title,
                                        adType: ad.adType,
                                        adUrl: ad.adUrl,
                                        adsterraId: ad.adsterraId,
                                        status: ad.status,
                                        minCoins: ad.minCoins,
                                        maxCoins: ad.maxCoins,
                                        watchDuration: ad.watchDuration,
                                      });
                                      setShowAddAdModal(true);
                                    }}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!confirm("Are you sure you want to delete this ad?")) return;
                                      try {
                                        const res = await apiFetch(`/api/admin/ads/${ad.id}`, { method: "DELETE" });
                                        if (res.ok) {
                                          alert("Ad deleted successfully!");
                                          fetchData();
                                        } else {
                                          const error = await res.json();
                                          alert(error.error || "Failed to delete ad");
                                        }
                                      } catch (error: any) {
                                        alert(error.message || "Failed to delete ad");
                                      }
                                    }}
                                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4">Ad Views</h2>
                  {adViews.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No ad views found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="px-4 py-3 text-left">User</th>
                            <th className="px-4 py-3 text-left">Ad</th>
                            <th className="px-4 py-3 text-left">Coins</th>
                            <th className="px-4 py-3 text-left">Duration</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adViews.map((view: any) => (
                            <tr key={view.id} className="border-b border-border">
                              <td className="px-4 py-3">{view.userName || view.userId}</td>
                              <td className="px-4 py-3">{view.adTitle || view.adId}</td>
                              <td className="px-4 py-3">{view.coinsEarned}</td>
                              <td className="px-4 py-3">{view.watchDuration}s</td>
                              <td className="px-4 py-3">
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-xs",
                                  view.status === "approved"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : view.status === "rejected"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                )}>
                                  {view.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">{new Date(view.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Add/Edit Ad Modal */}
        {showAddAdModal && typeof document !== 'undefined' && createPortal(
          <div className="fixed inset-0 bg-black/50 z-[9999] overflow-y-auto" onClick={() => {
            setShowAddAdModal(false);
            setEditingAd(null);
          }}>
            <div className="min-h-full flex items-start justify-center p-4 pt-20" onClick={(e) => e.stopPropagation()}>
              <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-full max-w-2xl my-8 relative z-[10000] shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">{editingAd ? "Edit Ad" : "Add Ad"}</h2>
                  <button
                    onClick={() => {
                      setShowAddAdModal(false);
                      setEditingAd(null);
                    }}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      type="text"
                      value={adFormData.title}
                      onChange={(e) => setAdFormData({ ...adFormData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Ad Type</label>
                    <select
                      value={adFormData.adType}
                      onChange={(e) => setAdFormData({ ...adFormData, adType: e.target.value as "adsterra" | "collaboration" })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800"
                    >
                      <option value="collaboration">Collaboration</option>
                      <option value="adsterra">Adsterra</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Ad URL</label>
                    <input
                      type="url"
                      value={adFormData.adUrl}
                      onChange={(e) => setAdFormData({ ...adFormData, adUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800"
                    />
                  </div>
                  {adFormData.adType === "adsterra" && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Adsterra ID (Optional)</label>
                      <input
                        type="text"
                        value={adFormData.adsterraId || ""}
                        onChange={(e) => setAdFormData({ ...adFormData, adsterraId: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Min Coins {adFormData.adType === "adsterra" ? "(Default: 20)" : "(Default: 10)"}
                      </label>
                      <input
                        type="number"
                        value={adFormData.minCoins}
                        onChange={(e) => setAdFormData({ ...adFormData, minCoins: parseInt(e.target.value) || (adFormData.adType === "adsterra" ? 20 : 10) })}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Max Coins (Default: 80)</label>
                      <input
                        type="number"
                        value={adFormData.maxCoins}
                        onChange={(e) => setAdFormData({ ...adFormData, maxCoins: parseInt(e.target.value) || 80 })}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {adFormData.adType === "adsterra" 
                      ? "Adsterra ads: 20-80 coins randomly"
                      : "Collaboration ads: 10-80 coins randomly"}
                  </p>
                  <div>
                    <label className="block text-sm font-medium mb-1">Watch Duration (seconds)</label>
                    <input
                      type="number"
                      value={adFormData.watchDuration}
                      onChange={(e) => setAdFormData({ ...adFormData, watchDuration: parseInt(e.target.value) || 15 })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={adFormData.status}
                      onChange={(e) => setAdFormData({ ...adFormData, status: e.target.value as "active" | "inactive" })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setShowAddAdModal(false);
                        setEditingAd(null);
                      }}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const endpoint = editingAd ? `/api/admin/ads/${editingAd.id}` : "/api/admin/ads";
                          const method = editingAd ? "PUT" : "POST";
                          const res = await apiFetch(endpoint, {
                            method,
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(adFormData),
                          });
                          if (res.ok) {
                            alert(editingAd ? "Ad updated successfully!" : "Ad created successfully!");
                            setShowAddAdModal(false);
                            setEditingAd(null);
                            fetchData();
                          } else {
                            const error = await res.json();
                            alert(error.error || "Failed to save ad");
                          }
                        } catch (error: any) {
                          alert(error.message || "Failed to save ad");
                        }
                      }}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                    >
                      {editingAd ? "Update" : "Create"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Add/Edit Post Modal - Using Portal to render outside AdminLayout */}
        {(showAddPostModal || editingPost) && typeof document !== 'undefined' && createPortal(
          <div className="fixed inset-0 bg-black/50 z-[9999] overflow-y-auto" onClick={() => {
            setShowAddPostModal(false);
            setEditingPost(null);
            resetForm();
          }}>
            <div className="min-h-full flex items-start justify-center p-4 pt-20" onClick={(e) => e.stopPropagation()}>
              <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-full max-w-2xl my-8 relative z-[10000] shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{editingPost ? "Edit Share Post" : "Add Share Post"}</h2>
                <button
                  onClick={() => {
                    setShowAddPostModal(false);
                    setEditingPost(null);
                    resetForm();
                  }}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">URL</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Coin Value</label>
                  <input
                    type="number"
                    value={formData.coinValue}
                    onChange={(e) => setFormData({ ...formData, coinValue: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                
                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Photo (Optional)
                    {videoPreview && <span className="text-xs text-muted-foreground ml-2">- Remove video first</span>}
                  </label>
                  {imagePreview ? (
                    <div className="relative mb-2">
                      <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg border border-border" />
                      <button
                        onClick={() => {
                          setImagePreview("");
                          setFormData({ ...formData, imageUrl: "" });
                          setImageFile(null);
                          if (imageInputRef.current) imageInputRef.current.value = "";
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                    >
                      {uploadingImage ? (
                        <div className="text-sm text-muted-foreground">Uploading...</div>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">Click to upload image</span>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={!!videoPreview}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (videoPreview) {
                          alert("Please remove video first before uploading an image");
                          return;
                        }
                        setImageFile(file);
                        handleImageUpload(file);
                      }
                    }}
                  />
                </div>

                {/* Video Upload */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Video (Optional)
                    {imagePreview && <span className="text-xs text-muted-foreground ml-2">- Remove image first</span>}
                  </label>
                  {videoPreview ? (
                    <div className="relative mb-2">
                      <video src={videoPreview} className="w-full h-48 object-cover rounded-lg border border-border" controls />
                      <button
                        onClick={() => {
                          setVideoPreview("");
                          setFormData({ ...formData, videoUrl: "" });
                          setVideoFile(null);
                          if (videoInputRef.current) videoInputRef.current.value = "";
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => videoInputRef.current?.click()}
                      className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                    >
                      {uploadingVideo ? (
                        <div className="text-sm text-muted-foreground">Uploading...</div>
                      ) : (
                        <>
                          <Video className="w-6 h-6 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">Click to upload video</span>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    disabled={!!imagePreview}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (imagePreview) {
                          alert("Please remove image first before uploading a video");
                          return;
                        }
                        setVideoFile(file);
                        handleVideoUpload(file);
                      }
                    }}
                  />
                </div>

                {/* Pop-up Ad Settings */}
                <div className="border-t border-border pt-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showAsPopup"
                      checked={formData.showAsPopup}
                      onChange={(e) => setFormData({ ...formData, showAsPopup: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="showAsPopup" className="text-sm font-medium cursor-pointer">
                      Show as Pop-up Ad
                    </label>
                  </div>
                  
                  {formData.showAsPopup && (
                    <div className="space-y-3 pl-6 border-l-2 border-primary/20">
                      <div>
                        <label className="block text-sm font-medium mb-1">Show Delay (ms)</label>
                        <input
                          type="number"
                          value={formData.showDelay}
                          onChange={(e) => setFormData({ ...formData, showDelay: parseInt(e.target.value) || 2000 })}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800"
                          placeholder="2000"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Delay before showing pop-up (milliseconds)</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Auto-close After (ms) - Optional</label>
                        <input
                          type="number"
                          value={formData.closeAfter || ""}
                          onChange={(e) => setFormData({ ...formData, closeAfter: e.target.value ? parseInt(e.target.value) : undefined })}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800"
                          placeholder="Leave empty for no auto-close"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Auto-close pop-up after X milliseconds (leave empty to disable)</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Max Displays per User - Optional</label>
                        <input
                          type="number"
                          value={formData.maxDisplays || ""}
                          onChange={(e) => setFormData({ ...formData, maxDisplays: e.target.value ? parseInt(e.target.value) : undefined })}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800"
                          placeholder="Leave empty for unlimited"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Maximum times to show this pop-up to the same user</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowAddPostModal(false);
                      setEditingPost(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingPost ? handleUpdatePost : handleCreatePost}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                  >
                    {editingPost ? "Update" : "Create"}
                  </button>
                </div>
              </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </AdminLayout>
  );
}

