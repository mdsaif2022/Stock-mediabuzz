import AdminLayout from "@/components/AdminLayout";
import { Search, Ban, Shield, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  downloads: number;
  accountStatus: "active" | "banned";
  role: "user" | "admin";
  joinedDate: string;
}

const users: User[] = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    downloads: 245,
    accountStatus: "active",
    role: "user",
    joinedDate: "2024-01-15",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    downloads: 189,
    accountStatus: "active",
    role: "user",
    joinedDate: "2024-02-20",
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike@example.com",
    downloads: 156,
    accountStatus: "active",
    role: "user",
    joinedDate: "2024-03-10",
  },
  {
    id: 4,
    name: "Sarah Williams",
    email: "sarah@example.com",
    downloads: 142,
    accountStatus: "banned",
    role: "user",
    joinedDate: "2024-01-25",
  },
  {
    id: 5,
    name: "Tom Brown",
    email: "tom@example.com",
    downloads: 128,
    accountStatus: "active",
    role: "user",
    joinedDate: "2024-04-05",
  },
];

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-2">View and manage user accounts</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-border overflow-hidden">
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
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium">{user.name}</td>
                  <td className="px-6 py-4 text-sm">{user.email}</td>
                  <td className="px-6 py-4 text-sm font-semibold">{user.downloads}</td>
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
                    {user.accountStatus === "active" ? (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded text-xs font-semibold">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-destructive/10 text-destructive rounded text-xs font-semibold">
                        Banned
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {user.joinedDate}
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
                      {user.accountStatus === "active" ? (
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
              ))}
            </tbody>
          </table>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6">
            <p className="text-muted-foreground text-sm mb-2">Total Users</p>
            <p className="text-3xl font-bold">5,234</p>
            <p className="text-xs text-green-600 mt-2">+124 this month</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6">
            <p className="text-muted-foreground text-sm mb-2">Active Users</p>
            <p className="text-3xl font-bold">5,142</p>
            <p className="text-xs text-muted-foreground mt-2">98.4% active rate</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6">
            <p className="text-muted-foreground text-sm mb-2">Banned Users</p>
            <p className="text-3xl font-bold">92</p>
            <p className="text-xs text-muted-foreground mt-2">1.6% of total</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
