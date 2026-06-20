import Constants from "expo-constants";

/**
 * Google OAuth "Web application" Client ID — the SAME one the web/iOS apps use
 * (web/.env AUTH_GOOGLE_ID). The native Google Sign-In SDK mints an ID token
 * with this audience, which the backend verifies.
 *
 * Set it in app.json under `expo.extra.googleWebClientId`, then rebuild.
 * (The client ID is not a secret — it's safe to ship in the app bundle.)
 */
const extra = (Constants.expoConfig?.extra ?? {}) as { googleWebClientId?: string };

export const GOOGLE_WEB_CLIENT_ID = extra.googleWebClientId ?? "";
