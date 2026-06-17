import { auth } from "@/auth";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/pages           -> all NON-hidden pages (the browse list)
// GET /api/pages?slug=foo  -> one page by slug (hidden pages are reachable here
//                             per spec section 4, since they're "direct link only")
// Every response requires a valid logged-in session.
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  try {
    if (slug) {
      const { rows } = await query(
        `SELECT id, notion_page_id, parent_page_id, title, slug, icon, cover,
                url, is_hidden, content, last_synced_at, updated_at
         FROM notion_pages
         WHERE slug = $1
         LIMIT 1`,
        [slug]
      );
      if (rows.length === 0) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ page: rows[0] });
    }

    const { rows } = await query(
      `SELECT id, notion_page_id, parent_page_id, title, slug, icon, cover,
              url, is_hidden, last_synced_at, updated_at
       FROM notion_pages
       WHERE is_hidden = false
       ORDER BY title ASC`
    );
    return NextResponse.json({ pages: rows });
  } catch (error) {
    // Never leak internals; safe generic message.
    console.error("[api/pages] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pages" },
      { status: 500 }
    );
  }
}
