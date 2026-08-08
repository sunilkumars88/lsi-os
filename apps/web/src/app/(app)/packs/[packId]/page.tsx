"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Badge, Button, Input, Loading, PageHeader, Panel, Textarea } from "@/components/ui";
import { api } from "@/lib/api";
import { usePack } from "@/lib/pack-context";

type PackData = {
  id: string;
  name: string;
  kpis: { label: string; value: string; delta: string }[];
  queues: { id: string; title: string; owner: string; priority: string; status: string }[];
  agents: { id: string; name: string; last_run: string; outcome: string }[];
  workflows: { id: string; name: string; status: string }[];
  insights: string[];
  actions: string[];
};

type RunResult = {
  ok: boolean;
  message: string;
  details?: string[];
};

export default function PackWorkspacePage() {
  const params = useParams<{ packId: string }>();
  const packId = params.packId;
  const { setPackId, packs } = usePack();
  const [data, setData] = useState<PackData | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<RunResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [queue, setQueue] = useState<PackData["queues"]>([]);

  const meta = useMemo(() => packs.find((p) => p.id === packId), [packs, packId]);

  useEffect(() => {
    if (!packId) return;
    if (packId === "life-sciences") {
      window.location.href = "/dashboard";
      return;
    }
    setPackId(packId);
    setError("");
    setResult(null);
    setData(null);
    api<PackData & { redirect?: string }>(`/api/v1/modules/packs/${packId}`)
      .then((d) => {
        if (d.redirect) {
          window.location.href = d.redirect;
          return;
        }
        setData(d);
        setQueue(d.queues);
        setQuery(d.actions[0] || "");
      })
      .catch((e) => setError(e.message));
  }, [packId, setPackId]);

  async function runAgent(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await api<RunResult>(`/api/v1/modules/packs/${packId}/run`, {
        method: "POST",
        body: JSON.stringify({ action: "agent", query, notes }),
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Run failed");
    } finally {
      setBusy(false);
    }
  }

  async function runWorkflow(workflowId: string, name: string) {
    setBusy(true);
    setError("");
    try {
      const res = await api<RunResult>(`/api/v1/modules/packs/${packId}/run`, {
        method: "POST",
        body: JSON.stringify({ action: "workflow", workflow_id: workflowId, query: name }),
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Workflow failed");
    } finally {
      setBusy(false);
    }
  }

  async function completeItem(id: string) {
    setBusy(true);
    try {
      const res = await api<RunResult & { queues?: PackData["queues"] }>(`/api/v1/modules/packs/${packId}/run`, {
        method: "POST",
        body: JSON.stringify({ action: "complete_queue", queue_id: id }),
      });
      if (res.queues) setQueue(res.queues);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) {
    return (
      <div>
        <PageHeader title="Industry pack" subtitle={meta?.name || packId} />
        <Panel>
          <p className="text-sm text-[var(--danger)]">{error}</p>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Life Sciences pack modules remain under Commercial / Clinical / Safety, etc.
          </p>
        </Panel>
      </div>
    );
  }

  if (!data) return <Loading />;

  return (
    <div>
      <PageHeader
        title={data.name}
        subtitle="Live pack console — KPIs, work queues, agents, and workflows with real API execution."
        action={<Badge tone="good">Pack online</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((k) => (
          <Panel key={k.label}>
            <div className="text-sm text-[var(--ink-muted)]">{k.label}</div>
            <div className="mt-2 font-[family-name:var(--font-display)] text-3xl">{k.value}</div>
            <div className="mt-1 text-sm text-[var(--accent)]">{k.delta}</div>
          </Panel>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="font-semibold">Work queue</h2>
          <div className="mt-3 space-y-3">
            {queue.map((q) => (
              <div key={q.id} className="border-b border-[var(--line)] pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{q.title}</div>
                    <div className="text-sm text-[var(--ink-muted)]">{q.owner}</div>
                  </div>
                  <Badge tone={q.priority === "high" ? "bad" : "warn"}>{q.priority}</Badge>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <Badge tone={q.status === "done" ? "good" : "neutral"}>{q.status}</Badge>
                  {q.status !== "done" ? (
                    <Button variant="secondary" disabled={busy} onClick={() => completeItem(q.id)}>
                      Mark done
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <h2 className="font-semibold">Run pack agent</h2>
          <form onSubmit={runAgent} className="mt-3 space-y-3">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Objective" required />
            <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Context / constraints" />
            <Button type="submit" disabled={busy}>{busy ? "Running…" : "Execute agent"}</Button>
          </form>
          <div className="mt-4 space-y-2 text-sm">
            {data.agents.map((a) => (
              <div key={a.id} className="flex justify-between gap-3 border-b border-[var(--line)] py-2">
                <span>{a.name}</span>
                <span className="text-[var(--ink-muted)]">{a.outcome}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="font-semibold">Workflows</h2>
          <div className="mt-3 space-y-2">
            {data.workflows.map((w) => (
              <div key={w.id} className="flex items-center justify-between gap-3 border-b border-[var(--line)] py-2">
                <div>
                  <div className="font-medium">{w.name}</div>
                  <Badge>{w.status}</Badge>
                </div>
                <Button variant="secondary" disabled={busy} onClick={() => runWorkflow(w.id, w.name)}>
                  Run
                </Button>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Insights & recommended actions</h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--ink-muted)]">
            {data.insights.map((i) => (
              <li key={i}>• {i}</li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {data.actions.map((a) => (
              <button
                key={a}
                className="rounded-md border border-[var(--line)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)]"
                onClick={() => setQuery(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </Panel>
      </div>

      {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
      {result ? (
        <Panel className="mt-4">
          <div className="flex items-center gap-2">
            <Badge tone={result.ok ? "good" : "bad"}>{result.ok ? "Executed" : "Failed"}</Badge>
            <h2 className="font-semibold">Run result</h2>
          </div>
          <p className="mt-2 text-sm">{result.message}</p>
          {result.details?.length ? (
            <ul className="mt-3 space-y-1 text-sm text-[var(--ink-muted)]">
              {result.details.map((d) => (
                <li key={d}>• {d}</li>
              ))}
            </ul>
          ) : null}
        </Panel>
      ) : null}
    </div>
  );
}
