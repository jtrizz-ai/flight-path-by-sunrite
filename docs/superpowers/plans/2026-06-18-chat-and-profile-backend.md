# Chat + Profile Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the chat page functional (keep its look) and add a profile backend that works for both the web and iOS frontends, sharing one auth bridge and one iOS networking layer.

**Architecture:** Single Next.js API serves both web (NextAuth cookie) and iOS (Bearer token from `POST /api/auth/exchange`). A `resolveSession()` helper accepts either auth method on every route. Chat uses live Postgres full-text search over `notion_pages` (new `search_text` + generated `search_vector`) and calls a local LM Studio LLM via the OpenAI-compatible protocol. LLM URL/model/key are stored in `admin_settings` and editable from `/admin`. iOS gets a new `Networking/` folder with `APIClient`, `KeychainStore`, typed `Endpoints`, and two new screens (`ProfileView`, `SettingsView`). Login gate is re-enabled.

**Tech Stack:** Next.js 16.2.9 (App Router, server components), React 19, NextAuth v5 beta (Google OAuth), `pg` 8 (raw SQL, no ORM), Postgres 16 (Docker), Tailwind v4, zod 4. iOS: SwiftUI (iOS 15+), `URLSession` async/await, Keychain Services, GoogleSignIn-iOS (SPM).

**Spec:** `docs/superpowers/specs/2026-06-18-chat-and-profile-backend-design.md`

**Repo conventions (read before starting):**
- All API routes use `query<T>(sql, [params])` from `web/src/lib/db.ts` — never instantiate `Pool` directly.
- Comments document the "why", not the what. Heavy banner comments matching `web/src/lib/auth/gate.ts` style are welcome.
- Next.js 16 breaking change: route handler `params` and searchParams are async — always `await` them. Consult `web/AGENTS.md` and `node_modules/next/dist/docs/` if unsure.
- No tests exist; verification is by curl with expected output (web) and Xcode simulator (iOS). Do not introduce a test framework in this plan.
- Commits: lowercase imperative subject, blank line, body. Match the existing style (`git log --oneline -5` to confirm).

**Out of scope (per spec §2):** Tally/Schedule live data, Browse/PageDetail views, multi-thread chat, streaming responses, rewriting CLAUDE.md.

---

## Phase 1 — Foundation: DB migration + cross-platform auth bridge

**Goal:** iOS can mint a backend token; web is unchanged. Verifiable with curl.

### Task 1.1: Database migration for new schema

**Files:**
- Create: `db/migrations/002-chat-and-profile.sql`

- [ ] **Step 1: Write the migration SQL**

Create `db/migrations/002-chat-and-profile.sql` with this exact content:

```sql
-- ===========================================================================
-- 002-chat-and-profile.sql
-- Implements: docs/superpowers/specs/2026-06-18-chat-and-profile-backend-design.md
-- Sections 5 (DB changes) and 7 (chat retrieval schema).
-- ===========================================================================

BEGIN;

-- ── Section 5: hire_date on app_users ───────────────────────────────────
ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS hire_date DATE;

-- ── Section 7: searchable text + tsvector on notion_pages ───────────────
-- The existing idx_notion_pages_search covers title only; chat retrieval
-- needs full-body search. search_text is populated by node-worker on crawl.
ALTER TABLE notion_pages
  ADD COLUMN IF NOT EXISTS search_text TEXT;

ALTER TABLE notion_pages
  DROP COLUMN IF EXISTS search_vector;
ALTER TABLE notion_pages
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(search_text,''))
  ) STORED;

DROP INDEX IF EXISTS idx_notion_pages_search_vector;
CREATE INDEX idx_notion_pages_search_vector
  ON notion_pages USING gin(search_vector);

-- ── Section 5: chat history tables ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_threads (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'Conversation',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_threads_user
  ON chat_threads(user_id);

CREATE TABLE IF NOT EXISTS chat_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id   UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  sources     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread
  ON chat_messages(thread_id, created_at);

-- Keep thread.updated_at fresh when messages are added.
CREATE OR REPLACE FUNCTION touch_thread_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_threads SET updated_at = now() WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_chat_messages_thread ON chat_messages;
CREATE TRIGGER update_chat_messages_thread
  AFTER INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION touch_thread_updated_at();

-- ── Section 5: seed llm_config (only if not already present) ────────────
INSERT INTO admin_settings (key, value)
VALUES (
  'llm_config',
  jsonb_build_object(
    'baseUrl', 'http://100.101.18.67:1234/v1',
    'model',   'local-model',
    'apiKey',  'not-needed'
  )
)
ON CONFLICT (key) DO NOTHING;

COMMIT;
```

- [ ] **Step 2: Apply the migration**

Run from repo root:

```bash
docker compose exec -T db psql -U flightpath -d flightpath -f - < db/migrations/002-chat-and-profile.sql
```

Expected: a series of `CREATE INDEX`, `ALTER TABLE`, `CREATE TRIGGER`, and `INSERT 0 1` lines, ending with `COMMIT`.

- [ ] **Step 3: Verify the schema**

```bash
docker compose exec -T db psql -U flightpath -d flightpath -c "\d app_users" | grep hire_date
docker compose exec -T db psql -U flightpath -d flightpath -c "\d notion_pages" | grep -E "search_text|search_vector"
docker compose exec -T db psql -U flightpath -d flightpath -c "\dt" | grep -E "chat_threads|chat_messages"
docker compose exec -T db psql -U flightpath -d flightpath -c "SELECT value FROM admin_settings WHERE key='llm_config';"
```

Expected: each line returns a row; the `llm_config` JSON shows the LM Studio URL.

- [ ] **Step 4: Commit**

```bash
git add db/migrations/002-chat-and-profile.sql
git commit -m "db: add hire_date, chat tables, FTS search_vector, llm_config seed

Implements spec section 5 (DB changes) and section 7 (search schema).
Migration 002; apply via psql against the running container."
```

---

### Task 1.2: Shared profile type and helpers

**Files:**
- Modify: `web/src/lib/types/index.ts`

- [ ] **Step 1: Read the current types file**

```bash
cat web/src/lib/types/index.ts
```

- [ ] **Step 2: Add the shared types**

Append (or merge) into `web/src/lib/types/index.ts`:

```typescript
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
```

If `UserStatus` is not already exported, check the file and add it. The exploration noted it exists as `'active' | 'paused'`.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd web && npx tsc --noEmit
```

Expected: no errors. (If `tsc` is slow, `cd web && npm run lint` is a faster smoke test.)

- [ ] **Step 4: Commit**

```bash
git add web/src/lib/types/index.ts
git commit -m "web: add UserProfile, ChatThread, ChatSource types"
```

---

### Task 1.3: `resolveSession` — unified cookie-or-bearer auth helper

**Files:**
- Create: `web/src/lib/auth/resolveSession.ts`
- Reference: `web/src/auth.ts`, `web/src/lib/auth/gate.ts`

- [ ] **Step 1: Write the helper**

Create `web/src/lib/auth/resolveSession.ts`:

```typescript
import { auth } from "@/auth";
import { query } from "@/lib/db";
import { randomBytes, createHash } from "node:crypto";
import type { UserProfile, UserRole, UserStatus } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────
// Unified session resolution (spec section 4: Auth bridge).
//
// Every API route calls resolveSession() to learn who is calling. It accepts
// EITHER:
//   1. The NextAuth cookie (web browser) - resolved via auth()
//   2. An Authorization: Bearer <token> header (iOS app), where <token> was
//      minted by POST /api/auth/exchange and stored as a SHA-256 hash in the
//      sessions table.
//
// Both paths resolve to the same UserProfile shape so route handlers don't
// care which client is calling.
// ─────────────────────────────────────────────────────────────────────────

export type ResolveSessionResult =
  | { ok: true; user: UserProfile; source: "cookie" | "bearer" }
  | { ok: false; reason: "unauthenticated" };

/** Hash a bearer token with SHA-256 (we never store the raw token). */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Mint a 32-byte cryptographically random opaque token. */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/** Look up an app_users row by id and shape it as UserProfile. */
async function loadUserProfile(userId: string): Promise<UserProfile | null> {
  const { rows } = await query<{
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    town: string | null;
    hire_date: Date | null;
    role: UserRole;
    status: UserStatus;
  }>(
    `SELECT id, email, full_name, avatar_url, phone, town, hire_date, role, status
       FROM app_users
      WHERE id = $1
      LIMIT 1`,
    [userId]
  );
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    email: r.email,
    fullName: r.full_name ?? "",
    avatarUrl: r.avatar_url,
    phone: r.phone,
    town: r.town,
    hireDate: r.hire_date ? r.hire_date.toISOString().slice(0, 10) : null,
    role: r.role,
    status: r.status,
  };
}

/**
 * Resolve the current caller. Pass the Request so we can pull the bearer
 * header; NextAuth's cookie is read from the same request under the hood.
 */
export async function resolveSession(
  req?: Request
): Promise<ResolveSessionResult> {
  // 1. Try the NextAuth cookie path first.
  try {
    const session = await auth();
    if (session?.user?.id) {
      const user = await loadUserProfile(session.user.id);
      if (user) return { ok: true, user, source: "cookie" };
    }
  } catch {
    // Cookie path failed; fall through to bearer.
  }

  // 2. Try Authorization: Bearer <token>.
  if (req) {
    const header = req.headers.get("authorization") ?? "";
    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (match) {
      const token = match[1].trim();
      const { rows } = await query<{ app_user_id: string }>(
        `SELECT s.app_user_id
           FROM sessions s
           JOIN app_users u ON u.id = s.app_user_id
          WHERE s.token_hash = $1
            AND s.expires_at > now()
            AND u.status = 'active'
          LIMIT 1`,
        [hashToken(token)]
      );
      const row = rows[0];
      if (row) {
        const user = await loadUserProfile(row.app_user_id);
        if (user) return { ok: true, user, source: "bearer" };
      }
    }
  }

  return { ok: false, reason: "unauthenticated" };
}

/** Convenience: returns the user or a 401 Response. */
export async function requireUser(
  req?: Request
): Promise<UserProfile | Response> {
  const result = await resolveSession(req);
  if (!result.ok) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  return result.user;
}

