## CLAUDE.md — Flight Path App

This file is the master instruction set for any AI coding agent working in this
repository. Read it fully before writing or changing any code. Follow it exactly.

The human owner (Jonathan) is NOT a software engineer. He is a salesperson and
founder. Explain things in plain English, never assume coding knowledge, give
copy/paste-ready commands, and never skip "obvious" setup steps.

---

## 0. WHAT THIS PRODUCT IS (READ THIS FIRST)

Flight Path App is a **private, login-protected "Notion site", like Super.so —
but as our own app, skinned with the Azurio dark-editorial design.**

Think of it exactly like Super.so:
- Notion is the CMS / source of truth.
- We pick ONE root Notion page and publish it plus EVERY sub-page beneath it.
- Navigation is generated automatically from the Notion page hierarchy.
- The front ends just render whatever is in Notion. Editing happens in Notion.

The difference from Super.so:
- Everything sits behind a LOGIN (invite + company-domain allowlist).
- There are TWO front ends sharing ONE backend: a website and an iOS app.

NOTE: Any earlier description of a custom "modules" data model is OBSOLETE.
There is no fixed module schema. We render a Notion page tree generically.

---

## 1. THE BIG PICTURE

    Browser (web)            iOS app (SwiftUI)
          \                       /
           \                     /
            >>>   LOGIN GATE   <<<      (invite + allowed email domains)
                     |
               Shared Backend API        (the ONLY holder of the Notion key)
                     |
              +------+------------------------+
              |                               |
          Notion API                   Auth/Config store (Supabase/Postgres)
     Flight Path Program wiki          users, allowed domains, invites, sync log
     (root page + ALL sub-pages,
      crawled recursively)

One sentence: a private app + website that publishes the "Flight Path Program"
Notion wiki and every page under it as a fast, beautiful, dark experience,
locked behind a company login, with an optional read-only local AI chat.

---

## 2. NON-NEGOTIABLE RULES

1. The front ends (web + iOS) MUST NEVER hold the Notion API secret.
   Only the backend talks to Notion.
2. NOTHING is public. Every page is behind the login gate.
3. Login is INVITE + DOMAIN-ALLOWLIST based. Allowed domains are stored in the
   database and edited in the admin portal. They are NEVER hard-coded in code.
4. The chat assistant is READ-ONLY. It can never create, edit, archive, or
   delete Notion pages. It has no write tools and no function calling.
5. Never expose the local LLM or backend directly to the public internet.
   Use Tailscale (private network) for any remote access.
6. Secrets live in environment variables only. Never hard-code secrets. Never
   commit a real .env file. Always provide a .env.example.
7. v1 ships DARK MODE FIRST. Build the day/night structure but default to night.
8. "Hidden Pages" stay hidden from navigation, listings, search, and the chat
   index (see section 4). They are reachable only by their direct link.
9. Do not invent scope. If something is ambiguous, build the simplest version
   and leave a clearly-commented // TODO.
10. Keep everything beginner-operable: every run/build step documented in the
    README in plain English.

---

## 3. THE ROOT + THE PAGE TREE (how publishing works)

- The ROOT is the Notion wiki database named "Flight Path Program".
- The backend CRAWLS the root and EVERY sub-page recursively to build a
  "site tree". Each node in the tree is one Notion page.
- The wiki's top-level pages become the top-level navigation. Their sub-pages
  nest underneath them, and so on, to any depth.
- For each page we store: id, title, icon, tags, last edited time, its blocks
  (the page body), and its child pages.
- A reference to a sub-page inside a page becomes a navigation link to that
  child node (not inline content).

---

## 4. THE "HIDDEN PAGES" RULE (important, custom behavior)

This is how Jonathan marks content as unlisted (same spirit as an unlisted page):

- If a page contains a TOGGLE whose label text is exactly "Hidden Pages", then:
  - every page nested inside that toggle, AND all of their descendant pages,
    are flagged `hidden = true`.
