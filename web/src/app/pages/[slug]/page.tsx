import { auth, signOut } from "@/auth";
import { query } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

async function handleSignOut() {
  "use server";
  await signOut({ redirectTo: "/" });
}

interface PageDetailRow {
  id: string;
  title: string;
  slug: string;
  icon: string | null;
  cover: string | null;
  is_hidden: boolean;
  updated_at: string;
  content: { blocks?: unknown[] } | null;
}

async function getPage(slug: string): Promise<PageDetailRow | null> {
  const { rows } = await query<PageDetailRow>(
    `SELECT id, title, slug, icon, cover, is_hidden, updated_at, content
     FROM notion_pages
     WHERE slug = $1
     LIMIT 1`,
    [slug]
  );
  return rows[0] ?? null;
}

// Renders one normalized content block. Field names match what the worker
// writes (content.blocks[].type + content.blocks[].content).
// TODO: align with the canonical Block shape in CLAUDE.md section 10 once the
// worker is migrated to local Postgres.
function ContentBlock({ block }: { block: any }) {
  const text = block.content?.text || block.content?.plain_text || "";
  switch (block.type) {
    case "paragraph":
      return <p className="text-gray-300 mb-4">{text}</p>;
    case "heading_1":
      return <h1 className="text-3xl font-bold text-white mb-4">{text}</h1>;
    case "heading_2":
      return <h2 className="text-2xl font-semibold text-white mb-3">{text}</h2>;
    case "heading_3":
      return <h3 className="text-xl font-semibold text-white mb-2">{text}</h3>;
    case "bulleted_list":
      return <li className="text-gray-300 ml-4 mb-2">• {text}</li>;
    case "numbered_list":
      return (
        <li className="text-gray-300 ml-4 mb-2">
          {block.content?.number}. {text}
        </li>
      );
    case "to_do":
      return (
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            checked={block.content?.checked}
            readOnly
            className="mr-2"
          />
          <span className="text-gray-300">{text}</span>
        </div>
      );
    case "callout":
      return (
        <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4 mb-4">
          {block.content?.icon && (
            <span className="mr-2">{block.content.icon}</span>
          )}
          <span className="text-gray-300">{text}</span>
        </div>
      );
    case "quote":
      return (
        <blockquote className="border-l-4 border-orange-500 pl-4 mb-4 italic text-gray-300">
          {text}
        </blockquote>
      );
    case "divider":
      return <hr className="border-white/10 my-6" />;
    case "code":
      return (
        <pre className="bg-slate-800 rounded-lg p-4 mb-4 overflow-x-auto">
          <code className="text-gray-300">{text}</code>
        </pre>
      );
    default:
      return null;
  }
}

export default async function PageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  // Per spec section 4: hidden pages ARE reachable by their direct slug
  // (they're just excluded from listings/search/chat). So no paywall here.

  const contentBlocks = (page.content?.blocks ?? []) as any[];

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
              <Link
                href="/pages"
                className="text-gray-300 hover:text-white transition"
              >
                Library
              </Link>
              {session.user.role === "admin" && (
                <Link
                  href="/admin"
                  className="text-gray-300 hover:text-white transition"
                >
                  Admin
                </Link>
              )}
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
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Cover Image */}
          {page.cover && (
            <div className="mb-8 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={page.cover}
                alt={page.title}
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* Page Header */}
          <div className="mb-8">
            {page.icon && <div className="text-6xl mb-4">{page.icon}</div>}
            <h1 className="text-5xl font-bold text-white mb-4">{page.title}</h1>

            <div className="flex items-center space-x-4 text-sm text-gray-400 mb-6">
              <span>
                Updated {new Date(page.updated_at).toLocaleDateString()}
              </span>
              {page.is_hidden && (
                <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded">
                  Hidden (direct link only)
                </span>
              )}
            </div>

            <Link
              href="/pages"
              className="text-orange-400 hover:text-orange-300 transition"
            >
              ← Back to Library
            </Link>
          </div>

          {/* Content Blocks */}
          <div className="prose prose-invert max-w-none">
            {contentBlocks.length === 0 ? (
              <div className="text-gray-400">No content available.</div>
            ) : (
              contentBlocks.map((block, index) => (
                <ContentBlock key={index} block={block} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