/** Returns true iff the resolved user is an Admin. */
export function isAdmin(user: UserProfile): boolean {
  return user.role === "Admin";
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/auth/resolveSession.ts
git commit -m "web: add resolveSession() cookie-or-bearer auth helper"
```

---

### Task 1.4: `POST /api/auth/exchange` — iOS token mint

**Files:**
- Create: `web/src/app/api/auth/exchange/route.ts`

- [ ] **Step 1: Write the route handler**

Create `web/src/app/api/auth/exchange/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { checkLoginGate, upsertAppUser } from "@/lib/auth/gate";
import {
  generateToken,
  hashToken,
} from "@/lib/auth/resolveSession";
import type { UserProfile, UserRole, UserStatus } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/exchange (iOS-only).
//
// Body: { googleIdToken: string }
//
// Flow (spec section 6):
//   1. Verify the Google ID token with Google's tokeninfo endpoint.
//   2. Look up the user by email in app_users (creating on first login).
//   3. Run checkLoginGate (allowed domain + invite + active status).
//   4. Mint a 32-byte opaque token, store its SHA-256 in sessions (60 days).
//   5. Return { token, expiresIn, user }.
//
// The response uses the same "Email not allowed" message for every gate
// failure to avoid leaking which check failed.
// ─────────────────────────────────────────────────────────────────────────

const SESSION_TTL_DAYS = 60;
const SESSION_TTL_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60;

type GoogleTokenInfo = {
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  sub?: string;
};

async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenInfo | null> {
  // Google's tokeninfo is the simplest verification path; for higher traffic
  // swap to local JWT verification against Google's public keys.
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as GoogleTokenInfo;
    if (!data.email) return null;
    return data;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  let body: { googleIdToken?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const idToken = body.googleIdToken;
  if (typeof idToken !== "string" || idToken.length === 0) {
    return NextResponse.json({ error: "googleIdToken required" }, { status: 400 });
  }

  // 1. Verify with Google.
  const info = await verifyGoogleIdToken(idToken);
  if (!info || !info.email) {
    return NextResponse.json({ error: "Invalid Google token" }, { status: 401 });
  }
  if (info.email_verified !== true && info.email_verified !== "true") {
    return NextResponse.json({ error: "Email not verified" }, { status: 401 });
  }

  const email = info.email.trim().toLowerCase();

  // 2. Run the same gate the web uses.
  const gate = await checkLoginGate(email);
  if (!gate.allowed) {
    // Single message; do not leak which check failed.
    return NextResponse.json({ error: "Email not allowed" }, { status: 403 });
  }

  // 3. Upsert the app_user row (mirrors the web signIn callback).
  await upsertAppUser(email, info.name ?? null, info.picture ?? null);

  // 4. Load the profile (we need the internal id + role).
  const { rows: userRows } = await query<{
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    town: string | null;
    hire_date: Date | null;
    role: UserRole;
    status: UserStatus;
  }>(
    `SELECT id, email, full_name, avatar_url, phone, town, hire_date, role, status
       FROM app_users WHERE lower(email) = $1 LIMIT 1`,
    [email]
  );
  const u = userRows[0];
  if (!u) {
    return NextResponse.json({ error: "User lookup failed" }, { status: 500 });
  }

  // 5. Mint token, store hash.
  const token = generateToken();
  await query(
    `INSERT INTO sessions (id, app_user_id, email, token_hash, expires_at)
     VALUES (gen_random_uuid(), $1, $2, $3, now() + ($4 || ' days')::interval)`,
    [u.id, email, hashToken(token), String(SESSION_TTL_DAYS)]
  );

  // 6. Return token + safe user profile.
  const profile: UserProfile = {
    id: u.id,
    email,
    fullName: u.full_name ?? "",
    avatarUrl: u.avatar_url,
    phone: u.phone,
    town: u.town,
    hireDate: u.hire_date ? u.hire_date.toISOString().slice(0, 10) : null,
    role: u.role,
    status: u.status,
  };

  return NextResponse.json({
    token,
    expiresIn: SESSION_TTL_SECONDS,
    user: profile,
  });
}
```

- [ ] **Step 2: Verify the route compiles**

```bash
cd web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Smoke-test with a fake token**

Start the dev server (`cd web && npm run dev` in another shell), then:

```bash
curl -s -X POST http://localhost:3000/api/auth/exchange \
  -H "content-type: application/json" \
  -d '{"googleIdToken":"bogus"}'
```

Expected: `{"error":"Invalid Google token"}` with HTTP 401.

- [ ] **Step 4: Commit**

```bash
git add web/src/app/api/auth/exchange/route.ts
git commit -m "web: add POST /api/auth/exchange for iOS bearer tokens"
```

---

### Task 1.5: `POST /api/auth/signout` — iOS token destroy

**Files:**
- Create: `web/src/app/api/auth/signout/route.ts`

- [ ] **Step 1: Write the route handler**

Create `web/src/app/api/auth/signout/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hashToken } from "@/lib/auth/resolveSession";

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/signout (iOS-only).
//
// Body: none. Reads Authorization: Bearer <token>, deletes the matching
// sessions row. Web sign-out continues to use NextAuth's /api/auth/signout.
//
// Always returns 200 { ok: true } so a stale/revoked token on the client
// does not strand the user in a "couldn't sign out" state.
// ─────────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (match) {
    const tokenHash = hashToken(match[1].trim());
    await query(`DELETE FROM sessions WHERE token_hash = $1`, [tokenHash]);
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Verify it compiles, then smoke-test**

```bash
cd web && npx tsc --noEmit
curl -s -X POST http://localhost:3000/api/auth/signout -H "authorization: Bearer deadbeef"
```

Expected: `{"ok":true}` HTTP 200.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/api/auth/signout/route.ts
git commit -m "web: add POST /api/auth/signout for iOS bearer tokens"
```

---

### Task 1.6: LLM config loader + first-boot seeder

**Files:**
- Create: `web/src/lib/chat/llmConfig.ts`

- [ ] **Step 1: Write the module**

Create `web/src/lib/chat/llmConfig.ts`:

```typescript
import { query } from "@/lib/db";

// ─────────────────────────────────────────────────────────────────────────
// LLM configuration (spec section 8).
//
// The active config lives in admin_settings.llm_config JSONB. On first boot
// we seed from process.env so a fresh install works without DB edits. After
// first boot, all changes go through PUT /api/admin/llm-config.
//
// The config is cached in-process for 60 seconds to avoid a DB lookup on
// every chat message.
// ─────────────────────────────────────────────────────────────────────────

export type LlmConfig = {
  baseUrl: string;
  model: string;
  apiKey: string;
};

const DEFAULT_CONFIG: LlmConfig = {
  baseUrl: process.env.LLM_BASE_URL ?? "http://100.101.18.67:1234/v1",
  model: process.env.LLM_MODEL ?? "local-model",
  apiKey: process.env.LLM_API_KEY ?? "not-needed",
};

let cache: { value: LlmConfig; expiresAt: number } | null = null;
const TTL_MS = 60_000;

let seeded = false;

/** Seed admin_settings.llm_config if missing. Called once at module load. */
export async function ensureLlmConfigSeeded(): Promise<void> {
  if (seeded) return;
  seeded = true;
  try {
    await query(
      `INSERT INTO admin_settings (key, value)
       VALUES ('llm_config', $1)
       ON CONFLICT (key) DO NOTHING`,
      [JSON.stringify(DEFAULT_CONFIG)]
    );
  } catch {
    // Best-effort; if this fails the route will surface a clearer error.
  }
}

/** Read the current LLM config (cached for TTL_MS). */
export async function getLlmConfig(): Promise<LlmConfig> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.value;
  }
  await ensureLlmConfigSeeded();
  const { rows } = await query<{ value: LlmConfig }>(
    `SELECT value FROM admin_settings WHERE key = 'llm_config' LIMIT 1`
  );
  const value = rows[0]?.value ?? DEFAULT_CONFIG;
  cache = { value, expiresAt: Date.now() + TTL_MS };
  return value;
}

/** Update the config (admin only) and bust the cache. */
export async function setLlmConfig(patch: Partial<LlmConfig>): Promise<LlmConfig> {
  const current = await getLlmConfig();
  const next: LlmConfig = {
    baseUrl: patch.baseUrl ?? current.baseUrl,
    model: patch.model ?? current.model,
    apiKey: patch.apiKey ?? current.apiKey,
  };
  await query(
    `UPDATE admin_settings SET value = $1, updated_at = now() WHERE key = 'llm_config'`,
    [JSON.stringify(next)]
  );
  cache = { value: next, expiresAt: Date.now() + TTL_MS };
  return next;
}

/** Mask the API key for safe display in admin UIs: "sk-...abc". */
export function maskApiKey(key: string): string {
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 3)}...${key.slice(-3)}`;
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/chat/llmConfig.ts
git commit -m "web: add LLM config loader with first-boot seeding + cache"
```

---

## Phase 2 — Profile backend + web profile page

### Task 2.1: `GET /api/me`

**Files:**
- Create: `web/src/app/api/me/route.ts`

- [ ] **Step 1: Write the route**

```typescript
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/resolveSession";

// GET /api/me — return the caller's full profile.
// Works for both web (cookie) and iOS (bearer).
export async function GET(req: Request) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;
  return NextResponse.json({ user });
}
```

- [ ] **Step 2: Verify with a cookie-session (web) call**

Sign in at `http://localhost:3000/` via Google in a browser, then:

```bash
# Copy the cookie value from your browser devtools, or just hit it from the browser:
curl -s http://localhost:3000/api/me -H "cookie: <paste next-auth.session-token cookie>"
```

Expected: JSON with `{ user: { id, email, fullName, ... } }`.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/api/me/route.ts
git commit -m "web: add GET /api/me"
```

---

### Task 2.2: `PATCH /api/profile`

**Files:**
- Create: `web/src/app/api/profile/route.ts`

- [ ] **Step 1: Write the route**

```typescript
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth/resolveSession";
import type { UserProfilePatch, UserRole, UserStatus } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────
// PATCH /api/profile — update the caller's self-editable fields.
//
// Whitelisted fields: fullName, avatarUrl, phone, town, hireDate.
// email, role, status, id are SILENTLY STRIPPED (never an error) so the
// client cannot escalate privileges via mass-assignment.
// ─────────────────────────────────────────────────────────────────────────

export async function PATCH(req: Request) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── Validate + collect only allowed fields ────────────────────────────
  const patch: UserProfilePatch = {};
  if (typeof body.fullName === "string") {
    const t = body.fullName.trim();
    if (t.length === 0 || t.length > 200) {
      return NextResponse.json({ error: "fullName must be 1-200 chars" }, { status: 400 });
    }
    patch.fullName = t;
  }
  if (body.avatarUrl === null || typeof body.avatarUrl === "string") {
    const v = body.avatarUrl;
    if (typeof v === "string" && v.length > 0) {
      try {
        new URL(v);
      } catch {
        return NextResponse.json({ error: "avatarUrl must be a URL" }, { status: 400 });
      }
    }
    patch.avatarUrl = v === "" ? null : v;
  }
  if (body.phone === null || typeof body.phone === "string") {
    const v = typeof body.phone === "string" ? body.phone.trim() : null;
    if (v !== null && v.length > 32) {
      return NextResponse.json({ error: "phone too long" }, { status: 400 });
    }
    patch.phone = v;
  }
  if (body.town === null || typeof body.town === "string") {
    const v = typeof body.town === "string" ? body.town.trim() : null;
    if (v !== null && v.length > 200) {
      return NextResponse.json({ error: "town too long" }, { status: 400 });
    }
    patch.town = v;
  }
  if (body.hireDate === null || typeof body.hireDate === "string") {
    if (typeof body.hireDate === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(body.hireDate)) {
      return NextResponse.json({ error: "hireDate must be YYYY-MM-DD or null" }, { status: 400 });
    }
    patch.hireDate = body.hireDate as string | null;
  }

  // ── Build a dynamic UPDATE (only touch provided fields) ───────────────
  const cols: string[] = [];
  const vals: unknown[] = [];
  const map: Record<keyof UserProfilePatch, string> = {
    fullName: "full_name",
    avatarUrl: "avatar_url",
    phone: "phone",
    town: "town",
    hireDate: "hire_date",
  };
  (Object.keys(map) as (keyof UserProfilePatch)[]).forEach((k) => {
    if (k in patch) {
      cols.push(`${map[k]} = $${cols.length + 1}`);
      vals.push(patch[k]);
    }
  });

  if (cols.length === 0) {
    return NextResponse.json({ user }, { status: 200 }); // nothing to do
  }

  vals.push(user.id);
  const { rows } = await query<{
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    town: string | null;
    hire_date: Date | null;
    role: UserRole;
    status: UserStatus;
  }>(
    `UPDATE app_users
        SET ${cols.join(", ")}
      WHERE id = $${vals.length}
      RETURNING id, email, full_name, avatar_url, phone, town, hire_date, role, status`,
    vals
  );

  const r = rows[0];
  const updated = {
    id: r.id,
    email: r.email,
    fullName: r.full_name ?? "",
    avatarUrl: r.avatar_url,
    phone: r.phone,
    town: r.town,
    hireDate: r.hire_date ? r.hire_date.toISOString().slice(0, 10) : null,
    role: r.role,
    status: r.status,
  };
  return NextResponse.json({ user: updated });
}
```

- [ ] **Step 2: Verify the PATCH works**

```bash
curl -s -X PATCH http://localhost:3000/api/profile \
  -H "content-type: application/json" \
  -H "cookie: <paste next-auth.session-token>" \
  -d '{"phone":"555-1234","town":"Phoenix","hireDate":"2024-08-15","role":"Admin"}'