- Hidden pages are EXCLUDED from: navigation, page listings, search results,
  and the chat retrieval index.
- Hidden pages ARE still crawled and stored, and ARE reachable by their own
  direct slug/URL (so they can be linked to, but never discovered by browsing).
- EVERY OTHER toggle renders normally as an inline collapsible section.

Implement this during the crawl/normalize step: when you encounter the
"Hidden Pages" toggle, walk its descendant pages and set hidden = true.

---

## 5. TECH STACK

**Backend + Web (ONE Next.js app)**
- Next.js (App Router) + TypeScript. This single app serves THREE things:
  the public-facing website UI, the admin portal, AND the JSON API that the
  iOS app calls. (Fewer moving parts for a non-engineer.)
- Notion access: the official @notionhq/client.
- Auth + database: Supabase (gives working email magic-link login + a Postgres
  database out of the box — strongly recommended so login "just works").
- Validation: zod. Styling: the Azurio CSS.

**iOS app**
- Swift + SwiftUI (iOS 17+), networking via URLSession async/await.
- Calls the SAME backend API. Logs in with the SAME magic-link/session system.
- The Azurio look is translated into native SwiftUI (NOT HTML/CSS).

**Local chat (read-only RAG)**
- Local LLM host: LM Studio or Ollama (OpenAI-compatible endpoint) on Jonathan's
  Mac. The backend reaches it over LAN/Tailscale.

