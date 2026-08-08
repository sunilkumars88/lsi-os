import bcrypt from "bcryptjs";
import { OFFLINE_CORPUS } from "./corpus";
import { cosine, embedTexts, keywordScore, localEmbed } from "./embeddings";
import { DEMO_ADMIN_ID, DEMO_ANALYST_ID, DEMO_ORG_ID, DEMO_WORKFLOW_ID } from "./ids";

export type User = {
  id: string;
  org_id: string;
  email: string;
  full_name: string;
  hashed_password: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  plan: string;
};

export type Chunk = {
  id: string;
  content: string;
  tokens: string[];
  embedding?: number[];
};

export type Document = {
  id: string;
  org_id: string;
  title: string;
  content: string;
  doc_type: string;
  source: string;
  created_at: string;
  chunks: Chunk[];
};

export type ChatSession = {
  id: string;
  org_id: string;
  user_id: string;
  title: string;
  created_at: string;
  messages: {
    id: string;
    role: string;
    content: string;
    citations: unknown[];
    tool_traces: unknown[];
    model: string;
    created_at: string;
  }[];
};

export type AgentJob = {
  id: string;
  org_id: string;
  user_id: string;
  name: string;
  agent_type: string;
  status: string;
  input: { query: string };
  plan: { step: number; action: string; detail: string }[];
  result: { summary: string; tool_traces: unknown[]; model: string; provider: string };
  requires_approval: boolean;
  approved: boolean | null;
  created_at: string;
  completed_at: string | null;
};

export type Workflow = {
  id: string;
  org_id: string;
  name: string;
  description: string;
  steps: { id: string; label: string; type: string }[];
  is_active: boolean;
};

export type WorkflowRun = {
  id: string;
  workflow_id: string;
  org_id: string;
  status: string;
  step_results: unknown[];
  created_at: string;
  completed_at: string | null;
};

export type AuditLog = {
  id: string;
  org_id: string;
  user_id: string | null;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  created_at: string;
};

export type UsageMeter = {
  id: string;
  org_id: string;
  provider: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  created_at: string;
};

export type ConnectorState = {
  id: string;
  name: string;
  category: string;
  status: "connected" | "available" | "roadmap" | "error";
  description: string;
  last_sync?: string | null;
};

export type MarketplaceItemState = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: string;
  installed: boolean;
};

export type RightsReview = {
  dataset_id: string;
  decision: "allow_rag" | "block" | "escalate";
  note: string;
  reviewer_id: string;
  created_at: string;
};

type Store = {
  orgs: Organization[];
  users: User[];
  documents: Document[];
  sessions: ChatSession[];
  jobs: AgentJob[];
  workflows: Workflow[];
  runs: WorkflowRun[];
  audit: AuditLog[];
  usage: UsageMeter[];
  connectors: ConnectorState[];
  marketplace: MarketplaceItemState[];
  rightsReviews: RightsReview[];
  packQueues: Record<string, { id: string; title: string; owner: string; priority: string; status: string }[]>;
  ready: boolean;
  embeddingReady: boolean;
  embeddingPromise?: Promise<void>;
};

const globalForStore = globalThis as unknown as { __lsiStore?: Store };

function emptyStore(): Store {
  return {
    orgs: [],
    users: [],
    documents: [],
    sessions: [],
    jobs: [],
    workflows: [],
    runs: [],
    audit: [],
    usage: [],
    connectors: [],
    marketplace: [],
    rightsReviews: [],
    packQueues: {},
    ready: false,
    embeddingReady: false,
  };
}

export function getStore(): Store {
  if (!globalForStore.__lsiStore) globalForStore.__lsiStore = emptyStore();
  return globalForStore.__lsiStore;
}

export function uid() {
  return crypto.randomUUID();
}

export function now() {
  return new Date().toISOString();
}

function tokenize(text: string) {
  return text.toLowerCase().match(/[a-z0-9]+/g) || [];
}

export function chunkText(text: string, size = 700): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= size) return clean ? [clean] : [];
  const out: string[] = [];
  for (let i = 0; i < clean.length; i += size - 100) out.push(clean.slice(i, i + size));
  return out;
}

