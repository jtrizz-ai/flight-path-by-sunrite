# Flight Path — Deployment Checklist

> **Goal:** Get the app live and accessible to ~10 internal users as fast as possible.
> Created: June 2026. Work through each phase in order.

---

## Where things will live

| Piece | Machine | Tailscale IP | Notes |
|---|---|---|---|
| Web backend (Next.js in Docker) | Mac mini (node renamed **`flightpath`**) | `100.97.135.81` | Production target. Public URL via **Tailscale Funnel**: `https://flightpath.tailbce7aa.ts.net`. Dev still runs on Mac Studio (`100.101.18.67:3101`) |
| Postgres database | Trashcan Mac Pro | `100.117.75.7` | **Live.** Migrations applied, real data present (5 `notion_pages`, 1 `app_user`) |
| Notion crawler (node-worker) | Same Mac mini as web | `100.97.135.81` | Run on demand |
| Local LLM (for chat) | Mac Studio | `100.101.18.67:1234` | Already running (LM Studio) |

> **Decisions locked in (June 2026):**
> - Public URL method: **Tailscale Funnel** (already enabled in your ACL).
> - Production host: **mini1-staging** renamed to **`flightpath`** (`100.97.135.81`).
> - Public URL: **`https://flightpath.tailbce7aa.ts.net`**

All three machines talk to each other over Tailscale. No public internet needed
except the one tunnel (below) that exposes the website.

> ⚠️ **Gotcha — `100.117.75.7:3100` is NOT Flight Path.** Port 3100 on the
> trashcan is some *other* Go service that returns `404 page not found`. Only
> the **database** lives on the trashcan (port 5432). The backend runs on the
> Mac mini (production) or Mac Studio (dev). Pointing the iOS app or browser at
> `100.117.75.7:3100` will fail with a 404 — this tripped up sign-in once already.

---

## Phase 1 — Get the Website Live (highest priority)

This is the fastest win. Once the website is live, your team can log in and use
Flight Path from any browser — no app install required.

### 1.1 Create a Dockerfile for the web app  ✅ DONE

**Already complete.** `web/Dockerfile` does a clean 3-stage build (deps → build →
standalone runner) on `node:20-alpine`, exposes port 3100, and runs the
standalone server. `output: 'standalone'` is set in `web/next.config.ts`.
`docker-compose.yml` at the repo root builds `./web`, maps port 3100, loads
`./web/.env`, and sets `restart: always`.

### 1.2 Pick a public URL method (free, no domain purchase needed)  ✅ DONE

**Decision: Tailscale Funnel.** It's already enabled in your tailnet ACL
(`nodeAttrs` → `funnel` for members), and the production node has been renamed
to `flightpath`, so the public URL is fixed:

```
https://flightpath.tailbce7aa.ts.net
```

The Funnel command itself is run in step 1.7 (after the container is up).

The original two options are kept below for reference.

**Option A — Tailscale Funnel (CHOSEN)**

Tailscale Funnel exposes a local port to the public internet with automatic
HTTPS. Your team does NOT need Tailscale installed to reach it.

```
URL format:  https://flightpath.tailbce7aa.ts.net
```

To set up (run on the Mac mini once the web container is running):
```bash
tailscale funnel 3100
```

Check your tailnet name at https://login.tailscale.com/admin/dns

**Option B — Cloudflare Tunnel (cleaner URLs)**

Create a free Cloudflare account, install `cloudflared`, and run:
```bash
cloudflared tunnel --url http://localhost:3100
```
This gives you a `*.trycloudflare.com` URL instantly.

For a named URL (like `flightpath.trycloudflare.com`), create a named tunnel
in the Cloudflare dashboard.

### 1.3 Update Google OAuth credentials for production  ✅ DONE

Production redirect URI `https://flightpath.tailbce7aa.ts.net/api/auth/callback/google`
added to the Google Cloud Console OAuth client. Dev URI kept alongside it.

### 1.4 Prepare production environment variables  ✅ DONE

