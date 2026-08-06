"use client";

import { useEffect, useState } from "react";
import { Badge, Loading, PageHeader, Panel } from "@/components/ui";
import { api } from "@/lib/api";

export default function RegulatoryPage() {
  const [data, setData] = useState<{
    guidances: { title: string; agency: string; updated: string; relevance: string }[];
    submissions: { name: string; type: string; status: string; due: string }[];
    readiness: { cmc: number; clinical: number; labeling: number; safety: number };
  } | null>(null);

  useEffect(() => {
    api<NonNullable<typeof data>>("/api/v1/modules/regulatory").then(setData).catch(console.error);
  }, []);

  if (!data) return <Loading />;

  return (
    <div>
      <PageHeader title="Regulatory Affairs" subtitle="Guidance radar, submission status, and readiness scores." />
      <div className="mb-4 grid gap-4 sm:grid-cols-4">
        {Object.entries(data.readiness).map(([k, v]) => (
          <Panel key={k}>
            <div className="text-sm capitalize text-[var(--ink-muted)]">{k}</div>
            <div className="font-[family-name:var(--font-display)] text-3xl">{v}%</div>
          </Panel>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="font-semibold">Guidances</h2>
          <div className="mt-3 space-y-3">
            {data.guidances.map((g) => (
              <div key={g.title} className="border-b border-[var(--line)] pb-3 text-sm">
                <div className="font-medium">{g.title}</div>
                <div className="mt-1 flex gap-2 text-[var(--ink-muted)]">
                  <Badge>{g.agency}</Badge>
                  <span>{g.updated}</span>
                  <Badge tone={g.relevance === "high" ? "warn" : "neutral"}>{g.relevance}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Submissions</h2>
          <div className="mt-3 space-y-3">
            {data.submissions.map((s) => (
              <div key={s.name} className="border-b border-[var(--line)] pb-3">
                <div className="font-medium">{s.name}</div>
                <div className="text-sm text-[var(--ink-muted)]">
                  {s.type} · {s.status} · due {s.due}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
