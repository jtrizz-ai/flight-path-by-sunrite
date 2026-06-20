"use client";

import { useEffect, useState } from "react";
import {
  AdminCard,
  AdminButton,
  AdminInput,
  ConfirmDialog,
  SectionHeader,
  useToast,
} from "@/components/admin/ui";

type Domain = { domain: string };
type Invite = { email: string; status: string; created_at: string };

type PendingRemove = { kind: "domain" | "invite"; value: string };

export function AccessSection() {
  const toast = useToast();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  const [newDomain, setNewDomain] = useState("");
  const [addingDomain, setAddingDomain] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [addingInvite, setAddingInvite] = useState(false);

  const [pendingRemove, setPendingRemove] = useState<PendingRemove | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/admin/domains", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/admin/invites", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([d, i]) => {
        if (cancelled) return;
        setDomains(d.domains || []);
        setInvites(i.invites || []);
      })
      .catch(() => {
        /* leave empty */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function addDomain(e: React.FormEvent) {
    e.preventDefault();
    if (!newDomain.trim()) return;
    setAddingDomain(true);
    try {
      const res = await fetch("/api/admin/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to add domain");
      setDomains(d.domains || []);
      setNewDomain("");
      toast.show("Domain added", "success");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setAddingDomain(false);
    }
  }

  async function addInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setAddingInvite(true);
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to invite");
      setInvites(d.invites || []);
      setNewEmail("");
      toast.show("Invite sent", "success");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setAddingInvite(false);
    }
  }

  async function confirmRemove() {
    if (!pendingRemove) return;
    setRemoving(true);
    const endpoint =
      pendingRemove.kind === "domain" ? "/api/admin/domains" : "/api/admin/invites";
    const param = pendingRemove.kind === "domain" ? "domain" : "email";
    try {
      const res = await fetch(
        `${endpoint}?${param}=${encodeURIComponent(pendingRemove.value)}`,
        { method: "DELETE" }
      );
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to remove");
      if (pendingRemove.kind === "domain") setDomains(d.domains || []);
      else setInvites(d.invites || []);
      toast.show(
        pendingRemove.kind === "domain" ? "Domain removed" : "Invite revoked",
        "success"
      );
      setPendingRemove(null);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Allowed domains */}
      <AdminCard>
        <SectionHeader
          title="Allowed Domains"
          subtitle="Anyone signing in with one of these email domains can get in (if invited)."
        />
        <form onSubmit={addDomain} className="flex gap-2 mb-4 max-w-md">
          <AdminInput
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="company.com"
          />
          <AdminButton type="submit" disabled={addingDomain}>
            {addingDomain ? "Adding..." : "Add"}
          </AdminButton>
        </form>
        {loading && domains.length === 0 ? (
          <div
            className="font-[var(--font-fp-mono)] text-[11px]"
            style={{ color: "var(--color-fp-ink-3)" }}
          >
            Loading...
          </div>
        ) : domains.length === 0 ? (
          <div
            className="font-[var(--font-fp-mono)] text-[11px]"
            style={{ color: "var(--color-fp-ink-3)" }}
          >
            No domains configured.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {domains.map((d) => (
              <span
                key={d.domain}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[12px]"
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--color-fp-line)",
                  color: "var(--color-fp-ink-2)",
                }}
              >
                {d.domain}
                <button
                  type="button"
                  onClick={() =>
                    setPendingRemove({ kind: "domain", value: d.domain })
                  }
                  className="text-[12px] transition-opacity"
                  style={{ color: "var(--color-fp-accent)" }}
                  aria-label={`Remove ${d.domain}`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </AdminCard>

      {/* Invites */}
      <AdminCard>
        <SectionHeader
          title="Invites"
          subtitle="Invite a specific email. Revoke anytime."
        />
        <form onSubmit={addInvite} className="flex gap-2 mb-4 max-w-md">
          <AdminInput
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="name@company.com"
          />
          <AdminButton type="submit" disabled={addingInvite}>
            {addingInvite ? "Sending..." : "Invite"}
          </AdminButton>
        </form>
        {invites.length === 0 ? (
          <div
            className="font-[var(--font-fp-mono)] text-[11px]"
            style={{ color: "var(--color-fp-ink-3)" }}
          >
            No invites yet.
          </div>
        ) : (
          <div className="space-y-2">
            {invites.map((i) => (
              <div
                key={i.email}
                className="flex items-center justify-between rounded-[10px] px-4 py-2.5"
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--color-fp-line)",
                }}
              >
                <div className="min-w-0">
                  <div
                    className="font-mono text-[13px] truncate"
                    style={{ color: "var(--color-fp-ink-2)" }}
                  >
                    {i.email}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.1em] uppercase"
                    style={{ color: "var(--color-fp-ink-3)" }}
                  >
                    {i.status}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPendingRemove({ kind: "invite", value: i.email })
                    }
                    className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.1em] uppercase transition-opacity"
                    style={{ color: "var(--color-fp-accent)" }}
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      <ConfirmDialog
        open={!!pendingRemove}
        title={
          pendingRemove?.kind === "domain"
            ? "Remove domain?"
            : "Revoke invite?"
        }
        message={
          pendingRemove?.kind === "domain"
            ? `Remove ${pendingRemove.value} from allowed domains?`
            : `Revoke the invite for ${pendingRemove?.value}?`
        }
        confirmLabel={pendingRemove?.kind === "domain" ? "Remove" : "Revoke"}
        loading={removing}
        onConfirm={confirmRemove}
        onCancel={() => !removing && setPendingRemove(null)}
      />
    </div>
  );
}
