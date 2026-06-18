import { auth, signOut } from "@/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserManagementSection } from "./components/UserManagementSection";

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

export default async function AdminPage() {
  const session = await auth();

  // Admin-only: must be logged in AND have the Admin role (from app_users).
  // Phase 1: Updated to use new role name "Admin" (capitalized)
  if (!session?.user) redirect("/");
  if (session.user.role !== "Admin") redirect("/pages");

  const stats = await getAdminStats();

  // Allowed domains + invites for a read-only view (add/remove comes in the
  // admin CRUD phase; the tables already exist and the gate reads from them).
  const domains = await query<{ domain: string }>(
    `SELECT domain FROM allowed_domains ORDER BY domain`
  );
  const invites = await query<{
    email: string;
    status: string;
  }>(`SELECT email, status FROM invites ORDER BY created_at DESC LIMIT 25`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <nav className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/pages"
              className="text-2xl font-bold text-white hover:text-orange-400 transition"
            >
              Flight Path
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/pages"
                className="text-gray-300 hover:text-white transition"
              >
                Library
              </Link>
              <div className="text-gray-400">Admin</div>
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="text-gray-300 hover:text-white transition"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Admin Portal</h1>
            <p className="text-gray-400">
              Manage your Flight Path content and access settings
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-1">Total Pages</div>
              <div className="text-3xl font-bold text-white">
                {stats.totalPages}
              </div>
            </div>
            <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-1">Hidden Pages</div>
              <div className="text-3xl font-bold text-orange-400">
                {stats.hiddenPages}
              </div>
            </div>
            <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-1">Last Sync</div>
              <div className="text-lg font-semibold text-white">
                {stats.lastSync
                  ? new Date(stats.lastSync).toLocaleString()
                  : "Never"}
              </div>
            </div>
          </div>

          {/* Phase 1: User Management */}
          <div className="mb-8">
            <UserManagementSection />
          </div>

          {/* Manual Crawl (placeholder until the worker is migrated) */}
          <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-2">
              Notion Sync
            </h2>
            <p className="text-gray-400 text-sm">
              {/* TODO: wire this button to the node-worker once it writes to the
                  local Postgres database. For now it is informational only. */}
              The Notion crawler (node-worker) writes crawled pages here. After
              the worker is migrated to this database, this button will trigger
              a fresh sync.
            </p>
            <button
              type="button"
              disabled
              className="mt-4 bg-slate-700 text-gray-400 px-6 py-2 rounded-lg cursor-not-allowed"
            >
              Sync Now (coming soon)
            </button>
          </div>

          {/* Allowed Domains */}
          <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Allowed Domains
            </h2>
            {domains.rows.length === 0 ? (
              <div className="text-gray-400 text-sm">No domains configured.</div>
            ) : (
              <ul className="space-y-2">
                {domains.rows.map((d) => (
                  <li
                    key={d.domain}
                    className="bg-slate-800/50 border border-white/5 rounded-lg px-4 py-2 text-gray-300 font-mono text-sm"
                  >
                    {d.domain}
                  </li>
                ))}
              </ul>
            )}
            {/* TODO: add/remove domains via /api/admin/domains in a later phase. */}
          </div>

          {/* Invites */}
          <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Invites</h2>
            {invites.rows.length === 0 ? (
              <div className="text-gray-400 text-sm">
                No invites yet. Add jrizzo@sunritesolarllc.com (or others) to the
                invites table to let them sign in while invite-required is on.
              </div>
            ) : (
              <div className="space-y-2">
                {invites.rows.map((i) => (
                  <div
                    key={i.email}
                    className="flex items-center justify-between bg-slate-800/50 border border-white/5 rounded-lg px-4 py-2"
                  >
                    <span className="text-gray-300 text-sm font-mono">
                      {i.email}
                    </span>
                    <span className="text-xs text-gray-500">{i.status}</span>
                  </div>
                ))}
              </div>
            )}
            {/* TODO: add/remove invites via /api/admin/invites in a later phase. */}
          </div>
        </div>
      </div>
    </div>
  );
}
