/**
 * Map Nest `/api/v1` entity shapes (camelCase) onto the UI shapes used by Core OS pages.
 * When NEXT_PUBLIC_API_URL is empty, pages keep calling the same-origin BFF directly.
 */

export type NestPack = {
  id: string;
  name: string;
  industry?: string;
  description?: string;
  agents?: {
    id: string;
    name: string;
    description?: string;
    requiresApproval?: boolean;
  }[];
  workflows?: { id: string; name: string; description?: string }[];
  actions?: { id: string; name: string; description?: string }[];
  pricing?: { starter?: string; professional?: string; enterprise?: string };
};

export type PackWorkspaceView = {
  id: string;
  name: string;
  description: string;
  kpis: { label: string; value: string; delta: string }[];
  queues: { id: string; title: string; owner: string; priority: string; status: string }[];
  agents: {
    id: string;
    name: string;
    description?: string;
    last_run: string;
    outcome: string;
    requiresApproval?: boolean;
  }[];
  workflows: { id: string; name: string; status: string; description?: string }[];
  insights: string[];
  actions: string[];
  actionDefs: { id: string; name: string; description?: string }[];
  pricing?: { starter?: string; professional?: string; enterprise?: string };
  source: "nest" | "bff";
};

export function nestPackToWorkspace(pack: NestPack): PackWorkspaceView {
  const agents = (pack.agents ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    last_run: "—",
    outcome: a.requiresApproval ? "Needs approval" : "Ready",
    requiresApproval: a.requiresApproval,
  }));
  const workflows = (pack.workflows ?? []).map((w) => ({
    id: w.id,
    name: w.name,
    status: "ready",
    description: w.description,
  }));
  const actionDefs = pack.actions ?? [];
  return {
    id: pack.id,
    name: pack.name,
    description: pack.description ?? "",
    kpis: [
      { label: "Agents", value: String(agents.length), delta: "registry" },
      { label: "Workflows", value: String(workflows.length), delta: "pack DAG" },
      { label: "Actions", value: String(actionDefs.length), delta: "runnable" },
      {
        label: "Pricing",
        value: pack.pricing?.professional?.split("/")[0] || "Custom",
        delta: "professional",
      },
    ],
    queues: agents.slice(0, 4).map((a, i) => ({
      id: `q-${a.id}`,
      title: a.description || a.name,
      owner: a.name,
      priority: a.requiresApproval ? "high" : i === 0 ? "high" : "medium",
      status: "open",
    })),
    agents,
    workflows,
    insights: [
      pack.description || `${pack.name} pack loaded from Nest registry.`,
      ...(agents.filter((a) => a.requiresApproval).map((a) => `${a.name} requires human approval.`)),
    ].filter(Boolean),
    actions: [
      ...agents.map((a) => `Run ${a.name}`),
      ...actionDefs.map((a) => a.name),
    ],
    actionDefs,
    pricing: pack.pricing,
    source: "nest",
  };
}

export type NestConnectorRegistryItem = {
  type: string;
  name: string;
  description?: string;
  sandboxFields?: string[];
};

export type NestConnector = {
  id: string;
  type: string;
  name: string;
  status: string;
  mode?: string;
  lastSyncAt?: string | null;
  config?: Record<string, unknown>;
};

export type IntegrationCard = {
  /** Instance id when connected; registry type when available. */
  id: string;
  type: string;
  name: string;
  category: string;
  status: string;
  description: string;
  last_sync?: string | null;
  sandboxFields?: string[];
  instanceId?: string;
};

export function mergeConnectorViews(
  registry: NestConnectorRegistryItem[],
  connected: NestConnector[],
): IntegrationCard[] {
  const byType = new Map<string, NestConnector>();
  for (const c of connected) {
    if (c.status !== "disconnected") byType.set(c.type, c);
  }
  return registry.map((r) => {
    const inst = byType.get(r.type);
    if (inst) {
      return {
        id: inst.id,
        type: r.type,
        name: inst.name || r.name,
        category: r.type,
        status: inst.status || "connected",
        description: r.description || "",
        last_sync: inst.lastSyncAt ?? null,
        sandboxFields: r.sandboxFields,
        instanceId: inst.id,
      };
    }
    return {
      id: r.type,
      type: r.type,
      name: r.name,
      category: r.type,
      status: "available",
      description: r.description || "",
      last_sync: null,
      sandboxFields: r.sandboxFields,
    };
  });
}

export type NestApproval = {
  id: string;
  title?: string;
  status: string;
  resourceType?: string;
  resourceId?: string;
  payload?: Record<string, unknown>;
  comment?: string | null;
  createdAt?: string;
};

export type ApprovalView = {
  id: string;
  name: string;
  agent_type: string;
  status: string;
  requires_approval: boolean;
  result_preview?: string;
};

