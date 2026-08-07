import bcrypt from "bcryptjs";
import { OFFLINE_CORPUS } from "./corpus";
import { cosine, embedQuery, embedTexts, keywordScore } from "./embeddings";

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
  const embeddings = await embedTexts(parts);
  return parts.map((c, i) => ({
    id: uid(),
    content: c,
    tokens: tokenize(c),
    embedding: embeddings[i],
  }));
}

async function embedAllDocuments(s: Store) {
  const pending = s.documents.flatMap((d) => d.chunks.filter((c) => !c.embedding));
  if (!pending.length) {
    s.embeddingReady = true;
    return;
  }
  // Batch in groups of 40
  for (let i = 0; i < pending.length; i += 40) {
    const batch = pending.slice(i, i + 40);
    const vectors = await embedTexts(batch.map((c) => c.content));
    batch.forEach((c, idx) => {
      c.embedding = vectors[idx];
    });
  }
  s.embeddingReady = true;
}

export function ensureSeeded() {
  const s = getStore();
  if (s.ready && s.users.length) {
    if (!s.embeddingReady && !s.embeddingPromise) {
      s.embeddingPromise = embedAllDocuments(s).catch(() => {
        s.embeddingReady = true;
      });
    }
    return s;
  }

  const orgId = uid();
  s.orgs = [{ id: orgId, name: "LSI Demo Pharma", slug: "lsi-demo", plan: "enterprise" }];
  const adminHash = bcrypt.hashSync("demo1234", 10);
  s.users = [
    {
      id: uid(),
      org_id: orgId,
      email: "admin@lsi.os",
      full_name: "Ada Admin",
      hashed_password: adminHash,
      role: "admin",
      is_active: true,
      created_at: now(),
    },
    {
      id: uid(),
      org_id: orgId,
      email: "analyst@lsi.os",
      full_name: "Alex Analyst",
      hashed_password: adminHash,
      role: "analyst",
      is_active: true,
      created_at: now(),
    },
  ];

  s.documents = OFFLINE_CORPUS.map((d) => {
    const parts = chunkText(d.content);
    return {
      id: uid(),
      org_id: orgId,
      title: d.title,
      content: d.content,
      doc_type: d.doc_type,
      source: d.source,
      created_at: now(),
      chunks: parts.map((c) => ({
        id: uid(),
        content: c,
        tokens: tokenize(c),
      })),
    };
  });

  s.workflows = [
    {
      id: uid(),
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
  s.jobs = [];
  s.runs = [];
  s.audit = [];
  s.usage = [];
  s.ready = true;
  s.embeddingPromise = embedAllDocuments(s).catch(() => {
    s.embeddingReady = true;
  });
  return s;
}

export async function ensureReady() {
  const s = ensureSeeded();
  if (s.embeddingPromise) await s.embeddingPromise;
  return s;
}

export async function hybridSearch(orgId: string, query: string, limit = 8) {
  const s = await ensureReady();
  const qEmb = await embedQuery(query);
  const scored: {
    score: number;
    title: string;
    content: string;
    doc_type: string;
    document_id: string;
    chunk_id: string;
    source: string;
  }[] = [];

  for (const doc of s.documents.filter((d) => d.org_id === orgId)) {
    for (const chunk of doc.chunks) {
      const vec = chunk.embedding ? cosine(qEmb, chunk.embedding) : 0;
      const kw = keywordScore(query, `${doc.title} ${chunk.content}`);
      const score = 0.72 * vec + 0.28 * kw;
      if (score > 0.08) {
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
    return s.documents
      .filter((d) => d.org_id === orgId)
      .slice(0, limit)
      .map((d) => ({
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
    embedding_ready: s.embeddingReady,
    openai_configured: Boolean(process.env.OPENAI_API_KEY),
  };
}
