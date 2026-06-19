import { query } from "@/lib/db";
import type { ChatSource } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────
// Retrieval (spec section 7).
//
// Live Postgres full-text search over notion_pages.search_vector. Hidden
// pages are always excluded. Returns the top-N matching pages with a
// ts_headline snippet for citation.
// ─────────────────────────────────────────────────────────────────────────

export type RetrievedPage = ChatSource & { bodyText: string };

export async function retrievePages(
  queryText: string,
  limit = 4
): Promise<RetrievedPage[]> {
  const trimmed = queryText.trim();
  if (!trimmed) return [];

  const { rows } = await query<{
    id: string;
    title: string;
    slug: string;
    snippet: string;
    body_text: string;
  }>(
    `SELECT id,
            title,
            slug,
            ts_headline('english',
                        coalesce(title,'') || ' ' || coalesce(search_text,''),
                        websearch_to_tsquery($1),
                        'MaxWords=35, MinWords=10') AS snippet,
            coalesce(search_text,'') AS body_text
       FROM notion_pages
      WHERE is_hidden = false
        AND search_vector @@ websearch_to_tsquery($1)
      ORDER BY ts_rank(search_vector, websearch_to_tsquery($1)) DESC
      LIMIT $2`,
    [trimmed, limit]
  );

  return rows.map((r) => ({
    pageId: r.id,
    title: r.title,
    slug: r.slug,
    snippet: r.snippet,
    bodyText: r.body_text,
  }));
}

/** Convert RetrievedPage[] to the wire `Source[]` shape (drops bodyText). */
export function toSources(pages: RetrievedPage[]): ChatSource[] {
  return pages.map((p) => ({
    pageId: p.pageId,
    title: p.title,
    slug: p.slug,
    snippet: p.snippet,
  }));
}
