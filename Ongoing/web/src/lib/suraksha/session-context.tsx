"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Role } from "./domain";

export type SessionUser = { id: string; name: string; role: Role; username: string };

type SessionContextValue = {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => Promise<SessionUser | null>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue>({
  user: null,
  loading: true,
  refresh: async () => null,
  logout: async () => undefined,
});

async function fetchSession(): Promise<SessionUser | null> {
  const res = await fetch("/api/suraksha/session", { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user || null;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = await fetchSession();
    setUser(next);
    setLoading(false);
    return next;
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/suraksha/session", { method: "DELETE" });
    setUser(null);
  }, []);

  useEffect(() => {
    refresh().catch(() => setLoading(false));
  }, [refresh]);

  return <SessionContext.Provider value={{ user, loading, refresh, logout }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}

export function isAuthority(role: Role | undefined): boolean {
  return role === "supervisor" || role === "reviewer" || role === "admin" || role === "patrol" || role === "municipal";
}
