"use client";

import { useEffect, useState } from "react";
import { Badge, Loading, PageHeader, Panel } from "@/components/ui";
import { api } from "@/lib/api";

export default function CommercialPage() {
  const [data, setData] = useState<{
    brands: { name: string; share: number; growth: number; hcp_reach: number; nrx: number }[];
    competitors: { name: string; move: string; impact: string }[];
    insights: string[];
  } | null>(null);

  useEffect(() => {
    api<NonNullable<typeof data>>("/api/v1/modules/commercial").then(setData).catch(console.error);
  }, []);

  if (!data) return <Loading />;

  return (
    <div>
      <PageHeader title="Commercial Analytics" subtitle="Brand performance, HCP reach, and competitive moves." />
      <div className="grid gap-4 md:grid-cols-3">
        {data.brands.map((b) => (
          <Panel key={b.name}>
            <div className="text-lg font-semibold">{b.name}</div>
            <div className="mt-3 font-[family-name:var(--font-display)] text-3xl">{b.share}%</div>
            <div className="mt-1 text-sm text-[var(--accent)]">Growth {b.growth}%</div>
            <div className="mt-3 text-sm text-[var(--ink-muted)]">
              HCP reach {b.hcp_reach.toLocaleString()} · NRx {b.nrx.toLocaleString()}
            </div>
          </Panel>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="font-semibold">Competitors</h2>
          <div className="mt-3 space-y-3">
            {data.competitors.map((c) => (
              <div key={c.name} className="border-b border-[var(--line)] pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{c.name}</span>
                  <Badge tone={c.impact === "high" ? "bad" : "warn"}>{c.impact}</Badge>
                </div>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">{c.move}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Insights</h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--ink-muted)]">
            {data.insights.map((i) => (
              <li key={i}>• {i}</li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
