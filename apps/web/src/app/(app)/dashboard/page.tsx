"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Loading, PageHeader, Panel } from "@/components/ui";
import { api } from "@/lib/api";

type Dash = {
  kpis: { id: string; label: string; value: string; delta: string; trend: string }[];
  briefing: string;
  risks: { title: string; severity: string; owner: string }[];
  ai_actions: string[];
};

export default function DashboardPage() {
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
        title="Executive Intelligence"
        subtitle="Portfolio pulse, risk focus, and AI-ready next actions."
        action={
          <Link href="/copilot">
            <Button>Ask Copilot</Button>
          </Link>
        }
      />
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
          <h2 className="font-semibold">AI briefing</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">{data.briefing}</p>
          <ul className="mt-4 space-y-2">
            {data.ai_actions.map((a) => (
              <li key={a} className="text-sm">• {a}</li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Open risks</h2>
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
