import { auth, signOut } from "@/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import { FPTopNav } from "@/components/fp/FPTopNav";
import { UserManagementSection } from "./components/UserManagementSection";
import { LlmConfigSection } from "./components/LlmConfigSection";
import { BadgeManagementSection } from "./components/BadgeManagementSection";

async function handleSignOut() {
  "use server";
  await signOut({ redirectTo: "/" });
}

interface AdminStats {
  totalPages: number;
  hiddenPages: number;
  lastSync: string | null;
}

async function getAdminStats(): Promise<AdminStats> {
  const total = await query<{ count: string }>(
    `SELECT count(*)::text AS count FROM notion_pages`
  );
  const hidden = await query<{ count: string }>(
    `SELECT count(*)::text AS count FROM notion_pages WHERE is_hidden = true`
  );
  const last = await query<{ last_sync: string | null }>(
    `SELECT last_sync FROM sync_meta WHERE id = 1`
  );
  return {
    totalPages: Number(total.rows[0]?.count ?? 0),
    hiddenPages: Number(hidden.rows[0]?.count ?? 0),
    lastSync: last.rows[0]?.last_sync ?? null,
  };
}

// Reusable FP card for admin sections.
function AdminCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[18px] p-6 ${className}`}
      style={{
        backgroundColor: "var(--color-fp-card)",
        border: "1px solid var(--color-fp-card-line)",
      }}
    >
      {children}
    </div>
  );
}

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  if (session.user.role !== "Admin") redirect("/pages");

  const stats = await getAdminStats();
  const domains = await query<{ domain: string }>(
    `SELECT domain FROM allowed_domains ORDER BY domain`
  );
  const invites = await query<{ email: string; status: string }>(
    `SELECT email, status FROM invites ORDER BY created_at DESC LIMIT 25`
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-fp-bg)" }}>
      <FPTopNav
        email={session.user.email ?? ""}
        role={session.user.role ?? "Sales"}
        active="admin"
        signOutAction={handleSignOut}
      />

      <div className="relative">
        <div className="grain-overlay" />

        <div className="relative z-10 mx-auto max-w-5xl px-5 py-14 md:py-20">
          {/* ViewHeader */}
          <div className="mb-8">
            <div
              className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.34em] uppercase mb-2"
              style={{ color: "var(--color-fp-ink-3)" }}
            >
              ADMINISTRATION
            </div>
            <h1
              className="font-[var(--font-fp-display)] text-5xl md:text-6xl uppercase leading-[0.92]"
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

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <AdminCard>
              <div
                className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.2em] uppercase mb-2"
                style={{ color: "var(--color-fp-ink-3)" }}
              >
                Total Pages
              </div>
              <div
                className="font-[var(--font-fp-display)] text-4xl"
                style={{ color: "var(--color-fp-ink)" }}
              >
                {stats.totalPages}
              </div>
            </AdminCard>
            <AdminCard>
              <div
                className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.2em] uppercase mb-2"
                style={{ color: "var(--color-fp-ink-3)" }}
              >
                Hidden Pages
              </div>
              <div
                className="font-[var(--font-fp-display)] text-4xl"
                style={{ color: "var(--color-fp-accent)" }}
              >
                {stats.hiddenPages}
              </div>
            </AdminCard>
            <AdminCard>
              <div
                className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.2em] uppercase mb-2"
                style={{ color: "var(--color-fp-ink-3)" }}
              >
                Last Sync
              </div>
              <div
                className="font-[var(--font-fp-sans)] text-[14px] font-semibold"
                style={{ color: "var(--color-fp-ink)" }}
              >
                {stats.lastSync
                  ? new Date(stats.lastSync).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "Never"}
              </div>
            </AdminCard>
          </div>

          {/* User Management */}
          <div className="mb-6">
            <UserManagementSection />
          </div>

          {/* AI Configuration */}
          <div className="mb-6">
            <LlmConfigSection />
          </div>

          {/* Notion Sync */}
          <div className="mb-6">
            <AdminCard>
              <h2
                className="font-[var(--font-fp-sans)] text-[16px] font-bold mb-2"
                style={{ color: "var(--color-fp-ink)" }}
              >
                Notion Sync
              </h2>
              <p
                className="font-[var(--font-fp-sans)] text-[13px] leading-relaxed mb-4"
                style={{ color: "var(--color-fp-ink-3)" }}
              >
                {/* TODO: wire this button to the node-worker. */}
                The Notion crawler (node-worker) writes crawled pages here. Run
                it from the terminal: <code className="font-mono">cd node-worker && npm start</code>
              </p>
              <button
                type="button"
                disabled
                className="rounded-[14px] px-5 py-2.5 font-[var(--font-fp-mono)] text-[11px] font-bold tracking-[0.1em] uppercase cursor-not-allowed"
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--color-fp-line)",
                  color: "var(--color-fp-ink-3)",
                }}
              >
                Sync Now (coming soon)
              </button>
            </AdminCard>
          </div>

          {/* Allowed Domains */}
          <div className="mb-6">
            <AdminCard>
              <h2
                className="font-[var(--font-fp-sans)] text-[16px] font-bold mb-4"
                style={{ color: "var(--color-fp-ink)" }}
              >
                Allowed Domains
              </h2>
              {domains.rows.length === 0 ? (
                <div
                  className="font-[var(--font-fp-mono)] text-[11px]"
                  style={{ color: "var(--color-fp-ink-3)" }}
                >
                  No domains configured.
                </div>
              ) : (
                <div className="space-y-2">
                  {domains.rows.map((d) => (
                    <div
                      key={d.domain}
                      className="rounded-[10px] px-4 py-2.5 font-mono text-[13px]"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.03)",
                        border: "1px solid var(--color-fp-line)",
                        color: "var(--color-fp-ink-2)",
                      }}
                    >
                      {d.domain}
                    </div>
                  ))}
                </div>
              )}
            </AdminCard>
          </div>

          {/* Invites */}
          <AdminCard>
            <h2
              className="font-[var(--font-fp-sans)] text-[16px] font-bold mb-4"
              style={{ color: "var(--color-fp-ink)" }}
            >
              Invites
            </h2>
            {invites.rows.length === 0 ? (
              <div
                className="font-[var(--font-fp-mono)] text-[11px]"
                style={{ color: "var(--color-fp-ink-3)" }}
              >
                No invites yet.
              </div>
            ) : (
              <div className="space-y-2">
                {invites.rows.map((i) => (
                  <div
                    key={i.email}
                    className="flex items-center justify-between rounded-[10px] px-4 py-2.5"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--color-fp-line)",
                    }}
                  >
                    <span
                      className="font-mono text-[13px]"
                      style={{ color: "var(--color-fp-ink-2)" }}
                    >
                      {i.email}
                    </span>
                    <span
                      className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.1em] uppercase"
                      style={{ color: "var(--color-fp-ink-3)" }}
                    >
                      {i.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