```

Expected: phone/town/hireDate updated in the response; `role` is **ignored** (still shows the prior role).

- [ ] **Step 3: Commit**

```bash
git add web/src/app/api/profile/route.ts
git commit -m "web: add PATCH /api/profile with mass-assignment guard"
```

---

### Task 2.3: Web profile page

**Files:**
- Create: `web/src/app/profile/page.tsx` (server-component shell)
- Create: `web/src/components/fp/ProfileForm.tsx` (client-component form)

- [ ] **Step 1: Read existing patterns**

```bash
cat web/src/components/fp/SideDrawer.tsx
ls web/src/app/flight-path
```

- [ ] **Step 2: Create the server-component shell**

`web/src/app/profile/page.tsx`:

```typescript
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/fp/ProfileForm";

// Force this page to be dynamic so the session is always read fresh.
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  return (
    <main className="min-h-screen bg-[var(--color-fp-bg)] text-[var(--color-fp-ink-1)]">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-[family-name:var(--font-anton)] text-4xl uppercase tracking-tight">
          Profile
        </h1>
        <p className="mt-2 font-[family-name:var(--font-jetbrains-mono)] text-xs uppercase tracking-[0.2em] text-[var(--color-fp-ink-3)]">
          {session.user.email}
        </p>
        <div className="mt-10">
          <ProfileForm />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Create the client form**

`web/src/components/fp/ProfileForm.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth";

type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  phone: string | null;
  town: string | null;
  hireDate: string | null;
};

export default function ProfileForm() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [town, setTown] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setProfile(d.user);
          setFullName(d.user.fullName ?? "");
          setAvatarUrl(d.user.avatarUrl ?? "");
          setPhone(d.user.phone ?? "");
          setTown(d.user.town ?? "");
          setHireDate(d.user.hireDate ?? "");
        }
      });
  }, []);

  async function onSave() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fullName,
        avatarUrl: avatarUrl || null,
        phone: phone || null,
        town: town || null,
        hireDate: hireDate || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSavedAt(Date.now());
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Save failed");
    }
  }

  if (!profile) {
    return <div className="text-[var(--color-fp-ink-3)]">Loading…</div>;
  }

  const inputCls =
    "w-full rounded-[var(--radius-2)] border border-[color:var(--color-fp-line)] bg-[color:var(--color-fp-surface)] px-4 py-3 font-[family-name:var(--font-archivo)] text-[var(--color-fp-ink-1)] focus:outline-none focus:border-[color:var(--color-fp-accent)]";

  return (
    <div className="space-y-5">
      <Field label="FULL NAME">
        <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </Field>
      <Field label="AVATAR URL">
        <input className={inputCls} value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
      </Field>
      <Field label="PHONE">
        <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
      </Field>
      <Field label="TOWN">
        <input className={inputCls} value={town} onChange={(e) => setTown(e.target.value)} />
      </Field>
      <Field label="HIRE DATE">
        <input type="date" className={inputCls} value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
      </Field>

      {error && <div className="text-sm text-[var(--color-fp-accent)]">{error}</div>}
      {savedAt && !error && <div className="text-sm text-[var(--color-fp-ink-3)]">Saved.</div>}

      <div className="flex items-center gap-4 pt-4">
        <button
          onClick={onSave}
          disabled={saving}
          className="rounded-[var(--radius-2)] bg-[var(--color-fp-accent)] px-6 py-3 font-[family-name:var(--font-jetbrains-mono)] text-xs uppercase tracking-[0.2em] text-black disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="font-[family-name:var(--font-jetbrains-mono)] text-xs uppercase tracking-[0.2em] text-[var(--color-fp-ink-3)] hover:text-[var(--color-fp-ink-2)]"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block pb-2 font-[family-name:var(--font-jetbrains-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--color-fp-ink-3)]">
        {label}
      </span>
      {children}
    </label>
  );
}
```

- [ ] **Step 4: Wire SideDrawer "Profile" link**

Read `web/src/components/fp/SideDrawer.tsx` and find the dead Profile link (currently non-navigating). Replace it with a Next.js `<Link href="/profile">`. Pattern: however Schedule/Tally/Chat rows render their link, mimic that with the new href.

- [ ] **Step 5: Verify in browser**

```bash
cd web && npm run dev
```

Open `http://localhost:3000/profile` (sign in first if needed). Expected: form pre-filled, change phone/town, hit Save, see "Saved." Refresh, see changes persist.

- [ ] **Step 6: Commit**

```bash
git add web/src/app/profile/page.tsx web/src/components/fp/ProfileForm.tsx web/src/components/fp/SideDrawer.tsx
git commit -m "web: add /profile page + form; wire SideDrawer link"
```

---

## Phase 3 — Chat backend + web chat wiring

### Task 3.1: node-worker `search_text` extraction

**Files:**
- Modify: `node-worker/src/services/db.service.ts` (or the function that writes `notion_pages`)
- Create: `node-worker/src/services/searchText.ts`

- [ ] **Step 1: Locate the writer**

```bash
grep -n "INSERT INTO notion_pages\|UPDATE notion_pages" node-worker/src
```

Identify the function that builds the upsert payload (per exploration, this lives in `node-worker/src/services/db.service.ts`).

- [ ] **Step 2: Create the text extractor**

`node-worker/src/services/searchText.ts`:

```typescript
// Walk a normalized Block[] and concatenate all visible text fields into
// a single string for full-text search. Block types match the spec section 10
// of CLAUDE.md. Image/bookmark/divider/page_link blocks contribute nothing.

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
  | { type: "divider" };

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
  }
}

export function blocksToSearchText(blocks: Block[] | null | undefined): string {
  if (!blocks) return "";
  return (blocks as Block[])
    .map(blockText)
    .filter(Boolean)
    .join("\n")
    .slice(0, 65_535); // hard cap for TEXT column sanity
}
```

- [ ] **Step 3: Wire the writer to populate `search_text`**

In the writer function that does the `INSERT`/`UPDATE` against `notion_pages`, add `search_text` to both the column list and the values, computed via `blocksToSearchText(content)`. Update the `ON CONFLICT` upsert to set `search_text = EXCLUDED.search_text`.

Exact patch depends on the writer's current shape — read it and apply the equivalent of:

```typescript
// Before:
INSERT INTO notion_pages (notion_page_id, parent_page_id, ..., content)
VALUES ($1, $2, ..., $N)
ON CONFLICT (notion_page_id) DO UPDATE SET content = EXCLUDED.content ...

// After:
INSERT INTO notion_pages (notion_page_id, parent_page_id, ..., content, search_text)
VALUES ($1, $2, ..., $N, $searchText)
ON CONFLICT (notion_page_id) DO UPDATE SET content = EXCLUDED.content, search_text = EXCLUDED.search_text ...
```

- [ ] **Step 4: Re-run a crawl to backfill**

```bash
cd node-worker && npm run build && npm start
```

Wait for the crawl to finish, then verify:

```bash
docker compose exec -T db psql -U flightpath -d flightpath -c "SELECT title, length(search_text) FROM notion_pages LIMIT 5;"
```

Expected: rows with non-zero `length(search_text)`.

- [ ] **Step 5: Commit**

```bash
git add node-worker/src/services/searchText.ts node-worker/src/services/db.service.ts
git commit -m "node-worker: populate notion_pages.search_text on crawl"
```

---

### Task 3.2: Retrieval service

**Files:**
- Create: `web/src/lib/chat/retrieve.ts`

- [ ] **Step 1: Write the service**

`web/src/lib/chat/retrieve.ts`:

```typescript
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

export async function retrievePages(queryText: string, limit = 4): Promise<RetrievedPage[]> {
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
```

- [ ] **Step 2: Verify it compiles**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/chat/retrieve.ts
git commit -m "web: add chat retrieval over notion_pages.search_vector"
```

---

### Task 3.3: Prompt builder + LLM caller

**Files:**
- Create: `web/src/lib/chat/prompt.ts`
- Create: `web/src/lib/chat/llm.ts`

- [ ] **Step 1: Write the prompt builder**

`web/src/lib/chat/prompt.ts`:

```typescript
import type { RetrievedPage } from "./retrieve";

// Verbatim system-prompt base from CLAUDE.md section 14. Read-only,
// refuses when content is missing, never claims to write/change anything.
const SYSTEM_BASE = `You are the Flight Path Assistant, a read-only helper.
You can ONLY use the Flight Path content provided below as CONTEXT.
If the answer is not in the context, say:
"I don't have that in the current Flight Path content."
Never say you changed, saved, created, or deleted anything.
Be concise, practical, and plain-spoken.`;

export function buildMessages(
  question: string,
  pages: RetrievedPage[]
): Array<{ role: "system" | "user"; content: string }> {
  const contextBlock = pages.length
    ? pages
        .map(
          (p) =>
            `### ${p.title}\n(slug: ${p.slug})\n${p.bodyText}`
        )
        .join("\n\n---\n\n")
    : "(No matching Flight Path pages were found.)";

  return [
    {
      role: "system",
      content: `${SYSTEM_BASE}\n\nCONTEXT:\n${contextBlock}`,
    },
    { role: "user", content: question },
  ];
}
```

- [ ] **Step 2: Write the LLM caller**

`web/src/lib/chat/llm.ts`:

```typescript
import { getLlmConfig } from "./llmConfig";

// ─────────────────────────────────────────────────────────────────────────
// OpenAI-compatible chat completion call. Works with LM Studio, Ollama
// (/v1), OpenAI, and any other provider that speaks this shape.
// ─────────────────────────────────────────────────────────────────────────

type Msg = { role: "system" | "user" | "assistant"; content: string };

export type ChatCompletionResult =
  | { ok: true; answer: string }
  | { ok: false; error: string; status: number };

export async function callLlm(
  messages: Msg[],
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<ChatCompletionResult> {
  const cfg = await getLlmConfig();
  const url = `${cfg.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(cfg.apiKey && cfg.apiKey !== "not-needed"
          ? { authorization: `Bearer ${cfg.apiKey}` }
          : {}),
      },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        temperature: opts.temperature ?? 0.3,
        max_tokens: opts.maxTokens ?? 800,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, status: res.status, error: `LLM ${res.status}: ${text.slice(0, 200)}` };
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const answer = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!answer) {
      return { ok: false, status: 200, error: "LLM returned empty answer" };
    }
    return { ok: true, answer };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: e instanceof Error ? e.message : "LLM request failed",
    };
  }
}

/** Used by /api/chat/health: tiny probe that does NOT consume tokens. */
export async function pingLlm(): Promise<{ ok: boolean; model?: string; error?: string }> {
  const cfg = await getLlmConfig();
  const url = `${cfg.baseUrl.replace(/\/+$/, "")}/models`;
  try {
    const res = await fetch(url, {
      headers:
        cfg.apiKey && cfg.apiKey !== "not-needed"
          ? { authorization: `Bearer ${cfg.apiKey}` }
          : {},
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    const data = (await res.json()) as { data?: Array<{ id?: string }> };
    return { ok: true, model: cfg.model };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unreachable" };
  }
}
```

- [ ] **Step 3: Verify compilation + smoke-test ping**

```bash
cd web && npx tsc --noEmit
curl -s http://localhost:1234/v1/models   # if LM Studio is running
```

- [ ] **Step 4: Commit**

```bash
git add web/src/lib/chat/prompt.ts web/src/lib/chat/llm.ts
git commit -m "web: add chat prompt builder + OpenAI-compatible LLM caller"
```

---

### Task 3.4: `GET /api/chat/threads`

**Files:**
- Create: `web/src/app/api/chat/threads/route.ts`

- [ ] **Step 1: Write the route**

```typescript
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth/resolveSession";
import type { ChatThread, ChatMessageRecord, ChatSource } from "@/lib/types";

// GET /api/chat/threads — returns the caller's single thread + all messages.
// Lazily creates the thread so the response shape is always consistent.
export async function GET(req: Request) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  // Get or create the thread.
  let { rows: threadRows } = await query<{ id: string; title: string; created_at: Date; updated_at: Date }>(
    `SELECT id, title, created_at, updated_at FROM chat_threads WHERE user_id = $1 LIMIT 1`,
    [user.id]
  );
  if (threadRows.length === 0) {
    const { rows: inserted } = await query<{ id: string; title: string; created_at: Date; updated_at: Date }>(
      `INSERT INTO chat_threads (user_id) VALUES ($1)
        RETURNING id, title, created_at, updated_at`,
      [user.id]
    );
    threadRows = inserted;
  }
  const t = threadRows[0];

  const { rows: msgRows } = await query<{
    id: string;
    role: "user" | "assistant";
    content: string;
    sources: ChatSource[] | null;
    created_at: Date;
  }>(
    `SELECT id, role, content, sources, created_at
       FROM chat_messages
      WHERE thread_id = $1
      ORDER BY created_at ASC`,
    [t.id]
  );

  const messages: ChatMessageRecord[] = msgRows.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    sources: m.sources,
    createdAt: m.created_at.toISOString(),
  }));

  const thread: ChatThread = {
    id: t.id,
    title: t.title,
    createdAt: t.created_at.toISOString(),
    updatedAt: t.updated_at.toISOString(),
    messages,
  };

  return NextResponse.json({ thread });
}
```

- [ ] **Step 2: Verify**

```bash
curl -s http://localhost:3000/api/chat/threads -H "cookie: <session>"
```

Expected: `{ thread: { id, title: "Conversation", messages: [] } }`.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/api/chat/threads/route.ts
git commit -m "web: add GET /api/chat/threads"
```

---

### Task 3.5: `POST /api/chat`

**Files:**
- Create: `web/src/app/api/chat/route.ts`

- [ ] **Step 1: Write the route**

```typescript
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth/resolveSession";
import { retrievePages, toSources } from "@/lib/chat/retrieve";
import { buildMessages } from "@/lib/chat/prompt";
import { callLlm } from "@/lib/chat/llm";
import type { ChatSource } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────
// POST /api/chat
//
// Body: { message: string }
//
// Flow (spec section 6):
//   1. Append the user message to the caller's thread.
//   2. Retrieve top-4 visible pages matching the message.
//   3. Build the system prompt + context; call the LLM.
//   4. Append the assistant message with cited sources.
//   5. Return { answer, sources }.
//
// 503 if the LLM is unreachable — never fake an answer.
// ─────────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  let body: { message?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length === 0) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }
  if (message.length > 4000) {
    return NextResponse.json({ error: "message too long (max 4000)" }, { status: 400 });
  }

  // Get or create the user's thread.
  let { rows: tRows } = await query<{ id: string }>(
    `SELECT id FROM chat_threads WHERE user_id = $1 LIMIT 1`,
    [user.id]
  );
  if (tRows.length === 0) {
    const { rows: ins } = await query<{ id: string }>(
      `INSERT INTO chat_threads (user_id) VALUES ($1) RETURNING id`,
      [user.id]
    );
    tRows = ins;
  }
  const threadId = tRows[0].id;

  // 1. Persist the user message.
  await query(
    `INSERT INTO chat_messages (thread_id, role, content) VALUES ($1, 'user', $2)`,
    [threadId, message]
  );

  // 2. Retrieve.
  const pages = await retrievePages(message, 4);
  const sources: ChatSource[] = toSources(pages);

  // 3. Build prompt + call LLM.
  const messages = buildMessages(message, pages);
  const result = await callLlm(messages);
  if (!result.ok) {
    return NextResponse.json(
      { error: "LLM unavailable", detail: result.error },
      { status: 503 }
    );
  }

  // 4. Persist the assistant message with sources.
  await query(
    `INSERT INTO chat_messages (thread_id, role, content, sources)
     VALUES ($1, 'assistant', $2, $3)`,
    [threadId, result.answer, JSON.stringify(sources)]
  );

  return NextResponse.json({ answer: result.answer, sources });
}
```

- [ ] **Step 2: Verify end-to-end**

```bash
curl -s -X POST http://localhost:3000/api/chat \
  -H "content-type: application/json" \
  -H "cookie: <session>" \
  -d '{"message":"What is the Flight Path program?"}'
```

Expected: `{ answer: "...", sources: [...] }`. If LLM is unreachable: 503.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/api/chat/route.ts
git commit -m "web: add POST /api/chat with retrieval + persistence"
```

---

### Task 3.6: `GET /api/chat/health` (admin)

**Files:**
- Create: `web/src/app/api/chat/health/route.ts`

- [ ] **Step 1: Write the route**

```typescript
import { NextResponse } from "next/server";
import { requireUser, isAdmin } from "@/lib/auth/resolveSession";
import { pingLlm } from "@/lib/chat/llm";

export async function GET(req: Request) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  const result = await pingLlm();
  return NextResponse.json(result);
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/app/api/chat/health/route.ts
git commit -m "web: add GET /api/chat/health (admin LLM ping)"
```

---

### Task 3.7: `GET` / `PUT /api/admin/llm-config`

**Files:**
- Create: `web/src/app/api/admin/llm-config/route.ts`

- [ ] **Step 1: Write the route**

```typescript
import { NextResponse } from "next/server";
import { requireUser, isAdmin } from "@/lib/auth/resolveSession";
import { getLlmConfig, setLlmConfig, maskApiKey } from "@/lib/chat/llmConfig";

async function requireAdmin(req: Request) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  return user;
}

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (guard instanceof Response) return guard;
  const cfg = await getLlmConfig();
  return NextResponse.json({
    baseUrl: cfg.baseUrl,
    model: cfg.model,
    apiKeyMasked: maskApiKey(cfg.apiKey),
  });
}

export async function PUT(req: Request) {
  const guard = await requireAdmin(req);
  if (guard instanceof Response) return guard;

  let body: { baseUrl?: unknown; model?: unknown; apiKey?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: { baseUrl?: string; model?: string; apiKey?: string } = {};
  if (typeof body.baseUrl === "string") {
    try {
      new URL(body.baseUrl);
    } catch {
      return NextResponse.json({ error: "baseUrl must be a URL" }, { status: 400 });
    }
    patch.baseUrl = body.baseUrl;
  }
  if (typeof body.model === "string") {
    if (body.model.trim().length === 0) {
      return NextResponse.json({ error: "model cannot be empty" }, { status: 400 });
    }
    patch.model = body.model.trim();
  }
  if (typeof body.apiKey === "string") {
    patch.apiKey = body.apiKey;
  }

  const next = await setLlmConfig(patch);
  return NextResponse.json({
    baseUrl: next.baseUrl,
    model: next.model,
    apiKeyMasked: maskApiKey(next.apiKey),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/app/api/admin/llm-config/route.ts
git commit -m "web: add GET/PUT /api/admin/llm-config"
```

---

### Task 3.8: Wire web `ChatView` to the real backend

**Files:**
- Modify: `web/src/components/fp/ChatView.tsx`
- Modify: `web/src/components/fp/FlightPathApp.tsx`
- Create: `web/src/components/fp/SourceCard.tsx`
- Create: `web/src/components/fp/TypingIndicator.tsx`

- [ ] **Step 1: Read the current stubs**

```bash
cat web/src/components/fp/FlightPathApp.tsx
cat web/src/components/fp/ChatView.tsx
```

- [ ] **Step 2: Create the small new components**

`web/src/components/fp/TypingIndicator.tsx`:

```typescript
export default function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-[var(--radius-2)] border border-[color:var(--color-fp-line)] bg-[var(--color-fp-card)] px-4 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-fp-ink-3)]"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

`web/src/components/fp/SourceCard.tsx`:

```typescript
import Link from "next/link";

type Source = { pageId: string; title: string; slug: string; snippet: string };

export default function SourceCard({ source }: { source: Source }) {
  return (
    <Link
      href={`/pages/${source.slug}`}
      className="mt-1 block rounded-[var(--radius-2)] border border-[color:var(--color-fp-line)] bg-[color:var(--color-fp-surface)] px-3 py-2 font-[family-name:var(--font-archivo)] text-xs text-[var(--color-fp-ink-2)] transition hover:border-[color:var(--color-fp-accent)]"
    >
      <div className="font-[family-name:var(--font-jetbrains-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--color-fp-accent)]">
        Source
      </div>
      <div className="mt-1 font-medium text-[var(--color-fp-ink-1)]">{source.title}</div>
      <div className="mt-1 line-clamp-2">{source.snippet}</div>
    </Link>
  );
}
```

- [ ] **Step 3: Replace the chat stub in `FlightPathApp.tsx`**

Find the `handleSendMessage` stub and the seeded `messages` array. Replace with:

```typescript
// types aligned with the API
type ChatSource = { pageId: string; title: string; slug: string; snippet: string };
type ChatMessage = {
  id: string;
  role: "me" | "ai";
  text: string;
  sources?: ChatSource[];
};

// inside the component:
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [isTyping, setIsTyping] = useState(false);

useEffect(() => {
  let cancelled = false;
  fetch("/api/chat/threads", { cache: "no-store" })
    .then((r) => r.json())
    .then((d) => {
      if (cancelled || !d.thread) return;
      setMessages(
        d.thread.messages.map((m: { id: string; role: string; content: string; sources?: ChatSource[] }) => ({
          id: m.id,
          role: m.role === "user" ? "me" : "ai",
          text: m.content,
          sources: m.sources ?? undefined,
        }))
      );
    })
    .catch(() => {});
  return () => {
    cancelled = true;
  };
}, []);

const handleSendMessage = async (text: string) => {
  const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "me", text };
  setMessages((prev) => [...prev, userMsg]);
  setIsTyping(true);
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Chat failed");
    setMessages((prev) => [
      ...prev,
      {
        id: `a-${Date.now()}`,
        role: "ai",
        text: data.answer ?? "(no answer)",
        sources: data.sources,
      },
    ]);
  } catch (e) {
    setMessages((prev) => [
      ...prev,
      {
        id: `e-${Date.now()}`,
        role: "ai",
        text: "Sorry — the assistant couldn't reach the Flight Path content. Try again in a moment.",
      },
    ]);
  } finally {
    setIsTyping(false);
  }
};
```

- [ ] **Step 4: Extend `ChatView.tsx` to render sources + typing**

Update `ChatView.tsx` so:
- The `ChatMessage` type it accepts now includes optional `sources`.
- Beneath any AI bubble that has `sources`, render a vertical list of `<SourceCard>`.
- When `isTyping` is true, render `<TypingIndicator />` at the bottom of the list.

Pass `isTyping` down from `FlightPathApp.tsx` to `ChatView`.

- [ ] **Step 5: Verify in browser**

```bash
cd web && npm run dev
```

Open `/flight-path`, sign in, click the Chat tab. Expected: typing indicator appears while waiting, real answer comes back with source cards under it. Refresh: history persists.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/fp/ChatView.tsx web/src/components/fp/FlightPathApp.tsx web/src/components/fp/SourceCard.tsx web/src/components/fp/TypingIndicator.tsx
git commit -m "web: wire ChatView to real /api/chat with sources + typing"
```

