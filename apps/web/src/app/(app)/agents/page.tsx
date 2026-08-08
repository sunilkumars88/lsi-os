"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge, Button, Input, Loading, PageHeader, Panel, Textarea } from "@/components/ui";
import { api } from "@/lib/api";

type AgentType = { id: string; name: string; tools: string[]; requires_approval: boolean };
type Job = {
  id: string;
  name: string;
  agent_type: string;
  status: string;
  requires_approval: boolean;
  approved: boolean | null;
  result_preview?: string;
  result?: { summary?: string; tool_traces?: unknown[] };
  plan?: { step: number; action: string; detail: string }[];
};

export default function AgentsPage() {
  const [types, setTypes] = useState<AgentType[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selected, setSelected] = useState("researcher");
  const [name, setName] = useState("Oncology evidence sweep");
  const [query, setQuery] = useState("pembrolizumab NSCLC Phase 3");
  const [active, setActive] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    const [t, j] = await Promise.all([
      api<AgentType[]>("/api/v1/agents/types"),
      api<Job[]>("/api/v1/agents/jobs"),
    ]);
    setTypes(t);
    setJobs(j);
  }

  useEffect(() => {
    refresh()
      .catch((e) => setError(e.message))
      .finally(() => setBootstrapping(false));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const job = await api<Job>("/api/v1/agents/jobs", {
        method: "POST",
        body: JSON.stringify({ name, agent_type: selected, query }),
      });
      setActive(job);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Agent run failed");
    } finally {
      setLoading(false);
    }
  }

  async function approve(id: string) {
    setError("");
    try {
      const job = await api<Job>(`/api/v1/agents/jobs/${id}/approve`, { method: "POST" });
      setActive(job);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed");
    }
  }

  if (bootstrapping) return <Loading />;

  return (
    <div>
      <PageHeader title="Agent Studio" subtitle="Plan → tool calls → synthesize. Safety/Regulatory agents require approval." />
      {error ? <p className="mb-3 text-sm text-[var(--danger)]">{error}</p> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm">Agent</label>
              <select
                className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm">Job name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Objective</label>
              <Textarea rows={4} value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading}>{loading ? "Running…" : "Run agent"}</Button>
          </form>
          <div className="mt-6 space-y-2">
            {types.map((t) => (
              <div key={t.id} className="text-sm text-[var(--ink-muted)]">
                <span className="font-medium text-[var(--ink)]">{t.name}</span> · {t.tools.join(", ")}
                {t.requires_approval ? " · approval required" : ""}
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Latest run</h2>
          {!active ? <p className="mt-3 text-sm text-[var(--ink-muted)]">Run an agent to inspect plan and traces.</p> : null}
          {active ? (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge>{active.agent_type}</Badge>
                <Badge tone={active.status === "completed" ? "good" : active.status === "awaiting_approval" ? "warn" : "neutral"}>
                  {active.status}
                </Badge>
              </div>
              <ol className="space-y-2 text-sm">
                {(active.plan || []).map((p) => (
                  <li key={p.step}>
                    {p.step}. <strong>{p.action}</strong> — {p.detail}
                  </li>
                ))}
              </ol>
              <div className="whitespace-pre-wrap rounded-lg bg-[var(--surface-2)] p-3 text-sm">
                {active.result?.summary || active.result_preview}
              </div>
              {active.status === "awaiting_approval" ? (
                <Button onClick={() => approve(active.id)}>Approve & complete</Button>
              ) : null}
            </div>
          ) : null}
        </Panel>
      </div>
      <Panel className="mt-4">
        <h2 className="font-semibold">Job history</h2>
        <div className="mt-3 space-y-2">
          {jobs.map((j) => (
            <button
              key={j.id}
              className="flex w-full items-center justify-between rounded-md border border-[var(--line)] px-3 py-2 text-left text-sm hover:bg-[var(--surface-2)]"
              onClick={() =>
                api<Job>(`/api/v1/agents/jobs/${j.id}`)
                  .then(setActive)
                  .catch((e) => setError(e.message))
              }
            >
              <span>{j.name}</span>
              <Badge>{j.status}</Badge>
            </button>
          ))}
          {!jobs.length ? <p className="text-sm text-[var(--ink-muted)]">No jobs yet — run an agent above.</p> : null}
        </div>
      </Panel>
    </div>
  );
}
