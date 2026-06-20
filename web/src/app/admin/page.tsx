import { auth, signOut } from "@/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import { FPTopNav } from "@/components/fp/FPTopNav";
import { AdminShell, type AdminStats } from "./_components/AdminShell";

async function handleSignOut() {
  "use server";
  await signOut({ redirectTo: "/" });
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
  if (!session?.user) redirect("/");
  if (session.user.role !== "Admin") redirect("/pages");

  const stats = await getAdminStats();

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: "var(--color-fp-bg)" }}
    >
      <FPTopNav
        email={session.user.email ?? ""}
        role={session.user.role ?? "Sales"}
        active="admin"
        signOutAction={handleSignOut}
      />

      <div className="relative flex-1 flex min-h-0">
        <div className="grain-overlay" />
        <AdminShell stats={stats} />
      </div>
    </div>
  );
}
