"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { Button, Input, Panel } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { INDUSTRY_PACKS, packWorkspaceHref } from "@/lib/packs";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("admin@lsi.os");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const packId = params.get("pack") || "life-sciences";
  const next = params.get("next") || packWorkspaceHref(packId);
  const pack = useMemo(() => INDUSTRY_PACKS.find((p) => p.id === packId), [packId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (typeof window !== "undefined" && packId) {
        localStorage.setItem("eios_pack", packId);
      }
      await login(email, password);
      router.push(next.startsWith("/") ? next : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel className="w-full max-w-md">
      <div className="font-[family-name:var(--font-display)] text-3xl tracking-tight">EIOS</div>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">Sign in to Enterprise Intelligence OS.</p>
      {pack ? (
        <p className="mt-2 text-sm text-[var(--accent)]">
          Opening: <strong>{pack.name}</strong>
        </p>
      ) : null}
      <div className="mt-4 rounded-md bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--accent-ink)]">
        Demo admin: <strong>admin@lsi.os</strong> / <strong>demo1234</strong>
      </div>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm">Email</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
        <div>
          <label className="mb-1 block text-sm">Password</label>
          <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </div>
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Signing in…" : "Sign in & open workspace"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-[var(--ink-muted)]">
        No account? <Link href="/register" className="text-[var(--accent)]">Create one</Link>
      </p>
    </Panel>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Suspense fallback={<Panel className="w-full max-w-md">Loading…</Panel>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