---

### Task 3.9: Admin "AI Configuration" card

**Files:**
- Create: `web/src/app/admin/components/LlmConfigSection.tsx`
- Modify: `web/src/app/admin/page.tsx`

- [ ] **Step 1: Read admin page structure**

```bash
cat web/src/app/admin/page.tsx
ls web/src/app/admin/components
```

- [ ] **Step 2: Create the section**

`web/src/app/admin/components/LlmConfigSection.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";

export default function LlmConfigSection() {
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [masked, setMasked] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/llm-config", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setBaseUrl(d.baseUrl ?? "");
        setModel(d.model ?? "");
        setMasked(d.apiKeyMasked ?? "");
      });
  }, []);

  async function onSave() {
    setSaving(true);
    setError(null);
    const patch: Record<string, string> = { baseUrl, model };
    if (apiKey) patch.apiKey = apiKey; // only send when the user typed a new one
    const res = await fetch("/api/admin/llm-config", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(false);
    if (res.ok) {
      const d = await res.json();
      setMasked(d.apiKeyMasked ?? "");
      setApiKey("");
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Save failed");
    }
  }

  async function onTest() {
    setTesting(true);
    setTestResult(null);
    const res = await fetch("/api/chat/health", { cache: "no-store" });
    const d = await res.json();
    setTesting(false);
    setTestResult(d.ok ? `OK — model: ${d.model}` : `Fail: ${d.error}`);
  }

  const inputCls =
    "w-full rounded-[var(--radius-2)] border border-[color:var(--color-fp-line)] bg-[color:var(--color-fp-surface)] px-4 py-3 font-[family-name:var(--font-archivo)] text-[var(--color-fp-ink-1)]";

  return (
    <section className="rounded-[var(--radius-3)] border border-[color:var(--color-fp-line)] bg-[color:var(--color-fp-card)] p-6">
      <h2 className="font-[family-name:var(--font-jetbrains-mono)] text-xs uppercase tracking-[0.2em] text-[var(--color-fp-ink-3)]">
        AI Configuration
      </h2>
      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="block pb-2 font-[family-name:var(--font-jetbrains-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--color-fp-ink-3)]">Base URL</span>
          <input className={inputCls} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="http://localhost:1234/v1" />
        </label>
        <label className="block">
          <span className="block pb-2 font-[family-name:var(--font-jetbrains-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--color-fp-ink-3)]">Model</span>
          <input className={inputCls} value={model} onChange={(e) => setModel(e.target.value)} />
        </label>
        <label className="block">
          <span className="block pb-2 font-[family-name:var(--font-jetbrains-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--color-fp-ink-3)]">
            API Token {masked && <span className="text-[var(--color-fp-ink-4)]">(current: {masked})</span>}
          </span>
          <input type="password" className={inputCls} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Leave blank to keep current" />
        </label>

        {error && <div className="text-sm text-[var(--color-fp-accent)]">{error}</div>}

        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={onSave}
            disabled={saving}
            className="rounded-[var(--radius-2)] bg-[var(--color-fp-accent)] px-5 py-2 font-[family-name:var(--font-jetbrains-mono)] text-xs uppercase tracking-[0.2em] text-black disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={onTest}
            disabled={testing}
            className="rounded-[var(--radius-2)] border border-[color:var(--color-fp-line)] px-5 py-2 font-[family-name:var(--font-jetbrains-mono)] text-xs uppercase tracking-[0.2em] text-[var(--color-fp-ink-2)] disabled:opacity-50"
          >
            {testing ? "Testing…" : "Test connection"}
          </button>
          {testResult && <span className="font-[family-name:var(--font-jetbrains-mono)] text-xs text-[var(--color-fp-ink-3)]">{testResult}</span>}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Mount it in the admin page**

Edit `web/src/app/admin/page.tsx` to render `<LlmConfigSection />` somewhere prominent (e.g. at the top, above the existing user management). Match the existing layout/spacing pattern.

- [ ] **Step 4: Verify as an admin**

Sign in as `jrizzo@sunritesolarllc.com` (the seeded admin), open `/admin`. Change the model name, click Save, click Test connection. Expected: green confirmation, masked API token displayed.

- [ ] **Step 5: Commit**

```bash
git add web/src/app/admin/components/LlmConfigSection.tsx web/src/app/admin/page.tsx
git commit -m "web: add admin AI configuration card"
```

---

## Phase 4 — iOS networking + auth bridge

**Goal:** Sign in on iOS, get a backend token, hit `/api/me`. Login gate enforced.

### Task 4.1: iOS model types

**Files:**
- Modify: `ios/FlightPathApp/Models/Models.swift`

- [ ] **Step 1: Add Codable profile + chat types**

Append to `Models.swift`:

```swift
// MARK: - API models (mirror web/src/lib/types/index.ts)

