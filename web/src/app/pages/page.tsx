import { auth, signOut } from "@/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FPTopNav } from "@/components/fp/FPTopNav";

async function handleSignOut() {
  "use server";
  await signOut({ redirectTo: "/" });
}

interface PageRow {
  id: string;
  title: string;
  slug: string;
  icon: string | null;
  is_hidden: boolean;
  updated_at: string;
}

export default async function PagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const { rows } = await query<PageRow>(
    `SELECT id, title, slug, icon, is_hidden, updated_at
     FROM notion_pages
     WHERE is_hidden = false
     ORDER BY title ASC`
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-fp-bg)" }}>
      <FPTopNav
        email={session.user.email ?? ""}
        role={session.user.role ?? "Sales"}
        active="library"
        signOutAction={handleSignOut}
      />

      {/* Cinematic background: image + scrim */}
      <div className="relative">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/images/schedule_bg.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(6,6,7,0.80) 0%, rgba(6,6,7,0.72) 38%, rgba(6,6,7,0.88) 100%)",
            }}
          />
        </div>
        <div className="grain-overlay" />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-5xl px-5 py-14 md:py-20">
          {/* ViewHeader */}
          <div className="mb-8">
            <div
              className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.34em] uppercase mb-2"
              style={{ color: "var(--color-fp-ink-3)" }}
            >
              FLIGHT PATH PROGRAM
            </div>
            <h1
              className="font-[var(--font-fp-display)] text-5xl md:text-6xl uppercase leading-[0.92]"
              style={{ color: "var(--color-fp-ink)" }}
            >
              Library
            </h1>
            <p
              className="font-[var(--font-fp-mono)] text-[11px] tracking-[0.06em] mt-2"
              style={{ color: "var(--color-fp-ink-2)" }}
            >
              {rows.length > 0
                ? `${rows.length} published pages`
                : "Browse all published Flight Path content."}
            </p>
          </div>

          {/* Empty state */}
          {rows.length === 0 ? (
            <div
              className="rounded-[18px] border p-8 text-center"
              style={{
                backgroundColor: "var(--color-fp-card)",
                borderColor: "var(--color-fp-card-line)",
              }}
            >
              <p
                className="font-[var(--font-fp-mono)] text-[11px] tracking-[0.1em]"
                style={{ color: "var(--color-fp-ink-3)" }}
              >
                No content available yet. Run the Notion crawler (node-worker)
                to publish pages here.
              </p>
            </div>
          ) : (
            /* Page cards */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rows.map((page) => (
                <Link key={page.id} href={`/pages/${page.slug}`} className="block group">
                  <div
                    className="h-full rounded-[18px] p-5 transition-all duration-200 group-hover:brightness-125"
                    style={{
                      backgroundColor: "var(--color-fp-card)",
                      border: "1px solid var(--color-fp-card-line)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {page.icon && <span className="text-xl">{page.icon}</span>}
                      <h3
                        className="font-[var(--font-fp-sans)] text-[15px] font-bold leading-tight"
                        style={{ color: "var(--color-fp-ink)" }}
                      >
                        {page.title}
                      </h3>
                    </div>
                    <div
                      className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.1em] uppercase"
                      style={{ color: "var(--color-fp-ink-3)" }}
                    >
                      Updated {new Date(page.updated_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
