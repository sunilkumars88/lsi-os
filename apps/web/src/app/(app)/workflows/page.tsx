"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Input, PageHeader, Panel, Textarea } from "@/components/ui";
import { api, isNestBackend } from "@/lib/api";
import {
  nestRunToView,
  nestWorkflowToView,
  type NestWorkflow,
  type NestWorkflowRun,
} from "@/lib/nest-adapters";

const NODE_TYPES = [
  "sequential",
  "parallel",
  "condition",
  "approval",
  "agent",
  "connector",
] as const;

type CanvasNode = {
  id: string;
  type: string;
  label?: string;
  x: number;
  y: number;
  config?: Record<string, unknown>;
};

type CanvasEdge = { from: string; to: string; condition?: string };

type WorkflowView = {
  id: string;
  name: string;
  description: string;
  steps: { id: string; label: string; type: string }[];
  nodes: CanvasNode[];
  edges: CanvasEdge[];
};

type RunView = {
  id: string;
  workflow_id: string;
  status: string;
  steps_completed: number;
  created_at: string;
  step_results?: { step: { label: string }; status: string }[];
};

function layoutNodes(
  nodes: { id: string; type: string; label?: string; config?: Record<string, unknown>; x?: number; y?: number }[],
): CanvasNode[] {
  return nodes.map((n, i) => ({
    id: n.id,
    type: n.type,
    label: n.label,
    config: n.config,
    x: typeof n.x === "number" ? n.x : 40 + (i % 4) * 180,
    y: typeof n.y === "number" ? n.y : 40 + Math.floor(i / 4) * 100,
  }));
}

