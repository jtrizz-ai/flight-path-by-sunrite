"use client";

import { useState, useEffect } from "react";
import type { AppUser, UserRole, UserStatus } from "@/lib/types";

const ROLES: UserRole[] = ["Admin", "Manager", "Team Lead", "Sales", "Field Marketer"];

export function UserManagementSection() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("Field Marketer");
  const [addingUser, setAddingUser] = useState(false);

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
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
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
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete user");
      }
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      loadUsers();
    }
  }

  async function handleUpdateField(userId: string, field: "region" | "team", value: string) {
    try {
      setError(null);
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to update ${field}`);
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, [field]: value || null } : u))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      loadUsers();
    }
  }

  if (loading) {
    return (
      <div
        className="rounded-[18px] p-6"
        style={{
          backgroundColor: "var(--color-fp-card)",
          border: "1px solid var(--color-fp-card-line)",
        }}
      >
        <div
          className="font-[var(--font-fp-mono)] text-[11px]"
          style={{ color: "var(--color-fp-ink-3)" }}
        >
          Loading users...
        </div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid var(--color-fp-line)",
    borderRadius: "14px",
    color: "var(--color-fp-ink)",
  };

  return (
    <div
      className="rounded-[18px] p-6"
      style={{
        backgroundColor: "var(--color-fp-card)",
        border: "1px solid var(--color-fp-card-line)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2
            className="font-[var(--font-fp-sans)] text-[16px] font-bold mb-1"
            style={{ color: "var(--color-fp-ink)" }}
          >
            User Management
          </h2>
          <p
            className="font-[var(--font-fp-sans)] text-[12px]"
            style={{ color: "var(--color-fp-ink-3)" }}
          >
            Manage users, roles, and access
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-full px-4 py-2 font-[var(--font-fp-mono)] text-[11px] font-bold tracking-[0.1em] uppercase transition-opacity"
          style={{
            backgroundColor: "var(--color-fp-accent)",
            color: "#fff",
          }}
        >
          {showAddForm ? "Cancel" : "+ Add User"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mb-4 rounded-[10px] px-4 py-3 font-[var(--font-fp-sans)] text-[13px]"
          style={{
            backgroundColor: "rgba(232,71,42,0.08)",
            border: "1px solid rgba(232,71,42,0.3)",
            color: "var(--color-fp-accent)",
          }}
        >
          {error}
        </div>
      )}

      {/* Add User Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddUser}
          className="mb-5 rounded-[14px] p-4"
          style={{
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid var(--color-fp-line)",
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label
                className="block font-[var(--font-fp-mono)] text-[10px] tracking-[0.2em] uppercase mb-2"
                style={{ color: "var(--color-fp-ink-3)" }}
              >
                Email Address
              </label>
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="user@sunritesolarllc.com"
                required
                className="w-full px-4 py-2.5 font-mono text-[13px] focus:outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label
                className="block font-[var(--font-fp-mono)] text-[10px] tracking-[0.2em] uppercase mb-2"
                style={{ color: "var(--color-fp-ink-3)" }}
              >
                Role
              </label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                className="w-full px-4 py-2.5 font-[var(--font-fp-sans)] text-[13px] focus:outline-none"
                style={inputStyle}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role} style={{ backgroundColor: "#0C0C10" }}>
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
              className="rounded-full px-5 py-2 font-[var(--font-fp-mono)] text-[11px] font-bold tracking-[0.1em] uppercase transition-opacity disabled:opacity-40"
              style={{ backgroundColor: "var(--color-fp-accent)", color: "#fff" }}
            >
              {addingUser ? "Adding..." : "Add User"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-full px-5 py-2 font-[var(--font-fp-mono)] text-[11px] font-bold tracking-[0.1em] uppercase"
              style={{
                border: "1px solid var(--color-fp-line)",
                color: "var(--color-fp-ink-2)",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Users Table */}
      {users.length === 0 ? (
        <div
          className="text-center py-8 font-[var(--font-fp-mono)] text-[11px]"
          style={{ color: "var(--color-fp-ink-3)" }}
        >
          No users found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-fp-line)" }}>
                {["Email", "Name", "Role", "Region", "Team", "Status", "Actions"].map((h, i) => (
                  <th
                    key={h}
                    className={`py-3 px-2 font-[var(--font-fp-mono)] text-[10px] tracking-[0.1em] uppercase ${
                      i === 6 ? "text-right" : "text-left"
                    }`}
                    style={{ color: "var(--color-fp-ink-3)" }}
                  >
                    {h}
                  </th>
                ))}
            </tr>
          </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="transition-colors"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <td
                    className="py-3 px-2 font-mono text-[12px]"
                    style={{ color: "var(--color-fp-ink-2)" }}
                  >
                    {user.email}
                  </td>
                  <td
                    className="py-3 px-2 font-[var(--font-fp-sans)] text-[13px]"
                    style={{ color: "var(--color-fp-ink-2)" }}
                  >
                    {user.full_name || "—"}
                  </td>
                  <td className="py-3 px-2">
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
                      className="rounded-[8px] px-2 py-1 font-[var(--font-fp-sans)] text-[12px] focus:outline-none"
                      style={inputStyle}
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role} style={{ backgroundColor: "#0C0C10" }}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-2">
                    <input
                      defaultValue={user.region ?? ""}
                      onBlur={(e) => {
                        if (e.target.value !== (user.region ?? ""))
                          handleUpdateField(user.id, "region", e.target.value);
                      }}
                      placeholder="—"
                      className="w-20 rounded-[6px] px-2 py-1 font-[var(--font-fp-sans)] text-[12px] focus:outline-none"
                      style={inputStyle}
                    />
                  </td>
                  <td className="py-3 px-2">
                    <input
                      defaultValue={user.team ?? ""}
                      onBlur={(e) => {
                        if (e.target.value !== (user.team ?? ""))
                          handleUpdateField(user.id, "team", e.target.value);
                      }}
                      placeholder="—"
                      className="w-20 rounded-[6px] px-2 py-1 font-[var(--font-fp-sans)] text-[12px] focus:outline-none"
                      style={inputStyle}
                    />
                  </td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => handleToggleStatus(user.id, user.status)}
                      className="rounded-full px-3 py-1 font-[var(--font-fp-mono)] text-[10px] tracking-[0.1em] uppercase"
                      style={{
                        backgroundColor:
                          user.status === "active"
                            ? "rgba(76,175,80,0.15)"
                            : "rgba(232,71,42,0.15)",
                        border:
                          user.status === "active"
                            ? "1px solid rgba(76,175,80,0.3)"
                            : "1px solid rgba(232,71,42,0.3)",
                        color:
                          user.status === "active" ? "#66BB6A" : "var(--color-fp-accent)",
                      }}
                    >
                      {user.status}
                    </button>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.1em] uppercase"
                      style={{ color: "var(--color-fp-accent)" }}
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
