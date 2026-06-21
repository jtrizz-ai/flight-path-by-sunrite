# Chat + Profile Backend — Design Spec

**Date:** 2026-06-18
**Status:** Approved in brainstorm (pending written-spec review)
**Owner:** Jonathan Rizzo
**Scope:** Web (Next.js) + iOS (SwiftUI) + Postgres

---

## 1. Goal

Make the chat page functional (keep its current look) and add a profile
backend that works for both the website and the iOS app. Both features share
one foundation: a cross-platform auth bridge and an iOS networking layer
that don't exist yet.

This spec covers:

1. Cross-platform auth bridge (iOS gets a backend token).
2. iOS networking layer (the app currently makes zero network requests).
3. `/api/chat` with retrieval over visible Flight Path content + persistent
   per-user history.
4. `/api/me` and `/api/profile` for reading and updating user profile.
5. Web profile page, web chat wiring, admin LLM config card.
6. iOS chat wiring, iOS profile/settings views, SideDrawer row activation.
7. Cleanup of dead code and stale docs.

## 2. Non-goals (explicitly out of scope)

- Tally counters going to a real backend (stays local mock).
- Schedule rows linking to real Notion content (stays local mock).
- Browse / Page Detail / Notion tree rendering (not in current app).
- Multi-conversation chat (one thread per user in v1).
- Streaming chat responses (return complete answers).
- Rewriting CLAUDE.md (it is significantly drifted; separate effort).

## 3. Current state (verified by exploration)

### What works today

- **Web auth:** NextAuth v5 + Google OAuth, JWT session in signed cookie.
  Login gate enforces allowed domain + invite + active status
  (`web/src/lib/auth/gate.ts`).
- **Database:** Postgres 16 in Docker (`docker-compose.yml`). Schema in
  `db/init/01-schema.sql`. Tables include `app_users`, `allowed_domains`,
  `invites`, `sessions`, `admin_settings`, `notion_pages`, `page_versions`,
  `crawl_logs`, `sync_meta`.
- **Notion crawler:** `node-worker/` runs on a schedule, writes
  `notion_pages` with `is_hidden` flag and a tsvector search index.
- **Web chat UI:** `web/src/components/fp/ChatView.tsx` is polished and
  Azurio-styled. Currently returns a hardcoded placeholder string.
- **iOS chat UI:** `ios/FlightPathApp/Views/ChatView.swift` is polished.
  Currently returns a hardcoded placeholder after a 0.5s delay.
- **Google Sign-In on iOS:** `GIDSignIn` is configured and works; the
  Google user profile object is currently discarded.

### What is missing or broken

- **`/api/chat` does not exist.** No LLM dependency in `web/package.json`.
- **`/api/me` / `/api/profile` do not exist.** No self-edit anywhere.
- **iOS has no networking layer at all.** No `URLSession`, no `APIClient`,
  no endpoints called.
- **iOS login gate is bypassed** (`AppState.swift:32` —
  `isAuthenticated = true` with a TODO).
- **iOS Profile/Settings/SideDrawer rows are dead** (`tab: nil` no-ops).
- **iOS user profile is hardcoded** as `"Jonathan Rizzo"` / `"jrizzo@..."`.
  The Google user object returned by `GIDSignIn` is discarded.
- **`flight-path-backend/` is dead code** — half its routes aren't mounted,
  its auth middleware references a missing config key, nothing calls it.
- **`web/.env.example` is stale** — lists Supabase vars that were removed,
  omits `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_*`, `LLM_*`.
- **Root README/setup docs describe a Supabase + Express architecture**
  that doesn't exist.

## 4. Architecture