Production `.env` is in place at `web/.env` on the Mac mini (`flightpath`).
All 15 required vars present; `AUTH_SECRET` / `APP_API_TOKEN` / `ADMIN_TOKEN`
generated; real values filled for DB, Google OAuth, Notion, and LLM. File is
gitignored (`web/.gitignore` line 34) and excluded from the Docker image
(`web/.dockerignore`).

```bash
# ── Database on the trashcan (over Tailscale) ─────────────────────────────
# Password from 1Password: "Flight Path DB user (trashcan)"
DATABASE_URL=postgres://flightpath_user:<DB_PASSWORD>@100.117.75.7:5432/flightpath?sslmode=disable

# ── Auth.js (NextAuth v5) ─────────────────────────────────────────────────
# Generated. Do not change.
AUTH_SECRET=8TrrdUOiJhGaaam5kDPi8wME+VViKt8pz8UV4zj+0ac=
# The public Funnel URL
AUTH_URL=https://flightpath.tailbce7aa.ts.net

# ── Google OAuth (same client as dev) ─────────────────────────────────────
# From https://console.cloud.google.com/apis/credentials
AUTH_GOOGLE_ID=<YOUR_GOOGLE_OAUTH_CLIENT_ID>.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=<YOUR_GOOGLE_OAUTH_CLIENT_SECRET>

# ── Notion (for the crawler) ──────────────────────────────────────────────
# Copy from your existing web/.env.local on the Mac Studio
NOTION_API_KEY=<from your .env.local>
NOTION_ROOT_PAGE_ID=<from your .env.local>

# ── Local LLM (Mac Studio over Tailscale) ─────────────────────────────────
LLM_BASE_URL=http://100.101.18.67:1234/v1
LLM_MODEL=qwen3.5-122b-a10b
LLM_API_KEY=not-needed-for-local

# ── App tokens (generated) ────────────────────────────────────────────────
APP_API_TOKEN=467c780de571ff4baee3cfb7ead42175471793296dfa1557acd86a3c457131e8
ADMIN_TOKEN=f510c0191a457f1df26800bc610dcbead19ee3e361b5bc67f576fd3fecb578b8

# ── Auth policy ───────────────────────────────────────────────────────────
DEFAULT_ALLOWED_DOMAIN=sunritesolarllc.com
INVITE_REQUIRED=true
ADMIN_SEED_EMAIL=jrizzo@sunritesolarllc.com
```

> ⚠️ **Keep this file secret.** It goes ONLY on the Mac mini at
> `/opt/flightpath/web/.env`. Never commit it. `web/.env` is in `.gitignore`.

### 1.5 Apply migrations to the trashcan database  ✅ DONE

**Already complete — skip this step.** Verified June 2026: all 16 tables exist
on the trashcan `flightpath` database (`admin_settings`, `allowed_domains`,
`app_users`, `badges`, `chat_messages`, `chat_threads`, `crawl_logs`,
`invites`, `login_tokens`, `notion_pages`, `page_versions`, `page_views`,
`sessions`, `sync_meta`, `tally_events`, `user_badges`), with 5 `notion_pages`
and 1 `app_user` already present.

The original instructions are kept below for reference, in case migrations
ever need to be re-run on a fresh database:

```bash
for f in db/migrations/001-extend-user-management-fixed.sql \
         db/migrations/002-chat-and-profile.sql \
         db/migrations/003-app-users-profile-columns.sql \
         db/migrations/005-admin-portal-expansion.sql \
         db/migrations/006-fix-role-constraint.sql \
         db/migrations/007-multi-thread-chat.sql; do
  docker run --rm -i postgres:16-alpine \
    psql "postgres://flightpath_user:PASSWORD@100.117.75.7:5432/flightpath?sslmode=disable" \
    < "$f"
done
```

(Replace PASSWORD with the real one from 1Password.)

### 1.6 Deploy the web container to the Mac mini  ✅ DONE

Built and started on `flightpath` (the Mac mini) via `docker compose up -d --build`.
Container `flight-path-by-sunrite-web-1` is running, port `3100`. Verified:
landing page HTTP 200, container reaches the trashcan DB (5 `notion_pages`).

