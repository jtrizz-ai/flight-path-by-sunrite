import { auth, signOut } from "@/auth";
import { query } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Block, Run } from "@/lib/types";
import { FPTopNav } from "@/components/fp/FPTopNav";

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

// Renders rich text with FP tokens.
function RichText({ runs, text }: { runs?: Run[]; text: string }) {
  if (!runs || runs.length === 0) {
    return <span style={{ color: "var(--color-fp-ink-2)" }}>{text}</span>;
  }
  return (
    <>
      {runs.map((run, i) => {
        let node: React.ReactNode = run.text;
        if (run.code)
          node = (
            <code
              className="font-mono text-[0.85em] px-1.5 py-0.5 rounded"
              style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "var(--color-fp-ink)" }}
            >
              {node}
            </code>
          );
        if (run.strikethrough) node = <span className="line-through">{node}</span>;
        if (run.bold)
          node = <strong className="font-bold" style={{ color: "var(--color-fp-ink)" }}>{node}</strong>;
        if (run.italic) node = <em>{node}</em>;
        if (run.href) {
          const external = /^https?:\/\//.test(run.href);
          node = external ? (
            <a
              href={run.href}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
              style={{ color: "var(--color-fp-accent-2)" }}
            >
              {node}
            </a>
          ) : (
            <a
              href={run.href}
              className="underline underline-offset-2"
              style={{ color: "var(--color-fp-accent-2)" }}
            >
              {node}
            </a>
          );
        }
        return <span key={i} style={{ color: "var(--color-fp-ink-2)" }}>{node}</span>;
      })}
    </>
  );
}

