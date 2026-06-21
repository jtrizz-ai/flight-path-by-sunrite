# Flight Path App

A private, login-protected publishing layer over a Notion wiki — like
Super.so, but as our own app, skinned with the Azurio dark-editorial design.
Three front ends (website + iOS app + Android app) share one Next.js backend.

Notion is the source of truth. The backend crawls the "Flight Path Program"
wiki and every sub-page into a cached site tree. The front ends render that
cache. Everything sits behind a Google sign-in gated by an email-domain
allowlist + invite table. An optional read-only AI chat answers questions
from the published content.

---

## Architecture (monorepo)

```
flight-path-by-sunrite/
├── web/              # Next.js: website + admin portal + JSON API
├── ios/              # SwiftUI iOS app (iOS 17+)
├── android/          # Expo + React Native Android app (see android/README.md)
├── node-worker/      # Notion crawler (writes to Postgres)
├── db/               # SQL schema + migrations
├── docs/             # Specs, plans, design notes
└── README.md         # This file
```

- **web/** — Next.js 15 (App Router) + TypeScript. Serves the public website,
  the `/admin` portal, and the JSON API the iOS app calls. Auth is Auth.js
  (NextAuth v5) with Google. Database is Postgres (local Docker or Supabase
  cloud). Styling is Tailwind + the Azurio dark palette.
- **ios/** — SwiftUI, iOS 17+. Native URLSession async networking. Google
  Sign-In SDK exchanges a Google ID token for a backend bearer token via
  `/api/auth/exchange`. Renders the same site tree + chat.
- **android/** — Expo + React Native + TypeScript (Expo Router). Same Google
  Sign-In → `/api/auth/exchange` flow and the same JSON API. Mirrors the iOS
  feature set. Setup details in `android/README.md`.
- **node-worker/** — Node.js + TypeScript. Recursively crawls the Notion wiki,
  applies the "Hidden Pages" toggle rule, extracts searchable text, and writes
  pages to Postgres. Runs on demand (no daemon in v1).
- **db/** — `init/01-schema.sql` (original) + `migrations/` (incremental).
  Apply via `psql` or your DB tool.

---

## Prerequisites

1. **Node.js** v20+ and npm
2. **Docker** (to run Postgres locally) OR a Supabase/Neon Postgres URL
3. **Google OAuth credentials** (for sign-in)
4. **Notion integration token** + the root wiki page ID
5. **Xcode 16+** (iOS app) **or Android Studio** (Android app) — only the one you'll run
6. **A local LLM** (LM Studio or Ollama, OpenAI-compatible endpoint) for chat

---

## Setup

### 1. Start Postgres

Local Docker (recommended for development):

```bash
docker compose up -d        # starts flightpath-postgres on port 5433
```

Apply the schema + migrations:

```bash
psql postgres://flightpath:flightpath@localhost:5433/flightpath \
  -f db/init/01-schema.sql \
  -f db/migrations/002-chat-and-profile.sql
```

> If you already ran `01-schema.sql` before, only run the migration files
> after it in numeric order.

### 2. Create Google OAuth credentials

1. Go to https://console.cloud.google.com/apis/credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   (and your production URL when you deploy)
4. Copy the Client ID and Client Secret

### 3. Create a Notion integration

1. Go to https://www.notion.so/my-integrations
2. Create an internal integration ("Flight Path Crawler")
3. Copy the **Internal Integration Token** (this is `NOTION_API_KEY`)
4. Open the Flight Path Program wiki in Notion → `...` → **Add connections**
   → select your integration
5. Copy the wiki's page ID from the URL (the 32-char hex string)

### 4. Configure the web backend

```bash
cd web
cp .env.example .env
```

Open `web/.env` and fill in every value. Each variable is documented inline.
Generate `AUTH_SECRET` with:

```bash
openssl rand -base64 32
```

### 5. Install + run the web app

```bash
cd web
npm install
npm run dev          # http://localhost:3000
```

On first boot, the backend seeds:
- `DEFAULT_ALLOWED_DOMAIN` into `allowed_domains`
- `ADMIN_SEED_EMAIL` into `app_users` with `role = admin`
- LLM config (`LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY`) into
  `admin_settings.llm_config`

### 6. Crawl Notion (first time)

```bash
cd node-worker
cp .env.example .env        # fill in NOTION_API_KEY, NOTION_ROOT_PAGE_ID, DATABASE_URL
npm install
npm run build
npm start
```

The worker crawls the wiki and writes pages to Postgres. Re-run it whenever
Notion content changes (there is no auto-sync in v1).

### 7. Run the iOS app

1. Open `ios/FlightPathApp.xcodeproj` in Xcode
2. In `ios/FlightPathApp/Networking/AppConfig.swift`, set:
   - `backendBaseURL` to your Mac's LAN/Tailscale URL (not localhost — the
     simulator can reach localhost, but a physical device cannot)
   - `appToken` to the same value as `APP_API_TOKEN` in `web/.env`
3. Add your Google OAuth **iOS** client ID and reversed client ID as URL
   schemes in the Xcode project (see Google Sign-In iOS docs)
4. Select a simulator and press ⌘R

---

## Usage

### Team members (website)
1. Visit the site → sign in with Google (must use an allowed-domain email)
2. Browse the Flight Path Program wiki in the Azurio dark UI
3. Open the chat to ask read-only questions about the content
4. Edit your profile from the side drawer

### Admins (`/admin`)
1. Sign in with the seeded admin email
2. Add/remove allowed email domains
3. Add/remove invited emails (if `INVITE_REQUIRED=true`)
4. Configure the LLM endpoint, model, and API key
5. View users and last sync time

### iOS app
1. Sign in with Google
2. Browse the site tree, open pages, ask chat questions
3. Edit profile + configure backend URL in Settings

---

## Development commands

### Web
```bash
cd web
npm run dev          # dev server with hot reload
npm run build        # production build
npm start            # run production build
npm run lint         # ESLint
npx tsc --noEmit     # type-check without emitting
```

### Node worker
```bash
cd node-worker
npm run dev          # watch mode
npm run build        # compile TypeScript
npm start            # run compiled worker
```

### iOS
- Open in Xcode, select a simulator, ⌘R to run.
- There is no shared Xcode scheme checked in (the project uses
  file-system-synchronized groups), so `xcodebuild` from the CLI does not
  work — build from the Xcode GUI.

### Database
- Connect: `psql postgres://flightpath:flightpath@localhost:5433/flightpath`
- Apply new migrations in numeric order from `db/migrations/`

---

## Database overview

Key tables (see `db/init/01-schema.sql` + `db/migrations/`):

| Table | Purpose |
|---|---|
| `app_users` | Team members (id, email, full_name, role, status, profile fields) |
| `sessions` | Backend bearer tokens for iOS (SHA-256 hashed) |
| `allowed_domains` | Email domains permitted to sign in |
| `invites` | Individual invited emails (when `INVITE_REQUIRED=true`) |
| `admin_settings` | Key/value config (e.g. `llm_config` JSON) |
| `notion_pages` | Crawled pages (title, slug, blocks, search_text, search_vector) |
| `chat_messages` | Chat history per user (role, content, sources, created_at) |
| `sync_meta` | Last crawl timestamp + page count |

---

## Security model

- **Nothing is public.** Every page, every API route is behind the login gate.
- **Google proves identity; the gate decides access.** After Google verifies
  the email, `lib/auth/gate.ts` checks the email's domain is in
  `allowed_domains` AND (if `INVITE_REQUIRED`) the email is in `invites`.
- **Allowed domains live in the database**, never in code. Edit them in
  `/admin`.
- **The Notion API key never reaches a front end.** Only the backend +
  node-worker read from Notion; the front ends read the Postgres cache.
- **The iOS app never holds a Google refresh token.** It exchanges a one-time
  Google ID token for a backend bearer token, stored in Keychain.
- **The chat is read-only.** The LLM receives only retrieved content, has no
  tools, and cannot write to Notion.
- **The local LLM is not exposed publicly.** Reach it over LAN or Tailscale.
- **Secrets live in `.env` only.** Never commit `.env`. `.env.example` has
  placeholders.

---

## Deployment

### Web (Docker on the Mac mini, reachable over Tailscale)
```bash
cd web
npm run build
npm start                # or containerize with the included Dockerfile
```
Expose via Tailscale Serve or a reverse proxy. Set `AUTH_URL` to the
reachable URL.

### Node worker
Run on the same machine as Postgres, on demand or via cron.

### iOS
1. Open in Xcode
2. Configure code signing (App Store Connect team)
3. Archive → upload to App Store Connect → TestFlight

---

## Troubleshooting

**"Database connection error"**
- Check `DATABASE_URL` in `web/.env`. Local Docker: port 5433, not 5432.

**"Google sign-in loops / ACCESS_DENIED"**
- The email's domain is not in `allowed_domains`, or `INVITE_REQUIRED=true`
  and the email is not in `invites`. Add them in `/admin`.

**"No pages showing after crawl"**
- Verify the Notion integration is added as a connection to the wiki (not
  just a single page). Re-run the worker. Check `notion_pages` row count.

**"Chat says 'I don't have that in the current Flight Path content.'"**
- `notion_pages.search_text` is empty. Re-run the node-worker (it populates
  `search_text` + `search_vector` used for retrieval).

**"iOS: can't reach backend"**
- The simulator can reach `localhost`; a physical device cannot. Set
  `backendBaseURL` in `AppConfig.swift` to your Mac's Tailscale hostname or
  LAN IP.

**"iOS: iOS 26.5 is not installed"**
- In Xcode → Settings → Platforms, download the matching iOS platform.

**`xcodebuild` from the terminal fails**
- Expected. The project has no shared scheme. Build from the Xcode GUI.

---

## Documentation

- `CLAUDE.md` — master spec for AI coding agents (read this first)
- `docs/superpowers/specs/` — design specs
- `docs/superpowers/plans/` — implementation plans
- `web/AGENTS.md` — web-specific agent notes

---

## License

MIT

---

Built by Sunrite.