export async function buildChunks(content: string): Promise<Chunk[]> {
  const parts = chunkText(content);
  // Instant local embeddings so ingest never blocks on OpenAI
  const local = parts.map((c) => ({
    id: uid(),
    content: c,
    tokens: tokenize(c),
    embedding: localEmbed(c),
  }));
  // Best-effort OpenAI upgrade in background
  void embedTexts(parts)
    .then((vectors) => {
      local.forEach((chunk, i) => {
        if (vectors[i]?.length) chunk.embedding = vectors[i];
      });
    })
    .catch(() => undefined);
  return local;
}

async function upgradeEmbeddingsInBackground(s: Store) {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    s.embeddingReady = true;
    return;
  }
  const pending = s.documents.flatMap((d) => d.chunks);
  for (let i = 0; i < pending.length; i += 20) {
    const batch = pending.slice(i, i + 20);
    try {
      const vectors = await embedTexts(batch.map((c) => c.content));
      batch.forEach((c, idx) => {
        if (vectors[idx]?.length) c.embedding = vectors[idx];
      });
    } catch {
      /* keep local embeddings */
    }
  }
  s.embeddingReady = true;
}

/** Precomputed demo password hash for "demo1234" so cold starts stay fast/stable. */
const DEMO_PASSWORD_HASH = bcrypt.hashSync("demo1234", 8);

