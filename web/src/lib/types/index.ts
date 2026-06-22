// Shared types for the web app.
//
// NOTE: The Supabase-generated `Database` type was removed when we migrated to
// local Postgres. Table shapes now live in the database (see db/init/01-schema.sql)
// and we type query results inline at each call site.

// A user row from `app_users`.
// Updated in Phase 1: 5 new roles, status field, profile fields (phone, town)
export type UserRole = "Admin" | "Manager" | "Team Lead" | "Sales" | "Field Marketer";
export type UserStatus = "active" | "paused";

export interface AppUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  phone: string | null;
  town: string | null;
  region: string | null;
  team: string | null;
  hire_date: string | null;
  app_open_count: number;
  last_app_open_at: string | null;
  created_at: string;
  last_active_at: string;
}

export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_quarterly: boolean;
  display_order: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  badge: Badge;
  quarter: number | null;
  year: number | null;
  awarded_by: string | null;
  awarded_at: string;
  notes: string | null;
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

// ─────────────────────────────────────────────────────────────────────────
// Profile + chat types (spec section 6: data shapes).
// Used by /api/me, /api/profile, /api/chat/*, and the iOS client mirror.
// ─────────────────────────────────────────────────────────────────────────

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  phone: string | null;
  town: string | null;
  region: string | null;
  team: string | null;
  hireDate: string | null; // ISO date YYYY-MM-DD
  role: UserRole;
  status: UserStatus;
};

/** All-optional shape for PATCH /api/profile. */
export type UserProfilePatch = {
  fullName?: string;
  avatarUrl?: string | null;
  phone?: string | null;
  town?: string | null;
  hireDate?: string | null;
};

export type ChatSource = {
  pageId: string;
  title: string;
  slug: string;
  snippet: string;
};

export type ChatMessageRecord = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: ChatSource[] | null;
  createdAt: string; // ISO
};

export type ChatThread = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessageRecord[];
};

/**
 * Lightweight row for the conversation list. Used by GET /api/chat/threads.
 * `messages` is intentionally omitted; clients fetch a single thread by id
 * via GET /api/chat/threads/[id] when the user opens it.
 */
export type ChatThreadSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessagePreview: string | null;
};

export type ChatThreadListResponse = {
  threads: ChatThreadSummary[];
};

/**
 * Extended /api/chat response. `threadId` lets the client track which thread
 * the answer belongs to (it may have just been created on this call).
 * `threadTitle` mirrors the (possibly newly-derived) title so the sidebar
 * stays in sync without a separate fetch.
 */
export type ChatResponsePayload = {
  answer: string;
  sources: ChatSource[];
  threadId: string;
  threadTitle: string;
};