struct UserProfile: Codable, Equatable {
    let id: String
    let email: String
    var fullName: String
    var avatarUrl: String?
    var phone: String?
    var town: String?
    var hireDate: String?  // YYYY-MM-DD
    let role: String
    let status: String
}

struct UserProfilePatch: Codable {
    var fullName: String?
    var avatarUrl: String?
    var phone: String?
    var town: String?
    var hireDate: String?
}

struct ExchangeResponse: Codable {
    let token: String
    let expiresIn: Int
    let user: UserProfile
}

struct ChatSource: Codable, Identifiable, Equatable {
    var id: String { pageId }
    let pageId: String
    let title: String
    let slug: String
    let snippet: String
}

struct ChatMessageRecord: Codable, Identifiable, Equatable {
    let id: String
    let role: String            // "user" or "assistant"
    let content: String
    let sources: [ChatSource]?
    let createdAt: String
}

struct ChatThread: Codable {
    let id: String
    let title: String
    let createdAt: String
    let updatedAt: String
    let messages: [ChatMessageRecord]
}

struct ChatResponse: Codable {
    let answer: String
    let sources: [ChatSource]?
}

struct HealthResponse: Codable {
    let ok: Bool
    let model: String?
    let error: String?
}

struct ApiError: Codable {
    let error: String?
}
```

Also extend the existing `ChatMessage` model to carry optional sources:

```swift
// Existing:
// struct ChatMessage: Identifiable { let id: UUID; let role: Role; let text: String }
// Updated:
struct ChatMessage: Identifiable {
    let id: UUID
    let role: Role
    var text: String
    var sources: [ChatSource]?
}
```

(Adjust the existing struct to match.)

- [ ] **Step 2: Build in Xcode to verify**

```bash
xcodebuild -project ios/FlightPathApp.xcodeproj -scheme FlightPathApp -destination 'platform=iOS Simulator,name=iPhone 15' build
```

Expected: `BUILD SUCCEEDED`.

- [ ] **Step 3: Commit**

```bash
git add ios/FlightPathApp/Models/Models.swift
git commit -m "ios: add Codable API models (UserProfile, ChatThread, ChatSource, etc.)"
```

---

### Task 4.2: KeychainStore + AppConfig

**Files:**
- Create: `ios/FlightPathApp/Networking/KeychainStore.swift`
- Create: `ios/FlightPathApp/Networking/AppConfig.swift`

- [ ] **Step 1: Create the directory + KeychainStore**

The Xcode project uses file-system-synchronized groups (`objectVersion = 77`), so new files just need to live at the right path — no `pbxproj` edits required. Create:

`ios/FlightPathApp/Networking/KeychainStore.swift`:

```swift
import Foundation
import Security