export function ensureSeeded() {
  const s = getStore();
  if (s.ready && s.users.length) {
    // Hot-upgrade older warm instances after deploy
    if (!Array.isArray(s.connectors) || !s.connectors.length) {
      s.connectors = [
        { id: "salesforce", name: "Salesforce CRM", category: "CRM", status: "available", description: "Accounts, HCPs, opportunities, field activity.", last_sync: null },
        { id: "veeva", name: "Veeva Vault / CRM", category: "Life Sciences", status: "connected", description: "Approved content, MLR artifacts, HCP interactions.", last_sync: now() },
        { id: "sap", name: "SAP ERP", category: "ERP", status: "available", description: "Finance, supply, and commercial operations data.", last_sync: null },
        { id: "ctms", name: "Clinical Trial System", category: "Clinical", status: "connected", description: "Sites, enrollment, milestones (plus ClinicalTrials.gov).", last_sync: now() },
        { id: "safety-db", name: "Safety / PV system", category: "Safety", status: "connected", description: "ICSRs with OpenFDA FAERS enrichment.", last_sync: now() },
        { id: "sharepoint", name: "Microsoft 365 / SharePoint", category: "Documents", status: "available", description: "SOPs, submissions, medical information.", last_sync: null },
        { id: "slack", name: "Slack / Teams", category: "Collab", status: "available", description: "Notifications, approvals, workflow alerts.", last_sync: null },
        { id: "servicenow", name: "ServiceNow", category: "ITSM", status: "roadmap", description: "Incident and change orchestration.", last_sync: null },
        { id: "fhir", name: "FHIR / HL7", category: "Interop", status: "available", description: "Healthcare provider interoperability adapters.", last_sync: null },
      ];
    }
    if (!Array.isArray(s.marketplace) || !s.marketplace.length) {
      s.marketplace = [
        { id: "agent-safety", name: "Safety Sentinel Pack", category: "Agents", description: "OpenFDA FAERS triage with approval gates.", price: "Included", installed: true },
        { id: "rag-regulatory", name: "Regulatory RAG Corpus", category: "Knowledge", description: "Offline dossiers + labels with embeddings.", price: "Enterprise", installed: false },
        { id: "sdk-python", name: "EIOS Python SDK", category: "SDK", description: "Typed client for chat, agents, knowledge.", price: "Open", installed: false },
        { id: "workflow-hta", name: "HTA Dossier Workflow", category: "Workflows", description: "Ingest → extract → analyze → approve → notify.", price: "Professional", installed: false },
      ];
    }
    if (!Array.isArray(s.rightsReviews)) s.rightsReviews = [];
    if (!s.packQueues) s.packQueues = {};
    if (!s.jobs.some((j) => j.status === "awaiting_approval")) {
      s.jobs.unshift({
        id: "job-seed-safety-001",
        org_id: DEMO_ORG_ID,
        user_id: DEMO_ADMIN_ID,
        name: "ImmunoPath FAERS triage",
        agent_type: "safety",
        status: "awaiting_approval",
        input: { query: "Review FAERS signals for ImmunoPath" },
        plan: [
          { step: 1, action: "plan", detail: "Scope pharmacovigilance review" },
          { step: 2, action: "retrieve", detail: "OpenFDA FAERS + enforcement + RxNorm" },
          { step: 3, action: "synthesize", detail: "Draft gated safety brief" },
        ],
        result: {
          summary: "Draft safety brief ready for human approval before external communication.",
          tool_traces: [],
          model: "demo-brain",
          provider: "demo",
        },
        requires_approval: true,
        approved: null,
        created_at: now(),
        completed_at: null,
      });
    }
    return s;
  }

  const orgId = DEMO_ORG_ID;
  s.orgs = [{ id: orgId, name: "LSI Demo Pharma", slug: "lsi-demo", plan: "enterprise" }];
  s.users = [
    {
      id: DEMO_ADMIN_ID,
      org_id: orgId,
      email: "admin@lsi.os",
      full_name: "Ada Admin",
      hashed_password: DEMO_PASSWORD_HASH,
      role: "admin",
      is_active: true,
      created_at: "2026-01-01T00:00:00.000Z",
    },
    {
      id: DEMO_ANALYST_ID,
      org_id: orgId,
      email: "analyst@lsi.os",
      full_name: "Alex Analyst",
      hashed_password: DEMO_PASSWORD_HASH,
      role: "analyst",
      is_active: true,
      created_at: "2026-01-01T00:00:00.000Z",
    },
  ];

  s.documents = OFFLINE_CORPUS.map((d, docIdx) => {
    const parts = chunkText(d.content);
    return {
      id: `doc-${String(docIdx + 1).padStart(4, "0")}`,
      org_id: orgId,
      title: d.title,
      content: d.content,
      doc_type: d.doc_type,
      source: d.source,
      created_at: "2026-01-01T00:00:00.000Z",
      chunks: parts.map((c, chunkIdx) => ({
        id: `chunk-${docIdx + 1}-${chunkIdx + 1}`,
        content: c,
        tokens: tokenize(c),
        embedding: localEmbed(c),
      })),
    };
  });

  s.workflows = [
    {
      id: DEMO_WORKFLOW_ID,
      org_id: orgId,
      name: "Intelligence Brief Pipeline",
      description: "Ingest knowledge, extract trials/literature, analyze KPIs, approve, notify.",
      steps: [
        { id: "ingest", label: "Ingest", type: "ingest" },
        { id: "extract", label: "Extract Trials", type: "extract" },
        { id: "analyze", label: "Analyze KPIs", type: "analyze" },
        { id: "approve", label: "Approve", type: "approve" },
        { id: "notify", label: "Notify", type: "notify" },
      ],
      is_active: true,
    },
  ];

  s.sessions = [];
  s.jobs = [
    {
      id: "job-seed-safety-001",
      org_id: orgId,
      user_id: DEMO_ADMIN_ID,
      name: "ImmunoPath FAERS triage",
      agent_type: "safety",
      status: "awaiting_approval",
      input: { query: "Review FAERS signals for ImmunoPath" },
      plan: [
        { step: 1, action: "plan", detail: "Scope pharmacovigilance review" },
        { step: 2, action: "retrieve", detail: "OpenFDA FAERS + enforcement + RxNorm" },
        { step: 3, action: "synthesize", detail: "Draft gated safety brief" },
      ],
      result: {
        summary:
          "Draft safety brief ready: GI haemorrhage remains the lead signal. Recommend medical review before any external communication.",
        tool_traces: [],
        model: "demo-brain",
        provider: "demo",
      },
      requires_approval: true,
      approved: null,
      created_at: "2026-01-02T00:00:00.000Z",
      completed_at: null,
    },
  ];
  s.runs = [];
  s.audit = [];
  s.usage = [];
  s.connectors = [
    { id: "salesforce", name: "Salesforce CRM", category: "CRM", status: "available", description: "Accounts, HCPs, opportunities, field activity.", last_sync: null },
    { id: "veeva", name: "Veeva Vault / CRM", category: "Life Sciences", status: "connected", description: "Approved content, MLR artifacts, HCP interactions.", last_sync: "2026-08-01T10:00:00.000Z" },
    { id: "sap", name: "SAP ERP", category: "ERP", status: "available", description: "Finance, supply, and commercial operations data.", last_sync: null },
    { id: "ctms", name: "Clinical Trial System", category: "Clinical", status: "connected", description: "Sites, enrollment, milestones (plus ClinicalTrials.gov).", last_sync: "2026-08-06T08:00:00.000Z" },
    { id: "safety-db", name: "Safety / PV system", category: "Safety", status: "connected", description: "ICSRs with OpenFDA FAERS enrichment.", last_sync: "2026-08-06T09:30:00.000Z" },
    { id: "sharepoint", name: "Microsoft 365 / SharePoint", category: "Documents", status: "available", description: "SOPs, submissions, medical information.", last_sync: null },
    { id: "slack", name: "Slack / Teams", category: "Collab", status: "available", description: "Notifications, approvals, workflow alerts.", last_sync: null },
    { id: "servicenow", name: "ServiceNow", category: "ITSM", status: "roadmap", description: "Incident and change orchestration.", last_sync: null },
    { id: "fhir", name: "FHIR / HL7", category: "Interop", status: "available", description: "Healthcare provider interoperability adapters.", last_sync: null },
  ];
  s.marketplace = [
    { id: "agent-safety", name: "Safety Sentinel Pack", category: "Agents", description: "OpenFDA FAERS + enforcement + RxNorm multi-agent triage with approval gates.", price: "Included", installed: true },
    { id: "rag-regulatory", name: "Regulatory RAG Corpus", category: "Knowledge", description: "Offline dossiers + OpenFDA labels + DailyMed with embeddings.", price: "Enterprise", installed: false },
    { id: "sdk-python", name: "EIOS Python SDK", category: "SDK", description: "Typed client for chat, agents, knowledge, and module APIs.", price: "Open", installed: false },
    { id: "workflow-hta", name: "HTA Dossier Workflow", category: "Workflows", description: "Ingest → extract trials/literature → analyze → approve → notify.", price: "Professional", installed: false },
  ];
  s.rightsReviews = [];
  s.packQueues = {};
  s.ready = true;
  s.embeddingReady = true;
  // Optional OpenAI upgrade — never blocks API requests
  s.embeddingPromise = upgradeEmbeddingsInBackground(s);
  return s;
}

