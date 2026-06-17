// ─────────────────────────────────────────────────────────────────────────
// normalize.ts — convert RAW Notion blocks into the canonical Block[] shape.
// (CLAUDE.md section 11: "normalize.ts converts Notion blocks into Block[]".)
//
// Two things the v1 of this file did NOT do, now fixed:
//   1. Hyperlinks were dropped (rich_text was flattened to a plain string).
//      We now keep both: `text` (plain, for search/chat) AND `runs` (rich,
//      preserving href + bold/italic/etc for rendering).
//   2. "Clickable images": Notion image blocks have NO native link field, so we
//      support a convention — if the image's caption contains a URL/link, that
//      URL becomes the image's `href`, so it renders as a clickable image.
//
// Unsupported block types are skipped gracefully (never throw) per spec rule:
// "Skip unsupported block types gracefully — never crash on an unknown block."
// ─────────────────────────────────────────────────────────────────────────

// One styled+optionally-linked span of text. `text` blocks carry an array of
// these as `runs`; if `runs` is absent the renderer falls back to `text`.
export type Run = {
  text: string
  href?: string
  bold?: boolean
  italic?: boolean
  code?: boolean
  strikethrough?: boolean
}

// Canonical content block. Mirrors CLAUDE.md section 10 with two extensions:
//   - text-bearing blocks carry optional `runs` (preserves links/formatting)
//   - image carries optional `href` (the "clickable image" convention)
// Keep in sync with web/src/lib/types/index.ts -> Block.
export type Block =
  | { type: "heading"; level: 1 | 2 | 3; text: string; runs?: Run[] }
  | { type: "paragraph"; text: string; runs?: Run[] }
  | { type: "bulleted_item"; text: string; runs?: Run[] }
  | { type: "numbered_item"; text: string; runs?: Run[] }
  | { type: "todo"; text: string; checked: boolean; runs?: Run[] }
  | { type: "toggle"; text: string; children: Block[]; runs?: Run[] }
  | { type: "callout"; text: string; emoji?: string; runs?: Run[] }
  | { type: "quote"; text: string; runs?: Run[] }
  | { type: "code"; language?: string; text: string }
  | { type: "image"; url: string; caption?: string; href?: string }
  | { type: "bookmark"; url: string; title?: string }
  | { type: "page_link"; pageId: string; title: string; slug?: string }
  | { type: "file"; url: string; name?: string; caption?: string }
  | { type: "divider" };

// Shape the crawler stores for each raw Notion block:
//   { id, type, content: <notion's type-specific object>, has_children, children? }
interface RawBlock {
  id: string
  type: string
  content: Record<string, unknown>
  has_children?: boolean
  children?: RawBlock[]
}

/** Flatten a Notion rich_text array into a single PLAIN string (links dropped). */
function richTextToPlainText(richText: unknown): string {
  if (!Array.isArray(richText)) return ""
  return richText
    .map((rt: any) => rt?.plain_text ?? rt?.text?.content ?? "")
    .join("")
}

/**
 * Convert a Notion rich_text array into styled+linked Run[].
 * Preserves href (from rt.href or rt.text.link.url) and annotations
 * (bold/italic/code/strikethrough). Empty input -> [].
 */
function richTextToRuns(richText: unknown): Run[] {
  if (!Array.isArray(richText)) return []
  const runs: Run[] = []
  for (const item of richText) {
    const rt: any = item
    const text = rt?.plain_text ?? rt?.text?.content ?? ""
    if (!text) continue
    const a = rt?.annotations ?? {}
    const href =
      rt?.href && rt.href !== "null"
        ? rt.href
        : rt?.text?.link?.url && rt.text.link.url !== "null"
        ? rt.text.link.url
        : undefined
    const run: Run = { text }
    if (href) run.href = href
    if (a.bold) run.bold = true
    if (a.italic) run.italic = true
    if (a.code) run.code = true
    if (a.strikethrough) run.strikethrough = true
    runs.push(run)
  }
  return runs
}

/**
 * Resolve a Notion file/image object to a URL.
 *   - { type: "external", external: { url } }   (stable)
 *   - { type: "file",    file: { url, expiry_time } }  (S3 signed, EXPIRES)
 * TODO: signed URLs expire (~1hr). For v1 we store as-is; a later phase should
 * refresh them on sync or proxy through the backend.
 */