Two code fixes were required to get a clean production build (June 2026):
- `web/src/components/fp/RoofKnockabilityView.tsx:22` — nested double quotes
  around `"3D"` broke the Turbopack parser; switched outer quotes to single.
- `web/src/lib/db.ts` — was throwing on a missing `DATABASE_URL` at module
  load, which `next build`'s page-data collection triggers. Refactored the
  Pool to be created lazily on first query, so the build no longer needs the
  env var (the real value is injected at runtime via the container `env_file`).
- Added `web/.dockerignore` (excludes `node_modules`, `.env`, etc. from the
  build context and image layers).

### 1.7 Start the public tunnel  ✅ DONE

Funnel running in the background on the Mac mini:

```
https://flightpath.tailbce7aa.ts.net (Funnel on)
|-- / proxy http://127.0.0.1:3100
```

Verified from the public internet: landing page HTTP 200 (~0.06s after warmup),
`/api/chat/health` returns `{"error":"Unauthorized"}` (gated + reachable).

To stop later: `sudo tailscale funnel --https=443 off`
To check status: `sudo tailscale funnel status`

### 1.8 Run the Notion crawler (first time on production DB)

```bash
cd /opt/flightpath/node-worker
cp .env.example .env   # fill in NOTION_API_KEY, NOTION_ROOT_PAGE_ID, DATABASE_URL
npm install
npm run build
npm start
```

This populates the `notion_pages` table so the website and chat have content.

### 1.9 Smoke test the production website

- [ ] Open `https://flightpath.tailbce7aa.ts.net` in a browser
- [ ] Sign in with Google (`jrizzo@sunritesolarllc.com`)
- [ ] Browse a page — content should appear
- [ ] Open the chat — it should respond (if the Mac Studio LLM is running)
- [ ] Go to `/admin` — you should see the admin portal

### 1.10 Share the URL with your team

Before others can sign in:
1. Go to `https://flightpath.tailbce7aa.ts.net/admin` → **Invites** → add each person's email
2. Confirm `sunritesolarllc.com` is in **Allowed Domains**
3. Send them the URL: "Sign in with your Google account at https://flightpath.tailbce7aa.ts.net"

---

## Phase 2 — iOS App via TestFlight Internal Testing

Once the website is live, do this to get the native iOS app to your team.

### 2.1 Buy an Apple Developer Program membership

- Cost: **$99/year**
- Go to: https://developer.apple.com/programs/
- Sign in with your Apple ID, complete the purchase
- Wait for activation (usually within minutes, sometimes up to 48 hours)

### 2.2 Create the app in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. **My Apps** → "+" → **New App**
3. Fill in:
   - Name: `Flight Path`
   - Primary Language: English
   - Bundle ID: select the one from your Xcode project
     (check `ios/FlightPathApp.xcodeproj` for the exact bundle ID)
   - Platform: iOS
4. Click **Create**

### 2.3 Configure code signing in Xcode

1. Open `ios/FlightPathApp.xcodeproj` in Xcode
2. Select the project in the left sidebar → **Signing & Capabilities** tab
3. Check **Automatically manage signing**
4. Under **Team**, select your new developer team
5. Xcode will create the signing certificate and provisioning profile automatically

### 2.4 Update the iOS app for production

> **Current state (June 2026):** `AppConfig.swift` is set to
> `http://100.101.18.67:3100` — the Mac Studio **dev** backend. This is a
> temporary value for local testing. Change it to the production URL below
> before archiving for TestFlight.

In `ios/FlightPathApp/Networking/AppConfig.swift`, change the default URL to
your production URL:
```swift
private static let defaultURL = "https://flightpath.tailbce7aa.ts.net"
```

Verify the iOS Google Client ID in `FlightPathApp.swift` is correct:
```swift
GIDSignIn.sharedInstance.configuration = GIDConfiguration(
    clientID: "<YOUR_GOOGLE_OAUTH_CLIENT_ID>.apps.googleusercontent.com"
)
```

