"use client";

import { useState } from "react";
import { AdminCard, AdminButton, useToast } from "@/components/admin/ui";

export function ContentSection({ initialLastSync }: { initialLastSync: string | null }) {
  const toast = useToast();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(initialLastSync);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Sync failed");
      setLastSync(d.lastSync ?? new Date().toISOString());
      toast.show(
        `Synced — ${d.totalPages ?? 0} pages`,
        "success"
      );
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Sync failed", "error");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <AdminCard>
      <h2
        className="font-[var(--font-fp-sans)] text-[16px] font-bold mb-2"
        style={{ color: "var(--color-fp-ink)" }}
      >
        Notion Sync
      </h2>
      <p
        className="font-[var(--font-fp-sans)] text-[13px] leading-relaxed mb-2"
        style={{ color: "var(--color-fp-ink-3)" }}
      >
        Last sync:{" "}
        <span style={{ color: "var(--color-fp-ink-2)" }}>
          {lastSync ? new Date(lastSync).toLocaleString("en-US") : "Never"}
        </span>
      </p>
      <p
        className="font-[var(--font-fp-sans)] text-[13px] leading-relaxed mb-5"
        style={{ color: "var(--color-fp-ink-3)" }}
      >
        Pulls the latest from the Flight Path Program wiki into the app. This
        runs the crawler once and may take a minute or two.
      </p>
      <AdminButton onClick={handleSync} disabled={syncing}>
        {syncing ? "Syncing..." : "Sync Now"}
      </AdminButton>
    </AdminCard>
  );
}
