import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import type { UserProfile } from "./types";

/**
 * Flight Path API client (Android). Mirrors the iOS `APIClient` and talks to
 * the SAME Next.js backend. Backend URL is configured in Settings and stored
 * locally; the session bearer token lives in the device keystore.
 *
 * Phase 1: connectivity + config plumbing. Auth (Google → /api/auth/exchange),
 * tally, chat, and page fetching land in later phases.
 */

const BASE_URL_KEY = "fp.base_url";
const TOKEN_KEY = "fp.token";

// Set to your backend URL in Settings (e.g. http://100.x.x.x:3000 over Tailscale).
export const DEFAULT_BASE_URL = "";

export async function getBaseUrl(): Promise<string> {
  const v = await AsyncStorage.getItem(BASE_URL_KEY);
  return v ?? DEFAULT_BASE_URL;
}

export async function setBaseUrl(url: string): Promise<void> {
  const clean = url.trim().replace(/\/+$/, "");
  if (clean) await AsyncStorage.setItem(BASE_URL_KEY, clean);
  else await AsyncStorage.removeItem(BASE_URL_KEY);
}

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string | null): Promise<void> {
  try {
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

type Json = Record<string, unknown> | unknown;

export async function request<T = Json>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const base = await getBaseUrl();
  if (!base) {
    throw new Error("Backend URL not set. Open Settings to configure it.");
  }
  const token = await getToken();
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...((init.headers as Record<string, string>) || {}),
  };
  if (token) headers["authorization"] = `Bearer ${token}`;

  const res = await fetch(`${base}${path}`, { ...init, headers });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as Json) : null;
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? String((data as Record<string, unknown>).error)
        : `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }
  return data as T;
}

export type HealthResult = {
  reachable: boolean;
  ok: boolean;
  status: number | null;
  detail: string;
};

/** Connectivity check. Any HTTP response = reachable; network error = not. */
export async function checkHealth(): Promise<HealthResult> {
  const base = await getBaseUrl();
  if (!base) {
    return { reachable: false, ok: false, status: null, detail: "Backend URL not set" };
  }
  try {
    const res = await fetch(`${base}/api/chat/health`, { method: "GET" });
    return {
      reachable: true,
      ok: res.ok,
      status: res.status,
      detail: res.ok ? "Reachable" : `HTTP ${res.status}`,
    };
  } catch (e) {
    return {
      reachable: false,
      ok: false,
      status: null,
      detail: e instanceof Error ? e.message : "Unreachable",
    };
  }
}

// ── Typed endpoints (Phase 3: tally + profile) ────────────────────────────

export type Metric = "doors" | "conversations" | "appointments";
export type TallyTotals = Record<Metric, number>;
type TallyResponse = { totals: TallyTotals };
type MeResponse = { user: UserProfile };

export type UserProfilePatch = {
  fullName?: string;
  phone?: string | null;
  town?: string | null;
  hireDate?: string | null;
  avatarUrl?: string | null;
};

export async function fetchTally(): Promise<TallyTotals> {
  const r = await request<TallyResponse>("/api/tally");
  return r.totals;
}

export async function incrementTally(
  metric: Metric,
  amount: 1 | -1
): Promise<TallyTotals> {
  const r = await request<TallyResponse>("/api/tally", {
    method: "POST",
    body: JSON.stringify({ metric, amount }),
  });
  return r.totals;
}

export async function fetchMe(): Promise<UserProfile> {
  const r = await request<MeResponse>("/api/me");
  return r.user;
}

export async function updateProfile(
  patch: UserProfilePatch
): Promise<UserProfile> {
  const r = await request<MeResponse>("/api/profile", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return r.user;
}

// ── Chat (Phase 5) ────────────────────────────────────────────────────────

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
  createdAt: string;
};
export type ChatThread = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessageRecord[];
};

type ThreadResponse = { thread: ChatThread };
type ChatSendResponse = { answer: string; sources: ChatSource[] };

export async function fetchChatThread(): Promise<ChatThread> {
  const r = await request<ThreadResponse>("/api/chat/threads");
  return r.thread;
}

export async function sendChat(
  message: string
): Promise<{ answer: string; sources: ChatSource[] }> {
  return await request<ChatSendResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

// ── Notion pages (Phase 6: reader) ────────────────────────────────────────

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

export type PageSummary = {
  id: string;
  notion_page_id?: string;
  parent_page_id?: string | null;
  title: string;
  slug: string;
  icon: string | null;
  cover?: string | null;
  is_hidden?: boolean;
  updated_at?: string;
};

export type PageDetail = PageSummary & {
  content: { blocks?: Block[] } | Block[] | null;
  url?: string | null;
};

type PagesResponse = { pages: PageSummary[] };
type PageResponse = { page: PageDetail };

export async function fetchPages(): Promise<PageSummary[]> {
  const r = await request<PagesResponse>("/api/pages");
  return r.pages ?? [];
}

export async function fetchPage(slug: string): Promise<PageDetail> {
  const r = await request<PageResponse>(
    `/api/pages?slug=${encodeURIComponent(slug)}`
  );
  return r.page;
}

/** Normalizes the `content` field into a Block[] regardless of shape. */
export function readBlocks(page: PageDetail): Block[] {
  const c = page.content;
  if (Array.isArray(c)) return c;
  return c?.blocks ?? [];
}
