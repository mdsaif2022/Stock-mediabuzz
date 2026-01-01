import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { UserEarnings, SharePost, ShareRecord, ReferralRecord, WithdrawRequest, ShareLinkRequest } from "@shared/api";
import { Copy, Share2, DollarSign, Users, TrendingUp, ExternalLink, Plus, CheckCircle, XCircle, Clock, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Earnings() {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [earnings, setEarnings] = useState<UserEarnings>({
    totalCoins: 0,
    referralCoins: 0,
    shareCoins: 0,
    adminPostShareCoins: 0,
    randomShareCoins: 0,
    pendingWithdraw: 0,
    availableCoins: 0,
  });
  const [referralInfo, setReferralInfo] = useState<{ referralCode: string; referralLink: string } | null>(null);
  const [sharePosts, setSharePosts] = useState<SharePost[]>([]);
  const [shareHistory, setShareHistory] = useState<ShareRecord[]>([]);
  const [referralHistory, setReferralHistory] = useState<ReferralRecord[]>([]);
  const [withdrawHistory, setWithdrawHistory] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "referral" | "sharing" | "withdraw">("overview");
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareFormData, setShareFormData] = useState({ shareType: "normal_link" as "admin_post" | "normal_link", sharePostId: "", shareLink: "" });
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawFormData, setWithdrawFormData] = useState({ coins: 5000, bkashNumber: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [earningsRes, referralRes, postsRes, sharesRes, referralsRes, withdrawsRes] = await Promise.all([
        apiFetch("/api/referral/earnings"),
        apiFetch("/api/referral/info"),
        apiFetch("/api/share/posts"),
        apiFetch("/api/share/history"),
        apiFetch("/api/referral/history"),
        apiFetch("/api/withdraw/history"),
      ]);

      if (!earningsRes.ok) {
        const errorData = await earningsRes.json().catch(() => ({ error: "Failed to fetch earnings" }));
        throw new Error(errorData.error || "Failed to fetch earnings");
      }

      const earningsData = await earningsRes.json();
      const referralData = referralRes.ok ? await referralRes.json() : null;
      const postsData = postsRes.ok ? await postsRes.json() : { data: [] };
      const sharesData = sharesRes.ok ? await sharesRes.json() : { data: [] };
      const referralsData = referralsRes.ok ? await referralsRes.json() : { data: [] };
      const withdrawsData = withdrawsRes.ok ? await withdrawsRes.json() : { data: [] };

      // Ensure earnings has all required properties with defaults
      setEarnings({
        totalCoins: earningsData.totalCoins ?? 0,
        referralCoins: earningsData.referralCoins ?? 0,
        shareCoins: earningsData.shareCoins ?? 0,
        adminPostShareCoins: earningsData.adminPostShareCoins ?? 0,
        randomShareCoins: earningsData.randomShareCoins ?? 0,
        pendingWithdraw: earningsData.pendingWithdraw ?? 0,
        availableCoins: earningsData.availableCoins ?? 0,
      });
      // Construct full referral link using current origin (ensures correct domain)
      if (referralData && referralData.referralCode && typeof window !== 'undefined') {
        const currentOrigin = window.location.origin;
        referralData.referralLink = `${currentOrigin}/signup?ref=${referralData.referralCode}`;
      }
      setReferralInfo(referralData);
      setSharePosts(postsData.data || []);
      setShareHistory(sharesData.data || []);
      setReferralHistory(referralsData.data || []);
      setWithdrawHistory(withdrawsData.data || []);
    } catch (error: any) {
      console.error("Failed to fetch data:", error);
      setError(error.message || "Failed to load earnings data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate("/login");
      return;
    }
    if (currentUser) {
      fetchData();
    }
  }, [authLoading, currentUser, fetchData, navigate]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handleCreateShareLink = async () => {
    if (!shareFormData.shareLink) {
      alert("Please enter a share link");
      return;
    }

    if (shareFormData.shareType === "admin_post" && !shareFormData.sharePostId) {
      alert("Please select a share post");
      return;
    }

    try {
      const response = await apiFetch("/api/share/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shareFormData),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Share link created! Share this URL: ${data.shareUrl}`);
        setShowShareModal(false);
        setShareFormData({ shareType: "normal_link", sharePostId: "", shareLink: "" });
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create share link");
      }
    } catch (error) {
      console.error("Failed to create share link:", error);
      alert("Failed to create share link");
    }
  };

  const handleWithdrawRequest = async () => {
    if (withdrawFormData.coins < 5000) {
      alert("Minimum withdraw is 5000 coins");
      return;
    }

    if (!withdrawFormData.bkashNumber) {
      alert("Please enter your bKash number");
      return;
    }

    try {
      const response = await apiFetch("/api/withdraw/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(withdrawFormData),
      });

      if (response.ok) {
        alert("Withdraw request submitted successfully!");
        setShowWithdrawModal(false);
        setWithdrawFormData({ coins: 5000, bkashNumber: "" });
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to submit withdraw request");
      }
    } catch (error) {
      console.error("Failed to submit withdraw request:", error);
      alert("Failed to submit withdraw request");
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!currentUser) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground mb-4">Please log in to view your earnings.</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">Earnings & Referrals</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
            <p className="font-semibold mb-1">Error loading data</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={() => fetchData()}
              className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {loading && !error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading earnings data...</div>
          </div>
        ) : (
          <>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border mb-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "px-4 py-2 font-medium transition-colors",
              activeTab === "overview"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("referral")}
            className={cn(
              "px-4 py-2 font-medium transition-colors",
              activeTab === "referral"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Referral
          </button>
          <button
            onClick={() => setActiveTab("sharing")}
            className={cn(
              "px-4 py-2 font-medium transition-colors",
              activeTab === "sharing"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Sharing
          </button>
          <button
            onClick={() => setActiveTab("withdraw")}
            className={cn(
              "px-4 py-2 font-medium transition-colors",
              activeTab === "withdraw"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Withdraw
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Earnings Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Coins</span>
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div className="text-2xl font-bold">{(earnings.totalCoins ?? 0).toLocaleString()}</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Referral Coins</span>
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="text-2xl font-bold">{(earnings.referralCoins ?? 0).toLocaleString()}</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Share Coins</span>
                  <Share2 className="w-5 h-5 text-primary" />
                </div>
                <div className="text-2xl font-bold">{(earnings.shareCoins ?? 0).toLocaleString()}</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Available Coins</span>
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div className="text-2xl font-bold">{(earnings.availableCoins ?? 0).toLocaleString()}</div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Earnings Breakdown</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Admin Post Shares:</span>
                  <span className="font-semibold">{(earnings.adminPostShareCoins ?? 0).toLocaleString()} coins</span>
                </div>
                <div className="flex justify-between">
                  <span>Random Link Shares:</span>
                  <span className="font-semibold">{(earnings.randomShareCoins ?? 0).toLocaleString()} coins</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending Withdraw:</span>
                  <span className="font-semibold text-yellow-600 dark:text-yellow-400">{(earnings.pendingWithdraw ?? 0).toLocaleString()} coins</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Referral Tab */}
        {activeTab === "referral" && (
          <div className="space-y-6">
            {referralInfo ? (
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Your Referral Link</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Referral Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={referralInfo.referralCode}
                        readOnly
                        className="flex-1 px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800"
                      />
                      <button
                        onClick={() => copyToClipboard(referralInfo.referralCode)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Referral Link</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={referralInfo.referralLink}
                        readOnly
                        className="flex-1 px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800"
                      />
                      <button
                        onClick={() => copyToClipboard(referralInfo.referralLink)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>How it works:</strong> Share your referral link. When someone signs up using your link, you earn 100 coins after their account is verified and approved by admin.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="text-center py-4 text-muted-foreground">Loading referral info...</div>
              </div>
            )}

            {/* Referral History */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Referral History</h2>
              {referralHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No referrals yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left">Referred User</th>
                        <th className="px-4 py-3 text-left">Coins</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referralHistory.map((ref) => (
                        <tr key={ref.id} className="border-b border-border">
                          <td className="px-4 py-3">{ref.referredId}</td>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sharing Tab */}
        {activeTab === "sharing" && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
                Create Share Link
              </button>
            </div>

            {/* Admin Posts */}
            {sharePosts.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Admin-Approved Posts</h2>
                <div className="space-y-3">
                  {sharePosts.map((post) => (
                    <div key={post.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{post.title}</h3>
                        <p className="text-sm text-muted-foreground">{post.coinValue} coins per registration</p>
                      </div>
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        View <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Share History */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Share History</h2>
              {shareHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No shares yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left">Type</th>
                        <th className="px-4 py-3 text-left">Link</th>
                        <th className="px-4 py-3 text-left">Registrations</th>
                        <th className="px-4 py-3 text-left">Coins</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shareHistory.map((share) => (
                        <tr key={share.id} className="border-b border-border">
                          <td className="px-4 py-3">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs",
                              share.shareType === "admin_post" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                              "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                            )}>
                              {share.shareType === "admin_post" ? "Admin Post" : "Normal Link"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="truncate max-w-xs">{share.shareLink}</span>
                              <button onClick={() => copyToClipboard(share.shareLink)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3">{share.registrationCount}</td>
                          <td className="px-4 py-3">{share.coinsEarned} coins</td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs",
                              share.status === "approved" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                              share.status === "rejected" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                              "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            )}>
                              {share.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">{new Date(share.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Withdraw Tab */}
        {activeTab === "withdraw" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Withdraw Request</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Withdraw Rules:</strong> Minimum 5000 coins = 100 BDT. Withdraw method: bKash. Requests are manually approved by admin.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Available Coins</label>
                  <div className="text-2xl font-bold">{(earnings.availableCoins ?? 0).toLocaleString()} coins</div>
                </div>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  disabled={(earnings.availableCoins ?? 0) < 5000}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Request Withdraw
                </button>
              </div>
            </div>

            {/* Withdraw History */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Withdraw History</h2>
              {withdrawHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No withdraw requests yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left">Coins</th>
                        <th className="px-4 py-3 text-left">Amount (BDT)</th>
                        <th className="px-4 py-3 text-left">bKash Number</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawHistory.map((withdraw) => (
                        <tr key={withdraw.id} className="border-b border-border">
                          <td className="px-4 py-3">{(withdraw.coins ?? 0).toLocaleString()} coins</td>
                          <td className="px-4 py-3">{(withdraw.amountBdt ?? 0).toFixed(2)} BDT</td>
                          <td className="px-4 py-3">{withdraw.bkashNumber}</td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs",
                              withdraw.status === "approved" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                              withdraw.status === "rejected" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                              "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            )}>
                              {withdraw.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">{new Date(withdraw.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create Share Link</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Share Type</label>
                  <select
                    value={shareFormData.shareType}
                    onChange={(e) => setShareFormData({ ...shareFormData, shareType: e.target.value as "admin_post" | "normal_link", sharePostId: "" })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800"
                  >
                    <option value="normal_link">Normal Link (Random 5-100 coins)</option>
                    <option value="admin_post">Admin Post (Fixed coins)</option>
                  </select>
                </div>
                {shareFormData.shareType === "admin_post" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Admin Post</label>
                    <select
                      value={shareFormData.sharePostId}
                      onChange={(e) => setShareFormData({ ...shareFormData, sharePostId: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800"
                    >
                      <option value="">Select a post...</option>
                      {sharePosts.map((post) => (
                        <option key={post.id} value={post.id}>
                          {post.title} ({post.coinValue} coins)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-2">Share Link</label>
                  <input
                    type="url"
                    value={shareFormData.shareLink}
                    onChange={(e) => setShareFormData({ ...shareFormData, shareLink: e.target.value })}
                    placeholder="https://example.com/page"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowShareModal(false);
                      setShareFormData({ shareType: "normal_link", sharePostId: "", shareLink: "" });
                    }}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateShareLink}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Modal */}
        {showWithdrawModal && earnings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Request Withdraw</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Coins (Minimum: 5000)</label>
                  <input
                    type="number"
                    value={withdrawFormData.coins}
                    onChange={(e) => setWithdrawFormData({ ...withdrawFormData, coins: parseInt(e.target.value) || 0 })}
                    min={5000}
                    step={5000}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    = {((withdrawFormData.coins / 5000) * 100).toFixed(2)} BDT
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">bKash Number</label>
                  <input
                    type="text"
                    value={withdrawFormData.bkashNumber}
                    onChange={(e) => setWithdrawFormData({ ...withdrawFormData, bkashNumber: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowWithdrawModal(false);
                      setWithdrawFormData({ coins: 5000, bkashNumber: "" });
                    }}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleWithdrawRequest}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </Layout>
  );
}