function fileUrl(obj: any): string | null {
  if (!obj || typeof obj !== "object") return null
  if (obj.type === "external" && obj.external?.url) return obj.external.url
  if (obj.type === "file" && obj.file?.url) return obj.file.url
  return null
}

/**
 * From a caption rich_text, return { caption, href }:
 *   - caption = the caption's plain text (may be empty)
 *   - href    = the first link found in the caption, if any
 * This powers the "clickable image" convention: put a URL in an image's caption
 * and the image renders as a link to that URL. If the caption is ONLY a URL,
 * we treat it as a link target (caption stays empty so it doesn't render twice).
 */
function captionAndHref(caption: unknown): { caption?: string; href?: string } {
  if (!Array.isArray(caption)) return {}
  const runs = richTextToRuns(caption)
  const plain = runs.map((r) => r.text).join("").trim()
  const href = runs.find((r) => r.href)?.href
  // If the whole caption is the URL, drop the caption text (avoid duplication).
  if (href && plain === href) return { href }
  return {
    href,
    ...(plain ? { caption: plain } : {}),
  }
}

/** Convert one raw Notion block into a canonical Block, or null to skip it. */
export function normalizeBlock(raw: RawBlock): Block | null {
  const c = raw.content ?? {}
  switch (raw.type) {
    // ── Headings ────────────────────────────────────────────────────────
    case "heading_1":
      return { type: "heading", level: 1, text: richTextToPlainText(c.rich_text), runs: richTextToRuns(c.rich_text) }
    case "heading_2":
      return { type: "heading", level: 2, text: richTextToPlainText(c.rich_text), runs: richTextToRuns(c.rich_text) }
    case "heading_3":
      return { type: "heading", level: 3, text: richTextToPlainText(c.rich_text), runs: richTextToRuns(c.rich_text) }

    // ── Body text ───────────────────────────────────────────────────────
    case "paragraph":
      return { type: "paragraph", text: richTextToPlainText(c.rich_text), runs: richTextToRuns(c.rich_text) }

    // ── Lists ───────────────────────────────────────────────────────────
    case "bulleted_list_item":
      return { type: "bulleted_item", text: richTextToPlainText(c.rich_text), runs: richTextToRuns(c.rich_text) }
    case "numbered_list_item":
      return { type: "numbered_item", text: richTextToPlainText(c.rich_text), runs: richTextToRuns(c.rich_text) }

    // ── To-do ───────────────────────────────────────────────────────────
    case "to_do":
      return {
        type: "todo",
        text: richTextToPlainText(c.rich_text),
        runs: richTextToRuns(c.rich_text),
        checked: Boolean(c.checked),
      }

    // ── Toggle (collapsible) ────────────────────────────────────────────
    // The toggle's own children are filled in by normalizeBlockWithChildren()
    // after this returns (it walks raw.children). Toggle detection is also the
    // basis for the "Hidden Pages" rule (spec section 4) — handled at crawl time.
    case "toggle":
      return {
        type: "toggle",
        text: richTextToPlainText(c.rich_text),
        runs: richTextToRuns(c.rich_text),
        children: [],
      }

    // ── Callout ─────────────────────────────────────────────────────────
    case "callout": {
      const emoji = (c.icon as any)?.emoji ?? (c.icon as any)?.external?.url ?? undefined
      return {
        type: "callout",
        text: richTextToPlainText(c.rich_text),
        runs: richTextToRuns(c.rich_text),
        ...(emoji ? { emoji } : {}),
      }
    }

    // ── Quote ───────────────────────────────────────────────────────────
    case "quote":
      return { type: "quote", text: richTextToPlainText(c.rich_text), runs: richTextToRuns(c.rich_text) }

    // ── Code ────────────────────────────────────────────────────────────
    case "code":
      return {
        type: "code",
        language: (c.language as string) ?? undefined,
        text: richTextToPlainText(c.rich_text),
      }

    // ── Image ───────────────────────────────────────────────────────────
    // Caption may carry a link -> clickable image (href). See captionAndHref.
    case "image": {
      const url = fileUrl(c)
      if (!url) return null
      const { caption, href } = captionAndHref(c.caption)
      const block: Block = { type: "image", url }
      if (caption) block.caption = caption
      if (href) (block as { href: string }).href = href
      return block
    }

    // ── Embed (interactive/external content) ────────────────────────────
    // We can't safely iframe arbitrary content in v1, so render as a clickable
    // link card. Reuses the bookmark shape. TODO: allowlist trusted embeds.
    case "embed": {
      const url = String((c as any).url ?? "")
      if (!url) return null
      return { type: "bookmark", url }
    }

    // ── Bookmark / link preview ─────────────────────────────────────────
    case "bookmark":
      return {
        type: "bookmark",
        url: String(c.url ?? ""),
        title: captionToText(c.caption),
      }

    // ── Link preview (Notion-generated cards for some URLs) ─────────────
    case "link_preview":
      return { type: "bookmark", url: String((c as any).url ?? "") }

    // ── File attachment ─────────────────────────────────────────────────
    case "file": {
      const url = fileUrl(c)
      if (!url) return null
      const out: Block = {
        type: "file",
        url,
        name: (c.name as string) ?? undefined,
      }
      const cap = captionToText(c.caption)
      if (cap) (out as { caption?: string }).caption = cap
      return out
    }

    // ── Reference to another Notion page (becomes a nav link) ───────────
    case "child_page":
      // slug is resolved later (the child may not be crawled yet); left empty.
      return {
        type: "page_link",
        pageId: raw.id,
        title: String((c as any).title ?? "Untitled"),
      }

    // ── Divider ─────────────────────────────────────────────────────────
    case "divider":
      return { type: "divider" }

    // ── Unsupported (column, column_list, table, synced_block, video, …) ─
    // Skip gracefully. TODO: recurse into column/synced containers + toggles
    // so nested content (and nested images) are picked up. This is also a
    // prerequisite for the "Hidden Pages" toggle rule (spec section 4).
    default:
      return null
  }
}

