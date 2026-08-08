"use client";

import { useEffect, useState } from "react";
import { Badge, Loading, PageHeader, Panel } from "@/components/ui";
import { api } from "@/lib/api";

export default function RouterPage() {
  const [data, setData] = useState<{
    active_provider: string;
    routes: { task: string; tier: string; provider: string; reason: string }[];
    policy: string[];
    note: string;
    action_required?: string | null;
    openai?: { configured: boolean; ok: boolean; error?: string };
  } | null>(null);

  useEffect(() => {
    api<NonNullable<typeof data>>("/api/v1/modules/router").then(setData).catch(console.error);
  }, []);

  if (!data) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Model Router"
        subtitle="LLM-agnostic gateway. Route by task complexity, cost, latency, privacy — models are replaceable; the OS is not."
      />
      <Panel className="mb-4">
        <div className="text-sm text-[var(--ink-muted)]">Active provider</div>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <div className="font-[family-name:var(--font-display)] text-3xl">{data.active_provider}</div>
          <Badge tone={data.openai?.ok ? "good" : "warn"}>
            {data.openai?.ok ? "OpenAI key valid" : data.openai?.configured ? "Key invalid" : "Key missing"}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">{data.note}</p>
        {data.action_required ? (
          <p className="mt-3 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-900">
            Action required: {data.action_required}
          </p>
        ) : null}
        {data.openai?.error ? (
          <p className="mt-2 text-sm text-[var(--danger)]">{data.openai.error}</p>
        ) : null}
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="font-semibold">Routes</h2>
          <div className="mt-3 space-y-3 text-sm">
            {data.routes.map((r) => (
              <div key={r.task} className="border-b border-[var(--line)] pb-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{r.task}</span>
                  <Badge>{r.provider}</Badge>
                </div>
                <div className="mt-1 text-[var(--ink-muted)]">
                  {r.tier} · {r.reason}
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Routing policy</h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--ink-muted)]">
            {data.policy.map((p) => (
              <li key={p}>• {p}</li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
