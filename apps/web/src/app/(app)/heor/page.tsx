"use client";

import { useEffect, useState } from "react";
import { Badge, Loading, PageHeader, Panel } from "@/components/ui";
import { api } from "@/lib/api";

export default function HeorPage() {
  const [data, setData] = useState<{
    evidence: { study: string; design: string; endpoint: string; result: string }[];
    hta: { market: string; status: string; risk: string }[];
    recommendations: string[];
  } | null>(null);

  useEffect(() => {
    api<NonNullable<typeof data>>("/api/v1/modules/heor").then(setData).catch(console.error);
  }, []);

  if (!data) return <Loading />;

  return (
    <div>
      <PageHeader title="HEOR / RWE" subtitle="Outcomes evidence, HTA readiness, and access recommendations." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="font-semibold">Evidence package</h2>
          <div className="mt-3 space-y-3">
            {data.evidence.map((e) => (
              <div key={e.study} className="border-b border-[var(--line)] pb-3 text-sm">
                <div className="font-medium">{e.study}</div>
                <div className="text-[var(--ink-muted)]">{e.design} · {e.endpoint}</div>
                <div className="mt-1">{e.result}</div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <h2 className="font-semibold">HTA tracker</h2>
          <div className="mt-3 space-y-3">
            {data.hta.map((h) => (
              <div key={h.market} className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <div>
                  <div className="font-medium">{h.market}</div>
                  <div className="text-sm text-[var(--ink-muted)]">{h.status}</div>
                </div>
                <Badge tone={h.risk === "high" ? "bad" : h.risk === "medium" ? "warn" : "good"}>{h.risk}</Badge>
              </div>
            ))}
          </div>
          <ul className="mt-4 space-y-2 text-sm text-[var(--ink-muted)]">
            {data.recommendations.map((r) => (
              <li key={r}>• {r}</li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
