import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

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