**Recommended hosting (matches Jonathan's hardware)**
- Run the Next.js backend in Docker on the Mac mini (already runs Docker), made
  remotely reachable via Tailscale.
- Supabase cloud for auth + database.
- Local LLM on the Mac Studio, reached from the backend over the private network.

**Optional later (do NOT build in v1 unless asked)**
- Per-user progress tracking, write-back to Notion, offline mode.

---

## 6. REPOSITORY STRUCTURE

    flight-path-app/
      README.md
      CLAUDE.md
      .gitignore
      web/                          # Next.js: website + admin + JSON API
        package.json
        tsconfig.json
        next.config.js
        .env.example
        app/
          (site)/[...slug]/page.tsx # renders ANY Notion page by slug
          login/page.tsx            # the login gate
          admin/page.tsx            # manage domains, invites, sync
          api/
            site/route.ts           # GET visible navigation tree
            pages/[idOrSlug]/route.ts # GET one page (+ blocks)
            sync/route.ts           # POST admin re-sync
            auth/[...]/route.ts     # magic-link request/verify/me
            admin/domains/route.ts  # GET/POST/DELETE allowed domains
            admin/invites/route.ts  # GET/POST/DELETE invites
            chat/route.ts           # POST chat (proxy to local LLM)
            chat/health/route.ts
            chat/reindex/route.ts
        lib/
          notion/client.ts          # configured Notion client
          notion/crawl.ts           # recursive root -> site tree
          notion/normalize.ts       # Notion blocks -> Block[]
          notion/hiddenPages.ts      # the "Hidden Pages" rule
          auth/allowlist.ts         # domain + invite checks
          auth/session.ts
          chat/retrieve.ts
          chat/prompt.ts
          chat/guardrails.ts
          store/cache.ts            # cached site tree
          store/chunks.ts           # text chunks for chat retrieval
          types.ts
        components/                 # Azurio web components
        styles/                     # Azurio CSS
      ios/
        FlightPathApp/              # Xcode project
          App/FlightPathApp.swift
          Theme/{FlightPathTheme,FlightPathFonts,Color+Hex}.swift
          Components/{FlightPathBackground,FlightPathCard,MonoLabel,PillTag,
                      HeroWordmark,NavRow,PageHeader,Block views,ChatBubble,
                      SourceCitationCard}.swift
          Models/{SiteNode,Block,NavItem,ChatMessage}.swift
          Networking/{APIClient,Endpoints,Session}.swift
          Features/{Login,Home,Browse,PageDetail,Chat,Settings}/...
          State/AppState.swift

---

## 7. ENVIRONMENT VARIABLES

web/.env (never commit). Provide web/.env.example with placeholders.

    # Notion
    NOTION_API_KEY=secret_xxx
    NOTION_ROOT_PAGE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   # Flight Path Program wiki

    # Supabase (auth + database)
    NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
    SUPABASE_SERVICE_ROLE_KEY=xxx          # server-only, never sent to client

    # Server
    PORT=3000
    APP_API_TOKEN=long_random_string       # extra check for the iOS app
    ADMIN_TOKEN=another_long_random_string # for sync/reindex

    # Auth policy
    DEFAULT_ALLOWED_DOMAIN=sunritesolarllc.com  # SEED only -> stored in DB
    INVITE_REQUIRED=true

    # Local LLM (OpenAI-compatible)
    LLM_BASE_URL=http://localhost:1234/v1
    LLM_MODEL=local-model
    LLM_API_KEY=not-needed-for-local

A config module must load these with validation (zod) and throw a clear,
friendly error naming any missing variable.

---

## 8. AUTH + ADMIN PORTAL (the login gate)

Login model:
- Email magic-link via Supabase (no passwords for users to forget).
- A sign-in is allowed ONLY if BOTH are true:
  1. the email's domain is in the allowed_domains table, AND
  2. if INVITE_REQUIRED is on, the email is in the invites table.
- The default allowed domain "sunritesolarllc.com" is SEED DATA inserted into
  the database on first run. It is editable/removable in the admin portal.
  Domain rules must NEVER be hard-coded in the app logic.

Database tables (Supabase/Postgres):

    allowed_domains (id, domain, created_at)
    invites         (id, email, status, invited_by, created_at)
    app_users       (id, email, role 'member'|'admin', created_at)
    sync_meta       (id, last_sync, page_count)

Admin portal (/admin, role = admin only):
- Add / remove allowed email domains.
- Add / remove invited emails.
- View users.
- Toggle "invite required" on/off.
- Trigger a Notion re-sync and see last sync time + page count.

First admin: seed Jonathan's email (jrizzo@sunritesolarllc.com) as role=admin
on first run.

---

## 9. API ENDPOINTS

All routes require a valid logged-in session. Admin routes also require
role = admin. The iOS app additionally sends header x-app-token: APP_API_TOKEN.

    GET  /api/site
      -> { nav: NavItem[] }            # visible pages only, hidden excluded

    GET  /api/pages/:idOrSlug
      -> { page: SiteNode }            # includes blocks; hidden reachable here
      -> 404 if not found

    POST /api/sync                     (admin)
      -> re-crawl Notion, rebuild cache + chat chunks
      -> { ok: true, count, lastSync }

    GET/POST/DELETE /api/admin/domains (admin)
    GET/POST/DELETE /api/admin/invites (admin)

    GET  /api/chat/health  -> { ok, llm: "reachable"|"unreachable" }
    POST /api/chat         body { message, scope?: "all"|pageId }
                           -> { answer, sources: Source[] }
    POST /api/chat/reindex (admin)

---

## 10. DATA SHAPES (types.ts)

    type SiteNode = {
      id: string
      slug: string
      title: string
      icon?: string
      parentId: string | null
      childIds: string[]
      hidden: boolean
      tags: string[]
      lastEditedTime: string   // ISO
      blocks: Block[]
    }

    type NavItem = {           // navigation tree (hidden pages excluded)
      id: string
      slug: string
      title: string
      icon?: string
      children: NavItem[]
    }

    type Block =
      | { type: "heading"; level: 1 | 2 | 3; text: string }
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

    type Source = { pageId: string; title: string; snippet: string }

---

## 11. NOTION CRAWL + NORMALIZE

- Start at NOTION_ROOT_PAGE_ID (the Flight Path Program wiki); list its pages.
- For each page: read properties (title, Tags multi-select, Owner, Verification,
  last edited) and fetch ALL block children (handle pagination via start_cursor).
- Recurse into child pages and child_database pages to any depth.
- Apply the "Hidden Pages" rule (section 4).
- normalize.ts converts Notion blocks into Block[]. Skip unsupported block
  types gracefully — never crash on an unknown block.
- Generate a URL slug from each title (kebab-case, de-duplicated).
- Cache the whole site tree (Supabase table or on-disk JSON). The front ends
  read the CACHE for speed, not live Notion. /api/sync refreshes the cache.
- The Notion integration must be shared to the Flight Path Program wiki in
  Notion settings — document this in the README.

---

## 12. WEB FRONT END (Azurio look)

- Reuse the Azurio HTML/CSS design directly for the web experience.
- A catch-all route /[...slug] renders any SiteNode by slug.
- A persistent side/left navigation is built from GET /api/site.
- Render every Block type; toggles are inline collapsibles; page_link blocks
  and child nodes become navigation links.
- /login (magic link) and /admin (portal) pages.
- Dark editorial: near-black background, accent used sparingly, uppercase mono
  labels, one big wordmark per major view.

---

## 13. iOS APP (SwiftUI — Azurio translated to native)

Visual design (full tokens on the Azurio spec page):
- Background #060607 / #0C0C10 (never pure black). Text white / 72% / 45%.
  Borders white 16%. Accents #E8472A and #FF8A5B used sparingly (focus, send
  button, sync dot, selected tags, small "planet" glows). Never flat-fill large
  areas. Day palette #A9CCEA / #E4F0FA / #0B1B2B (structure only for v1).
