import { auth, signOut } from "@/auth";
import { query } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Block, Run } from "@/lib/types";

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

// Renders rich text, preserving hyperlinks + bold/italic/code/strikethrough.
// Uses `runs` when present (worker v2+), otherwise the plain `text` string.
function RichText({ runs, text }: { runs?: Run[]; text: string }) {
  if (!runs || runs.length === 0) return <>{text}</>;
  return (
    <>
      {runs.map((run, i) => {
        let node: React.ReactNode = run.text;
        if (run.code) node = <code className="px-1 py-0.5 bg-slate-800 rounded text-sm">{node}</code>;
        if (run.strikethrough) node = <span className="line-through">{node}</span>;
        if (run.bold) node = <strong className="font-semibold text-white">{node}</strong>;
        if (run.italic) node = <em>{node}</em>;
        if (run.href) {
          const external = /^https?:\/\//.test(run.href);
          node = external ? (
            <a href={run.href} target="_blank" rel="noreferrer" className="text-orange-400 hover:text-orange-300 underline underline-offset-2">
              {node}
            </a>
          ) : (
            <a href={run.href} className="text-orange-400 hover:text-orange-300 underline underline-offset-2">
              {node}
            </a>
          );
        }
        return <span key={i}>{node}</span>;
      })}
    </>
  );
}

// Renders one canonical Block (see lib/types -> Block, mirrored from the
// worker's normalize.ts). Handles every block type in CLAUDE.md section 10.
function ContentBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "paragraph":
      // Notion can produce empty paragraph blocks (spacers); hide those.
      if (!block.text.trim()) return null;
      return <p className="text-gray-300 mb-4 leading-relaxed"><RichText runs={block.runs} text={block.text} /></p>;

    case "heading":
      if (block.level === 1)
        return <h1 className="text-3xl font-bold text-white mt-8 mb-4"><RichText runs={block.runs} text={block.text} /></h1>;
      if (block.level === 2)
        return <h2 className="text-2xl font-semibold text-white mt-6 mb-3"><RichText runs={block.runs} text={block.text} /></h2>;
      return <h3 className="text-xl font-semibold text-white mt-5 mb-2"><RichText runs={block.runs} text={block.text} /></h3>;

    case "bulleted_item":
      return <li className="text-gray-300 ml-6 mb-2 list-disc"><RichText runs={block.runs} text={block.text} /></li>;

    case "numbered_item":
      return <li className="text-gray-300 ml-6 mb-2 list-decimal"><RichText runs={block.runs} text={block.text} /></li>;

    case "todo":
      return (
        <div className="flex items-start gap-2 mb-2">
          <input type="checkbox" checked={block.checked} readOnly className="mt-1 accent-orange-500" />
          <span className="text-gray-300"><RichText runs={block.runs} text={block.text} /></span>
        </div>
      );

    case "toggle":
      return (
        <details className="mb-4 bg-slate-800/40 border border-white/10 rounded-lg p-4">
          <summary className="cursor-pointer text-gray-200 font-medium">
            <RichText runs={block.runs} text={block.text || "(toggle)"} />
          </summary>
          <div className="mt-3 ml-2 pl-4 border-l border-white/10 space-y-1">
            {block.children.length === 0 ? (
              <div className="text-gray-500 text-sm">(empty)</div>
            ) : (
              block.children.map((child, i) => (
                <ContentBlock key={i} block={child} />
              ))
            )}
          </div>
        </details>
      );

    case "callout":
      return (
        <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4 mb-4 flex gap-3">
          {block.emoji && <span className="text-xl">{block.emoji}</span>}
          <span className="text-gray-300"><RichText runs={block.runs} text={block.text} /></span>
        </div>
      );

    case "quote":
      return <blockquote className="border-l-4 border-orange-500 pl-4 mb-4 italic text-gray-300"><RichText runs={block.runs} text={block.text} /></blockquote>;

    case "code":
      return (
        <pre className="bg-slate-800 rounded-lg p-4 mb-4 overflow-x-auto">
          <code className="text-gray-300 text-sm">{block.text}</code>
        </pre>
      );

    case "image": {
      // "Clickable image": if the image carried a link (a URL in its caption in
      // Notion), wrap the image in a link. External links open in a new tab.
      const img = (
        <figure className="mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.url} alt={block.caption ?? ""} className="w-full rounded-lg" />
          {block.caption && <figcaption className="text-sm text-gray-500 mt-2 text-center">{block.caption}</figcaption>}
        </figure>
      );
      if (!block.href) return img;
      const external = /^https?:\/\//.test(block.href);
      return external ? (
        <a href={block.href} target="_blank" rel="noreferrer" className="block mb-4">{img}</a>
      ) : (
        <a href={block.href} className="block mb-4">{img}</a>
      );
    }

    case "bookmark":
      return (
        <a
          href={block.url}
          target="_blank"
          rel="noreferrer"
          className="block mb-4 bg-slate-800/50 border border-white/10 rounded-lg p-4 hover:border-orange-500/50 transition"
        >
          <div className="text-orange-400 text-sm break-all">{block.url}</div>
          {block.title && (
            <div className="text-gray-300 mt-1">{block.title}</div>
          )}
        </a>
      );

    case "file":
      return (
        <a
          href={block.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 mb-4 bg-slate-800/50 border border-white/10 rounded-lg p-4 hover:border-orange-500/50 transition"
        >
          <span className="text-2xl">📎</span>
          <span className="text-gray-300">{block.name ?? "Download file"}</span>
          {block.caption && (
            <span className="text-sm text-gray-500">— {block.caption}</span>
          )}
        </a>
      );

    case "page_link":
      // Links to another Notion page in the tree. If we have a slug, route
      // through our site; otherwise show the title (TODO: slug resolution).
      return block.slug ? (
        <Link
          href={`/pages/${block.slug}`}
          className="block mb-3 bg-slate-800/50 border border-white/10 rounded-lg p-4 hover:border-orange-500/50 transition"
        >
          <div className="text-gray-200 font-medium">📄 {block.title}</div>
        </Link>
      ) : (
        <div className="mb-3 bg-slate-800/50 border border-white/10 rounded-lg p-4">
          <div className="text-gray-200 font-medium">📄 {block.title}</div>
        </div>
      );

    case "divider":
      return <hr className="border-white/10 my-6" />;

    default:
      // Exhaustiveness guard; should never happen for a normalized Block.
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

  const contentBlocks = (page.content?.blocks ?? []) as Block[];

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