```
                      +---------------------------------------------+
                      |   Next.js backend (web/) - the ONLY API     |
                      |                                             |
                      |   /api/auth/exchange  <- iOS gets token     |
                      |   /api/auth/signout   <- iOS destroys token |
                      |   /api/me             <- profile (read)     |
                      |   /api/profile        <- profile (update)   |
                      |   /api/chat           <- LLM + retrieval    |
                      |   /api/chat/threads   <- history            |
                      |   /api/chat/health    <- admin LLM ping     |
                      |   /api/admin/llm-config                  |
                      |                                             |
                      |   resolveSession() accepts EITHER:         |
                      |     * NextAuth cookie (web browser)        |
                      |     * Bearer token (iOS, from /exchange)   |
                      |   ...both resolve to the same app_users row|
                      +---------+-----------------------+----------+
                                |                       |
                        NextAuth cookie          Bearer token
                                |                       |
                  +-------------v------+    +-----------v-----------+
                  |  Web (browser)     |    |  iOS (SwiftUI)        |
                  |  - ChatView (kept) |    |  - APIClient (NEW)    |
                  |  - /profile (NEW)  |    |  - KeychainStore(NEW) |
                  |  (existing auth)   |    |  - ChatView (kept)    |
                  +--------------------+    |  - ProfileView (NEW)  |
                                            |  - SettingsView (NEW)|
                                            +-----------------------+
                                |
                                v
                  +----------------------------------------+
                  |  Postgres (db/) - already running      |
                  |                                        |
                  |  Existing tables we USE:               |
                  |    app_users (add: hire_date)          |
                  |    notion_pages (add: search_text,     |
                  |                  search_vector)        |
                  |    admin_settings (llm_config row)     |
                  |    sessions (iOS bearer tokens)        |
                  |                                        |
                  |  New tables:                           |
                  |    chat_threads                        |
                  |    chat_messages                       |
                  +----------------------------------------+
                                ^       |
                  +-------------+       | websearch_to_tsquery
                  |  node-worker writes  |
                  |  search_text on crawl|
                  +-----------------------+
                                |
                                v
                  +----------------------------------------+
                  |   Local LLM (LM Studio)                |
                  |   http://100.101.18.67:1234/v1         |
                  |   URL/model/key set in /admin          |
                  +----------------------------------------+
```

### Auth bridge: Token Exchange via existing `sessions` table

- iOS signs in with Google (already works), gets a Google ID token.
- iOS sends `{ googleIdToken }` to `POST /api/auth/exchange`.
- Backend verifies the Google ID token with Google's tokeninfo endpoint.
- Backend looks up the user by email in `app_users`.
- Backend runs the SAME login gate as the web (`checkLoginGate` from
  `web/src/lib/auth/gate.ts`): allowed domain + (optional) invite +
  `status = 'active'`.
- On success, backend mints a 32-byte cryptographically-random opaque
  token, stores its SHA-256 hash in `sessions` with a 60-day expiry.
- Backend returns `{ token, expiresIn, user: { id, email, fullName,
  avatarUrl, role } }`.
- iOS stores the token in Keychain. Every subsequent request adds
  `Authorization: Bearer <token>`.
- Sign-out (`POST /api/auth/signout`) deletes the `sessions` row.

### Unified auth helper

`web/src/lib/auth/resolveSession.ts` (new) accepts a `Request` and returns
the current user or null. Internally:

1. Try NextAuth `auth()` — if a cookie session exists, return that user.
2. Else look for `Authorization: Bearer <token>`, hash it, look up
   `sessions` by `token_hash` where `expires_at > now()` and
   `app_users.status = 'active'`. If found, return that user.
3. Else return null (caller emits 401).

Every protected API route uses `resolveSession()` instead of calling
`auth()` directly. Web behavior is unchanged; iOS is now first-class.

## 5. Database changes

### New column

```sql
ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS hire_date DATE;
```

### New tables

```sql
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
```

For v1, each user gets at most one row in `chat_threads` (created lazily on
first message). The schema permits multi-thread later without migration.

### Seed LLM config

On first boot, if `admin_settings` has no `llm_config` key, a small Next.js
bootstrap helper inserts one row reading `process.env.LLM_BASE_URL`,
`process.env.LLM_MODEL`, `process.env.LLM_API_KEY`. Defaults if env vars
are absent:

```json
{
  "baseUrl": "http://100.101.18.67:1234/v1",
  "model":   "local-model",
  "apiKey":  "not-needed"
}
```

