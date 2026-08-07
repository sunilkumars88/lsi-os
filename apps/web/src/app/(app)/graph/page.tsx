"use client";

import { useEffect, useState } from "react";
import { Badge, Loading, PageHeader, Panel } from "@/components/ui";
import { api } from "@/lib/api";

export default function GraphPage() {
  const [data, setData] = useState<{
    entities: { type: string; count: number }[];
    relationships: { from: string; rel: string; to: string }[];
    ontology: string[];
  } | null>(null);

  useEffect(() => {
    api<NonNullable<typeof data>>("/api/v1/modules/graph").then(setData).catch(console.error);
  }, []);

  if (!data) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Knowledge Graph"
        subtitle="Enterprise ontology: organizations, products, trials, HCPs, risks, evidence — relationships, not just paragraphs."
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {data.entities.map((e) => (
          <Panel key={e.type}>
            <div className="text-sm text-[var(--ink-muted)]">{e.type}</div>
            <div className="font-[family-name:var(--font-display)] text-3xl">{e.count}</div>
          </Panel>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="font-semibold">Recent relationships</h2>
          <div className="mt-3 space-y-2 text-sm">
            {data.relationships.map((r, i) => (
              <div key={i} className="border-b border-[var(--line)] py-2">
                <span className="font-medium">{r.from}</span>{" "}
                <Badge>{r.rel}</Badge>{" "}
                <span className="font-medium">{r.to}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Universal ontology (extendable by pack)</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.ontology.map((o) => (
              <Badge key={o} tone="neutral">{o}</Badge>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
