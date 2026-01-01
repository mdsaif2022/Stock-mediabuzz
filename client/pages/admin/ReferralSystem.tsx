import AdminLayout from "@/components/AdminLayout";
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { SharePost, ReferralRecord, ShareRecord, WithdrawRequest } from "@shared/api";
import { Plus, Edit, Trash2, Check, X, DollarSign, Users, Share2, ExternalLink, Copy, CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminReferralSystem() {
  const [activeTab, setActiveTab] = useState<"share-posts" | "referrals" | "shares" | "withdraws">("share-posts");
  const [sharePosts, setSharePosts] = useState<SharePost[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [shareRecords, setShareRecords] = useState<ShareRecord[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPostModal, setShowAddPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState<SharePost | null>(null);
  const [formData, setFormData] = useState({ title: "", url: "", coinValue: 100, status: "active" as "active" | "inactive" });

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

  const handleCreatePost = async () => {
    if (!formData.title || !formData.url || !formData.coinValue) {
      alert("Please fill in all required fields");
      return;
    }
    
    try {
      const response = await apiFetch("/api/admin/share-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        alert("Share post created successfully!");
        setShowAddPostModal(false);
        setFormData({ title: "", url: "", coinValue: 100, status: "active" });
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

  const handleUpdatePost = async () => {
    if (!editingPost) return;
    if (!formData.title || !formData.url || !formData.coinValue) {
      alert("Please fill in all required fields");
      return;
    }
    
    try {
      const response = await apiFetch(`/api/admin/share-posts/${editingPost.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        alert("Share post updated successfully!");
        setEditingPost(null);
        setFormData({ title: "", url: "", coinValue: 100, status: "active" });
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
        </div>

        {/* Share Posts Tab */}
        {activeTab === "share-posts" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setEditingPost(null);
                  setFormData({ title: "", url: "", coinValue: 100, status: "active" });
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
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left">Title</th>
                      <th className="px-4 py-3 text-left">URL</th>
                      <th className="px-4 py-3 text-left">Coin Value</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Created</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sharePosts.map((post) => (
                      <tr key={post.id} className="border-b border-border hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="px-4 py-3">{post.title}</td>
                        <td className="px-4 py-3">
                          <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                            {post.url.length > 40 ? post.url.substring(0, 40) + "..." : post.url}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="px-4 py-3">{post.coinValue} coins</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs",
                            post.status === "active" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                          )}>
                            {post.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">{new Date(post.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingPost(post);
                                setFormData({ title: post.title, url: post.url, coinValue: post.coinValue, status: post.status });
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
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left">Referrer</th>
                      <th className="px-4 py-3 text-left">Referred User</th>
                      <th className="px-4 py-3 text-left">Coins</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((ref: any) => (
                      <tr key={ref.id} className="border-b border-border hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="px-4 py-3">
                          <div className="font-medium">{ref.referrerName || ref.referrerId}</div>
                          <div className="text-sm text-muted-foreground">{ref.referrerEmail || ref.referrerId}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{ref.referredName || ref.referredId}</div>
                          <div className="text-sm text-muted-foreground">{ref.referredEmail || ref.referredId}</div>
                        </td>
                        <td className="px-4 py-3">{ref.coinsEarned} coins</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs",
                            ref.status === "approved" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                            ref.status === "rejected" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          )}>
                            {ref.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">{new Date(ref.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
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
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left">User</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Link</th>
                      <th className="px-4 py-3 text-left">Registrations</th>
                      <th className="px-4 py-3 text-left">Coins</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shareRecords.map((record: any) => (
                      <tr key={record.id} className="border-b border-border hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="px-4 py-3">
                          <div className="font-medium">{record.userName || record.userId}</div>
                          <div className="text-sm text-muted-foreground">{record.userEmail || record.userId}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs",
                            record.shareType === "admin_post" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                            "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                          )}>
                            {record.shareType === "admin_post" ? "Admin Post" : "Normal Link"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-xs">{record.shareLink}</span>
                            <button onClick={() => copyToClipboard(record.shareLink)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">{record.registrationCount}</td>
                        <td className="px-4 py-3">{record.coinsEarned} coins</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs",
                            record.status === "approved" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                            record.status === "rejected" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          )}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">{new Date(record.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
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
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left">User</th>
                      <th className="px-4 py-3 text-left">Coins</th>
                      <th className="px-4 py-3 text-left">Amount (BDT)</th>
                      <th className="px-4 py-3 text-left">bKash Number</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawRequests.map((request: any) => (
                      <tr key={request.id} className="border-b border-border hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="px-4 py-3">
                          <div className="font-medium">{request.userName || request.userId}</div>
                          <div className="text-sm text-muted-foreground">{request.userEmail || request.userId}</div>
                        </td>
                        <td className="px-4 py-3">{request.coins.toLocaleString()} coins</td>
                        <td className="px-4 py-3">{request.amountBdt.toFixed(2)} BDT</td>
                        <td className="px-4 py-3">{request.bkashNumber}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs",
                            request.status === "approved" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                            request.status === "rejected" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          )}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">{new Date(request.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
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

        {/* Add/Edit Post Modal */}
        {(showAddPostModal || editingPost) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">{editingPost ? "Edit Share Post" : "Add Share Post"}</h2>
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
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowAddPostModal(false);
                      setEditingPost(null);
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
        )}
      </div>
    </AdminLayout>
  );
}

