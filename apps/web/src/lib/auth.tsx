"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "./api";

export type User = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  org_id: string;
  org_name?: string | null;
  workspace_id?: string | null;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { email: string; password: string; full_name: string; org_name: string }) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

function normalizeUser(raw: Record<string, unknown>): User {
  return {
    id: String(raw.id || ""),
    email: String(raw.email || ""),
    full_name: String(raw.full_name || raw.fullName || ""),
    role: String(raw.role || "viewer"),
    org_id: String(raw.org_id || raw.orgId || ""),
    org_name: (raw.org_name || raw.orgName || null) as string | null,
    workspace_id: (raw.workspace_id || raw.workspaceId || null) as string | null,
  };
}

function extractToken(res: Record<string, unknown>): string {
  const token = res.access_token || res.accessToken;
  if (!token || typeof token !== "string") throw new Error("No access token in login response");
  return token;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api<Record<string, unknown>>("/api/v1/auth/me");
      setUser(normalizeUser(me));
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const res = await api<Record<string, unknown>>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(extractToken(res));
    await refresh();
  };

  const register = async (payload: { email: string; password: string; full_name: string; org_name: string }) => {
    const res = await api<Record<string, unknown>>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
        fullName: payload.full_name,
        orgName: payload.org_name,
      }),
    });
    setToken(extractToken(res));
    await refresh();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
