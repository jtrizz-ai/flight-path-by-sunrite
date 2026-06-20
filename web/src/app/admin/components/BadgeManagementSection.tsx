"use client";

import { useCallback, useEffect, useState } from "react";
import type { Badge } from "@/lib/types";
import {
  AdminCard,
  AdminSelect,
  EmptyState,
  ErrorBanner,
  SectionHeader,
  useToast,
} from "@/components/admin/ui";

type EarnedBadge = {
  id: string;
  badge_id: string;
  quarter: number | null;
  year: number | null;
  awarded_at: string;
};

const QUARTERS = [1, 2, 3, 4];

function currentQuarter() {
  return Math.floor(new Date().getMonth() / 3) + 1;
}
function currentYear() {
  return new Date().getFullYear();
}

export function BadgeManagementSection({ userId }: { userId: string }) {
  const toast = useToast();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earned, setEarned] = useState<EarnedBadge[]>([]);
  const [loadedFor, setLoadedFor] = useState("");
  const [quarter, setQuarter] = useState(currentQuarter());
  const [year, setYear] = useState(currentYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/badges")
      .then((r) => r.json())
      .then((d) => setBadges(d.badges || []))
      .catch(() => {});
  }, []);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}/badges`, {
        cache: "no-store",
      });
      if (res.ok) {
        const d = await res.json();
        setEarned(d.badges || []);
        setLoadedFor(userId);
      }
    } catch {
      /* ignore */
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetch(`/api/admin/users/${userId}/badges`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (cancelled) return;
        setEarned(d.badges || []);
        setLoadedFor(userId);
      })
      .catch(() => {
        /* leave existing */
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function awardBadge(badge: Badge) {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { badgeId: badge.id };
      if (badge.is_quarterly) {
        body.quarter = quarter;
        body.year = year;
      }
      const res = await fetch(`/api/admin/users/${userId}/badges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to award badge");
      await refresh();
      toast.show(`Awarded: ${badge.name}`, "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function revokeBadge(badgeId: string, q: number | null, y: number | null) {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q !== null) params.set("quarter", String(q));
      if (y !== null) params.set("year", String(y));
      const res = await fetch(
        `/api/admin/users/${userId}/badges/${badgeId}?${params}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to revoke badge");
      await refresh();
      toast.show("Badge revoked", "success");
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

  if (!userId) {
    return (
      <AdminCard>
        <SectionHeader
          title="Badges"
          subtitle="Award and revoke badges. Quarterly badges are tied to a quarter + year."
        />
        <EmptyState message="Select a member to manage badges." />
      </AdminCard>
    );
  }

  return (
    <AdminCard>
      <SectionHeader
        title="Badges"
        subtitle="Award and revoke badges. Quarterly badges are tied to a quarter + year."
        action={
          <div className="flex gap-2">
            <AdminSelect
              value={quarter}
              onChange={(e) => setQuarter(Number(e.target.value))}
            >
              {QUARTERS.map((q) => (
                <option key={q} value={q} style={{ backgroundColor: "#0C0C10" }}>
                  Q{q}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {[currentYear(), currentYear() - 1].map((y) => (
                <option key={y} value={y} style={{ backgroundColor: "#0C0C10" }}>
                  {y}
                </option>
              ))}
            </AdminSelect>
          </div>
        }
      />

      {error && <ErrorBanner message={error} />}

      {loadedFor !== userId ? (
        <EmptyState message="Loading badges..." />
      ) : badges.length === 0 ? (
        <EmptyState message="No badge definitions found." />
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
                    backgroundColor: isAwarded
                      ? "rgba(232,71,42,0.1)"
                      : "var(--color-fp-accent)",
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
    </AdminCard>
  );
}