- Type: system .black for wordmarks; system for body; monospaced UPPERCASE for
  small labels/metadata/tags.
- Soft radial gradient background + 1-2 blurred accent circles. Rounded cards,
  pill tags, thin borders, generous spacing.

Theme tokens (Theme/): color, spacing (4,8,12,16,24,32,48,64), radius
(6,10,14,999), plus a Color(hex:) initializer.

Reusable components: FlightPathBackground, FlightPathCard, MonoLabel, PillTag,
HeroWordmark, NavRow, PageHeader, per-Block render views, ChatBubble,
SourceCitationCard.

Models: mirror the backend JSON exactly (SiteNode, Block enum Decodable,
NavItem, ChatMessage, Source).

Networking (APIClient): base URL from config (backend over Tailscale/LAN),
send session token + x-app-token, async fetchNav(), fetchPage(slug:),
health(), sendChat(message:).

Screens:
1. LoginView: email magic-link sign-in; blocks anyone outside the allowlist.
2. HomeView: big "FLIGHT PATH" wordmark, mono eyebrow label, a few recently
   updated pages as cards, buttons to Browse and Chat.
3. BrowseView: the navigation tree (from /api/site) as dark cards / rows.
4. PageDetailView: title, tags, last updated mono label, then renders the
   page's blocks in order; child pages and page_links are tappable.
5. ChatView: messages as ChatBubbles, source cards under assistant answers,
   input bar with accent send button, typing indicator.
6. SettingsView: backend URL, last sync time, app version, connection + login
   status, sign out.

State: AppState (ObservableObject) holds session, nav tree, current page,
loading/error states, chat thread. Pull-to-refresh re-fetches.

---

## 14. LOCAL CHAT (READ-ONLY RAG)

Flow: app/web -> POST /api/chat -> retrieve top chunks -> build a strict system
prompt + context -> call the local LLM -> return { answer, sources }.

Rules:
- Only index VISIBLE pages. NEVER index hidden pages.
- The LLM only receives content we retrieved. No tools, no write access.
- Always return sources (page title + short snippet) when content was used.
- Retrieval v1 can be simple keyword-overlap scoring over ~800-char chunks
  (with ~100-char overlap), tagged with pageId + title; return top 4.

