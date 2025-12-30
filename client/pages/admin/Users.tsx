import AdminLayout from "@/components/AdminLayout";
import { Search, Ban, Shield, RotateCcw, Trash2, CheckCircle2, AlertTriangle, Loader2, Sparkles, Calendar, Clock, Edit, Plus, History } from "lucide-react";
import { useEffect, useState } from "react";
import { CreatorProfile, CreatorStoragePurchase, PlatformUser } from "@shared/api";
import { apiFetch } from "@/lib/api";

interface ManualPaymentRecord {
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  purchase: CreatorStoragePurchase;
}

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [creatorLoading, setCreatorLoading] = useState(false);
  const [manualPayments, setManualPayments] = useState<ManualPaymentRecord[]>([]);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState("");
  const [allPurchases, setAllPurchases] = useState<ManualPaymentRecord[]>([]);
  const [allPurchasesLoading, setAllPurchasesLoading] = useState(false);
  const [allPurchasesError, setAllPurchasesError] = useState("");

  const filtered = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      setUsersError("");
      const response = await apiFetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("Failed to load users");
      }
      const data = await response.json();
      setUsers(data.data || []);
    } catch (error: any) {
      setUsersError(error.message || "Unable to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchCreators = async () => {
    try {
      setCreatorLoading(true);
      const response = await apiFetch("/api/admin/creators");
      if (!response.ok) {
        throw new Error("Failed to load creator applications");
      }
      const data = await response.json();
      setCreators(data.data || []);
    } catch (error) {
      // Silently handle error
    } finally {
      setCreatorLoading(false);
    }
  };

  const fetchManualPayments = async () => {
    try {
      setManualLoading(true);
      setManualError("");
      const response = await apiFetch("/api/admin/storage/manual-payments");
      if (!response.ok) {
        throw new Error("Failed to load manual payments");
      }
      const data = await response.json();
      setManualPayments(data || []);
    } catch (error: any) {
      setManualError(error.message || "Unable to load manual payments");
    } finally {
      setManualLoading(false);
    }
  };

  const fetchAllPurchases = async () => {
    try {
      setAllPurchasesLoading(true);
      setAllPurchasesError("");
      const response = await apiFetch("/api/admin/storage/all-purchases");
      
      if (!response.ok) {
        throw new Error(`Failed to load purchase history: ${response.status} ${response.statusText}`);
      }
      
      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response. Please restart the server.");
      }
      
      const data = await response.json();
      setAllPurchases(data || []);
    } catch (error: any) {
      setAllPurchasesError(error.message || "Unable to load purchase history");
    } finally {
      setAllPurchasesLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCreators();
    fetchManualPayments();
    fetchAllPurchases();
  }, []);

  // Auto-refresh every 30 seconds to catch new accounts
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUsers();
      fetchCreators();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const updateCreatorStatus = async (id: string, status: CreatorProfile["status"]) => {
    try {
      const response = await apiFetch(`/api/admin/creators/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error("Failed to update creator status");
      }
      await fetchCreators();
    } catch (error) {
      console.error(error);
      alert("Unable to update creator status. Please try again.");
    }
  };

  const handleDeletePurchase = async (creatorId: string, purchaseId: string, creatorName: string) => {
    if (!confirm(`Are you sure you want to delete this storage purchase from ${creatorName}? This will recalculate their storage.`)) {
      return;
    }
    
    const reason = prompt("Reason for deletion (optional):") || undefined;
    
    try {
      const response = await apiFetch(`/api/admin/storage/purchases/${creatorId}/${purchaseId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete purchase");
      }

      // Refresh purchase history
      await fetchAllPurchases();
      alert("Purchase deleted successfully. Creator storage has been recalculated.");
    } catch (error: any) {
      alert(`Failed to delete purchase: ${error.message}`);
    }
  };

  const handleFreezeCreator = async (creatorId: string, creatorName: string, currentlyFrozen: boolean) => {
    const action = currentlyFrozen ? "unfreeze" : "freeze";
    if (!confirm(`Are you sure you want to ${action} ${creatorName}'s account?`)) {
      return;
    }
    
    const reason = prompt(`Reason for ${action} (optional):`) || undefined;
    
    try {
      const response = await apiFetch(`/api/admin/creators/${creatorId}/freeze`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          frozen: !currentlyFrozen,
          reason 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to ${action} creator`);
      }

      // Refresh purchase history and creators
      await fetchAllPurchases();
      await fetchCreators();
      alert(`Creator account ${action}d successfully.`);
    } catch (error: any) {
      alert(`Failed to ${action} creator: ${error.message}`);
    }
  };

  const handleManualPaymentAction = async (
    record: ManualPaymentRecord,
    action: "approve" | "reject"
  ) => {
    const note =
      action === "reject" ? window.prompt("Optional note for the creator:", "") ?? "" : "";

    try {
      const response = await apiFetch(
        `/api/admin/storage/manual-payments/${record.creatorId}/${record.purchase.id}/${action}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ adminNote: note }),
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to ${action} payment`);
      }
      await fetchManualPayments();
      await fetchCreators();
      alert(`Payment ${action === "approve" ? "approved" : "rejected"} successfully.`);
    } catch (error: any) {
      console.error(error);
      alert(error.message || `Unable to ${action} payment. Please try again.`);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-2">View and manage user accounts</p>
        </div>

        {/* Search and Refresh */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            onClick={() => {
              fetchUsers();
              fetchCreators();
            }}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-border overflow-hidden">
          {usersError && (
            <div className="px-6 py-3 text-sm text-destructive border-b border-border bg-destructive/5">
              {usersError}
            </div>
          )}
          <table className="w-full">
            <thead className="border-b border-border bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Downloads</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Joined</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {usersLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-6 text-center text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                    Loading users...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-6 text-center text-sm text-muted-foreground">
                    No users match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">{user.name}</td>
                    <td className="px-6 py-4 text-sm break-all">{user.email}</td>
                    <td className="px-6 py-4 text-sm font-semibold">{user.downloads ?? 0}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          user.role === "admin"
                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        }`}
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {user.status === "active" ? (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded text-xs font-semibold">
                          Active
                        </span>
                      ) : user.status === "banned" ? (
                        <span className="px-2 py-1 bg-destructive/10 text-destructive rounded text-xs font-semibold">
                          Banned
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-semibold">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        {user.role !== "admin" && (
                          <button
                            title="Promote to Admin"
                            className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded transition-colors text-purple-600 dark:text-purple-400"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        )}
                        {user.status === "active" ? (
                          <button
                            title="Ban User"
                            className="p-1 hover:bg-destructive/10 rounded transition-colors text-destructive"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            title="Unban User"
                            className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors text-green-600 dark:text-green-400"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          title="Delete User"
                          className="p-1 hover:bg-destructive/10 rounded transition-colors text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6">
            <p className="text-muted-foreground text-sm mb-2">Total Users</p>
            <p className="text-3xl font-bold">{users.length}</p>
            <p className="text-xs text-muted-foreground mt-2">Includes downloader and creator accounts</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6">
            <p className="text-muted-foreground text-sm mb-2">Active Users</p>
            <p className="text-3xl font-bold">{users.filter((u) => u.status === "active").length}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {users.length ? `${Math.round((users.filter((u) => u.status === "active").length / users.length) * 100)}% active` : "—"}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6">
            <p className="text-muted-foreground text-sm mb-2">Banned Users</p>
            <p className="text-3xl font-bold">{users.filter((u) => u.status === "banned").length}</p>
            <p className="text-xs text-muted-foreground mt-2">Users blocked from downloads</p>
          </div>
        </div>

        {/* Creator Verification */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                Creator Verification
              </div>
              <p className="text-lg font-semibold">Review & verify creator accounts</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  fetchUsers();
                  fetchCreators();
                }}
                className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Refresh All
              </button>
              <button
                onClick={fetchCreators}
                className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Refresh Creators
              </button>
            </div>
          </div>

          {creatorLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading creator verification queue...
            </div>
          ) : creators.length === 0 ? (
            <p className="text-sm text-muted-foreground">No creator profiles need verification right now.</p>
          ) : (
            <div className="space-y-3">
              {creators.map((creator) => (
                <div
                  key={creator.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-semibold">{creator.name}</p>
                    <p className="text-sm text-muted-foreground break-all">{creator.email}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {creator.specialization || "No specialization provided"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-semibold ${
                        creator.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : creator.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {creator.status}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateCreatorStatus(creator.id, "approved")}
                        className="px-2 py-1 text-xs rounded-lg border border-green-500 text-green-600 hover:bg-green-500/10 transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Verify
                      </button>
                      <button
                        onClick={() => updateCreatorStatus(creator.id, "rejected")}
                        className="px-2 py-1 text-xs rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manual Storage Payments */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                Storage Payments
              </div>
              <p className="text-lg font-semibold">Verify manual bKash payments</p>
            </div>
            <button
              onClick={fetchManualPayments}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {manualError && <p className="text-sm text-destructive">{manualError}</p>}
          {manualLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading manual payments...
            </div>
          ) : manualPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No manual payments submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {manualPayments.map((record) => {
                const creator = creators.find((c) => c.id === record.creatorId);
                const isFrozen = creator?.status === "rejected";
                return (
                <div
                  key={`${record.creatorId}-${record.purchase.id}`}
                  className="rounded-lg border border-border p-3 flex flex-col gap-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">{record.creatorName}</p>
                        <p className="text-xs text-muted-foreground">{record.creatorEmail}</p>
                        {isFrozen && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs rounded-full font-semibold bg-red-100 text-red-700">
                            <Ban className="w-3 h-3" />
                            Account Frozen
                          </span>
                        )}
                      </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-semibold ${
                        record.purchase.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : record.purchase.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {record.purchase.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <p>
                      Plan: {record.purchase.gb}GB / {record.purchase.months}m
                    </p>
                    <p>Amount: ৳{record.purchase.totalTk}</p>
                    <p>Txn: {record.purchase.reference}</p>
                    <p>Sender: {record.purchase.senderNumber}</p>
                    <p>Method: {record.purchase.paymentMethod}</p>
                    <p>Submitted: {new Date(record.purchase.purchasedAt).toLocaleString()}</p>
                  </div>
                  {record.purchase.adminNote && (
                    <p className="text-xs text-muted-foreground">
                      Admin note: {record.purchase.adminNote}
                    </p>
                  )}
                  {record.purchase.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleManualPaymentAction(record, "approve")}
                        className="px-3 py-1 text-xs rounded-lg border border-green-500 text-green-600 hover:bg-green-500/10 transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleManualPaymentAction(record, "reject")}
                        className="px-3 py-1 text-xs rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Creator Storage History */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <History className="w-4 h-4 text-primary" />
                Creator Storage History
              </div>
              <p className="text-lg font-semibold">Storage Purchase Log</p>
              <p className="text-xs text-muted-foreground mt-1">View detailed storage history per creator with management options</p>
            </div>
            <button
              onClick={() => {
                fetchCreators();
                fetchAllPurchases();
              }}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {creatorLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading creator storage history...
            </div>
          ) : creators.length === 0 ? (
            <p className="text-sm text-muted-foreground">No creators found.</p>
          ) : (
            <div className="space-y-4">
              {creators.map((creator) => {
                const purchases = creator.storagePurchaseHistory || [];
                const activePurchases = purchases.filter(
                  (p) => p.status === "completed" && p.expiresAt && new Date(p.expiresAt) > new Date()
                );
                const expiredPurchases = purchases.filter(
                  (p) => p.status === "completed" && p.expiresAt && new Date(p.expiresAt) <= new Date()
                );
                const totalActiveGb = activePurchases.reduce((sum, p) => sum + p.gb, 0);
                const totalExpiredGb = expiredPurchases.reduce((sum, p) => sum + p.gb, 0);

                return (
                  <div key={creator.id} className="border border-border rounded-lg p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{creator.name}</p>
                        <p className="text-xs text-muted-foreground">{creator.email}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <div className="px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Active: {totalActiveGb} GB
                        </div>
                        <div className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                          Expired: {totalExpiredGb} GB
                        </div>
                        <div className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          Total: {purchases.length} purchases
                        </div>
                      </div>
                    </div>

                    {purchases.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No storage purchases yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {purchases
                          .sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime())
                          .map((purchase) => {
                            const purchaseDate = new Date(purchase.purchasedAt);
                            const expiryDate = purchase.expiresAt ? new Date(purchase.expiresAt) : null;
                            const isExpired = expiryDate ? expiryDate <= new Date() : false;
                            const isActive = purchase.status === "completed" && !isExpired;

                            return (
                              <div
                                key={purchase.id}
                                className={`rounded-lg border p-3 ${
                                  isExpired
                                    ? "opacity-60 border-muted bg-slate-50 dark:bg-slate-900/40"
                                    : isActive
                                    ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10"
                                    : "border-border"
                                }`}
                              >
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                                  <div>
                                    <p className="text-muted-foreground">Storage</p>
                                    <p className="font-semibold">{purchase.gb} GB</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Duration</p>
                                    <p className="font-semibold">{purchase.months} months</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Purchase Date</p>
                                    <p className="font-semibold flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {purchaseDate.toLocaleDateString("en-GB", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Expiry Date</p>
                                    <p
                                      className={`font-semibold flex items-center gap-1 ${
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
                                  <div>
                                    <p className="text-muted-foreground">Status</p>
                                    <span
                                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
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
                                  </div>
                                </div>
                                {purchase.status === "completed" && (
                                  <div className="mt-2 pt-2 border-t border-border flex gap-2">
                                    <button
                                      onClick={async () => {
                                        const months = prompt("Extend by how many months?", "1");
                                        if (!months || isNaN(Number(months))) return;

                                        const reason = prompt("Reason for extension (optional):") || undefined;

                                        try {
                                          const response = await apiFetch(
                                            `/api/admin/storage/purchases/${creator.id}/${purchase.id}/extend`,
                                            {
                                              method: "PATCH",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({
                                                additionalMonths: Number(months),
                                                reason,
                                              }),
                                            }
                                          );

                                          if (!response.ok) {
                                            const errorData = await response.json().catch(() => ({}));
                                            throw new Error(errorData.error || "Failed to extend storage");
                                          }

                                          await fetchCreators();
                                          await fetchAllPurchases();
                                          alert("Storage validity extended successfully.");
                                        } catch (error: any) {
                                          alert(`Failed to extend storage: ${error.message}`);
                                        }
                                      }}
                                      className="px-2 py-1 text-xs rounded-lg border border-primary text-primary hover:bg-primary/10 transition-colors flex items-center gap-1"
                                      title="Extend storage validity"
                                    >
                                      <Plus className="w-3 h-3" />
                                      Extend
                                    </button>
                                    <button
                                      onClick={async () => {
                                        const newDate = prompt(
                                          "Enter new expiry date (YYYY-MM-DD):",
                                          expiryDate ? expiryDate.toISOString().split("T")[0] : ""
                                        );
                                        if (!newDate) return;

                                        const reason = prompt("Reason for modification (optional):") || undefined;

                                        try {
                                          const response = await apiFetch(
                                            `/api/admin/storage/purchases/${creator.id}/${purchase.id}/extend`,
                                            {
                                              method: "PATCH",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({
                                                newExpiryDate: newDate,
                                                reason,
                                              }),
                                            }
                                          );

                                          if (!response.ok) {
                                            const errorData = await response.json().catch(() => ({}));
                                            throw new Error(errorData.error || "Failed to modify storage");
                                          }

                                          await fetchCreators();
                                          await fetchAllPurchases();
                                          alert("Storage validity modified successfully.");
                                        } catch (error: any) {
                                          alert(`Failed to modify storage: ${error.message}`);
                                        }
                                      }}
                                      className="px-2 py-1 text-xs rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-500/10 transition-colors flex items-center gap-1"
                                      title="Modify expiry date"
                                    >
                                      <Edit className="w-3 h-3" />
                                      Modify
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* All Purchase History */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                Purchase History
              </div>
              <p className="text-lg font-semibold">All storage purchases</p>
              <p className="text-xs text-muted-foreground mt-1">View all purchases (auto and manual) from all creators</p>
            </div>
            <button
              onClick={fetchAllPurchases}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {allPurchasesError && <p className="text-sm text-destructive">{allPurchasesError}</p>}
          {allPurchasesLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading purchase history...
            </div>
          ) : allPurchases.length === 0 ? (
            <p className="text-sm text-muted-foreground">No purchases found.</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {allPurchases.map((record) => {
                const isExpired = record.purchase.expiresAt && new Date(record.purchase.expiresAt) < new Date();
                const creator = creators.find((c) => c.id === record.creatorId);
                const isFrozen = creator?.status === "rejected";
                return (
                  <div
                    key={`${record.creatorId}-${record.purchase.id}`}
                    className={`rounded-lg border p-3 flex flex-col gap-2 ${
                      isExpired ? "opacity-60 border-muted" : "border-border"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">{record.creatorName}</p>
                        <p className="text-xs text-muted-foreground">{record.creatorEmail}</p>
                        {isFrozen && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs rounded-full font-semibold bg-red-100 text-red-700">
                            <Ban className="w-3 h-3" />
                            Account Frozen
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-semibold ${
                            record.purchase.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : record.purchase.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {record.purchase.status}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-semibold ${
                            record.purchase.paymentMethod === "auto"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {record.purchase.paymentMethod === "auto" ? "Auto" : "Manual"}
                        </span>
                        {isExpired && (
                          <span className="px-2 py-1 text-xs rounded-full font-semibold bg-gray-100 text-gray-600">
                            Expired
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Storage</p>
                        <p className="font-semibold">{record.purchase.gb} GB</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Duration</p>
                        <p className="font-semibold">{record.purchase.months} months</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-semibold">৳{record.purchase.totalTk}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Purchased</p>
                        <p className="font-semibold">{new Date(record.purchase.purchasedAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expires</p>
                        <p className={`font-semibold ${isExpired ? "text-destructive" : ""}`}>
                          {record.purchase.expiresAt
                            ? new Date(record.purchase.expiresAt).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                      {record.purchase.reference && (
                        <div>
                          <p className="text-muted-foreground">Transaction ID</p>
                          <p className="font-semibold font-mono text-xs">{record.purchase.reference}</p>
                        </div>
                      )}
                      {record.purchase.senderNumber && (
                        <div>
                          <p className="text-muted-foreground">Sender</p>
                          <p className="font-semibold">{record.purchase.senderNumber}</p>
                        </div>
                      )}
                    </div>
                    {record.purchase.adminNote && (
                      <p className="text-xs text-muted-foreground border-t border-border pt-2">
                        <span className="font-semibold">Admin note:</span> {record.purchase.adminNote}
                      </p>
                    )}
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <button
                        onClick={() => handleDeletePurchase(record.creatorId, record.purchase.id, record.creatorName)}
                        className="px-3 py-1.5 text-xs rounded-lg border border-red-500 text-red-600 hover:bg-red-500/10 transition-colors flex items-center gap-1"
                        title="Delete this storage purchase"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete Purchase
                      </button>
                      <button
                        onClick={() => handleFreezeCreator(record.creatorId, record.creatorName, isFrozen)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-colors flex items-center gap-1 ${
                          isFrozen
                            ? "border-green-500 text-green-600 hover:bg-green-500/10"
                            : "border-orange-500 text-orange-600 hover:bg-orange-500/10"
                        }`}
                        title={isFrozen ? "Unfreeze creator account" : "Freeze creator account"}
                      >
                        <Ban className="w-3 h-3" />
                        {isFrozen ? "Unfreeze Account" : "Freeze Account"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
