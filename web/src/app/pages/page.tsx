import { auth, signOut } from "@/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

// Logs the user out, then returns to the landing/login page.
async function handleSignOut() {
  "use server";
  await signOut({ redirectTo: "/" });
}

interface PageRow {
  id: string;
  title: string;
  slug: string;
  icon: string | null;
  cover: string | null;
  is_hidden: boolean;
  updated_at: string;
}

export default async function PagesPage() {
  const session = await auth();
  // Every page is behind the login gate.
  if (!session?.user) redirect("/");

  // List only NON-hidden pages (spec section 4: hidden pages are never listed).
  // Hidden pages remain reachable by their direct slug (see /pages/[slug]).
  const { rows } = await query<PageRow>(
    `SELECT id, title, slug, icon, cover, is_hidden, updated_at
     FROM notion_pages
     WHERE is_hidden = false
     ORDER BY title ASC`
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
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
              {session.user.role === "admin" && (
                <Link
                  href="/admin"
                  className="text-gray-300 hover:text-white transition"
                >
                  Admin
                </Link>
              )}
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {session.user.email?.[0]?.toUpperCase()}
                </span>
              </div>
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

      {/* Main Content */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Content Library</h1>
            <p className="text-gray-400">
              Browse all published Flight Path content.
            </p>
          </div>

          {rows.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                No content available yet. Run a Notion sync from the Admin portal
                (or the worker) to publish pages here.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rows.map((page) => (
                <Link
                  key={page.id}
                  href={`/pages/${page.slug}`}
                  className="group bg-slate-900/50 border border-white/10 rounded-lg p-6 hover:border-orange-500/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      {page.icon && (
                        <span className="text-2xl mr-2">{page.icon}</span>
                      )}
                      <h3 className="text-xl font-semibold text-white group-hover:text-orange-400 transition">
                        {page.title}
                      </h3>
                    </div>
                  </div>

                  {page.cover && (
                    <div className="mb-3 rounded overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={page.cover}
                        alt={page.title}
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  )}

                  <div className="text-gray-400 text-sm">
                    Last updated:{" "}
                    {new Date(page.updated_at).toLocaleDateString()}
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