export async function ensureReady() {
  // Instant: local embeddings already present. Do NOT await OpenAI upgrade.
  return ensureSeeded();
}

export async function hybridSearch(orgId: string, query: string, limit = 8) {
  const s = ensureSeeded();
  // Local embeddings keep query/doc dimensions aligned and avoid request timeouts.
  const qEmb = localEmbed(query);

  const scored: {
    score: number;
    title: string;
    content: string;
    doc_type: string;
    document_id: string;
    chunk_id: string;
    source: string;
  }[] = [];

  for (const doc of s.documents.filter((d) => d.org_id === orgId || d.org_id === DEMO_ORG_ID)) {
    for (const chunk of doc.chunks) {
      const emb = chunk.embedding || localEmbed(chunk.content);
      const vec = cosine(qEmb, emb);
      const kw = keywordScore(query, `${doc.title} ${chunk.content}`);
      const score = 0.72 * vec + 0.28 * kw;
      if (score > 0.05 || kw > 0.05) {
        scored.push({
          score: Math.round(score * 1000) / 1000,
          title: doc.title,
          content: chunk.content,
          doc_type: doc.doc_type,
          document_id: doc.id,
          chunk_id: chunk.id,
          source: doc.source,
        });
      }
    }
  }

  scored.sort((a, b) => b.score - a.score);
  if (!scored.length) {
    return s.documents.slice(0, limit).map((d) => ({
      score: 0.12,
      title: d.title,
      content: d.content.slice(0, 360),
      doc_type: d.doc_type,
      document_id: d.id,
      chunk_id: d.chunks[0]?.id || d.id,
      source: d.source,
    }));
  }
  return scored.slice(0, limit);
}

export function audit(
  orgId: string,
  userId: string | null,
  action: string,
  resource = "",
  details: Record<string, unknown> = {},
) {
  const s = ensureSeeded();
  s.audit.unshift({
    id: uid(),
    org_id: orgId,
    user_id: userId,
    action,
    resource,
    details,
    created_at: now(),
  });
}

export function knowledgeStats() {
  const s = ensureSeeded();
  const chunks = s.documents.reduce((n, d) => n + d.chunks.length, 0);
  const embedded = s.documents.reduce((n, d) => n + d.chunks.filter((c) => c.embedding?.length).length, 0);
  return {
    documents: s.documents.length,
    chunks,
    embedded_chunks: embedded,
    embedding_ready: true,
    openai_configured: Boolean(process.env.OPENAI_API_KEY?.trim()),
  };
}
