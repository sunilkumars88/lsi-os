"use client";

import Link from "next/link";
import { Button, Panel } from "@/components/ui";
import { INDUSTRY_PACKS, packLoginHref } from "@/lib/packs";

export default function PublicPacksPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <Link href="/" className="text-sm text-[var(--accent)]">
        ← EIOS
      </Link>
      <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl">Industry packs</h1>
      <p className="mt-3 max-w-2xl text-[var(--ink-muted)]">
        One Enterprise Intelligence OS. Open any pack to sign in and run its live KPIs, agents, and workflows.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {INDUSTRY_PACKS.map((p) => (
          <Panel key={p.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="font-semibold">{p.name}</div>
              <span className="text-xs uppercase tracking-wide text-[var(--ink-muted)]">{p.status}</span>
            </div>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">{p.description}</p>
            <div className="mt-4">
              <Link href={packLoginHref(p.id)}>
                <Button>{p.id === "life-sciences" ? "Open Command Center" : "Open pack console"}</Button>
              </Link>
            </div>
          </Panel>
        ))}
      </div>
      <Link href="/login" className="mt-8 inline-block">
        <Button variant="secondary">Sign in without pack</Button>
      </Link>
    </div>
  );
}
