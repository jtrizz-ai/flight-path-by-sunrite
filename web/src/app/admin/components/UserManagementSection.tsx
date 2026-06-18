"use client";

/**
 * User Management Section - Phase 1
 * Admin-only UI for managing users (add, edit role, pause, delete)
 * Follows Sunrite OS design system (dark, cinematic, orange accents)
 */

import { useState, useEffect } from "react";
import type { AppUser, UserRole, UserStatus } from "@/lib/types";

const ROLES: UserRole[] = ["Admin", "Manager", "Team Lead", "Sales", "Field Marketer"];

export function UserManagementSection() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add user form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("Field Marketer");
  const [addingUser, setAddingUser] = useState(false);

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load users");
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newUserEmail.trim()) return;

    try {
      setAddingUser(true);
      setError(null);
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newUserEmail.trim(), role: newUserRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add user");
      }

      // Success: reload users and reset form
      await loadUsers();
      setNewUserEmail("");
      setNewUserRole("Field Marketer");
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setAddingUser(false);
    }
  }

  async function handleUpdateRole(userId: string, newRole: UserRole) {
    try {
      setError(null);
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update role");
      }

      // Optimistic update
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      // Reload to restore correct state
      loadUsers();
    }
  }

  async function handleToggleStatus(userId: string, currentStatus: UserStatus) {
    const newStatus: UserStatus = currentStatus === "active" ? "paused" : "active";
    
    try {
      setError(null);
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }

      // Optimistic update
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      loadUsers();
    }
  }

  async function handleDeleteUser(userId: string, userEmail: string) {
    if (!confirm(`Delete ${userEmail}? This cannot be undone.`)) return;

    try {
      setError(null);
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete user");
      }

      // Remove from UI
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      loadUsers();
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6">
        <div className="text-gray-400">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">User Management</h2>
          <p className="text-sm text-gray-400">Manage users, roles, and access</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-[#E8472A] hover:bg-[#FF8A5B] text-white px-4 py-2 rounded-full font-mono text-xs uppercase tracking-wider transition"
        >
          {showAddForm ? "Cancel" : "+ Add User"}
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Add User Form */}
      {showAddForm && (
        <form onSubmit={handleAddUser} className="mb-6 bg-slate-800/50 border border-white/5 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="user@sunritesolarllc.com"
                required
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#E8472A]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">
                Role
              </label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#E8472A]"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={addingUser}
              className="bg-[#E8472A] hover:bg-[#FF8A5B] disabled:bg-slate-700 disabled:text-gray-500 text-white px-6 py-2 rounded-full font-mono text-xs uppercase tracking-wider transition"
            >
              {addingUser ? "Adding..." : "Add User"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="border border-white/10 hover:border-white/30 text-gray-300 px-6 py-2 rounded-full font-mono text-xs uppercase tracking-wider transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Users Table */}
      {users.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No users found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-2 text-xs font-mono uppercase tracking-wider text-gray-400">Email</th>
                <th className="text-left py-3 px-2 text-xs font-mono uppercase tracking-wider text-gray-400">Name</th>
                <th className="text-left py-3 px-2 text-xs font-mono uppercase tracking-wider text-gray-400">Role</th>
                <th className="text-left py-3 px-2 text-xs font-mono uppercase tracking-wider text-gray-400">Status</th>
                <th className="text-right py-3 px-2 text-xs font-mono uppercase tracking-wider text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-slate-800/30 transition">
                  <td className="py-3 px-2 text-sm text-gray-300 font-mono">{user.email}</td>
                  <td className="py-3 px-2 text-sm text-gray-300">{user.full_name || "—"}</td>
                  <td className="py-3 px-2">
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
                      className="bg-slate-800 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#E8472A]"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => handleToggleStatus(user.id, user.status)}
                      className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider transition ${
                        user.status === "active"
                          ? "bg-green-900/30 text-green-400 border border-green-500/30 hover:bg-green-900/50"
                          : "bg-red-900/30 text-red-400 border border-red-500/30 hover:bg-red-900/50"
                      }`}
                    >
                      {user.status}
                    </button>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      className="text-red-400 hover:text-red-300 text-xs font-mono uppercase tracking-wider transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