System prompt template (use verbatim as a base):

    You are the Flight Path Assistant, a read-only helper.
    You can ONLY use the Flight Path content provided below as CONTEXT.
    If the answer is not in the context, say:
    "I don't have that in the current Flight Path content."
    Never say you changed, saved, created, or deleted anything.
    Be concise, practical, and plain-spoken.

    CONTEXT:
    {retrieved_chunks}

    QUESTION:
    {user_question}

---

## 15. BUILD ORDER (PHASES)

Work in small, verifiable steps. After each phase, STOP and report what to test.

Phase 0 — Setup: repo structure, git, .gitignore, README skeleton, .env.example.
Phase 1 — Crawl: Notion client + recursive crawl + GET /api/site and
  /api/pages/:slug from live Notion. Verify real titles + a real page come back.
Phase 2 — Normalize + Hidden Pages + cache + /api/sync. Verify a page's content
  is clean Block[] and that pages under a "Hidden Pages" toggle are excluded
  from /api/site but reachable by slug.
Phase 3 — Auth + admin portal: Supabase magic-link, domain allowlist + invites,
  seed Jonathan as admin. Verify only allowed emails can sign in.
Phase 4 — Web front end (Azurio) rendering the tree behind login + admin page.
Phase 5 — iOS app: login, Browse the nav tree, render a page, Settings.
Phase 6 — Local read-only chat (web + iOS) with sources + safe refusal.
Phase 7 — Polish: loading/empty/error states, pull-to-refresh, README finalize.
Phase 8 (later, only if asked) — progress tracking, write-back, offline.

---

## 16. COMMANDS

Web/backend (run from web/):

    npm install
    cp .env.example .env       # then fill in real values
    npm run dev                # start Next.js dev server
    npm run build
    npm start
    npm run lint

iOS:
- Open ios/FlightPathApp in Xcode, select a simulator, press Run.
- Set the backend URL in SettingsView (or a config constant) first.

---

## 17. CODING CONVENTIONS

- TypeScript strict mode. No `any` without a justifying comment.
- Small, single-purpose files and functions. Clear names over cleverness.
- Validate all external input (Notion responses, request bodies) with zod.
- Comment the "why", not the obvious "what". Use // TODO: for deferred work.
- Swift: value types where possible, @MainActor for UI state, no force-unwraps
  on network data.

---

## 18. SECURITY CHECKLIST (CONFIRM EVERY CHANGE)

- [ ] No secrets in code or in the iOS app bundle.
- [ ] .env gitignored; .env.example has placeholders only.
- [ ] Every page is behind login; nothing is public.
- [ ] Allowed domains come from the DATABASE, not hard-coded.
- [ ] Hidden pages are never listed, searched, or fed to the chat index.
- [ ] Chat cannot write to Notion (no write client, no tools).
- [ ] Local LLM/backend not exposed publicly (Tailscale/LAN only).
- [ ] Errors return safe JSON; no stack traces or secrets leaked.

---

## 19. DEFINITION OF DONE (v1)

- Backend crawls the Flight Path Program wiki + all sub-pages into a cached
  site tree, refreshable via /api/sync.
- The "Hidden Pages" toggle correctly hides its descendants from browsing while
  keeping them reachable by direct link.
- Login works: only allowed-domain + invited emails can get in; admin can
  manage domains and invites in the portal.
- The website renders the page tree in the Azurio dark style behind login.
- The iOS app renders the same tree behind login in native SwiftUI.
- Read-only chat answers from visible content with sources and safely refuses
  when content is missing.
- README documents setup end-to-end for a non-engineer.

---

## 20. HOW TO WORK WITH THE OWNER

- Explain each step in plain English before and after doing it.
- Put every command and code change in copy/paste-ready form.
- Don't dump everything at once; deliver phase by phase and tell him exactly
  what to click/type to verify it works.
- When something needs his input (API keys, Notion sharing, Supabase setup,
  URLs), give him a short, numbered checklist.