export default function WorkflowsPage() {
  const nest = isNestBackend();
  const [workflows, setWorkflows] = useState<WorkflowView[]>([]);
  const [runs, setRuns] = useState<RunView[]>([]);
  const [name, setName] = useState("HTA dossier refresh");
  const [description, setDescription] = useState(
    "Ingest evidence → extract trials → analyze → approve → notify",
  );
  const [nodes, setNodes] = useState<CanvasNode[]>([
    { id: "n1", type: "sequential", label: "Ingest", x: 40, y: 60 },
    { id: "n2", type: "agent", label: "Analyze", x: 220, y: 60 },
    { id: "n3", type: "approval", label: "Approve", x: 400, y: 60 },
    { id: "n4", type: "connector", label: "Notify", x: 580, y: 60 },
  ]);
  const [edges, setEdges] = useState<CanvasEdge[]>([
    { from: "n1", to: "n2" },
    { from: "n2", to: "n3" },
    { from: "n3", to: "n4" },
  ]);
  const [lastRun, setLastRun] = useState<RunView | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [linkFrom, setLinkFrom] = useState<string | null>(null);

  async function refresh() {
    if (nest) {
      const [w, r] = await Promise.all([
        api<NestWorkflow[]>("/api/v1/workflows"),
        api<NestWorkflowRun[]>("/api/v1/workflows/runs/list").catch(() =>
          api<NestWorkflowRun[]>("/api/v1/workflows/runs/recent"),
        ),
      ]);
      setWorkflows(
        w.map((wf) => {
          const view = nestWorkflowToView(wf);
          return {
            ...view,
            nodes: layoutNodes(view.nodes),
            edges: view.edges,
          };
        }),
      );
      setRuns(r.map(nestRunToView));
      return;
    }

    const [w, r] = await Promise.all([
      api<NestWorkflow[]>("/api/v1/workflows"),
      api<NestWorkflowRun[]>("/api/v1/workflows/runs/recent"),
    ]);
    setWorkflows(
      w.map((wf) => {
        const view = nestWorkflowToView(wf);
        const canvasNodes =
          view.nodes.length > 0
            ? layoutNodes(view.nodes)
            : layoutNodes(view.steps.map((s) => ({ id: s.id, type: s.type, label: s.label })));
        const canvasEdges =
          view.edges.length > 0
            ? view.edges
            : canvasNodes.slice(0, -1).map((n, i) => ({
                from: n.id,
                to: canvasNodes[i + 1]!.id,
              }));
        return { ...view, nodes: canvasNodes, edges: canvasEdges };
      }),
    );
    setRuns(r.map(nestRunToView));
  }

  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, []);

  function addNode(type: (typeof NODE_TYPES)[number]) {
    const id = `n${Date.now().toString(36)}`;
    const idx = nodes.length;
    const node: CanvasNode = {
      id,
      type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      x: 40 + (idx % 4) * 180,
      y: 40 + Math.floor(idx / 4) * 100,
    };
    setNodes((prev) => [...prev, node]);
    if (nodes.length > 0) {
      setEdges((prev) => [...prev, { from: nodes[nodes.length - 1]!.id, to: id }]);
    }
    setSelected(id);
  }

  function onNodeClick(id: string) {
    if (linkFrom && linkFrom !== id) {
      setEdges((prev) =>
        prev.some((e) => e.from === linkFrom && e.to === id)
          ? prev
          : [...prev, { from: linkFrom, to: id }],
      );
      setLinkFrom(null);
      return;
    }
    setSelected(id);
  }

  function moveSelected(dx: number, dy: number) {
    if (!selected) return;
    setNodes((prev) =>
      prev.map((n) => (n.id === selected ? { ...n, x: n.x + dx, y: n.y + dy } : n)),
    );
  }

  async function create() {
    setError("");
    setBusy(true);
    try {
      if (nest) {
        await api("/api/v1/workflows", {
          method: "POST",
          body: JSON.stringify({
            name,
            description,
            nodes: nodes.map(({ id, type, label, config }) => ({ id, type, label, config })),
            edges,
          }),
        });
      } else {
        await api("/api/v1/workflows", {
          method: "POST",
          body: JSON.stringify({
            name,
            description,
            steps: nodes.map((n) => ({
              id: n.id,
              label: n.label || n.type,
              type: n.type,
            })),
            nodes,
            edges,
          }),
        });
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function run(id: string) {
    setError("");
    setBusy(true);
    try {
      const res = await api<NestWorkflowRun>(`/api/v1/workflows/${id}/run`, {
        method: "POST",
        body: JSON.stringify({ input: {} }),
      });
      setLastRun(nestRunToView(res));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Run failed");
    } finally {
      setBusy(false);
    }
  }

  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  return (
    <div>
      <PageHeader
        title="Workflow Builder"
        subtitle="Canvas v1 — place sequential, parallel, condition, approval, agent, and connector nodes; save as nodes/edges."
      />
      {error ? <p className="mb-3 text-sm text-[var(--danger)]">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Canvas</h2>
            <div className="flex flex-wrap gap-1">
              {NODE_TYPES.map((t) => (
                <Button key={t} variant="secondary" className="!px-2 !py-1 text-xs" onClick={() => addNode(t)}>
                  + {t}
                </Button>
              ))}
            </div>
          </div>
          <div className="relative mt-3 h-[320px] overflow-auto rounded-lg border border-[var(--line)] bg-[var(--surface-2)]">
            <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
              {edges.map((e, i) => {
                const a = nodeMap.get(e.from);
                const b = nodeMap.get(e.to);
                if (!a || !b) return null;
                const x1 = a.x + 70;
                const y1 = a.y + 28;
                const x2 = b.x + 70;
                const y2 = b.y + 28;
                return (
                  <line
                    key={`${e.from}-${e.to}-${i}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="var(--accent)"
                    strokeWidth="2"
                    strokeOpacity="0.55"
                  />
                );
              })}
            </svg>
            {nodes.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => onNodeClick(n.id)}
                className={`absolute w-[140px] rounded-md border px-3 py-2 text-left text-xs shadow-sm transition ${
                  selected === n.id
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-[var(--line)] bg-[var(--surface)]"
                }`}
                style={{ left: n.x, top: n.y }}
              >
                <div className="font-semibold capitalize">{n.label || n.type}</div>
                <div className="text-[var(--ink-muted)]">{n.type}</div>
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={!selected}
              onClick={() => selected && setLinkFrom(selected)}
            >
              {linkFrom ? "Click target node…" : "Link from selected"}
            </Button>
            <Button variant="ghost" disabled={!selected} onClick={() => moveSelected(-20, 0)}>
              ←
            </Button>
            <Button variant="ghost" disabled={!selected} onClick={() => moveSelected(20, 0)}>
              →
            </Button>
            <Button variant="ghost" disabled={!selected} onClick={() => moveSelected(0, -20)}>
              ↑
            </Button>
            <Button variant="ghost" disabled={!selected} onClick={() => moveSelected(0, 20)}>
              ↓
            </Button>
            <Button
              variant="ghost"
              disabled={!selected}
              onClick={() => {
                if (!selected) return;
                setNodes((prev) => prev.filter((n) => n.id !== selected));
                setEdges((prev) => prev.filter((e) => e.from !== selected && e.to !== selected));
                setSelected(null);
              }}
            >
              Delete node
            </Button>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <h2 className="font-semibold">Save workflow</h2>
            <div className="mt-3 space-y-3">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
              <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              <Button disabled={busy || nodes.length === 0} onClick={create}>
                {busy ? "Working…" : "Save workflow"}
              </Button>
            </div>
          </Panel>
          <Panel>
            <h2 className="font-semibold">Recent runs</h2>
            <div className="mt-3 space-y-2">
              {runs.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between border-b border-[var(--line)] py-2 text-sm"
                >
                  <span>
                    {r.id.slice(0, 8)}… · {r.steps_completed} steps
                  </span>
                  <Badge tone={r.status === "completed" ? "good" : r.status === "paused" ? "warn" : "neutral"}>
                    {r.status}
                  </Badge>
                </div>
              ))}
              {!runs.length ? (
                <p className="text-sm text-[var(--ink-muted)]">No runs yet.</p>
              ) : null}
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {workflows.map((w) => (
          <Panel key={w.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">{w.name}</h3>
                <p className="text-sm text-[var(--ink-muted)]">{w.description}</p>
              </div>
              <Button disabled={busy} onClick={() => run(w.id)}>
                {busy ? "Running…" : "Run"}
              </Button>
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
            {(lastRun.step_results || []).map((s, i) => (
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
