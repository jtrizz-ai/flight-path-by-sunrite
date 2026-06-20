"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { AppUser } from "@/lib/types";

type AdminUsersContextValue = {
  users: AppUser[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  setUsers: (updater: (prev: AppUser[]) => AppUser[]) => void;
};

const AdminUsersContext = createContext<AdminUsersContextValue | null>(null);

export function useAdminUsers(): AdminUsersContextValue {
  const ctx = useContext(AdminUsersContext);
  if (!ctx) {
    throw new Error("useAdminUsers must be used inside <AdminUsersProvider>");
  }
  return ctx;
}

export function AdminUsersProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsersState] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to load users");
      }
      const d = await res.json();
      setUsersState(d.users || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/users", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setUsersState(d.users || []);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setUsers = useCallback(
    (updater: (prev: AppUser[]) => AppUser[]) => {
      setUsersState((prev) => updater(prev));
    },
    []
  );

  return (
    <AdminUsersContext.Provider value={{ users, loading, error, reload, setUsers }}>
      {children}
    </AdminUsersContext.Provider>
  );
}
