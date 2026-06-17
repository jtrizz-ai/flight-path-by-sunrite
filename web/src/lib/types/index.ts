// Shared types for the web app.
//
// NOTE: The Supabase-generated `Database` type was removed when we migrated to
// local Postgres. Table shapes now live in the database (see db/init/01-schema.sql)
// and we type query results inline at each call site.

// A user row from `app_users`.
export interface AppUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "member" | "admin";
  created_at: string;
  last_active_at: string;
}

// One crawled Notion page (see db/init/01-schema.sql -> notion_pages).
export interface NotionPage {
  id: string;
  notion_page_id: string;
  parent_page_id: string | null;
  child_ids: string[];
  title: string;
  slug: string;
  icon: string | null;
  cover: string | null;
  url: string | null;
  tags: string[];
  is_hidden: boolean;
  content: { blocks?: unknown[] } | null;
  order_index: number | null;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

// Page change snapshots.
export interface PageVersion {
  id: string;
  page_id: string;
  content: unknown;
  version_number: number;
  change_summary: string | null;
  created_at: string;
}

// Worker crawl history.
export interface CrawlLog {
  id: string;
  status: "running" | "completed" | "failed";
  pages_processed: number;
  pages_created: number;
  pages_updated: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

// Canonical content block (mirrors CLAUDE.md section 10 and the worker's
// normalize.ts). Two extensions: text-bearing blocks carry optional `runs`
// (preserves hyperlinks + bold/italic/etc), and image carries optional `href`
// (the "clickable image" convention: a URL in an image's caption -> link).
export type Run = {
  text: string;
  href?: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  strikethrough?: boolean;
};

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