export function nestApprovalToView(a: NestApproval): ApprovalView {
  const payload = a.payload ?? {};
  const preview =
    (typeof payload.preview === "string" && payload.preview) ||
    (typeof payload.summary === "string" && payload.summary) ||
    a.comment ||
    a.title ||
    "Awaiting review";
  return {
    id: a.id,
    name: a.title || `Approval ${a.id.slice(0, 8)}`,
    agent_type: a.resourceType || "approval",
    status: a.status === "pending" ? "awaiting_approval" : a.status,
    requires_approval: a.status === "pending",
    result_preview: preview,
  };
}

export type NestWorkflow = {
  id: string;
  name: string;
  description?: string;
  nodes?: { id: string; type: string; label?: string; config?: Record<string, unknown>; x?: number; y?: number }[];
  edges?: { from: string; to: string; condition?: string }[];
  steps?: { id: string; label: string; type: string }[];
};

export type NestStepResult = {
  nodeId?: string;
  type?: string;
  result?: { status?: string };
  step?: { label?: string };
  status?: string;
};

export type NestWorkflowRun = {
  id: string;
  workflowId?: string;
  workflow_id?: string;
  status: string;
  stepResults?: NestStepResult[];
  step_results?: NestStepResult[];
  createdAt?: string;
  created_at?: string;
  steps_completed?: number;
};

export function nestWorkflowToView(w: NestWorkflow) {
  const nodes = w.nodes ?? [];
  const steps =
    w.steps ??
    nodes.map((n) => ({
      id: n.id,
      label: n.label || n.type,
      type: n.type,
    }));
  return {
    id: w.id,
    name: w.name,
    description: w.description || "",
    steps,
    nodes,
    edges: w.edges ?? [],
  };
}

export function nestRunToView(r: NestWorkflowRun) {
  const stepResults: NestStepResult[] = r.stepResults ?? r.step_results ?? [];
  return {
    id: r.id,
    workflow_id: r.workflowId || r.workflow_id || "",
    status: r.status,
    steps_completed: r.steps_completed ?? stepResults.length,
    created_at: r.createdAt || r.created_at || new Date().toISOString(),
    step_results: stepResults.map((s) => ({
      step: { label: s.step?.label || s.nodeId || s.type || "step" },
      status: s.status || s.result?.status || "completed",
    })),
  };
}

export type NestDocument = {
  id: string;
  title: string;
  content?: string;
  source?: string;
  docType?: string;
  doc_type?: string;
  createdAt?: string;
  chunks?: { id: string; content: string; embedding?: unknown }[];
};

export function nestDocToView(d: NestDocument) {
  const chunks = d.chunks ?? [];
  const embedded = chunks.filter((c) => c.embedding != null).length;
  return {
    id: d.id,
    title: d.title,
    doc_type: d.docType || d.doc_type || "general",
    source: d.source || "upload",
    preview: (d.content || "").slice(0, 160),
    chunk_count: chunks.length || undefined,
    embedded: chunks.length ? embedded : undefined,
    content: d.content,
  };
}

export type NestSearchHit = {
  chunkId?: string;
  documentId?: string;
  content: string;
  score: number;
  documentTitle?: string;
  title?: string;
  doc_type?: string;
  source?: string;
};

export function nestSearchHitToView(h: NestSearchHit) {
  return {
    title: h.documentTitle || h.title || "Untitled",
    content: h.content,
    score: Math.round((h.score ?? 0) * 1000) / 1000,
    doc_type: h.doc_type || "chunk",
    source: h.source || h.documentId,
    citation: h.documentId
      ? { documentId: h.documentId, chunkId: h.chunkId }
      : undefined,
  };
}

export function formatAgentRunResult(raw: unknown): { ok: boolean; message: string; details?: string[] } {
  if (!raw || typeof raw !== "object") {
    return { ok: true, message: String(raw ?? "Done") };
  }
  const o = raw as Record<string, unknown>;
  const status = String(o.status || "completed");
  const result = (o.result && typeof o.result === "object" ? o.result : o) as Record<string, unknown>;
  const message =
    (typeof result.summary === "string" && result.summary) ||
    (typeof result.message === "string" && result.message) ||
    (typeof o.name === "string" && `${o.name}: ${status}`) ||
    `Agent run ${status}`;
  const details: string[] = [];
  if (o.id) details.push(`Job ${String(o.id)}`);
  if (o.agentType || o.agent_type) details.push(`Type ${String(o.agentType || o.agent_type)}`);
  if (Array.isArray(result.citations)) {
    for (const c of result.citations.slice(0, 6)) details.push(String(c));
  }
  if (typeof result.answer === "string") details.push(result.answer.slice(0, 400));
  return {
    ok: status !== "failed" && status !== "rejected",
    message,
    details: details.length ? details : undefined,
  };
}