// Renders one canonical Block using FP design tokens.
function ContentBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "paragraph":
      if (!block.text.trim()) return null;
      return (
        <p className="mb-4 leading-relaxed font-[var(--font-fp-sans)] text-[14px]">
          <RichText runs={block.runs} text={block.text} />
        </p>
      );

    case "heading":
      if (block.level === 1)
        return (
          <h1
            className="font-[var(--font-fp-sans)] text-2xl font-bold mt-8 mb-4"
            style={{ color: "var(--color-fp-ink)" }}
          >
            <RichText runs={block.runs} text={block.text} />
          </h1>
        );
      if (block.level === 2)
        return (
          <h2
            className="font-[var(--font-fp-sans)] text-xl font-bold mt-6 mb-3"
            style={{ color: "var(--color-fp-ink)" }}
          >
            <RichText runs={block.runs} text={block.text} />
          </h2>
        );
      return (
        <h3
          className="font-[var(--font-fp-sans)] text-lg font-semibold mt-5 mb-2"
          style={{ color: "var(--color-fp-ink)" }}
        >
          <RichText runs={block.runs} text={block.text} />
        </h3>
      );

    case "bulleted_item":
      return (
        <li className="ml-5 mb-2 list-disc font-[var(--font-fp-sans)] text-[14px]">
          <RichText runs={block.runs} text={block.text} />
        </li>
      );

    case "numbered_item":
      return (
        <li className="ml-5 mb-2 list-decimal font-[var(--font-fp-sans)] text-[14px]">
          <RichText runs={block.runs} text={block.text} />
        </li>
      );

    case "todo":
      return (
        <div className="flex items-start gap-2 mb-2">
          <input
            type="checkbox"
            checked={block.checked}
            readOnly
            className="mt-1"
            style={{ accentColor: "var(--color-fp-accent)" }}
          />
          <span className="font-[var(--font-fp-sans)] text-[14px]">
            <RichText runs={block.runs} text={block.text} />
          </span>
        </div>
      );

    case "toggle":
      return (
        <details
          className="mb-4 rounded-[14px] p-4"
          style={{
            backgroundColor: "var(--color-fp-card)",
            border: "1px solid var(--color-fp-card-line)",
          }}
        >
          <summary
            className="cursor-pointer font-[var(--font-fp-sans)] text-[14px] font-medium"
            style={{ color: "var(--color-fp-ink)" }}
          >
            <RichText runs={block.runs} text={block.text || "(toggle)"} />
          </summary>
          <div
            className="mt-3 ml-2 pl-4 space-y-1"
            style={{ borderLeft: "1px solid var(--color-fp-line)" }}
          >
            {block.children.length === 0 ? (
              <div
                className="font-[var(--font-fp-sans)] text-[13px]"
                style={{ color: "var(--color-fp-ink-3)" }}
              >
                (empty)
              </div>
            ) : (
              block.children.map((child, i) => <ContentBlock key={i} block={child} />)
            )}
          </div>
        </details>
      );

    case "callout":
      return (
        <div
          className="mb-4 rounded-[14px] p-4 flex gap-3"
          style={{
            backgroundColor: "var(--color-fp-card)",
            border: "1px solid var(--color-fp-card-line)",
          }}
        >
          {block.emoji && <span className="text-xl shrink-0">{block.emoji}</span>}
          <span className="font-[var(--font-fp-sans)] text-[14px]">
            <RichText runs={block.runs} text={block.text} />
          </span>
        </div>
      );

    case "quote":
      return (
        <blockquote
          className="pl-4 mb-4 italic font-[var(--font-fp-sans)] text-[14px]"
          style={{
            borderLeft: "3px solid var(--color-fp-accent)",
            color: "var(--color-fp-ink-2)",
          }}
        >
          <RichText runs={block.runs} text={block.text} />
        </blockquote>
      );

    case "code":
      return (
        <pre
          className="mb-4 rounded-[14px] p-4 overflow-x-auto font-mono text-[13px]"
          style={{
            backgroundColor: "var(--color-fp-card)",
            border: "1px solid var(--color-fp-card-line)",
            color: "var(--color-fp-ink-2)",
          }}
        >
          <code>{block.text}</code>
        </pre>
      );

    case "image": {
      const img = (
        <figure className="mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.url}
            alt={block.caption ?? ""}
            className="w-full rounded-[14px]"
          />
          {block.caption && (
            <figcaption
              className="font-[var(--font-fp-mono)] text-[11px] mt-2 text-center"
              style={{ color: "var(--color-fp-ink-3)" }}
            >
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
      if (!block.href) return img;
      const external = /^https?:\/\//.test(block.href);
      return external ? (
        <a href={block.href} target="_blank" rel="noreferrer" className="block mb-4">
          {img}
        </a>
      ) : (
        <a href={block.href} className="block mb-4">
          {img}
        </a>
      );
    }

    case "bookmark":
      return (
        <a
          href={block.url}
          target="_blank"
          rel="noreferrer"
          className="block mb-4 rounded-[14px] p-4 transition-all duration-200 hover:brightness-125"
          style={{
            backgroundColor: "var(--color-fp-card)",
            border: "1px solid var(--color-fp-card-line)",
          }}
        >
          <div
            className="font-[var(--font-fp-mono)] text-[12px] break-all"
            style={{ color: "var(--color-fp-accent-2)" }}
          >
            {block.url}
          </div>
          {block.title && (
            <div
              className="font-[var(--font-fp-sans)] text-[14px] mt-1"
              style={{ color: "var(--color-fp-ink-2)" }}
            >
              {block.title}
            </div>
          )}
        </a>
      );

    case "file":
      return (
        <a
          href={block.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 mb-4 rounded-[14px] p-4 transition-all duration-200 hover:brightness-125"
          style={{
            backgroundColor: "var(--color-fp-card)",
            border: "1px solid var(--color-fp-card-line)",
          }}
        >
          <span className="text-2xl">📎</span>
          <span
            className="font-[var(--font-fp-sans)] text-[14px]"
            style={{ color: "var(--color-fp-ink-2)" }}
          >
            {block.name ?? "Download file"}
          </span>
          {block.caption && (
            <span
              className="font-[var(--font-fp-mono)] text-[11px]"
              style={{ color: "var(--color-fp-ink-3)" }}
            >
              — {block.caption}
            </span>
          )}
        </a>
      );

    case "page_link":
      return block.slug ? (
        <Link
          href={`/pages/${block.slug}`}
          className="block mb-3 rounded-[14px] p-4 transition-all duration-200 hover:brightness-125"
          style={{
            backgroundColor: "var(--color-fp-card)",
            border: "1px solid var(--color-fp-card-line)",
          }}
        >
          <div
            className="font-[var(--font-fp-sans)] text-[14px] font-medium"
            style={{ color: "var(--color-fp-ink)" }}
          >
            📄 {block.title}
          </div>
        </Link>
      ) : (
        <div
          className="mb-3 rounded-[14px] p-4"
          style={{
            backgroundColor: "var(--color-fp-card)",
            border: "1px solid var(--color-fp-card-line)",
          }}
        >
          <div
            className="font-[var(--font-fp-sans)] text-[14px] font-medium"
            style={{ color: "var(--color-fp-ink)" }}
          >
            📄 {block.title}
          </div>
        </div>
      );

    case "divider":
      return <hr className="my-6" style={{ borderColor: "var(--color-fp-line)" }} />;

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

  // Track page view (server-side; non-blocking, won't fail the page render)
  if (session.user.id) {
    query(
      `INSERT INTO page_views (user_id, path, title) VALUES ($1, $2, $3)`,
      [session.user.id, `/pages/${slug}`, page.title]
    ).catch(() => {});
  }

  const contentBlocks = (page.content?.blocks ?? []) as Block[];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-fp-bg)" }}>
      <FPTopNav
        email={session.user.email ?? ""}
        role={session.user.role ?? "Sales"}
        active="library"
        signOutAction={handleSignOut}
      />

      <div className="relative">
        <div className="grain-overlay" />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-3xl px-5 py-12 md:py-16">
          {/* Back link */}
          <Link
            href="/pages"
            className="font-[var(--font-fp-mono)] text-[11px] tracking-[0.1em] uppercase mb-6 inline-block transition-colors"
            style={{ color: "var(--color-fp-ink-3)" }}
          >
            ← Library
          </Link>

          {/* Cover Image */}
          {page.cover && (
            <div className="mb-8 rounded-[18px] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={page.cover} alt={page.title} className="w-full h-64 object-cover" />
            </div>
          )}

          {/* Page Header */}
          <div className="mb-8">
            {page.icon && <div className="text-5xl mb-4">{page.icon}</div>}
            <h1
              className="font-[var(--font-fp-display)] text-4xl md:text-5xl uppercase leading-[0.92] mb-3"
              style={{ color: "var(--color-fp-ink)" }}
            >
              {page.title}
            </h1>
            <div className="flex items-center gap-3 mb-4">
              <span
                className="font-[var(--font-fp-mono)] text-[11px] tracking-[0.1em] uppercase"
                style={{ color: "var(--color-fp-ink-3)" }}
              >
                Updated{" "}
                {new Date(page.updated_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              {page.is_hidden && (
                <span
                  className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.1em] uppercase px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: "rgba(232,71,42,0.15)",
                    color: "var(--color-fp-accent)",
                  }}
                >
                  Hidden
                </span>
              )}
            </div>
          </div>

          {/* Content Blocks */}
          <div>
            {contentBlocks.length === 0 ? (
              <div
                className="font-[var(--font-fp-mono)] text-[11px] tracking-[0.1em]"
                style={{ color: "var(--color-fp-ink-3)" }}
              >
                No content available.
              </div>
            ) : (
              contentBlocks.map((block, index) => <ContentBlock key={index} block={block} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
