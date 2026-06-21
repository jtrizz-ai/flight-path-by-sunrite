// Walk a normalized Block[] and concatenate all visible text fields into
// a single string for full-text search. Block types match CLAUDE.md section 10
// and the worker's normalize.ts. Image/bookmark/divider/page_link blocks
// contribute their captions/titles only (no URL noise).

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bulleted_item"; text: string }
  | { type: "numbered_item"; text: string }
  | { type: "todo"; text: string; checked: boolean }
  | { type: "toggle"; text: string; children: Block[] }
  | { type: "callout"; text: string; emoji?: string }
  | { type: "quote"; text: string }
  | { type: "code"; language?: string; text: string }
  | { type: "image"; url: string; caption?: string }
  | { type: "bookmark"; url: string; title?: string }
  | { type: "page_link"; pageId: string; slug: string; title: string }
  | { type: "divider" }
  // The worker's normalize.ts also emits blocks with a richer shape that
  // carries `runs` (text + formatting). Fall back to .text if present.
  | { type: string; text?: string; children?: Block[]; emoji?: string; caption?: string; title?: string };

function blockText(b: Block): string {
  switch (b.type) {
    case "heading":
    case "paragraph":
    case "bulleted_item":
    case "numbered_item":
    case "todo":
    case "quote":
    case "code":
      return b.text ?? "";
    case "callout":
      return [b.emoji, b.text].filter(Boolean).join(" ");
    case "toggle":
      return [b.text, ...(b.children ?? []).map(blockText)].filter(Boolean).join(" ");
    case "image":
      return b.caption ?? "";
    case "bookmark":
      return b.title ?? "";
    case "page_link":
      return b.title ?? "";
    case "divider":
      return "";
    default:
      // Unknown block type — extract whatever text-like fields exist.
      const fallback = b as { text?: string; emoji?: string; caption?: string; title?: string }
      return [fallback.text, fallback.emoji, fallback.caption, fallback.title].filter(Boolean).join(" ");
  }
}

export function blocksToSearchText(blocks: Block[] | null | undefined): string {
  if (!blocks || !Array.isArray(blocks)) return "";
  return blocks
    .map(blockText)
    .filter((s) => s && s.trim().length > 0)
    .join("\n")
    .slice(0, 65_535); // hard cap for TEXT column sanity
}
