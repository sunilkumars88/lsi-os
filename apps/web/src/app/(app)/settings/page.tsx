"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { API_URL, api } from "@/lib/api";
import { Badge, Loading, PageHeader, Panel } from "@/components/ui";

export default function SettingsPage() {
  const { user } = useAuth();
  const [health, setHealth] = useState<{
    openai?: boolean;
    openai_configured?: boolean;
    openai_status?: { ok: boolean; configured: boolean; error?: string };
    action_required?: string | null;
    knowledge?: { documents: number };
    sources?: number;
  } | null>(null);

  useEffect(() => {
    api<NonNullable<typeof health>>("/api/health").then(setHealth).catch(console.error);
  }, []);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Organization profile, API status, and what you need to configure." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="font-semibold">Organization</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--ink-muted)]">Name</dt>
              <dd>{user?.org_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--ink-muted)]">User</dt>
              <dd>{user?.full_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--ink-muted)]">Email</dt>
              <dd>{user?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--ink-muted)]">Role</dt>
              <dd>{user?.role}</dd>
            </div>
          </dl>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Runtime status</h2>
          {!health ? (
            <Loading />
          ) : (
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span>API base</span>
                <code>{API_URL || "same-origin /api"}</code>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>OpenAI</span>
                <Badge tone={health.openai_status?.ok ? "good" : "warn"}>
                  {health.openai_status?.ok ? "Working" : health.openai_configured ? "Key invalid" : "Not set"}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Knowledge docs</span>
                <span>{health.knowledge?.documents ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Live sources</span>
                <span>{health.sources ?? "—"}</span>
              </div>
              {health.openai_status?.error ? (
                <p className="rounded-md bg-rose-500/10 px-3 py-2 text-[var(--danger)]">{health.openai_status.error}</p>
              ) : null}
              {health.action_required ? (
                <p className="rounded-md bg-amber-500/10 px-3 py-2 text-amber-900">{health.action_required}</p>
              ) : null}
              <p className="text-[var(--ink-muted)]">
                ClinicalTrials.gov, OpenFDA, PubMed, Europe PMC, RxNorm, and DailyMed work without OpenAI. Copilot/agents use the demo brain until a valid key is set.
              </p>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
