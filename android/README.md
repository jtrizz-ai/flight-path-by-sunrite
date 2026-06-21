# Flight Path — Android App

The Android front end for Flight Path. Built with **Expo + React Native**
(TypeScript, Expo Router). It shares the **same Next.js backend** as the
website and the iOS app — same login, same Notion content, same chat.

Everything sits behind the Google sign-in gate. Notion stays the source of
truth; this app just renders the cached pages and talks to the API.

> This guide is written for Jonathan (not an engineer). Every command is
> copy/paste-ready. Anything that needs *your* input is a numbered checklist.

---

## What's built (current status)

| Area | Status |
|------|--------|
| Dark "Flight Path" theme + fonts | ✅ Done |
| Tab navigation (Home, Library, Tally, Chat) | ✅ Done |
| Google Sign-In → backend session | ✅ Wired (needs your Google setup — see below) |
| Library: browse + search Notion pages | ✅ Done |
| Page reader: all 14 Notion block types | ✅ Done |
| Tally: live counters + goals | ✅ Done |
| Chat: history, send, sources, typing | ✅ Done |
| Profile + Settings (backend URL, sign out) | ✅ Done |
| Run on a physical device/emulator | ⏳ Needs a one-time dev build (below) |

Type-check and JS bundle both pass. **It runs for real once you do the
one-time setup below.**

---

## Prerequisites

1. **Node.js v20+** and npm (same as the web app).
2. **The Flight Path backend running** — start the web app first
   (`cd web && npm run dev`) and note its address, e.g. `http://localhost:3000`
   (simulator) or your Mac's Tailscale IP (real device).
3. **An Android emulator OR a physical Android device.**
   - Easiest: install **Android Studio** → open "Device Manager" → create a
     Pixel emulator.
4. **Google OAuth credentials** (the same Google Cloud project the web/iOS
   app uses).

---

## Quick start (happy path)

From this folder:

```bash
npm install
```

Then do the **one-time Google Sign-In setup** below (required before sign-in
works). After that, build + run:

```bash
npx expo run:android
```

The first run downloads and compiles native code (Google Sign-In, secure
storage) — this takes a few minutes. Subsequent runs are fast.

> ⚠️ **Do not use Expo Go.** It can't load the native Google Sign-In module.
> `expo run:android` builds a proper **development client** instead.

When the app opens:
1. Go to **Settings** (top-right gear) → enter your **Backend URL**
   (e.g. `http://10.0.2.2:3000` for an emulator hitting `localhost:3000` on
   your Mac, or your Tailscale IP for a real device) → **Save** →
   **Test Connection**.
2. Back on **Login**, tap **Continue with Google** and sign in with your
   Sunrite Google account.

---

## Google Sign-In setup (one-time, needs *you*)

The Android app uses the native Google Sign-In SDK. It mints a Google **ID
token** and swaps it for a backend session via `/api/auth/exchange` — the
exact same flow as the iOS app.

### Step 1 — Note your Web Client ID
This is the **"Web application"** OAuth Client ID the web app already uses
(`web/.env` → `AUTH_GOOGLE_ID`). Copy that value.

### Step 2 — Add an Android OAuth client (in Google Cloud Console)
1. Open https://console.cloud.google.com/apis/credentials (same project as web).
2. **Create Credentials → OAuth client ID → Android**.
3. **Package name:** `com.sunritesolar.flightpath`
4. **SHA-1 certificate fingerprint:** get it by running this on your Mac:

   ```bash
   keytool -list -v \
     -keystore ~/.android/debug.keystore \
     -alias androiddebugkey \
     -storepass android -keypass android \
     | grep SHA1
   ```

   (That's the standard Android debug keystore. If the file doesn't exist yet,
   run `npx expo run:android` once first to create it, then re-run the command.)
5. Save the Android client.

### Step 3 — Download `google-services.json`
1. Still in Google Cloud Console, download the `google-services.json` for your
   Android app.
2. Drop it in **this folder** (`android/google-services.json`, next to
   `app.json`).

### Step 4 — Put your Web Client ID into the app
Open `app.json` and set `expo.extra.googleWebClientId`:

```json
"extra": {
  "googleWebClientId": "1234567890-abcdef.apps.googleusercontent.com"
}
```

Then rebuild (`npx expo run:android`).

> The Web Client ID is **not a secret** — it's fine to ship in the app bundle.
> Only the *Client Secret* (which the backend holds) is sensitive.

---

## How it's organized

```
android/
├── app/                    # Screens (Expo Router — file-based, like Next.js)
│   ├── (tabs)/             # Home, Library, Tally, Chat
│   ├── page/[slug].tsx     # Notion page reader (all block types)
│   ├── login.tsx           # Google sign-in gate
│   ├── settings.tsx        # Backend URL + account + sign out
│   └── profile.tsx         # Edit profile
├── components/             # Shared UI (cards, block renderer, background)
├── constants/theme.ts      # Flight Path design tokens (dark)
├── lib/
│   ├── api.ts              # Backend client (auth, tally, chat, pages)
│   ├── auth.tsx            # Google Sign-In + session provider
│   ├── config.ts           # Reads Google Web Client ID from app.json
│   └── types.ts            # Shared data shapes
└── app.json                # Expo config + Google plugin + client ID
```

---

## Notes & troubleshooting

- **"Backend URL not set"** — open Settings and set it first. The app won't
  attempt any sign-in or data calls until a URL is configured.
- **Emulator can't reach `localhost`** — use `http://10.0.2.2:3000` (the
  emulator's alias for your Mac's localhost) instead of `http://localhost:3000`.
- **Real device** — the phone must reach the backend. Use your Mac's
  **Tailscale IP** (e.g. `http://100.101.18.67:3000`) and be on the same
  Tailscale network.
- **Changes to `app.json` or native modules** require a rebuild
  (`npx expo run:android`). Pure TypeScript/JS changes hot-reload.
- **`npx expo run:android` generates a nested `android/` folder** (the native
  project). That's normal — it lives at `android/android/`. Don't edit it by
  hand unless you know why.

---

## Relationship to the iOS app

This app **mirrors** the iOS SwiftUI app (same backend, same screens, same
design language). One intentional difference: where iOS has a hardcoded
"Schedule" tab, Android has a **Library** tab that renders the Notion program
content generically — which is the spec'd behavior (CLAUDE.md: "front ends just
render whatever is in Notion").
