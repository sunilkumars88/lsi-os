"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Loading, PageHeader, Panel } from "@/components/ui";
import { api } from "@/lib/api";
import { usePack } from "@/lib/pack-context";

type Dash = {
  kpis: { id: string; label: string; value: string; delta: string; trend: string }[];
  briefing: string;
  risks: { title: string; severity: string; owner: string }[];
  ai_actions: string[];
  openai?: boolean;
  sources_online?: number;
};

export default function DashboardPage() {
  const { pack } = usePack();
  const [data, setData] = useState<Dash | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Dash>("/api/v1/modules/dashboard")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-[var(--danger)]">{error}</p>;
  if (!data) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Command Center"
        subtitle={`Enterprise Intelligence OS · ${pack.name}. Outcomes, not chat transcripts.`}
        action={
          <div className="flex gap-2">
            <Link href="/copilot"><Button variant="secondary">Ask Copilot</Button></Link>
            <Link href="/workflows"><Button>Run workflow</Button></Link>
          </div>
        }
      />

      <Panel className="mb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm text-[var(--ink-muted)]">Why this beats a general LLM</div>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed">
              EIOS connects enterprise systems, retrieves approved knowledge with citations, runs multi-step agents,
              enforces human approvals, and writes audit trails—work ChatGPT cannot execute inside your tenant.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="good">Memory</Badge>
            <Badge tone="good">Connectors</Badge>
            <Badge tone="good">Workflows</Badge>
            <Badge tone="good">Approvals</Badge>
            <Badge>{data.sources_online || 11} sources</Badge>
            <Badge tone={data.openai ? "good" : "warn"}>{data.openai ? "LLM router ready" : "Demo brain"}</Badge>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.kpis.map((k) => (
          <Panel key={k.id}>
            <div className="text-sm text-[var(--ink-muted)]">{k.label}</div>
            <div className="mt-2 font-[family-name:var(--font-display)] text-3xl">{k.value}</div>
            <div className="mt-1 text-sm text-[var(--accent)]">{k.delta}</div>
          </Panel>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="font-semibold">Intelligence briefing</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">{data.briefing}</p>
          <ul className="mt-4 space-y-2">
            {data.ai_actions.map((a) => (
              <li key={a} className="text-sm">• {a}</li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Open risks · {pack.short}</h2>
          <div className="mt-3 space-y-3">
            {data.risks.map((r) => (
              <div key={r.title} className="flex items-start justify-between gap-3 border-b border-[var(--line)] pb-3">
                <div>
                  <div className="font-medium">{r.title}</div>
                  <div className="text-sm text-[var(--ink-muted)]">{r.owner}</div>
                </div>
                <Badge tone={r.severity === "high" ? "bad" : r.severity === "medium" ? "warn" : "neutral"}>
                  {r.severity}
                </Badge>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
