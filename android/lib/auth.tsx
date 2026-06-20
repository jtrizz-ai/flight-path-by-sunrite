import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { request, getToken, setToken } from "./api";
import type { UserProfile } from "./types";
import { GOOGLE_WEB_CLIENT_ID } from "./config";

type ExchangeResponse = {
  token: string;
  expiresIn: number;
  user: UserProfile;
};
type MeResponse = { user: UserProfile };

type AuthState = {
  user: UserProfile | null;
  loading: boolean; // initial restore in progress
  signingIn: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore a previous session on app open (if a token is stored).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getToken();
      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const me = await request<MeResponse>("/api/me");
        if (!cancelled) setUser(me.user);
      } catch {
        await setToken(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async () => {
    setSigningIn(true);
    setError(null);
    try {
      if (!GOOGLE_WEB_CLIENT_ID) {
        throw new Error(
          "Google Client ID not set. Add it under expo.extra.googleWebClientId in app.json and rebuild."
        );
      }
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        offlineAccess: false,
      });
      await GoogleSignin.hasPlayServices();
      const resp = await GoogleSignin.signIn();
      if (resp.type !== "success" || !resp.data) {
        // User cancelled — stay quiet, no error banner.
        return;
      }
      let idToken = resp.data.idToken;
      if (!idToken) {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens.idToken;
      }
      if (!idToken) throw new Error("Google did not return an ID token.");

      const ex = await request<ExchangeResponse>("/api/auth/exchange", {
        method: "POST",
        body: JSON.stringify({ googleIdToken: idToken }),
      });
      await setToken(ex.token);
      setUser(ex.user);
    } catch (e) {
      const err = e as { code?: string; message?: string };
      // Swallow user-cancellation codes; surface everything else.
      if (err?.code === "SIGN_IN_CANCELLED" || err?.code === "-5") {
        return;
      }
      setError(err?.message || "Sign-in failed");
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await GoogleSignin.signOut();
    } catch {
      /* ignore */
    }
    try {
      await request("/api/auth/signout", { method: "POST" });
    } catch {
      /* ignore */
    }
    await setToken(null);
    setUser(null);
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, signingIn, error, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
