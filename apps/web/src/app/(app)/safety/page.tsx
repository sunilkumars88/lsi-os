"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge, Button, Input, Loading, PageHeader, Panel } from "@/components/ui";
import { api } from "@/lib/api";

export default function SafetyPage() {
  const [drug, setDrug] = useState("aspirin");
  const [data, setData] = useState<{
    drug: string;
    total_reports?: number;
    events: { safetyreportid: string; serious: string; reactions: string[]; receive_date: string }[];
    recalls?: { recall_number: string; classification: string; reason: string; product_description: string }[];
    rxnorm?: { name: string; rxcui: string; tty: string }[];
    signals: { term: string; score: number; trend: string }[];
    sources?: string[];
    error?: string;
    note?: string;
  } | null>(null);

  async function load(d = drug) {
    setData(await api<NonNullable<typeof data>>(`/api/v1/modules/safety?drug=${encodeURIComponent(d)}`));
  }

  useEffect(() => {
    load().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    await load(drug);
  }

  if (!data) return <Loading />;

  return (
    <div>
      <PageHeader title="Pharmacovigilance" subtitle="OpenFDA adverse events plus internal signal scores." />
      <form onSubmit={onSearch} className="mb-4 flex gap-2">
        <Input value={drug} onChange={(e) => setDrug(e.target.value)} placeholder="Drug name" />
        <Button type="submit">Query FAERS</Button>
      </form>
      {data.error ? <p className="mb-3 text-sm text-[var(--danger)]">{data.error}</p> : null}
      {data.note ? <p className="mb-3 text-sm text-[var(--ink-muted)]">{data.note}</p> : null}
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        {data.signals.map((s) => (
          <Panel key={s.term}>
            <div className="font-medium">{s.term}</div>
            <div className="mt-2 font-[family-name:var(--font-display)] text-3xl">{s.score}</div>
            <Badge tone={s.trend === "up" ? "bad" : "neutral"}>{s.trend}</Badge>
          </Panel>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="font-semibold">
            OpenFDA FAERS · {data.drug}
            {data.total_reports ? ` · ~${data.total_reports.toLocaleString()}` : ""}
          </h2>
          <div className="mt-3 space-y-3">
            {data.events.map((e) => (
              <div key={e.safetyreportid} className="border-b border-[var(--line)] pb-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge>#{e.safetyreportid}</Badge>
                  <Badge tone={String(e.serious) === "1" ? "bad" : "neutral"}>serious: {e.serious}</Badge>
                  <span className="text-[var(--ink-muted)]">{e.receive_date}</span>
                </div>
                <div className="mt-1">{(e.reactions || []).join(", ")}</div>
              </div>
            ))}
            {!data.events.length ? <p className="text-sm text-[var(--ink-muted)]">No events returned.</p> : null}
          </div>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Recalls · RxNorm</h2>
          <div className="mt-3 space-y-3 text-sm">
            {(data.recalls || []).map((r) => (
              <div key={r.recall_number} className="border-b border-[var(--line)] pb-3">
                <div className="flex gap-2"><Badge tone="warn">{r.classification}</Badge><span>{r.recall_number}</span></div>
                <p className="mt-1 text-[var(--ink-muted)]">{r.reason || r.product_description}</p>
              </div>
            ))}
            {(data.rxnorm || []).slice(0, 6).map((r) => (
              <div key={r.rxcui} className="flex justify-between border-b border-[var(--line)] py-2">
                <span>{r.name}</span>
                <Badge>{r.rxcui}</Badge>
              </div>
            ))}
          </div>
          {data.sources?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">{data.sources.map((s) => <Badge key={s} tone="neutral">{s}</Badge>)}</div>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
