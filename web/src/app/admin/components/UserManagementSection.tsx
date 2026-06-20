"use client";

import { useMemo, useState } from "react";
import type { AppUser, UserRole, UserStatus } from "@/lib/types";
import { useAdminUsers } from "@/app/admin/_components/AdminUsersContext";
import {
  AdminButton,
  AdminCard,
  AdminInput,
  AdminSelect,
  EmptyState,
  ErrorBanner,
  FieldLabel,
  ConfirmDialog,
  SectionHeader,
  useToast,
} from "@/components/admin/ui";
import { UserDetailDrawer } from "./UserDetailDrawer";

const ROLES: UserRole[] = [
  "Admin",
  "Manager",
  "Team Lead",
  "Sales",
  "Field Marketer",
];

const PAGE_SIZE = 8;

export function UserManagementSection() {
  const { users, loading, error, reload, setUsers } = useAdminUsers();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AppUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("Field Marketer");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Derived filter option lists.
  const regions = useMemo(
    () => Array.from(new Set(users.map((u) => u.region).filter(Boolean))) as string[],
    [users]
  );
  const teams = useMemo(
    () => Array.from(new Set(users.map((u) => u.team).filter(Boolean))) as string[],
    [users]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (q) {
        const hay = `${u.email} ${u.full_name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (regionFilter !== "all" && (u.region ?? "") !== regionFilter) return false;
      if (teamFilter !== "all" && (u.team ?? "") !== teamFilter) return false;
      return true;
    });
  }, [users, search, roleFilter, statusFilter, regionFilter, teamFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const selectedUser =
    users.find((u) => u.id === selectedUserId) ?? null;

  function openUser(user: AppUser) {
    setSelectedUserId(user.id);
  }

  function handleSaved(updated: AppUser) {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim(), role: newRole }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to add user");
      }
      await reload();
      setNewEmail("");
      setNewRole("Field Marketer");
      setShowAddForm(false);
      toast.show("User added", "success");
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setAdding(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${pendingDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to delete user");
      }
      setUsers((prev) => prev.filter((u) => u.id !== pendingDelete.id));
      if (selectedUserId === pendingDelete.id) setSelectedUserId(null);
      toast.show("User removed", "success");
      setPendingDelete(null);
    } catch (err) {
      toast.show(
        err instanceof Error ? err.message : "Failed to delete",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  }

  const hasActiveFilters =
    !!search.trim() ||
    roleFilter !== "all" ||
    statusFilter !== "all" ||
    regionFilter !== "all" ||
    teamFilter !== "all";

  function clearFilters() {
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
    setRegionFilter("all");
    setTeamFilter("all");
  }

  return (
    <>
      <AdminCard>
        <SectionHeader
          title="Users"
          subtitle="Search, filter, and edit roles, status, region, and team."
          action={
            <AdminButton size="sm" onClick={() => setShowAddForm((v) => !v)}>
              {showAddForm ? "Cancel" : "+ Add User"}
            </AdminButton>
          }
        />

        {error && <ErrorBanner message={error} />}

        {/* Add user form */}
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
                <FieldLabel>Email Address</FieldLabel>
                <AdminInput
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@sunritesolarllc.com"
                  required
                />
              </div>
              <div>
                <FieldLabel>Role</FieldLabel>
                <AdminSelect
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r} style={{ backgroundColor: "#0C0C10" }}>
                      {r}
                    </option>
                  ))}
                </AdminSelect>
              </div>
            </div>
            {addError && <div className="mt-3"><ErrorBanner message={addError} /></div>}
            <div className="mt-4 flex gap-3">
              <AdminButton type="submit" disabled={adding}>
                {adding ? "Adding..." : "Add User"}
              </AdminButton>
              <AdminButton
                type="button"
                variant="secondary"
                onClick={() => setShowAddForm(false)}
                disabled={adding}
              >
                Cancel
              </AdminButton>
            </div>
          </form>
        )}

        {/* Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
          <div className="lg:col-span-2">
            <AdminInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name or email..."
            />
          </div>
          <AdminSelect
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as "all" | UserRole);
              setPage(1);
            }}
            className="w-full"
          >
            <option value="all" style={{ backgroundColor: "#0C0C10" }}>All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r} style={{ backgroundColor: "#0C0C10" }}>{r}</option>
            ))}
          </AdminSelect>
          <AdminSelect
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "all" | UserStatus);
              setPage(1);
            }}
            className="w-full"
          >
            <option value="all" style={{ backgroundColor: "#0C0C10" }}>All status</option>
            <option value="active" style={{ backgroundColor: "#0C0C10" }}>Active</option>
            <option value="paused" style={{ backgroundColor: "#0C0C10" }}>Paused</option>
          </AdminSelect>
          <div className="flex gap-2">
            <AdminSelect
              value={regionFilter}
              onChange={(e) => {
                setRegionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full"
            >
              <option value="all" style={{ backgroundColor: "#0C0C10" }}>All regions</option>
              {regions.map((r) => (
                <option key={r} value={r} style={{ backgroundColor: "#0C0C10" }}>{r}</option>
              ))}
            </AdminSelect>
            <AdminSelect
              value={teamFilter}
              onChange={(e) => {
                setTeamFilter(e.target.value);
                setPage(1);
              }}
              className="w-full"
            >
              <option value="all" style={{ backgroundColor: "#0C0C10" }}>All teams</option>
              {teams.map((t) => (
                <option key={t} value={t} style={{ backgroundColor: "#0C0C10" }}>{t}</option>
              ))}
            </AdminSelect>
          </div>
        </div>

        {/* Result count + clear */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.15em] uppercase"
            style={{ color: "var(--color-fp-ink-3)" }}
          >
            {filtered.length} {filtered.length === 1 ? "user" : "users"}
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.1em] uppercase"
              style={{ color: "var(--color-fp-accent-2)" }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table / states */}
        {loading ? (
          <EmptyState message="Loading users..." />
        ) : filtered.length === 0 ? (
          <EmptyState message={hasActiveFilters ? "No users match your filters." : "No users found."} />
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-fp-line)" }}>
                  {["Name", "Role", "Region", "Team", "Status"].map((h) => (
                    <th
                      key={h}
                      className="py-3 px-2 text-left font-[var(--font-fp-mono)] text-[10px] tracking-[0.1em] uppercase"
                      style={{ color: "var(--color-fp-ink-3)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => openUser(u)}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <td className="py-3 px-2">
                      <div
                        className="font-[var(--font-fp-sans)] text-[13px] leading-tight"
                        style={{ color: "var(--color-fp-ink)" }}
                      >
                        {u.full_name || "—"}
                      </div>
                      <div
                        className="font-mono text-[11px]"
                        style={{ color: "var(--color-fp-ink-3)" }}
                      >
                        {u.email}
                      </div>
                    </td>
                    <td
                      className="py-3 px-2 font-[var(--font-fp-sans)] text-[12px]"
                      style={{ color: "var(--color-fp-ink-2)" }}
                    >
                      {u.role}
                    </td>
                    <td
                      className="py-3 px-2 font-[var(--font-fp-sans)] text-[12px]"
                      style={{ color: "var(--color-fp-ink-2)" }}
                    >
                      {u.region || "—"}
                    </td>
                    <td
                      className="py-3 px-2 font-[var(--font-fp-sans)] text-[12px]"
                      style={{ color: "var(--color-fp-ink-2)" }}
                    >
                      {u.team || "—"}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className="inline-flex rounded-full px-3 py-1 font-[var(--font-fp-mono)] text-[10px] tracking-[0.1em] uppercase"
                        style={{
                          backgroundColor:
                            u.status === "active"
                              ? "rgba(76,175,80,0.15)"
                              : "rgba(232,71,42,0.15)",
                          border:
                            u.status === "active"
                              ? "1px solid rgba(76,175,80,0.3)"
                              : "1px solid rgba(232,71,42,0.3)",
                          color:
                            u.status === "active"
                              ? "#66BB6A"
                              : "var(--color-fp-accent)",
                        }}
                      >
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-4">
            <span
              className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.1em] uppercase"
              style={{ color: "var(--color-fp-ink-3)" }}
            >
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length}
            </span>
            <div className="flex gap-2">
              <AdminButton
                variant="secondary"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </AdminButton>
              <AdminButton
                variant="secondary"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </AdminButton>
            </div>
          </div>
        )}
      </AdminCard>

      <UserDetailDrawer
        user={selectedUser}
        open={!!selectedUser}
        onClose={() => setSelectedUserId(null)}
        onSaved={handleSaved}
        onRequestDelete={(u) => setPendingDelete(u)}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Remove user?"
        message={
          pendingDelete
            ? `This permanently removes ${pendingDelete.email} from Flight Path. This cannot be undone.`
            : ""
        }
        confirmLabel="Remove"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setPendingDelete(null)}
      />
    </>
  );
}
