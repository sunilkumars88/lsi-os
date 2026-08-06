"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge, Button, Input, Loading, PageHeader, Panel } from "@/components/ui";
import { api } from "@/lib/api";

export default function ClinicalPage() {
  const [q, setQ] = useState("oncology immunotherapy");
  const [data, setData] = useState<{
    trials: { nct_id: string; title: string; status: string; phase: string; sponsor?: string }[];
    ops: { sites_activated: number; screen_fail_rate: number; median_enrollment_days: number; protocol_amendments_ytd: number };
    error?: string;
  } | null>(null);

  async function load(query = q) {
    setData(await api<NonNullable<typeof data>>(`/api/v1/modules/clinical?q=${encodeURIComponent(query)}`));
  }

  useEffect(() => {
    load().catch(console.error);
    // initial fetch only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    await load(q);
  }

  if (!data) return <Loading />;

  return (
    <div>
      <PageHeader title="Clinical Intelligence" subtitle="Live ClinicalTrials.gov explorer plus operations KPIs." />
      <form onSubmit={onSearch} className="mb-4 flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} />
        <Button type="submit">Search trials</Button>
      </form>
      <div className="mb-4 grid gap-4 sm:grid-cols-4">
        <Panel><div className="text-sm text-[var(--ink-muted)]">Sites</div><div className="text-2xl font-[family-name:var(--font-display)]">{data.ops.sites_activated}</div></Panel>
        <Panel><div className="text-sm text-[var(--ink-muted)]">Screen fail</div><div className="text-2xl font-[family-name:var(--font-display)]">{(data.ops.screen_fail_rate * 100).toFixed(0)}%</div></Panel>
        <Panel><div className="text-sm text-[var(--ink-muted)]">Median enroll days</div><div className="text-2xl font-[family-name:var(--font-display)]">{data.ops.median_enrollment_days}</div></Panel>
        <Panel><div className="text-sm text-[var(--ink-muted)]">Amendments YTD</div><div className="text-2xl font-[family-name:var(--font-display)]">{data.ops.protocol_amendments_ytd}</div></Panel>
      </div>
      {data.error ? <p className="mb-3 text-sm text-[var(--danger)]">Live API note: {data.error}</p> : null}
      <Panel>
        <h2 className="font-semibold">Trials</h2>
        <div className="mt-3 space-y-3">
          {data.trials.map((t) => (
            <div key={t.nct_id || t.title} className="border-b border-[var(--line)] pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{t.title}</span>
                <Badge>{t.nct_id}</Badge>
                <Badge tone="neutral">{t.status}</Badge>
                <Badge>{t.phase}</Badge>
              </div>
              <div className="mt-1 text-sm text-[var(--ink-muted)]">{t.sponsor}</div>
            </div>
          ))}
          {!data.trials.length ? <p className="text-sm text-[var(--ink-muted)]">No trials returned.</p> : null}
        </div>
      </Panel>
    </div>
  );
}
