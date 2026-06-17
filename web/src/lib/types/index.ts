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

// Content block (rendered from the normalized Notion body). Field names match
// what the worker currently writes; to be reconciled with CLAUDE.md section 10.
// TODO: replace with the canonical Block union from the spec.
export interface ContentBlock {
  type:
    | "paragraph"
    | "heading_1"
    | "heading_2"
    | "heading_3"
    | "bulleted_list"
    | "numbered_list"
    | "to_do"
    | "toggle"
    | "callout"
    | "quote"
    | "divider"
    | "code";
  content: any;
  text?: string;
  level?: number;
  checked?: boolean;
  children?: ContentBlock[];
}