// Wraps Keychain Services so we never store the bearer token in UserDefaults.
// Service + account are constants; we only ever store one token.
enum KeychainStore {
    private static let service = "flight-path.app"
    private static let account = "bearer"

    static func save(token: String) {
        let data = Data(token.utf8)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
        SecItemDelete(query as CFDictionary) // clear any prior
        var add = query
        add[kSecValueData as String] = data
        SecItemAdd(add as CFDictionary, nil)
    }

    static func loadToken() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var item: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess,
              let data = item as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    static func clear() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
        SecItemDelete(query as CFDictionary)
    }
}
```

- [ ] **Step 2: Create AppConfig**

`ios/FlightPathApp/Networking/AppConfig.swift`:

```swift
import Foundation

// Backend base URL is user-editable in SettingsView and persisted in
// UserDefaults. Default points at localhost for the simulator hitting
// `npm run dev`. Tailscale/production URLs go in via the Settings UI.
enum AppConfig {
    private static let key = "fp_backend_url"
    private static let defaultURL = "http://localhost:3000"

    static var backendBaseURL: String {
        get {
            let v = UserDefaults.standard.string(forKey: key) ?? ""
            return v.isEmpty ? defaultURL : v
        }
        set {
            UserDefaults.standard.set(newValue, forKey: key)
        }
    }

    /// Trims trailing slashes so callers can concatenate paths safely.
    static var backendBaseURLNormalized: String {
        backendBaseURL.hasSuffix("/")
            ? String(backendBaseURL.dropLast())
            : backendBaseURL
    }
}
```

- [ ] **Step 3: Build to verify**

```bash
xcodebuild -project ios/FlightPathApp.xcodeproj -scheme FlightPathApp -destination 'platform=iOS Simulator,name=iPhone 15' build
```

Expected: `BUILD SUCCEEDED`.

- [ ] **Step 4: Commit**

```bash
git add ios/FlightPathApp/Networking/KeychainStore.swift ios/FlightPathApp/Networking/AppConfig.swift
git commit -m "ios: add KeychainStore + AppConfig for bearer token + backend URL"
```

---

### Task 4.3: APIClient + Endpoints

**Files:**
- Create: `ios/FlightPathApp/Networking/APIClient.swift`
- Create: `ios/FlightPathApp/Networking/Endpoints.swift`

- [ ] **Step 1: Create APIClient**

`ios/FlightPathApp/Networking/APIClient.swift`:

```swift
import Foundation

enum APIError: LocalizedError {
    case notAuthenticated
    case http(Int, String?)
    case decoding(Error)
    case network(Error)
    case invalidURL

    var errorDescription: String? {
        switch self {
        case .notAuthenticated: return "Not signed in."
        case .http(let code, let msg): return "Server error \(code): \(msg ?? "")"
        case .decoding(let e): return "Could not parse response: \(e.localizedDescription)"
        case .network(let e): return "Network error: \(e.localizedDescription)"
        case .invalidURL: return "Bad URL. Check the backend URL in Settings."
        }
    }
}

@MainActor
final class APIClient {
    static let shared = APIClient()
    private init() {}

    /// Always send JSON; attach Authorization if we have a token.
    private func request<T: Decodable>(
        path: String,
        method: String = "GET",
        body: Encodable? = nil,
        authRequired: Bool = true,
        tokenOverride: String? = nil
    ) async throws -> T {
        guard let url = URL(string: AppConfig.backendBaseURLNormalized + path) else {
            throw APIError.invalidURL
        }
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let token = tokenOverride ?? KeychainStore.loadToken()
        if authRequired {
            guard let token else { throw APIError.notAuthenticated }
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        } else if let tokenOverride {
            req.setValue("Bearer \(tokenOverride)", forHTTPHeaderField: "Authorization")
        }

        if let body {
            req.httpBody = try JSONEncoder().encode(body)
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: req)
        } catch {
            throw APIError.network(error)
        }

        if let http = response as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
            let apiErr = try? JSONDecoder().decode(ApiError.self, from: data)
            throw APIError.http(http.statusCode, apiErr?.error)
        }

        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            throw APIError.decoding(error)
        }
    }

    // ── Endpoints (thin wrappers) ─────────────────────────────────────────

    func exchangeToken(googleIdToken: String) async throws -> ExchangeResponse {
        let body = ["googleIdToken": googleIdToken]
        let data = try JSONSerialization.data(withJSONObject: body)
        guard let url = URL(string: AppConfig.backendBaseURLNormalized + "/api/auth/exchange") else {
            throw APIError.invalidURL
        }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = data
        let (resp, respData): (URLResponse, Data)
        do {
            (resp, respData) = try await URLSession.shared.data(for: req)
        } catch {
            throw APIError.network(error)
        }
        if let http = resp as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
            let e = try? JSONDecoder().decode(ApiError.self, from: respData)
            throw APIError.http(http.statusCode, e?.error)
        }
        do {
            return try JSONDecoder().decode(ExchangeResponse.self, from: respData)
        } catch {
            throw APIError.decoding(error)
        }
    }

    func signOut() async {
        struct Empty: Decodable {}
        _ = try? await request(path: "/api/auth/signout", method: "POST") as Empty
        KeychainStore.clear()
    }

    func fetchMe() async throws -> UserProfile {
        let resp: MeResponse = try await request(path: "/api/me")
        return resp.user
    }

    func updateProfile(_ patch: UserProfilePatch) async throws -> UserProfile {
        let resp: MeResponse = try await request(path: "/api/profile", method: "PATCH", body: AnyEncodable(patch))
        return resp.user
    }

    func fetchChatThread() async throws -> ChatThread {
        let resp: ThreadResponse = try await request(path: "/api/chat/threads")
        return resp.thread
    }

    func sendChat(message: String) async throws -> ChatResponse {
        try await request(path: "/api/chat", method: "POST", body: ["message": message])
    }

    func health() async throws -> HealthResponse {
        try await request(path: "/api/chat/health")
    }
}

// Tiny helpers for the wrapper response shapes
private struct MeResponse: Decodable { let user: UserProfile }
private struct ThreadResponse: Decodable { let thread: ChatThread }

// Allows passing any Encodable as a generic body
private struct AnyEncodable: Encodable {
    private let encode: (Encoder) throws -> Void
    init(_ wrapped: Encodable) { self.encode = wrapped.encode }
    func encode(to encoder: Encoder) throws { try encode(encoder) }
}

// Allow `["message": "..."]` literal as a body
extension Dictionary where Key == String, Value == String {
    public func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        try c.encode(self)
    }
}
```

Note: the dictionary `Encodable` conformance above is a workaround; if the compiler complains, replace with a small `struct ChatRequestBody: Encodable { let message: String }`.

- [ ] **Step 2: Build to verify**

```bash
xcodebuild -project ios/FlightPathApp.xcodeproj -scheme FlightPathApp -destination 'platform=iOS Simulator,name=iPhone 15' build
```

Expected: `BUILD SUCCEEDED`.

- [ ] **Step 3: Commit**

```bash
git add ios/FlightPathApp/Networking/APIClient.swift
git commit -m "ios: add APIClient with all endpoints"
```

---

### Task 4.4: Wire Google sign-in to the backend + re-enable login gate

**Files:**
- Modify: `ios/FlightPathApp/App/AppState.swift`
- Modify: `ios/FlightPathApp/Views/LoginView.swift` (only if it needs a backend URL prompt)

- [ ] **Step 1: Read current AppState**

```bash
cat ios/FlightPathApp/App/AppState.swift
```

- [ ] **Step 2: Update AppState**

Replace the hardcoded user fields, the dev bypass, and the stub `send()` with:

```swift
@MainActor
final class AppState: ObservableObject {
    @Published var tab: AppTab = .home
    @Published var drawerOpen = false
    @Published var doors = 0, conversations = 0, appointments = 0
    let doorsGoal = 40, conversationsGoal = 15, appointmentsGoal = 5

    // Chat
    @Published var messages: [ChatMessage] = []
    @Published var isTyping = false

    // Auth + profile
    @Published var isAuthenticated = false   // NO MORE DEV BYPASS
    @Published var isSigningIn = false
    @Published var user: UserProfile?
    @Published var signInError: String?

    private let api = APIClient.shared