/** Read a caption array into a plain string (helper for bookmark/file titles). */
function captionToText(caption: unknown): string | undefined {
  const text = richTextToPlainText(caption)
  return text ? text : undefined
}

/** Convert a list of raw Notion blocks into canonical Block[]. */
export function normalizeBlocks(raws: RawBlock[]): Block[] {
  const out: Block[] = []
  for (const raw of raws) {
    const normalized = normalizeBlockWithChildren(raw)
    out.push(...normalized)
  }
  return out
}

/**
 * Normalize a raw block into zero or more canonical Blocks.
 *
 * Containers (column_list, column, table) are FLATTENED: their children are
 * inlined into the parent flow so the content (text/images inside columns, or
 * rows inside tables) actually renders. A single raw block can therefore
 * produce multiple output Blocks (the container itself contributes nothing).
 */
function normalizeBlockWithChildren(raw: RawBlock): Block[] {
  const kids = raw.children ?? []

  // ── Containers: flatten their children into the parent flow ──────────
  // column_list -> its column children -> each column's content. Recursing
  // here means a column's own children flatten too.
  if (raw.type === 'column_list' || raw.type === 'column') {
    return normalizeBlocks(kids)
  }

  // table -> table_row children. Render each row as a paragraph of
  // "cell | cell | …" text (simple v1; a real table layout is TODO).
  if (raw.type === 'table') {
    const rows: Block[] = []
    for (const child of kids) {
      if (child.type !== 'table_row') continue
      const cells = (child.content as any)?.cells as unknown[] | undefined
      if (!Array.isArray(cells)) continue
      const line = cells
        .map((cell) => richTextToPlainText(cell))
        .filter((s) => s.length > 0)
        .join('  |  ')
      if (line.trim()) rows.push({ type: 'paragraph', text: line })
    }
    return rows
  }

  // ── Non-container: normalize normally, but if it's a toggle, fill in ─
  // its fetched children (recursive).
  const block = normalizeBlock(raw)
  if (block && block.type === 'toggle') {
    block.children = normalizeBlocks(kids)
  }
  return block ? [block] : []
}
