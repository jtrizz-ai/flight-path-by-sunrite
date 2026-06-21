"use client";

import { useEffect, useState } from "react";
import {
  AdminCard,
  EmptyState,
  SectionHeader,
} from "@/components/admin/ui";

type Stats = {
  user: {
    email: string;
    full_name: string | null;
    region: string | null;
    team: string | null;
    role: string;
    status: string;
    app_open_count: number;
    last_app_open_at: string | null;
    last_active_at: string;
    created_at: string;
  };
  tally: Record<string, number>;
  quarterlyTally: Record<string, number>;
  quarter: number;
  year: number;
  recentViews: Array<{ path: string; title: string | null; created_at: string }>;
  badges: Array<{
    name: string;
    slug: string;
    is_quarterly: boolean;
    quarter: number | null;
    year: number | null;
    awarded_at: string;
  }>;
};

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function UserStatsSection({ userId }: { userId: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [failed, setFailed] = useState(false);
  const [loadedFor, setLoadedFor] = useState("");

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetch(`/api/admin/users/${userId}/stats`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setStats(d);
        setFailed(false);
        setLoadedFor(userId);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!userId) {
    return (
      <AdminCard>
        <SectionHeader title="Activity" subtitle="App opens, tally totals, page views, and badges." />
        <EmptyState message="Select a member to view activity." />
      </AdminCard>
    );
  }

  const loading = loadedFor !== userId && !failed;

  return (
    <AdminCard>
      <SectionHeader title="Activity" subtitle="App opens, tally totals, page views, and badges." />

      {loading ? (
        <EmptyState message="Loading..." />
      ) : failed ? (
        <EmptyState message="Failed to load stats." />
      ) : stats ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatBox label="App Opens" value={String(stats.user.app_open_count)} />
            <StatBox label="Last Active" value={timeAgo(stats.user.last_active_at)} />
            <StatBox label="Last App Open" value={timeAgo(stats.user.last_app_open_at)} />
            <StatBox label="Joined" value={timeAgo(stats.user.created_at)} />
          </div>

          <div>
            <SectionLabel>All-Time Tally</SectionLabel>
            <div className="grid grid-cols-3 gap-3">
              <StatBox label="Doors" value={String(stats.tally.doors || 0)} accent />
              <StatBox label="Conversations" value={String(stats.tally.conversations || 0)} accent />
              <StatBox label="Appointments" value={String(stats.tally.appointments || 0)} accent />
            </div>
          </div>

          <div>
            <SectionLabel>
              Q{stats.quarter} {stats.year} Tally
            </SectionLabel>
            <div className="grid grid-cols-3 gap-3">
              <StatBox label="Doors" value={String(stats.quarterlyTally.doors || 0)} />
              <StatBox label="Conversations" value={String(stats.quarterlyTally.conversations || 0)} />
              <StatBox label="Appointments" value={String(stats.quarterlyTally.appointments || 0)} />
            </div>
          </div>

          {stats.badges.length > 0 && (
            <div>
              <SectionLabel>Badges ({stats.badges.length})</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {stats.badges.map((b, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-full px-3 py-1.5 font-[var(--font-fp-mono)] text-[10px] tracking-[0.1em] uppercase"
                    style={{
                      backgroundColor: "rgba(232,71,42,0.08)",
                      border: "1px solid rgba(232,71,42,0.3)",
                      color: "var(--color-fp-ink)",
                    }}
                  >
                    {b.name}
                    {b.is_quarterly && (b.quarter || b.year) && (
                      <span style={{ color: "var(--color-fp-accent-2)" }} className="ml-1.5">
                        Q{b.quarter} {b.year}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <SectionLabel>Recent Page Views ({stats.recentViews.length})</SectionLabel>
            {stats.recentViews.length === 0 ? (
              <div
                className="font-[var(--font-fp-mono)] text-[11px] py-2"
                style={{ color: "var(--color-fp-ink-3)" }}
              >
                No page views recorded yet.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {stats.recentViews.map((v, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-[8px] px-3 py-2"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--color-fp-line)",
                    }}
                  >
                    <span
                      className="font-mono text-[11px] truncate"
                      style={{ color: "var(--color-fp-ink-2)" }}
                    >
                      {v.title || v.path}
                    </span>
                    <span
                      className="font-[var(--font-fp-mono)] text-[9px] tracking-[0.1em] uppercase shrink-0 ml-2"
                      style={{ color: "var(--color-fp-ink-3)" }}
                    >
                      {timeAgo(v.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </AdminCard>
  );
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-[12px] px-3 py-2.5"
      style={{
        backgroundColor: "rgba(255,255,255,0.03)",
        border: "1px solid var(--color-fp-line)",
      }}
    >
      <div
        className="font-[var(--font-fp-mono)] text-[9px] tracking-[0.15em] uppercase mb-1"
        style={{ color: "var(--color-fp-ink-3)" }}
      >
        {label}
      </div>
      <div
        className="font-[var(--font-fp-display)] text-2xl leading-none"
        style={{ color: accent ? "var(--color-fp-accent-2)" : "var(--color-fp-ink)" }}
      >
        {value}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.2em] uppercase mb-2.5"
      style={{ color: "var(--color-fp-ink-3)" }}
    >
      {children}
    </div>
  );
}
