import bcrypt from "bcryptjs";

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

export type Document = {
  id: string;
  org_id: string;
  title: string;
  content: string;
  doc_type: string;
  source: string;
  created_at: string;
  chunks: { id: string; content: string; tokens: string[] }[];
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
  };
}

export function getStore(): Store {
  if (!globalForStore.__lsiStore) {
    globalForStore.__lsiStore = emptyStore();
  }
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

function chunkText(text: string, size = 700) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= size) return clean ? [clean] : [];
  const out: string[] = [];
  for (let i = 0; i < clean.length; i += size - 100) {
    out.push(clean.slice(i, i + size));
  }
  return out;
}

const SEED_DOCS = [
  {
    title: "CardiaX Phase III Synopsis",
    doc_type: "protocol",
    content:
      "CardiaX is an oral SGLT2-pathway modulator in Phase III for HFpEF. Primary endpoint: cardiovascular death or HF hospitalization at 24 months. Enrollment target 4200 subjects across 180 sites. Current enrollment lag in APAC sites is 14% behind plan. Safety: genital mycotic infections and volume depletion are monitored.",
  },
  {
    title: "OncoPrime Biomarker Testing Brief",
    doc_type: "medical",
    content:
      "OncoPrime is a PD-1 combination therapy for NSCLC with PD-L1 >= 50%. Medical affairs priorities include KOL education on companion diagnostics and MSL talk tracks on immune-related AEs. Competitive pressure from Rival-B dual checkpoint regimen.",
  },
  {
    title: "ImmunoPath Safety Signal Assessment",
    doc_type: "safety",
    content:
      "ImmunoPath (IL-17 pathway) has an open signal for inflammatory bowel events. Disproportionality analysis shows EB05 1.8 for colitis. Actions: enhanced monitoring and label language review with PV and Regulatory. Human-in-the-loop approval required before external communication.",
  },
  {
    title: "EU HTA Evidence Requirements — HEOR",
    doc_type: "heor",
    content:
      "For EU HTA Joint Clinical Assessment readiness, OncoPrime requires relative effectiveness vs relevant comparators, subgroup consistency, and quality-of-life instruments (EQ-5D). NICE and G-BA remain critical markets.",
  },
  {
    title: "FDA RWE Guidance Summary for Regulatory Affairs",
    doc_type: "regulatory",
    content:
      "FDA guidance on real-world evidence supports use of RWD for label expansions when data quality, provenance, and confounding control are demonstrated. CMC readiness for CardiaX sNDA currently at 78%.",
  },
  {
    title: "Competitive Landscape Snapshot",
    doc_type: "commercial",
    content:
      "Rival-A expanded specialty pharmacy access in Q2. Rival-B launched a dual-checkpoint regimen with aggressive HCP digital detailing. Reinforce OncoPrime biomarker testing pathways and CardiaX cardiology KOL programs.",
  },
];

export function ensureSeeded() {
  const s = getStore();
  if (s.ready && s.users.length) return s;

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

  s.documents = SEED_DOCS.map((d) => {
    const id = uid();
    const chunks = chunkText(d.content).map((c) => ({
      id: uid(),
      content: c,
      tokens: tokenize(c),
    }));
    return {
      id,
      org_id: orgId,
      title: d.title,
      content: d.content,
      doc_type: d.doc_type,
      source: "seed",
      created_at: now(),
      chunks,
    };
  });

  s.workflows = [
    {
      id: uid(),
      org_id: orgId,
      name: "Intelligence Brief Pipeline",
      description: "Ingest knowledge, extract trials, analyze KPIs, approve, notify executives.",
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
  return s;
}

export function hybridSearch(orgId: string, query: string, limit = 6) {
  const s = ensureSeeded();
  const qTokens = new Set(tokenize(query));
  const scored: { score: number; title: string; content: string; doc_type: string; document_id: string; chunk_id: string }[] = [];

  for (const doc of s.documents.filter((d) => d.org_id === orgId)) {
    for (const chunk of doc.chunks) {
      const overlap = chunk.tokens.filter((t) => qTokens.has(t)).length;
      const score = qTokens.size ? overlap / Math.sqrt(qTokens.size * Math.max(chunk.tokens.length, 1)) : 0;
      if (score > 0.02 || doc.title.toLowerCase().includes(query.toLowerCase().slice(0, 12))) {
        scored.push({
          score: Math.round((score + (doc.title.toLowerCase().includes("cardiax") && query.toLowerCase().includes("cardiax") ? 0.3 : 0)) * 1000) / 1000,
          title: doc.title,
          content: chunk.content,
          doc_type: doc.doc_type,
          document_id: doc.id,
          chunk_id: chunk.id,
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
        score: 0.15,
        title: d.title,
        content: d.content.slice(0, 320),
        doc_type: d.doc_type,
        document_id: d.id,
        chunk_id: d.chunks[0]?.id || d.id,
      }));
  }
  return scored.slice(0, limit);
}

export function audit(orgId: string, userId: string | null, action: string, resource = "", details: Record<string, unknown> = {}) {
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