    // ── Auth ────────────────────────────────────────────────────────────
    func signInWithGoogle() async {
        isSigningIn = true
        signInError = nil
        defer { isSigningIn = false }
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let rootVC = windowScene.windows.first(where: \.isKeyWindow)?.rootViewController
        else { return }
        do {
            let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: rootVC)
            // Get the Google ID token and exchange it for our backend token.
            guard let idToken = result.user.idToken?.tokenString else {
                signInError = "Google did not return an ID token."
                return
            }
            let exchange = try await api.exchangeToken(googleIdToken: idToken)
            KeychainStore.save(token: exchange.token)
            user = exchange.user
            isAuthenticated = true
            await loadChatHistory()
        } catch let APIError.http(403, _) {
            signInError = "Your email isn't on the allowlist."
        } catch {
            signInError = error.localizedDescription
        }
    }

    func restorePreviousSignIn() async {
        // Only restore if we already have a backend token; otherwise show login.
        guard KeychainStore.loadToken() != nil,
              GIDSignIn.sharedInstance.hasPreviousSignIn() else { return }
        do {
            try await GIDSignIn.sharedInstance.restorePreviousSignIn()
            user = try? await api.fetchMe()
            if user != nil {
                isAuthenticated = true
                await loadChatHistory()
            } else {
                KeychainStore.clear()
            }
        } catch {
            KeychainStore.clear()
        }
    }

    func signOut() async {
        await api.signOut()
        GIDSignIn.sharedInstance.signOut()
        user = nil
        isAuthenticated = false
        messages = []
    }

    // ── Chat ────────────────────────────────────────────────────────────
    func loadChatHistory() async {
        do {
            let thread = try await api.fetchChatThread()
            messages = thread.messages.map { m in
                ChatMessage(
                    id: UUID(uuidString: m.id) ?? UUID(),
                    role: m.role == "user" ? .me : .ai,
                    text: m.content,
                    sources: m.sources
                )
            }
        } catch {
            // Leave messages empty on failure; user can still send new ones.
        }
    }

    func send(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        messages.append(ChatMessage(id: UUID(), role: .me, text: trimmed, sources: nil))
        isTyping = true
        Task {
            do {
                let resp = try await api.sendChat(message: trimmed)
                messages.append(ChatMessage(id: UUID(), role: .ai, text: resp.answer, sources: resp.sources))
            } catch {
                messages.append(ChatMessage(id: UUID(), role: .ai,
                    text: "Sorry — I couldn't reach the Flight Path assistant. Try again in a moment.",
                    sources: nil))
            }
            isTyping = false
        }
    }

    func select(_ tab: AppTab) {
        withAnimation(.easeInOut(duration: 0.18)) { self.tab = tab }
    }
}
```

Also delete the hardcoded `userName`, `userEmail`, `userInitials` computed properties — they're replaced by `user`.

- [ ] **Step 3: Update AppHeader and SideDrawer to read `app.user`**

Find references to `app.userName`, `app.userEmail`, `app.userInitials` in `AppHeader.swift` and `SideDrawer.swift`. Replace with safe access through `app.user`:

```swift
// e.g. in SideDrawer header:
Text(app.user?.fullName ?? "—")
Text(app.user?.email ?? "")
// initials:
Text(String(app.user?.fullName.prefix(1) ?? "F").uppercased())
```

- [ ] **Step 4: Add a sign-in error banner to LoginView**

In `LoginView.swift`, near the Google button, show `app.signInError` if non-nil (small accent-colored text). Also: if `AppConfig.backendBaseURL` is empty/localhost, show a small "Tap the gear to set your backend URL" hint that opens a Settings sheet.

- [ ] **Step 5: Build + run on simulator**

```bash
xcodebuild -project ios/FlightPathApp.xcodeproj -scheme FlightPathApp -destination 'platform=iOS Simulator,name=iPhone 15' build
```

Open Xcode, run on simulator. Expected: the app boots to LoginView (NOT the shell, since the dev bypass is gone). Set backend URL via Settings if needed, tap Continue with Google, complete sign-in, land in the app shell with `app.user` populated from `/api/me`.

- [ ] **Step 6: Commit**

```bash
git add ios/FlightPathApp/App/AppState.swift ios/FlightPathApp/Components/AppHeader.swift ios/FlightPathApp/Components/SideDrawer.swift ios/FlightPathApp/Views/LoginView.swift
git commit -m "ios: wire Google sign-in to /api/auth/exchange; remove dev bypass"
```

---

### Task 4.5: SettingsView + SideDrawer navigation

**Files:**
- Create: `ios/FlightPathApp/Views/SettingsView.swift`
- Modify: `ios/FlightPathApp/Components/SideDrawer.swift`

- [ ] **Step 1: Create SettingsView**

`ios/FlightPathApp/Views/SettingsView.swift`:

```swift
import SwiftUI

struct SettingsView: View {
    @ObservedObject var app: AppState
    @Environment(\.dismiss) private var dismiss

    @State private var backendURL: String = AppConfig.backendBaseURL
    @State private var testing = false
    @State private var testResult: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Backend") {
                    TextField("http://localhost:3000", text: $backendURL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    Button("Save") {
                        AppConfig.backendBaseURL = backendURL.trimmingCharacters(in: .whitespacesAndNewlines)
                    }
                }
                Section("Connection") {
                    Button(testing ? "Testing…" : "Test connection") {
                        testing = true
                        testResult = nil
                        Task {
                            do {
                                let h = try await APIClient.shared.health()
                                testResult = h.ok ? "OK — \(h.model ?? "?")" : "Fail: \(h.error ?? "?")"
                            } catch {
                                testResult = "Fail: \(error.localizedDescription)"
                            }
                            testing = false
                        }
                    }
                    if let testResult {
                        Text(testResult).font(.caption).foregroundStyle(Color.fpAccent2)
                    }
                }
                Section("Account") {
                    Button("Sign out", role: .destructive) {
                        Task {
                            await app.signOut()
                            dismiss()
                        }
                    }
                }
                Section("About") {
                    HStack { Text("App version"); Spacer(); Text("1.0").foregroundStyle(.secondary) }
                }
            }
            .navigationTitle("Settings")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
            .onAppear { backendURL = AppConfig.backendBaseURL }
        }
    }
}
```

- [ ] **Step 2: Add a ProfileView placeholder (real form lands in Phase 6)**

For this phase we just need the drawer rows to navigate somewhere non-crashing. Create a minimal `ios/FlightPathApp/Views/ProfileView.swift` now (Phase 6 will replace it with the full form):

```swift
import SwiftUI

struct ProfileView: View {
    @ObservedObject var app: AppState
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Profile") {
                    Text(app.user?.fullName ?? "—")
                    Text(app.user?.email ?? "")
                }
            }
            .navigationTitle("Profile")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}
```

- [ ] **Step 3: Wire SideDrawer rows to present sheets**

In `SideDrawer.swift`, add `@State private var showProfile = false` and `@State private var showSettings = false`, then change the Profile/Settings rows from no-ops to:

```swift
Button { showProfile = true } label: { ... }
Button { showSettings = true } label: { ... }
```

At the top level of the drawer view, attach:

```swift
.sheet(isPresented: $showProfile) { ProfileView(app: app) }
.sheet(isPresented: $showSettings) { SettingsView(app: app) }
```

- [ ] **Step 4: Build + verify on simulator**

Tap the hamburger, tap Profile and Settings. Both should present modally. Settings → Backend URL field pre-filled; Save + Done works. Test connection will fail until Phase 3 backend is reachable.

- [ ] **Step 5: Commit**

```bash
git add ios/FlightPathApp/Views/SettingsView.swift ios/FlightPathApp/Views/ProfileView.swift ios/FlightPathApp/Components/SideDrawer.swift
git commit -m "ios: add SettingsView, stub ProfileView, wire SideDrawer rows"
```

---

## Phase 5 — iOS chat wiring (typing indicator + source cards)

### Task 5.1: TypingIndicator + SourceCitationCard

**Files:**
- Create: `ios/FlightPathApp/Components/TypingIndicator.swift`
- Create: `ios/FlightPathApp/Components/SourceCitationCard.swift`
- Modify: `ios/FlightPathApp/Views/ChatView.swift`

- [ ] **Step 1: Create TypingIndicator**

```swift
import SwiftUI

struct TypingIndicator: View {
    @State private var phase: CGFloat = 0
    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3) { i in
                Circle()
                    .fill(Color.fpInk3)
                    .frame(width: 6, height: 6)
                    .opacity(0.4 + 0.6 * sin(phase + Double(i) * 0.9))
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(Color.card)
        .overlay(
            UnevenRoundedRectangle(
                topLeadingRadius: 10, bottomLeadingRadius: 2,
                bottomTrailingRadius: 14, topTrailingRadius: 14
            ).stroke(Color.cardLine, lineWidth: 1)
        )
        .onAppear {
            TimelineView(.animation) { _ in } // ensures redraw; not strictly required
        }
        .task {
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 130_000_000)
                phase += 0.6
            }
        }
    }
}
```

- [ ] **Step 2: Create SourceCitationCard**

```swift
import SwiftUI

struct SourceCitationCard: View {
    let source: ChatSource

    var body: some View {
        // v1: not tappable (no PageDetail view exists yet). Visual only.
        VStack(alignment: .leading, spacing: 4) {
            MonoLabel(text: "SOURCE", color: Color.fpAccent2)
            Text(source.title)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(Color.fpInk1)
            Text(source.snippet)
                .font(.system(size: 12))
                .foregroundStyle(Color.fpInk2)
                .lineLimit(2)
        }
        .padding(10)
        .background(Color.card)
        .overlay(
            RoundedRectangle(cornerRadius: 10).stroke(Color.cardLine, lineWidth: 1)
        )
    }
}
```

Note: if `MonoLabel` does not exist with that initializer, replicate the small mono-uppercase label pattern from elsewhere in `Components/`.

- [ ] **Step 3: Extend ChatView to show typing + sources**

In `ChatView.swift`:

1. After the last message in the scroll view, conditionally render `TypingIndicator()` when `app.isTyping` is true.
2. Inside the `ChatBubble` for AI messages that have `sources`, render a `VStack` of `SourceCitationCard`s beneath the bubble.
3. Keep the visual design of the bubbles exactly as-is — only add new subviews.

- [ ] **Step 4: Build + verify**

Run on simulator. Send a chat message. Expected: typing indicator appears while waiting, real answer returns, source cards (if any) appear beneath the answer bubble. Quit + relaunch the app: history is still there (loaded via `loadChatHistory`).

- [ ] **Step 5: Commit**

```bash
git add ios/FlightPathApp/Components/TypingIndicator.swift ios/FlightPathApp/Components/SourceCitationCard.swift ios/FlightPathApp/Views/ChatView.swift
git commit -m "ios: chat typing indicator + source citation cards"
```

---

## Phase 6 — iOS Profile view (full form)

### Task 6.1: Replace stub ProfileView with real form

**Files:**
- Modify: `ios/FlightPathApp/Views/ProfileView.swift`

- [ ] **Step 1: Replace the stub**

```swift
import SwiftUI

struct ProfileView: View {
    @ObservedObject var app: AppState
    @Environment(\.dismiss) private var dismiss

    @State private var fullName = ""
    @State private var avatarUrl = ""
    @State private var phone = ""
    @State private var town = ""
    @State private var hireDate: Date = .now
    @State private var hireDateNone = false
    @State private var saving = false
    @State private var error: String?
    @State private var savedAt: Date?

    private let df: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    var body: some View {
        NavigationStack {
            Form {
                Section("Identity") {
                    LabeledContent("Email", value: app.user?.email ?? "")
                    TextField("Full name", text: $fullName)
                }
                Section("Profile") {
                    TextField("Avatar URL", text: $avatarUrl)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    TextField("Phone", text: $phone)
                    TextField("Town", text: $town)
                    Toggle("No hire date", isOn: $hireDateNone)
                    if !hireDateNone {
                        DatePicker("Hire date", selection: $hireDate, displayedComponents: .date)
                    }
                }
                if let error { Text(error).foregroundStyle(Color.fpAccent2) }
                if let savedAt {
                    Text("Saved.").foregroundStyle(.secondary).font(.caption)
                }
                Section {
                    Button(saving ? "Saving…" : "Save") {
                        Task { await save() }
                    }
                    .disabled(saving)
                }
                Section {
                    Button("Sign out", role: .destructive) {
                        Task {
                            await app.signOut()
                            dismiss()
                        }
                    }
                }
            }
            .navigationTitle("Profile")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
            .onAppear { populate() }
        }
    }