The bootstrap runs once on server startup (in `web/src/lib/llm/bootstrap.ts`)
via a `SETVERLESS == false` guarded side-effect. After first boot, all
changes go through the admin portal.

## 6. API endpoints

All endpoints except `/api/auth/exchange` require authentication via
`resolveSession()`. Admin endpoints additionally require `role = 'Admin'`.

### `POST /api/auth/exchange` (iOS-only, no auth)

- Request: `{ googleIdToken: string }`
- Verifies token with Google (`tokeninfo` endpoint).
- Looks up user by email; runs `checkLoginGate`.
- Mints token; inserts `sessions` row.
- Response 200: `{ token: string, expiresIn: number, user: UserProfile }`
- Response 401: `{ error: "Invalid Google token" }`
- Response 403: `{ error: "Email not allowed" }` (domain/invite/active
  failure — same message for all three to avoid information leakage).

### `POST /api/auth/signout` (iOS-only)

- Reads `Authorization: Bearer <token>`, hashes it, deletes the `sessions`
  row. Returns 200 `{ ok: true }` regardless of whether a row existed.
- Web sign-out continues to use NextAuth's `/api/auth/signout`.

### `GET /api/me`

- Returns the current user's profile:
  `{ id, email, fullName, avatarUrl, phone, town, hireDate, role, status }`

### `PATCH /api/profile`

- Request body may include any subset of:
  `fullName, avatarUrl, phone, town, hireDate`.
- Server validates: `fullName` non-empty (1-200 chars), `avatarUrl` is a
  URL (or empty), `phone` is a string (max 32 chars), `town` is a string
  (max 200 chars), `hireDate` is an ISO date (or null).
- Any attempt to set `email`, `role`, `status`, or `id` is silently
  ignored (defensive filter — never an error).
- Returns the updated `UserProfile` (same shape as `/api/me`).

### `GET /api/chat/threads`

- Returns the current user's thread with all messages:
  `{ thread: { id, title, createdAt, updatedAt,
               messages: [ { id, role, content, sources, createdAt } ] } }`
- Creates the thread row lazily if the user has none (so the response
  shape is always consistent).

### `POST /api/chat`

- Request: `{ message: string }` (1-4000 chars, trimmed, non-empty).
- Flow:
  1. Append the user message to the thread (`chat_messages`, role=user).
  2. Run retrieval: top-4 visible Flight Path pages matching the message,
     using Postgres full-text search against `notion_pages` (tsvector
     index already exists). Hidden pages excluded by
     `WHERE is_hidden = false`.
  3. Build system prompt per `CLAUDE.md` section 14 (read-only, answer
     only from context, refusal line if not present).
  4. Call the LLM via the OpenAI-compatible
     `${baseUrl}/chat/completions` endpoint. Model, URL, and API key come
     from `admin_settings.llm_config`.
  5. Extract answer + sources (pageId, title, slug, snippet).
  6. Append assistant message to thread (`chat_messages`, role=assistant,
     `sources` JSONB).
  7. Return `{ answer: string, sources: Source[] }`.
- Response 503 if LLM unreachable (no fallback answer — surface the
  failure honestly).

### `GET /api/chat/health` (admin)

- Reads LLM config, opens a tiny request (e.g. `GET /v1/models`), returns
  `{ ok: true, model: string }` or `{ ok: false, error: string }`.

### `GET /api/admin/llm-config` (admin)

- Returns the current config (without leaking the full API key — masked
  like `sk-...abc`).

### `PUT /api/admin/llm-config` (admin)

- Body: `{ baseUrl?, model?, apiKey? }`. Validates URL shape on
  `baseUrl`, non-empty `model`. `apiKey` is optional (preserve existing
  if omitted). Writes to `admin_settings.llm_config`.

### Data shapes

```typescript
type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  phone: string | null;
  town: string | null;
  hireDate: string | null;   // ISO date (YYYY-MM-DD)
  role: "Admin" | "Manager" | "Team Lead" | "Sales" | "Field Marketer";
  status: "active" | "paused";
};

type Source = {
  pageId: string;
  title: string;
  slug: string;
  snippet: string;
};

type ChatMessageRecord = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: Source[] | null;
  createdAt: string;   // ISO
};

type ChatThread = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessageRecord[];
};
```

