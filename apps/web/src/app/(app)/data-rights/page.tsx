"use client";

import { useEffect, useState } from "react";
import { Badge, Loading, PageHeader, Panel } from "@/components/ui";
import { api } from "@/lib/api";

type Zone = { zone: string; label: string; count: number; policy: string };
type Dataset = {
  dataset_id: string;
  publisher: string;
  license: string;
  commercial_use_allowed: boolean;
  model_training_allowed: boolean;
  rag_allowed: boolean;
  zone: string;
};

export default function DataRightsPage() {
  const [data, setData] = useState<{ zones: Zone[]; registry: Dataset[] } | null>(null);

  useEffect(() => {
    api<NonNullable<typeof data>>("/api/v1/modules/data-rights").then(setData).catch(console.error);
  }, []);

  if (!data) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Data Rights Registry"
        subtitle="Green / Blue / Yellow / Red zones. If rights are unclear — do not train. Enterprise trust starts here."
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {data.zones.map((z) => (
          <Panel key={z.zone}>
            <Badge tone={z.zone === "GREEN" ? "good" : z.zone === "RED" ? "bad" : z.zone === "YELLOW" ? "warn" : "neutral"}>
              {z.zone}
            </Badge>
            <div className="mt-2 font-semibold">{z.label}</div>
            <div className="mt-1 font-[family-name:var(--font-display)] text-2xl">{z.count}</div>
            <p className="mt-2 text-xs text-[var(--ink-muted)]">{z.policy}</p>
          </Panel>
        ))}
      </div>
      <Panel>
        <h2 className="font-semibold">Registry</h2>
        <div className="mt-3 space-y-3">
          {data.registry.map((d) => (
            <div key={d.dataset_id} className="grid gap-2 border-b border-[var(--line)] pb-3 text-sm md:grid-cols-[1.2fr_1fr_auto]">
              <div>
                <div className="font-medium">{d.dataset_id}</div>
                <div className="text-[var(--ink-muted)]">{d.publisher} · {d.license}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone={d.rag_allowed ? "good" : "bad"}>RAG {d.rag_allowed ? "yes" : "no"}</Badge>
                <Badge tone={d.model_training_allowed ? "good" : "warn"}>
                  Train {d.model_training_allowed ? "yes" : "no"}
                </Badge>
                <Badge tone={d.commercial_use_allowed ? "good" : "warn"}>
                  Commercial {d.commercial_use_allowed ? "yes" : "no"}
                </Badge>
              </div>
              <Badge>{d.zone}</Badge>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
