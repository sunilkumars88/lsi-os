"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Input, PageHeader, Panel, Textarea } from "@/components/ui";
import { api } from "@/lib/api";

type Workflow = { id: string; name: string; description: string; steps: { id: string; label: string; type: string }[] };
type Run = { id: string; workflow_id: string; status: string; steps_completed: number; created_at: string };

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [name, setName] = useState("HTA dossier refresh");
  const [description, setDescription] = useState("Ingest evidence → extract trials → analyze → approve → notify");
  const [lastRun, setLastRun] = useState<{ step_results: { step: { label: string }; status: string }[] } | null>(null);

  async function refresh() {
    const [w, r] = await Promise.all([
      api<Workflow[]>("/api/v1/workflows"),
      api<Run[]>("/api/v1/workflows/runs/recent"),
    ]);
    setWorkflows(w);
    setRuns(r);
  }

  useEffect(() => {
    refresh().catch(console.error);
  }, []);

  async function create() {
    await api("/api/v1/workflows", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    });
    await refresh();
  }

  async function run(id: string) {
    const res = await api<{ step_results: { step: { label: string }; status: string }[] }>(`/api/v1/workflows/${id}/run`, {
      method: "POST",
    });
    setLastRun(res);
    await refresh();
  }

  return (
    <div>
      <PageHeader title="Workflow Builder" subtitle="Composable steps: ingest → extract → analyze → approve → notify." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="font-semibold">Create workflow</h2>
          <div className="mt-3 space-y-3">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            <Button onClick={create}>Save workflow</Button>
          </div>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Recent runs</h2>
          <div className="mt-3 space-y-2">
            {runs.map((r) => (
              <div key={r.id} className="flex items-center justify-between border-b border-[var(--line)] py-2 text-sm">
                <span>{r.id.slice(0, 8)}…</span>
                <Badge tone="good">{r.status}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <div className="mt-4 space-y-3">
        {workflows.map((w) => (
          <Panel key={w.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">{w.name}</h3>
                <p className="text-sm text-[var(--ink-muted)]">{w.description}</p>
              </div>
              <Button onClick={() => run(w.id)}>Run</Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {w.steps.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="rounded-md bg-[var(--accent-soft)] px-3 py-1.5 text-sm text-[var(--accent-ink)]">
                    {s.label}
                  </span>
                  {i < w.steps.length - 1 ? <span className="text-[var(--ink-muted)]">→</span> : null}
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
      {lastRun ? (
        <Panel className="mt-4">
          <h2 className="font-semibold">Last run steps</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {lastRun.step_results.map((s, i) => (
              <li key={i}>
                {s.step.label}: <Badge tone="good">{s.status}</Badge>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
