# Login setup (Google sign-in + invite gate)

Flight Path uses **"Sign in with Google"** as the only way in. Google just proves
*who you are*; our app decides *whether you're allowed* by checking an **invite
list** and an **allowed-domains list** in the database.

> This replaces the old Supabase login. There is no Supabase anymore — only the
> local Postgres database (see the repo-root `docker-compose.yml`).

---

## Part 1 — Start the database (one time)

From the **repo root** (`flight_path_by_sunrite/`):

```bash
docker compose up -d
```

Check it's healthy:

```bash
docker compose ps
```

You should see `flightpath-postgres` as `healthy`. (Database details and
passwords live in the repo-root `.env`, which is gitignored.)

---

## Part 2 — Get Google OAuth keys (one time)

Google has to know about our app. Do this in your browser:

1. Go to **https://console.cloud.google.com/** and sign in with your Sunrite
   Google account.
2. At the top, pick (or create) a project. Call it something like
   `Flight Path`.
3. In the left menu go to **APIs & Services → OAuth consent screen**.
   - User type: **Internal** (this keeps it limited to your Google Workspace,
     which is exactly what we want).
   - Fill in the app name (`Flight Path`), your support email, and your email
     under "Developer contact information."
   - Click **Save and Continue** through the Scopes/Test users screens (you can
     skip adding scopes).
4. In the left menu go to **APIs & Services → Credentials → Create credentials
   → OAuth client ID**.
   - Application type: **Web application**.
   - Name: `Flight Path local`.
   - **Authorized redirect URIs** — add EXACTLY this one:
     ```
     http://localhost:3100/api/auth/callback/google
     ```
   - Click **Create**.
5. You'll see a **Client ID** and **Client secret**. Copy both.

> The redirect URI must match the port the app runs on. We use **3100** because
> port **3000 on your Mac is Grafana**. (If you'd rather use 3000, stop Grafana
> first and change the port in `web/.env.local` and in Google.)

---

## Part 3 — Put the keys into the app

Open `web/.env.local` and fill in the two lines:

```
AUTH_GOOGLE_ID=paste_the_client_id_here.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=paste_the_client_secret_here
```

(`web/.env.local` is gitignored — it never gets committed.)

---

## Part 4 — Run the app

From the `web/` folder:

```bash
npm install        # first time only
npx next dev -p 3100
```

Open **http://localhost:3100/** and click **Sign in with Google**.

- If you sign in with `jrizzo@sunritesolarllc.com`, you get in (you are already
  seeded as an invited admin).
- Any other email is blocked unless it has been **invited** AND uses an
  **allowed domain**.

---

## How the gate works (the "once invited" part)

Three database tables control access (all editable; never hard-coded):

| Table | What it does |
|---|---|
| `allowed_domains` | Which email domains can sign in at all. Seeded with `sunritesolarllc.com`. |
| `invites` | The specific people allowed in. You (jrizzo@…) are already invited. |
| `app_users` | Created automatically the first time someone signs in successfully. |

Rules (enforced in `web/src/lib/auth/gate.ts`):

1. The email's **domain** must be in `allowed_domains`, **AND**
2. The exact **email** must be in `invites` (while invite-required is on).

If either fails, Google sign-in is **denied** and they're sent back to the
landing page with an "Access denied" message.

---

## Inviting a new person

Easiest way right now is a one-line SQL command against the database. From the
repo root:

```bash
docker exec flightpath-postgres psql -U flightpath -d flightpath \
  -c "INSERT INTO invites (email, status) VALUES ('name@sunritesolarllc.com', 'pending') ON CONFLICT (email) DO NOTHING;"
```

(Their domain must also be in `allowed_domains`. Adding a new domain works the
same way against the `allowed_domains` table.) The admin portal will get
add/remove buttons for these in a later phase.

---

## What's wired up now vs. next

- ✅ Google sign-in + invite/domain gate (web)
- ✅ Routes protected (`/pages`, `/admin`, `/api/pages`)
- ✅ Local Postgres replaces Supabase for users, invites, domains, pages
- ⏭️ Next: migrate the **node-worker** so crawled Notion pages actually appear in
  the library (right now the library is empty until that happens)
- ⏭️ Later: iOS sign-in, admin add/remove buttons for invites & domains
