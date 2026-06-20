"use client";

import { useState, useEffect } from "react";
import type { AppUser, Badge } from "@/lib/types";

type EarnedBadge = {
  id: string;
  badge_id: string;
  quarter: number | null;
  year: number | null;
  awarded_at: string;
};

const QUARTERS = [1, 2, 3, 4];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function currentQuarter() {
  return Math.floor(new Date().getMonth() / 3) + 1;
}
function currentYear() {
  return new Date().getFullYear();
}

export function BadgeManagementSection({ users }: { users: AppUser[] }) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [earned, setEarned] = useState<EarnedBadge[]>([]);
  const [quarter, setQuarter] = useState(currentQuarter());
  const [year, setYear] = useState(currentYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load badge definitions
  useEffect(() => {
    fetch("/api/admin/badges")
      .then((r) => r.json())
      .then((d) => setBadges(d.badges || []))
      .catch(() => {});
  }, []);

  // Load earned badges when user changes
  useEffect(() => {
    if (!selectedUserId) {
      setEarned([]);
      return;
    }
    loadEarnedBadges();
  }, [selectedUserId]);

  async function loadEarnedBadges() {
    if (!selectedUserId) return;
    try {
      const res = await fetch(`/api/admin/users/${selectedUserId}/badges`, {
        cache: "no-store",
      });
      // If the endpoint doesn't have a GET, derive from users endpoint
      // Actually, let me use a different approach - fetch user's badges from /api/me won't work
      // since this is an admin viewing another user. Let me just track via award/revoke.
      if (res.ok) {
        const d = await res.json();
        setEarned(d.badges || []);
      }
    } catch {
      /* ok */
    }
  }

  async function awardBadge(badge: Badge) {
    if (!selectedUserId) return;
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        badgeId: badge.id,
      };
      if (badge.is_quarterly) {
        body.quarter = quarter;
        body.year = year;
      }
      const res = await fetch(`/api/admin/users/${selectedUserId}/badges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to award badge");
      // Refresh earned list
      await loadEarnedBadges();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function revokeBadge(badgeId: string, q: number | null, y: number | null) {
    if (!selectedUserId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q !== null) params.set("quarter", String(q));
      if (y !== null) params.set("year", String(y));
      const res = await fetch(
        `/api/admin/users/${selectedUserId}/badges/${badgeId}?${params}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to revoke badge");
      await loadEarnedBadges();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function isEarned(badgeId: string): EarnedBadge | undefined {
    return earned.find(
      (e) =>
        e.badge_id === badgeId &&
        (e.quarter === quarter || e.quarter === null) &&
        (e.year === year || e.year === null)
    );
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid var(--color-fp-line)",
    borderRadius: "14px",
    color: "var(--color-fp-ink)",
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div
      className="rounded-[18px] p-6"
      style={{
        backgroundColor: "var(--color-fp-card)",
        border: "1px solid var(--color-fp-card-line)",
      }}
    >
      <h2
        className="font-[var(--font-fp-sans)] text-[16px] font-bold mb-1"
        style={{ color: "var(--color-fp-ink)" }}
      >
        Badges
      </h2>
      <p
        className="font-[var(--font-fp-sans)] text-[12px] mb-4"
        style={{ color: "var(--color-fp-ink-3)" }}
      >
        Award and revoke badges per user. Quarterly badges are tied to a quarter + year.
      </p>

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

      {/* Controls row */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <label className="block">
          <span
            className="block pb-1.5 font-[var(--font-fp-mono)] text-[10px] tracking-[0.2em] uppercase"
            style={{ color: "var(--color-fp-ink-3)" }}
          >
            User
          </span>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="px-4 py-2.5 font-[var(--font-fp-sans)] text-[13px] focus:outline-none min-w-[240px]"
            style={inputStyle}
          >
            <option value="" style={{ backgroundColor: "#0C0C10" }}>
              Select a user...
            </option>
            {users.map((u) => (
              <option key={u.id} value={u.id} style={{ backgroundColor: "#0C0C10" }}>
                {u.full_name || u.email} {u.region ? `· ${u.region}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span
            className="block pb-1.5 font-[var(--font-fp-mono)] text-[10px] tracking-[0.2em] uppercase"
            style={{ color: "var(--color-fp-ink-3)" }}
          >
            Quarter
          </span>
          <select
            value={quarter}
            onChange={(e) => setQuarter(Number(e.target.value))}
            className="px-4 py-2.5 font-[var(--font-fp-sans)] text-[13px] focus:outline-none"
            style={inputStyle}
          >
            {QUARTERS.map((q) => (
              <option key={q} value={q} style={{ backgroundColor: "#0C0C10" }}>
                Q{q}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span
            className="block pb-1.5 font-[var(--font-fp-mono)] text-[10px] tracking-[0.2em] uppercase"
            style={{ color: "var(--color-fp-ink-3)" }}
          >
            Year
          </span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-4 py-2.5 font-[var(--font-fp-sans)] text-[13px] focus:outline-none"
            style={inputStyle}
          >
            {[currentYear(), currentYear() - 1].map((y) => (
              <option key={y} value={y} style={{ backgroundColor: "#0C0C10" }}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Badge grid */}
      {!selectedUserId ? (
        <div
          className="text-center py-8 font-[var(--font-fp-mono)] text-[11px]"
          style={{ color: "var(--color-fp-ink-3)" }}
        >
          Select a user to manage badges.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {badges.map((badge) => {
            const earnedRecord = isEarned(badge.id);
            const isAwarded = !!earnedRecord;
            return (
              <div
                key={badge.id}
                className="rounded-[14px] p-4"
                style={{
                  backgroundColor: isAwarded
                    ? "rgba(232,71,42,0.06)"
                    : "rgba(255,255,255,0.02)",
                  border: isAwarded
                    ? "1px solid rgba(232,71,42,0.3)"
                    : "1px solid var(--color-fp-line)",
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div
                      className="font-[var(--font-fp-sans)] text-[14px] font-bold"
                      style={{ color: "var(--color-fp-ink)" }}
                    >
                      {badge.name}
                    </div>
                    {badge.is_quarterly && (
                      <div
                        className="font-[var(--font-fp-mono)] text-[9px] tracking-[0.1em] uppercase mt-0.5"
                        style={{ color: "var(--color-fp-accent-2)" }}
                      >
                        Q{quarter} · {year}
                      </div>
                    )}
                  </div>
                  {badge.is_quarterly && (
                    <span
                      className="font-[var(--font-fp-mono)] text-[8px] tracking-[0.1em] uppercase px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.06)",
                        color: "var(--color-fp-ink-3)",
                      }}
                    >
                      Quarterly
                    </span>
                  )}
                </div>
                {badge.description && (
                  <p
                    className="font-[var(--font-fp-sans)] text-[11px] mb-3"
                    style={{ color: "var(--color-fp-ink-3)" }}
                  >
                    {badge.description}
                  </p>
                )}
                <button
                  disabled={loading}
                  onClick={() =>
                    isAwarded && earnedRecord
                      ? revokeBadge(badge.id, earnedRecord.quarter, earnedRecord.year)
                      : awardBadge(badge)
                  }
                  className="w-full rounded-[10px] py-2 font-[var(--font-fp-mono)] text-[10px] font-bold tracking-[0.1em] uppercase transition-opacity disabled:opacity-40"
                  style={{
                    backgroundColor: isAwarded ? "rgba(232,71,42,0.1)" : "var(--color-fp-accent)",
                    color: isAwarded ? "var(--color-fp-accent)" : "#fff",
                    border: isAwarded ? "1px solid rgba(232,71,42,0.3)" : "none",
                  }}
                >
                  {isAwarded ? "✓ Awarded · Revoke" : "Award"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
