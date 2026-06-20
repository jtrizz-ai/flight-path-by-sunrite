"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { AppUser, UserRole, UserStatus } from "@/lib/types";
import {
  AdminButton,
  AdminInput,
  AdminSelect,
  FieldLabel,
  useToast,
} from "@/components/admin/ui";

const ROLES: UserRole[] = [
  "Admin",
  "Manager",
  "Team Lead",
  "Sales",
  "Field Marketer",
];

export function UserDetailDrawer({
  user,
  open,
  onClose,
  onSaved,
  onRequestDelete,
}: {
  user: AppUser | null;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: AppUser) => void;
  onRequestDelete?: (user: AppUser) => void;
}) {
  if (!open || !user || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="ml-auto h-full w-full max-w-md overflow-y-auto p-6 shadow-2xl"
        style={{
          backgroundColor: "var(--color-fp-bg-2)",
          borderLeft: "1px solid var(--color-fp-card-line)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Remount on user change so form state initializes cleanly (no prop-sync effect). */}
        <DrawerForm
          key={user.id}
          user={user}
          onClose={onClose}
          onSaved={onSaved}
          onRequestDelete={onRequestDelete}
        />
      </div>
    </div>,
    document.body
  );
}

function DrawerForm({
  user,
  onClose,
  onSaved,
  onRequestDelete,
}: {
  user: AppUser;
  onClose: () => void;
  onSaved: (updated: AppUser) => void;
  onRequestDelete?: (user: AppUser) => void;
}) {
  const toast = useToast();
  const [role, setRole] = useState<UserRole>(user.role);
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [region, setRegion] = useState(user.region ?? "");
  const [team, setTeam] = useState(user.team ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saving, onClose]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, status, region, team }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to save");
      }
      const d = await res.json();
      onSaved(d.user as AppUser);
      toast.show("User updated", "success");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div
          className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.34em] uppercase"
          style={{ color: "var(--color-fp-ink-3)" }}
        >
          Edit User
        </div>
        <button
          onClick={() => !saving && onClose()}
          className="font-[var(--font-fp-mono)] text-[12px]"
          style={{ color: "var(--color-fp-ink-3)" }}
        >
          ESC ✕
        </button>
      </div>

      <div className="mb-6">
        <div
          className="font-[var(--font-fp-display)] text-2xl uppercase leading-tight"
          style={{ color: "var(--color-fp-ink)" }}
        >
          {user.full_name || "—"}
        </div>
        <div
          className="font-mono text-[12px] mt-1"
          style={{ color: "var(--color-fp-ink-2)" }}
        >
          {user.email}
        </div>
      </div>

      <div className="space-y-4">
        <label className="block">
          <FieldLabel>Role</FieldLabel>
          <AdminSelect
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full"
          >
            {ROLES.map((r) => (
              <option key={r} value={r} style={{ backgroundColor: "#0C0C10" }}>
                {r}
              </option>
            ))}
          </AdminSelect>
        </label>

        <div>
          <FieldLabel>Status</FieldLabel>
          <div className="flex gap-2">
            {(["active", "paused"] as UserStatus[]).map((s) => {
              const active = status === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className="flex-1 rounded-[14px] px-4 py-2.5 font-[var(--font-fp-mono)] text-[11px] font-bold tracking-[0.1em] uppercase transition-opacity"
                  style={{
                    backgroundColor: active
                      ? s === "active"
                        ? "rgba(76,175,80,0.15)"
                        : "rgba(232,71,42,0.15)"
                      : "rgba(255,255,255,0.03)",
                    border: active
                      ? s === "active"
                        ? "1px solid rgba(76,175,80,0.4)"
                        : "1px solid rgba(232,71,42,0.4)"
                      : "1px solid var(--color-fp-line)",
                    color: active
                      ? s === "active"
                        ? "#66BB6A"
                        : "var(--color-fp-accent)"
                      : "var(--color-fp-ink-3)",
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <FieldLabel>Region</FieldLabel>
            <AdminInput
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="—"
            />
          </label>
          <label className="block">
            <FieldLabel>Team</FieldLabel>
            <AdminInput
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder="—"
            />
          </label>
        </div>
      </div>

      {error && (
        <div
          className="mt-5 rounded-[10px] px-4 py-3 font-[var(--font-fp-sans)] text-[13px]"
          style={{
            backgroundColor: "rgba(232,71,42,0.08)",
            border: "1px solid rgba(232,71,42,0.3)",
            color: "var(--color-fp-accent)",
          }}
        >
          {error}
        </div>
      )}

      <div className="flex gap-3 mt-7">
        <AdminButton variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </AdminButton>
        <AdminButton variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </AdminButton>
      </div>

      {onRequestDelete && (
        <div
          className="mt-8 pt-5"
          style={{ borderTop: "1px solid var(--color-fp-line)" }}
        >
          <button
            type="button"
            disabled={saving}
            onClick={() => onRequestDelete(user)}
            className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.1em] uppercase transition-opacity disabled:opacity-40"
            style={{ color: "var(--color-fp-accent)" }}
          >
            Remove user
          </button>
        </div>
      )}
    </>
  );
}