    private func populate() {
        guard let u = app.user else { return }
        fullName = u.fullName
        avatarUrl = u.avatarUrl ?? ""
        phone = u.phone ?? ""
        town = u.town ?? ""
        if let iso = u.hireDate, let d = df.date(from: iso) {
            hireDate = d
            hireDateNone = false
        } else {
            hireDateNone = true
        }
    }

    private func save() async {
        saving = true
        error = nil
        defer { saving = false }
        var patch = UserProfilePatch()
        patch.fullName = fullName
        patch.avatarUrl = avatarUrl.isEmpty ? nil : avatarUrl
        patch.phone = phone.isEmpty ? nil : phone
        patch.town = town.isEmpty ? nil : town
        patch.hireDate = hireDateNone ? nil : df.string(from: hireDate)
        do {
            let updated = try await APIClient.shared.updateProfile(patch)
            app.user = updated
            savedAt = .now
        } catch {
            self.error = error.localizedDescription
        }
    }
}
```

- [ ] **Step 2: Build + verify end-to-end cross-platform**

Run the iOS simulator, sign in, open Profile from the drawer, change phone/town/hire date, hit Save. Then open the web `/profile` page in a browser. Expected: changes made on iOS are visible on web. Try the reverse — change on web, pull-to-refresh the iOS app (or re-open Profile), see the change.

- [ ] **Step 3: Commit**

```bash
git add ios/FlightPathApp/Views/ProfileView.swift
git commit -m "ios: full ProfileView form wired to /api/profile"
```

---

## Phase 7 — Cleanup

### Task 7.1: Confirm and delete `flight-path-backend/`

- [ ] **Step 1: Confirm nothing references it**

```bash
rg -n ":8787|flight-path-backend" web/ ios/ node-worker/ docs/ README.md 2>/dev/null | grep -v node_modules
```

Expected: only matches in docs (README, SETUP_GUIDE) that will be fixed in Task 7.2. No code references.

- [ ] **Step 2: Delete**

```bash
git rm -r flight-path-backend
```

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: delete dead flight-path-backend/

Half its routes weren't mounted; auth middleware referenced a missing
config key; nothing in the repo called it. Superseded by web/Next.js."
```

---

### Task 7.2: Rewrite README + archive stale docs

**Files:**
- Modify: `README.md`
- Create: `docs/archive/` (move files into it)

- [ ] **Step 1: Move stale docs**

```bash
mkdir -p docs/archive
git mv PHASE_0_SUMMARY.md docs/archive/
git mv PHASE_0_SUMMARY.pdf docs/archive/
git mv PHASE_0_SUMMARY.docx docs/archive/
git mv PHASE_1_TESTING_GUIDE.md docs/archive/
git mv PHASE_1_TESTING_GUIDE.pdf docs/archive/
git mv PHASE_1_TESTING_GUIDE.docx docs/archive/
git mv READY_TO_TEST.md docs/archive/
git mv READY_TO_TEST.pdf docs/archive/
git mv READY_TO_TEST.docx docs/archive/
git mv LOGIN_SUCCESS_STATUS.md docs/archive/
git mv LOGIN_SUCCESS_STATUS.pdf docs/archive/
git mv LOGIN_SUCCESS_STATUS.docx docs/archive/
git mv VM_SETUP_COMPLETE.md docs/archive/
git mv VM_SETUP_COMPLETE.pdf docs/archive/
git mv VM_SETUP_COMPLETE.docx docs/archive/
git mv FLIGHT_PATH_V2_SUMMARY.md docs/archive/
git mv GOOGLE_OAUTH_SETUP.md docs/archive/
git mv SETUP_GUIDE.md docs/archive/
```

- [ ] **Step 2: Rewrite README**

Replace `README.md` with a plain-English quickstart that matches reality. Required sections:

```markdown
# Flight Path App

A private, login-protected sales-rep field tool (Home, Schedule, Tally, Chat)
with an admin portal. Built with Next.js + Postgres (web/backend) and SwiftUI (iOS).

## What's in here

- `web/` — Next.js app: website, admin portal, and JSON API for iOS.
- `ios/` — SwiftUI iOS app.
- `node-worker/` — Notion crawler. Populates `notion_pages`.
- `db/` — Postgres schema + migrations.
- `docker-compose.yml` — Postgres container.
- `docs/` — Design specs + plans + archive of old phase notes.

## Quick start (local dev)

1. **Start Postgres.** From the repo root:
   ```
   docker compose up -d
   ```
2. **Configure the backend.** Copy `web/.env.example` to `web/.env.local`
   and fill in real values for `DATABASE_URL`, `AUTH_SECRET`,
   `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and the LLM vars.
3. **Run the backend.**
   ```
   cd web
   npm install
   npm run dev
   ```
   Open http://localhost:3000.
4. **Crawl Notion (first time only).**
   ```
   cd node-worker
   cp .env.example .env       # fill in NOTION_API_KEY, NOTION_ROOT_PAGE_ID, DATABASE_URL
   npm install
   npm run build && npm start
   ```
5. **Run the iOS app.** Open `ios/FlightPathApp.xcodeproj` in Xcode 16+,
   pick a simulator, press Run. Set the backend URL in Settings.

See `docs/superpowers/specs/` for the design and `docs/superpowers/plans/`
for the build plan.
```

- [ ] **Step 3: Commit**

```bash
git add README.md docs/archive/
git commit -m "docs: rewrite README to match reality; archive stale phase notes"
```

---

### Task 7.3: Rewrite `web/.env.example`

**Files:**
- Modify: `web/.env.example`

- [ ] **Step 1: Replace the file**

```bash
# ── Database (local Postgres via docker-compose) ──────────────────────────
# Matches the defaults in docker-compose.yml. URL-encode the password if it
# contains special characters.
DATABASE_URL=postgresql://flightpath:changeme@localhost:5433/flightpath

# ── NextAuth v5 (Google OAuth) ────────────────────────────────────────────
# Generate: `openssl rand -base64 32`
AUTH_SECRET=replace_with_a_long_random_string
AUTH_GOOGLE_ID=your_google_oauth_client_id
AUTH_GOOGLE_SECRET=your_google_oauth_client_secret
# The public URL of your deployment (used for OAuth callback):
NEXTAUTH_URL=http://localhost:3000

# ── iOS auth bridge ───────────────────────────────────────────────────────
# Set to "true" to allow POST /api/auth/exchange. Default true.
GOOGLE_TOKEN_EXCHANGE_ENABLED=true

# ── Local LLM (OpenAI-compatible) ─────────────────────────────────────────
# First-boot defaults for admin_settings.llm_config. Editable from /admin.
LLM_BASE_URL=http://100.101.18.67:1234/v1
LLM_MODEL=local-model
LLM_API_KEY=not-needed
```

- [ ] **Step 2: Commit**

```bash
git add web/.env.example
git commit -m "web: rewrite .env.example to match the actual stack"
```

---

## Verification (final smoke test before handoff)

Run these in order. All must pass.

1. **Database migrations applied.**
   ```bash
   docker compose exec -T db psql -U flightpath -d flightpath -c "\dt" | grep -E "chat_threads|chat_messages"
   docker compose exec -T db psql -U flightpath -d flightpath -c "SELECT key FROM admin_settings WHERE key='llm_config';"
   ```
   Expected: both tables listed; llm_config row present.

2. **Web sign-in works.** Open `/`, sign in with `jrizzo@sunritesolarllc.com`. Lands on `/flight-path`.

3. **Web `/profile` works.** Edit phone/town/hire date. Save. Refresh. Changes persist.

4. **Web chat works.** Click Chat tab, ask a question about Flight Path content. Real answer returns with source cards. Refresh: history persists.

5. **Admin LLM config works.** As admin, open `/admin`, change the model name, click Test connection. See OK.

6. **iOS sign-in works.** Boot simulator, set backend URL in Settings if needed, tap Continue with Google. Land in shell. `app.user.fullName` shows your name.

7. **iOS chat works.** Send a message. Typing indicator, real answer, source cards. Quit + relaunch: history loads.

8. **iOS profile works.** Edit phone/town on iOS. Open web `/profile`: see the iOS change.

9. **Hidden pages excluded.** In Notion, mark a page under a "Hidden Pages" toggle. Re-crawl. Verify `is_hidden = true` in DB. Ask chat a question only that page could answer: assistant should refuse ("I don't have that in the current Flight Path content.").

10. **Dead backend gone.** `ls flight-path-backend` should fail.

11. **Docs clean.** `ls *.md` at repo root returns only `README.md` and `CLAUDE.md`.

---

## Self-review

**Spec coverage:**
- §4 architecture (auth bridge): Tasks 1.3, 1.4, 1.5
- §5 DB changes: Task 1.1 (migration), Task 1.2 (types)
- §6 endpoints: Tasks 1.4–1.5 (auth), 2.1–2.2 (profile), 3.4–3.7 (chat/admin)
- §7 retrieval: Tasks 3.1 (schema+worker), 3.2 (FTS query)
- §8 LLM config: Tasks 1.6, 3.3, 3.7
- §9 web changes: Tasks 2.3, 3.8, 3.9
- §10 iOS changes: Tasks 4.1–4.5, 5.1, 6.1
- §11 cleanup: Tasks 7.1–7.3
- §12 build order: matches the phase ordering
- §13 security: covered by requireUser on every route + mass-assignment guard + opaque-token hashing
- §14 decisions: rate-limit + scrollback + OAuth-in-plist all deliberately deferred (not blocking)

**Placeholder scan:** No TBDs, no "implement later," no "add appropriate error handling." Every step has concrete code or concrete commands.

**Type consistency:** UserProfile / UserProfilePatch / ChatSource / ChatThread / ChatMessageRecord appear identically in TS (Task 1.2) and Swift (Task 4.1). resolveSession API surface (requireUser, isAdmin, hashToken, generateToken) is stable across all callers.

**Known gaps acknowledged:** iOS KeychainStore and the GoogleSignIn SPM dependency are assumed to be already linked (Task 4.2 confirms via build). If the SPM package isn't linked, the build at Task 4.2 will fail — the fix is in Xcode: File → Add Package Dependencies → `https://github.com/google/GoogleSignIn-iOS`.