## 7. Chat retrieval design (v1)

### Current state and required schema work

The existing `idx_notion_pages_search` index covers **title only**
(`db/init/01-schema.sql:149`). Page content lives inside `notion_pages.content
JSONB` as normalized `Block[]` and is not searchable. The migration must add:

```sql
-- 1. New column: flat searchable text extracted from Block[].
ALTER TABLE notion_pages
  ADD COLUMN IF NOT EXISTS search_text TEXT;

-- 2. Generated tsvector over title + body.
ALTER TABLE notion_pages
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(search_text,''))
  ) STORED;

-- 3. GIN index for fast FTS.
CREATE INDEX IF NOT EXISTS idx_notion_pages_search_vector
  ON notion_pages USING gin(search_vector);
```

The `node-worker` must also be updated to populate `search_text` when it
writes a page: walk the normalized `Block[]` and concatenate all text
fields (paragraph/heading/list/todo/toggle/code/quote/callout text;
skip `image`/`bookmark`/`divider`/`page_link`). A small helper in
`node-worker/src/services/normalize.ts` (or a sibling
`searchText.ts`) does this. Existing rows are backfilled by re-running
the crawl (the admin portal's "Re-sync" trigger already exists).

### Retrieval approach

Live Postgres full-text search over the new `search_vector`. No separate
chunks table in v1.

```sql
SELECT id, title, slug,
       ts_headline('english',
                   coalesce(title,'') || ' ' || coalesce(search_text,''),
                   websearch_to_tsquery($1),
                   'MaxWords=35, MinWords=10') AS snippet,
       ts_rank(search_vector, websearch_to_tsquery($1)) AS rank
FROM notion_pages
WHERE is_hidden = false
  AND search_vector @@ websearch_to_tsquery($1)
ORDER BY rank DESC
LIMIT 4;
```

Each retrieved row becomes a `Source` (with the `ts_headline` snippet).
Retrieved pages' full `search_text` is concatenated into the CONTEXT
block of the system prompt.

This is intentionally simple. If retrieval quality is poor in testing,
we upgrade to a chunks table in a follow-up — but the `/api/chat`
interface stays identical.

### System prompt (verbatim base)

```
You are the Flight Path Assistant, a read-only helper.
You can ONLY use the Flight Path content provided below as CONTEXT.
If the answer is not in the context, say:
"I don't have that in the current Flight Path content."
Never say you changed, saved, created, or deleted anything.
Be concise, practical, and plain-spoken.

CONTEXT:
{retrieved_pages_with_titles_and_content}

QUESTION:
{user_question}
```

## 8. LLM config

- Stored in `admin_settings.llm_config` JSONB:
  `{ baseUrl: string, model: string, apiKey: string }`.
- A small server-side helper `getLlmConfig()` reads from the DB on each
  chat request (cheap, single row, cached in module scope for 60s).
- First-boot seeding reads from `process.env.LLM_BASE_URL`,
  `LLM_MODEL`, `LLM_API_KEY`. Default for development:
  `http://100.101.18.67:1234/v1`.
- The LLM call uses the OpenAI-compatible
  `POST ${baseUrl}/chat/completions` shape. This works with LM Studio,
  Ollama (`/v1`), OpenAI, and most other providers — swapping providers
  is purely a config change.
- No SDK dependency. Plain `fetch` against the OpenAI-compatible
  endpoint. Avoids pinning a client library.

## 9. Web (Next.js) changes

### New files

- `web/src/lib/auth/resolveSession.ts` — cookie-or-bearer helper.
- `web/src/lib/chat/llm.ts` — `getLlmConfig()`, `callLlm(system, user)`.
- `web/src/lib/chat/retrieve.ts` — FTS retrieval returning `Source[]` +
  raw page content for the context block.
- `web/src/lib/chat/prompt.ts` — system prompt builder (verbatim base
  above).
- `web/src/app/api/auth/exchange/route.ts`
- `web/src/app/api/auth/signout/route.ts`
- `web/src/app/api/me/route.ts`
- `web/src/app/api/profile/route.ts`
- `web/src/app/api/chat/route.ts`
- `web/src/app/api/chat/threads/route.ts`
- `web/src/app/api/chat/health/route.ts`
- `web/src/app/api/admin/llm-config/route.ts`
- `web/src/app/profile/page.tsx` — profile form page.
- `web/src/components/fp/SourceCard.tsx` — source citation card.
- `web/src/components/fp/TypingIndicator.tsx` — animated typing bubble.
- `web/src/components/fp/ProfileForm.tsx` — shared form (used by
  `/profile` page).
- `web/src/app/admin/components/LlmConfigSection.tsx` — admin card.

### Modified files

- `web/src/components/fp/ChatView.tsx` (web — distinct from the iOS
  `ChatView.swift`) — accept `sources` per AI message; render `SourceCard`
  list beneath AI bubbles; render `TypingIndicator` while waiting.
- `web/src/components/fp/FlightPathApp.tsx` (web root component —
  distinct from the iOS `FlightPathApp.swift`) — replace stub
  `handleSendMessage` with a real `POST /api/chat` call; on mount,
  fetch existing thread via `GET /api/chat/threads`; add `isTyping`
  state; thread source arrays on each AI message.
- `web/src/components/fp/SideDrawer.tsx` — make the dead "Profile" row
  link to `/profile`.
- `web/src/app/admin/page.tsx` — render the new `LlmConfigSection`.
- `web/.env.example` — rewrite to match reality:
  `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`,
  `NEXTAUTH_URL`, `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY`,
  `GOOGLE_TOKEN_EXCHANGE_ENABLED` (default `true`; lets an operator
  disable the iOS bridge if needed without code changes).

### Profile page UX

- Route `/profile` (server component shells, client component form).
- Reads `GET /api/me` on mount; pre-fills the five editable fields.
- Inline validation; submit button disabled while dirty + invalid.
- "Sign out" button at bottom (calls NextAuth sign-out).
- Linked from SideDrawer's "Profile" row.

### Admin LLM config UX

- Card on `/admin` titled "AI Configuration".
- Three inputs: Base URL, Model, API Token (password-type, masked).
- "Test connection" button — calls `GET /api/chat/health`, shows green
  checkmark + model name or red `x` + error message.
- "Save" button — `PUT /api/admin/llm-config`.

## 10. iOS (SwiftUI) changes

### New `Networking/` folder (does not exist yet)

- `AppConfig.swift` — `static var backendBaseURL: String` read from
  `UserDefaults` (key `fp_backend_url`), default
  `http://localhost:3000`. Editable from `SettingsView`.
- `KeychainStore.swift` — `save(token:)`, `loadToken()`, `clear()`.
  Uses `kSecClassGenericPassword`, service `flight-path.app`,
  account `bearer`.
- `APIClient.swift` — `struct APIClient` with async `request<T:
  Decodable>(endpoint:)`. Injects `Authorization: Bearer <token>` if a
  token is in Keychain. Common error type `APIError`.
- `Endpoints.swift` — typed functions:
  - `exchangeToken(googleIdToken:) -> ExchangeResponse`
  - `fetchMe() -> UserProfile`
  - `updateProfile(_: UserProfilePatch) -> UserProfile`
  - `fetchChatThread() -> ChatThread`
  - `sendChat(message:) -> ChatResponse`
  - `signOut()`
  - `health() -> HealthResponse`

### New model types (in `Models.swift`)

- `UserProfile` (Codable) — mirrors the backend shape, with
  `null` -> `nil` optionals.
- `UserProfilePatch` — all-optional fields for partial updates.
- `ChatThread`, `ChatMessageRecord`, `ChatSource` (Codable).
- Extend existing `ChatMessage` with `sources: [ChatSource]?`.

### New views

- `Views/ProfileView.swift` — form with full name, avatar URL, phone,
  town, hire date (DatePicker). Pre-fills from `fetchMe()`, saves via
  `updateProfile`. Sign-out button.
- `Views/SettingsView.swift` — backend URL text field (persisted to
  `UserDefaults`), "Test connection" button (`health()`), app version,
  sign-out button.
- `Components/SourceCitationCard.swift` — small card showing a source
  page title; tappable (no-op in v1 since the app has no PageDetail
  view; just visual).
- `Components/TypingIndicator.swift` — three pulsing dots in a left-
  aligned bubble.

### Modified files

- `App/AppState.swift`:
  - Remove the `isAuthenticated = true` dev bypass; default to `false`.
  - Replace hardcoded `userName`/`userEmail` with `@Published var
    user: UserProfile?`.
  - Add `@Published var isTyping: Bool = false`.
  - In `signInWithGoogle()`: after Google sign-in succeeds, call
    `exchangeToken(googleIdToken:)`, store returned token in Keychain,
    set `user` from response, set `isAuthenticated = true`.
  - In `restorePreviousSignIn()`: if Google restore succeeds AND a
    Keychain token exists AND `fetchMe()` succeeds, restore session;
    else clear and show login.
  - In `signOut()`: call backend `signOut()`, clear Keychain, clear
    `user`, set `isAuthenticated = false`.
  - Replace stub `send(_:)` with: append user message; set `isTyping`;
    call `sendChat`; on success append assistant message + sources; on
    error append a graceful error bubble; clear `isTyping`.
  - Add `loadChatHistory()` — called on app launch and on
    `ChatView.onAppear`.
- `App/RootView.swift` — no change to the gate logic, but the gate now
  actually means something.
- `Components/SideDrawer.swift` — `Profile` row navigates to
  `ProfileView`; `Settings` row navigates to `SettingsView`. Implement
  via a `@State var destination: DrawerDestination?` and sheet
  presentation (no navigation stack needed for v1).
- `Views/ChatView.swift`:
  - Add typing indicator rendering when `app.isTyping` is true.
  - Render `SourceCitationCard` list under any AI message with sources.
- `App/FlightPathApp.swift` — wire `restorePreviousSignIn()` (already
  called) into the new networking-aware flow.

### Login gate re-enablement

`AppState.isAuthenticated` defaults to `false`. Set to `true` only after
`exchangeToken()` returns successfully. This is the single most
important security fix in this spec.

### Distribution note

The Google OAuth `clientID` is currently hardcoded in
`FlightPathApp.swift`. iOS OAuth client IDs are not secret (they're
embedded in the app bundle by nature), so this is acceptable. A future
improvement is to move it to an `Info.plist` entry for environment
swapping. Out of scope here.

## 11. Cleanup

1. **Delete `flight-path-backend/`** — confirmed dead. Before deletion,
   grep for `:8787`, `flight-path-backend`, and any imports in
   `web/`, `ios/`, `node-worker/` to confirm no references. Expected:
   none.
2. **Update `README.md`** — replace Supabase/Express description with
   reality (NextAuth + Postgres in Docker + `node-worker` crawler + iOS
   shell + the new auth bridge and chat/profile features).
3. **Move stale phase docs to `docs/archive/`** —
   `PHASE_0_SUMMARY.{md,pdf,docx}`, `PHASE_1_TESTING_GUIDE.{md,pdf,docx}`,
   `READY_TO_TEST.{md,pdf,docx}`, `LOGIN_SUCCESS_STATUS.{md,pdf,docx}`,
   `VM_SETUP_COMPLETE.{md,pdf,docx}`,
   `FLIGHT_PATH_V2_SUMMARY.md`, `GOOGLE_OAUTH_SETUP.md`,
   `SETUP_GUIDE.md`. These describe prior states; keep them as history
   but out of the root.
4. **Rewrite `web/.env.example`** (covered in section 9).

## 12. Build order (each phase is independently shippable)

1. **Foundation** — DB migration (`hire_date`, `chat_threads`,
   `chat_messages`, seed `llm_config`), `resolveSession` helper,
   `/api/auth/exchange`, `/api/auth/signout`. Verify with `curl` using
   a real Google ID token from the iOS sign-in flow.
2. **Profile backend + web profile page** — `/api/me`, `/api/profile`,
   web `/profile` page wired to them. Verify: edit on web, refresh,
   see changes.
3. **Chat backend + web chat wiring** — DB migration for `search_text`
   + `search_vector` on `notion_pages`, node-worker update to populate
   `search_text` on crawl, `/api/chat`, `/api/chat/threads`,
   `/api/chat/health`, admin LLM config card, wire existing
   `ChatView.tsx`. Verify: ask a real question on web, see sourced
   answer.
4. **iOS networking + auth bridge** — `Networking/` folder, wire
   Google sign-in to `/api/auth/exchange`, re-enable login gate, add
   `SettingsView` for backend URL. Verify: sign in on iOS simulator,
   reach `/api/me`.
5. **iOS chat wiring** — wire `ChatView` to real backend, add typing
   indicator + source cards. Verify: chat on iOS, then refresh web
   and see the same history.
6. **iOS Profile** — `ProfileView`, wire SideDrawer Profile row.
   Verify: edit profile on iOS, see change on web.
7. **Cleanup** — delete `flight-path-backend/`, update README, archive
   old docs, rewrite `.env.example`.

Each phase ends in a working, demonstrable slice. The user can stop
after any phase.

## 13. Security checklist

- No secrets in code or in the iOS app bundle (LLM key, DB URL,
  NextAuth secret all server-side).
- `.env` gitignored; `.env.example` has placeholders only.
- Every API route behind `resolveSession()` except
  `/api/auth/exchange` (which is itself rate-limited and verifies the
  Google token).
- Allowed domains come from the database (no hardcoding).
- Hidden pages excluded from chat retrieval and chat history by
  `WHERE is_hidden = false`.
- Chat cannot write to Notion (the LLM only emits text; we never
  invoke any write tool).
- LLM endpoint not exposed publicly (Tailscale IP, reached only by
  the Next.js server).
- Bearer tokens are 32-byte crypto-random, stored only as SHA-256 in
  the DB, expire in 60 days, revocable by sign-out or admin action.
- Profile PATCH silently strips `email`, `role`, `status`, `id` from
  input (no privilege escalation via mass-assignment).
- Errors return safe JSON; no stack traces or secrets leaked.

## 14. Decisions noted (with recommendations)

These came up during design. Each has a recommendation; flagged here so
the implementer can revisit if context changes.

- **Rate limiting on `/api/auth/exchange`.** Recommendation: yes, a
  simple in-memory IP limiter (e.g. 10 requests/minute/IP) in v1.
  Revisit if we add a proper proxy.
- **Google OAuth `clientID` placement.** Currently hardcoded in
  `FlightPathApp.swift`. iOS OAuth client IDs are not secret, so this is
  acceptable. A future improvement moves it to `Info.plist` for
  environment-swapping. Out of scope here.
- **Chat history scrollback.** Recommendation: load all messages in v1
  (threads will be short). Revisit with pagination if threads grow past
  ~200 messages.
- **`flight-path-backend/` disposition.** Delete, do not archive. The
  drift is severe enough that any future revival would rewrite from
  scratch.

## 15. Definition of done

- Web: `/profile` page lets the user edit avatar, phone, town, hire
  date, full name. Changes persist and show in the SideDrawer.
- Web: `ChatView` returns real answers from Flight Path content with
  source cards. History persists across sign-out/in.
- Web: `/admin` shows an AI Configuration card that lets an admin
  change LLM URL/model/key and test the connection.
- iOS: signing in with Google reaches the backend, which mints a
  bearer token. Login gate is enforced (no bypass).
- iOS: `ChatView` returns the same real answers as the web; chat
  history syncs across devices.
- iOS: `ProfileView` and `SettingsView` work; SideDrawer rows navigate
  to them.
- `flight-path-backend/` deleted. `README.md` updated. Old phase docs
  archived. `.env.example` corrected.
- Every phase above has been verified end-to-end before moving on.
