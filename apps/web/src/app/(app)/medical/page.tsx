"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge, Button, Input, Loading, PageHeader, Panel } from "@/components/ui";
import { api } from "@/lib/api";

export default function MedicalPage() {
  const [q, setQ] = useState("immunotherapy checkpoint");
  const [data, setData] = useState<{
    kols: { name: string; specialty: string; influence: number; recent_topic: string }[];
    publications: { pmid: string; title: string; journal: string; pubdate: string }[];
    msls_focus: string[];
  } | null>(null);

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load(query = q) {
    setBusy(true);
    setError("");
    try {
      setData(await api<NonNullable<typeof data>>(`/api/v1/modules/medical?q=${encodeURIComponent(query)}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    await load(q);
  }

  if (!data && !error) return <Loading />;
  if (!data) {
    return (
      <div>
        <PageHeader title="Medical Affairs" subtitle="KOL intelligence and live PubMed scientific signals." />
        <Panel><p className="text-sm text-[var(--danger)]">{error}</p></Panel>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Medical Affairs" subtitle="KOL intelligence and live PubMed scientific signals." />
      {error ? <p className="mb-3 text-sm text-[var(--danger)]">{error}</p> : null}
      <form onSubmit={onSearch} className="mb-4 flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} />
        <Button type="submit" disabled={busy}>{busy ? "Searching…" : "Search literature"}</Button>
      </form>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="font-semibold">KOL map</h2>
          <div className="mt-3 space-y-3">
            {data.kols.map((k) => (
              <div key={k.name} className="border-b border-[var(--line)] pb-3">
                <div className="font-medium">{k.name}</div>
                <div className="text-sm text-[var(--ink-muted)]">
                  {k.specialty} · influence {k.influence} · {k.recent_topic}
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <h2 className="font-semibold">PubMed</h2>
          <div className="mt-3 space-y-3">
            {data.publications.map((p) => (
              <div key={p.pmid} className="border-b border-[var(--line)] pb-3 text-sm">
                <div className="font-medium">{p.title}</div>
                <div className="mt-1 text-[var(--ink-muted)]">
                  {p.journal} · {p.pubdate} · PMID {p.pmid}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {data.msls_focus.map((m) => (
              <Badge key={m}>{m}</Badge>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
