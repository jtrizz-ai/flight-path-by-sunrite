"use client";

import { useState } from "react";
import {
  AdminCard,
  AdminButton,
  ToastProvider,
} from "@/components/admin/ui";
import { AdminUsersProvider } from "./AdminUsersContext";
import { MembersSection } from "./MembersSection";
import { AccessSection } from "./AccessSection";
import { ContentSection } from "./ContentSection";
import { UserManagementSection } from "../components/UserManagementSection";
import { LlmConfigSection } from "../components/LlmConfigSection";

export type AdminStats = {
  totalPages: number;
  hiddenPages: number;
  lastSync: string | null;
};

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "members", label: "Members" },
  { id: "access", label: "Access" },
  { id: "content", label: "Content" },
  { id: "ai", label: "AI Config" },
] as const;

type AdminTab = (typeof TABS)[number]["id"];

export function AdminShell({ stats }: { stats: AdminStats }) {
  const [tab, setTab] = useState<AdminTab>("overview");

  return (
    <ToastProvider>
      <AdminUsersProvider>
        <div className="flex-1 flex min-h-0">
          {/* Desktop rail */}
          <aside
            className="hidden md:flex flex-col w-56 shrink-0 p-4 gap-1"
            style={{ borderRight: "1px solid var(--color-fp-line)" }}
          >
            {TABS.map((t) => (
              <TabButton
                key={t.id}
                label={t.label}
                active={tab === t.id}
                onClick={() => setTab(t.id)}
              />
            ))}
          </aside>

          <div className="flex-1 flex flex-col min-w-0">
            {/* Mobile tab strip */}
            <div
              className="md:hidden flex gap-1 overflow-x-auto px-3 py-3"
              style={{ borderBottom: "1px solid var(--color-fp-line)" }}
            >
              {TABS.map((t) => (
                <MobileTabButton
                  key={t.id}
                  label={t.label}
                  active={tab === t.id}
                  onClick={() => setTab(t.id)}
                />
              ))}
            </div>

            <main className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-5xl px-5 py-10 md:py-12">
                {/* Title */}
                <div className="mb-8">
                  <div
                    className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.34em] uppercase mb-2"
                    style={{ color: "var(--color-fp-ink-3)" }}
                  >
                    ADMINISTRATION
                  </div>
                  <h1
                    className="font-[var(--font-fp-display)] text-4xl md:text-5xl uppercase leading-[0.92]"
                    style={{ color: "var(--color-fp-ink)" }}
                  >
                    Admin Portal
                  </h1>
                  <p
                    className="font-[var(--font-fp-mono)] text-[11px] tracking-[0.06em] mt-2"
                    style={{ color: "var(--color-fp-ink-2)" }}
                  >
                    Manage content, users, and access settings
                  </p>
                </div>

                {tab === "overview" && (
                  <OverviewTab stats={stats} onJump={setTab} />
                )}
                {tab === "users" && <UserManagementSection />}
                {tab === "members" && <MembersSection />}
                {tab === "access" && <AccessSection />}
                {tab === "content" && (
                  <ContentSection initialLastSync={stats.lastSync} />
                )}
                {tab === "ai" && <LlmConfigSection />}
              </div>
            </main>
          </div>
        </div>
      </AdminUsersProvider>
    </ToastProvider>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-[10px] px-3 py-2.5 font-[var(--font-fp-mono)] text-[11px] tracking-[0.1em] uppercase transition-colors"
      style={{
        backgroundColor: active ? "rgba(255,255,255,0.05)" : "transparent",
        color: active ? "var(--color-fp-ink)" : "var(--color-fp-ink-3)",
        borderLeft: active
          ? "2px solid var(--color-fp-accent)"
          : "2px solid transparent",
      }}
    >
      {label}
    </button>
  );
}

function MobileTabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 rounded-full px-4 py-2 font-[var(--font-fp-mono)] text-[10px] tracking-[0.1em] uppercase"
      style={{
        backgroundColor: active ? "var(--color-fp-accent)" : "rgba(255,255,255,0.04)",
        color: active ? "#fff" : "var(--color-fp-ink-3)",
        border: active ? "none" : "1px solid var(--color-fp-line)",
      }}
    >
      {label}
    </button>
  );
}

function OverviewTab({
  stats,
  onJump,
}: {
  stats: AdminStats;
  onJump: (t: AdminTab) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <OverviewStat label="Total Pages" value={String(stats.totalPages)} />
        <OverviewStat
          label="Hidden Pages"
          value={String(stats.hiddenPages)}
          accent
        />
        <OverviewStat
          label="Last Sync"
          value={
            stats.lastSync
              ? new Date(stats.lastSync).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "Never"
          }
        />
      </div>

      <AdminCard>
        <div
          className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.2em] uppercase mb-4"
          style={{ color: "var(--color-fp-ink-3)" }}
        >
          Quick Actions
        </div>
        <div className="flex flex-wrap gap-3">
          <AdminButton onClick={() => onJump("users")}>Manage Users</AdminButton>
          <AdminButton variant="secondary" onClick={() => onJump("members")}>
            Manage Badges
          </AdminButton>
          <AdminButton variant="secondary" onClick={() => onJump("access")}>
            Domains &amp; Invites
          </AdminButton>
          <AdminButton variant="secondary" onClick={() => onJump("content")}>
            Sync Content
          </AdminButton>
          <AdminButton variant="secondary" onClick={() => onJump("ai")}>
            AI Config
          </AdminButton>
        </div>
      </AdminCard>
    </div>
  );
}

function OverviewStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <AdminCard>
      <div
        className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.2em] uppercase mb-2"
        style={{ color: "var(--color-fp-ink-3)" }}
      >
        {label}
      </div>
      <div
        className="font-[var(--font-fp-display)] text-3xl md:text-4xl"
        style={{ color: accent ? "var(--color-fp-accent)" : "var(--color-fp-ink)" }}
      >
        {value}
      </div>
    </AdminCard>
  );
}