### 2.5 Archive and upload to App Store Connect

1. In Xcode, select **Any iOS Device (arm64)** as the build target (not a simulator)
2. **Product** → **Archive** (wait for the build to finish)
3. In the Organizer window that appears, click **Distribute App**
4. Choose **TestFlight & App Store** → **TestFlight Internal Testing**
5. Follow the prompts to upload

Apple processes the build in 15–30 minutes. You'll get an email when it's ready.

### 2.6 Invite your testers

1. In App Store Connect → your app → **TestFlight** tab
2. Under **Internal Testing**, click **+** to add testers by email
3. Each tester gets an email with a TestFlight invite
4. They install the free **TestFlight** app from the App Store, then install Flight Path

**No Apple review is required for internal testing.** Up to 100 testers.

### 2.7 Smoke test on a real device

- [ ] Install via TestFlight on your iPhone
- [ ] Sign in with Google
- [ ] Browse pages, open chat, check profile
- [ ] The app should point to your production backend automatically

---

## Phase 3 — Android (sideload APK, no store needed)

This is the fastest Android path — no Google Play account, no review.

### 3.1 Build a release APK

```bash
cd android
# Install EAS CLI if not already installed
npm install -g eas-cli

# Log in to Expo (free account)
eas login

# Build the APK
eas build --platform android --profile preview
```

This takes 10–20 minutes (builds in Expo's cloud). When done, you get a
download link for the `.apk` file.

### 3.2 Update the Android app for production

Before building, update the backend URL in `android/lib/config.ts` (or
`app.json`) to your production URL.

### 3.3 Distribute the APK

- Share the download link with your team
- On their Android phone: open the link, download the APK
- They may need to enable **Settings → Security → Install unknown apps**
- Tap the downloaded file to install

### 3.4 (Later, optional) Google Play internal testing

If you want it on the Play Store later:
- **$25 one-time fee** for Google Play Console
- Upload an `.aab` (Android App Bundle) instead of APK
- Invite testers by email
- More polished but not needed for v1

---

## Phase 4 — Ongoing Operations

| Task | How | How often |
|---|---|---|
| **Add a new user** | `/admin` → Invites → add their email. Tell them to sign in. | As needed |
| **Update Notion content** | Edit pages in Notion, then click "Sync Now" in `/admin` (or run node-worker manually) | Whenever content changes |
| **Update the iOS app** | Change code → Archive in Xcode → Upload. TestFlight auto-updates testers within minutes. | As needed |
| **Restart the server** | `docker compose restart web` on the Mac mini | Only if it crashes (set restart: always in docker-compose) |
| **Check server health** | `curl https://flightpath.tailbce7aa.ts.net/api/chat/health` | If something seems off |
| **Back up the database** | `pg_dump` on the trashcan, or add a cron job | Weekly recommended |

---

## Quick reference — what to tell your team

> "Flight Path is live. Open this link in your browser:
> **https://flightpath.tailbce7aa.ts.net**
>
> Sign in with your SunRite Google account. If you can't get in, your email
> needs to be on the invite list — ask Jonathan to add you in the admin portal."

---

## Cost summary

| Item | Cost |
|---|---|
| Apple Developer Program (iOS) | $99/year |
| Google Play Console (Android, optional) | $25 one-time |
| Domain (optional, later) | ~$12/year |
| Hosting (your own Macs) | $0 |
| Tunnels (Tailscale Funnel or Cloudflare) | $0 |
| **Total to launch** | **$99** (Apple only, if you do iOS) |

---

*Generated June 2026. Updated June 2026: tunnel method (Tailscale Funnel) and
production host (`flightpath` / `100.97.135.81`) locked in; 1.1/1.2/1.3/1.4/1.5/1.6/1.7
done and site is LIVE at https://flightpath.tailbce7aa.ts.net. Remaining:
1.8 (fresh Notion crawl — optional, 5 pages already present), 1.9 (smoke test
sign-in), 1.10 (invite team).*
