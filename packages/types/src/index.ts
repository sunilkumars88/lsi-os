export enum Role {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  MANAGER = "manager",
  ANALYST = "analyst",
  APPROVER = "approver",
  VIEWER = "viewer",
}

export type BillingPlan = "starter" | "professional" | "enterprise" | "custom";

export type User = {
  id: string;
  org_id: string;
  email: string;
  full_name: string;
  role: Role | string;
  is_active: boolean;
  created_at: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  plan: BillingPlan | string;
  created_at?: string;
};

export type Workspace = {
  id: string;
  org_id: string;
  name: string;
  slug: string;
  pack_id?: string | null;
  settings?: Record<string, unknown>;
  created_at: string;
};

export type DocumentChunk = {
  id: string;
  content: string;
  tokens?: string[];
  embedding?: number[];
};

export type Document = {
  id: string;
  org_id: string;
  workspace_id?: string;
  title: string;
  content: string;
  doc_type: string;
  source: string;
  created_at: string;
  chunks?: DocumentChunk[];
};

export type ConnectorStatus = "connected" | "available" | "roadmap" | "error" | "disconnected";

export type Connector = {
  id: string;
  org_id?: string;
  name: string;
  provider: string;
  category: string;
  status: ConnectorStatus;
  description: string;
  config?: Record<string, unknown>;
  last_sync?: string | null;
  created_at?: string;
};

export type WorkflowNodeType =
  | "ingest"
  | "retrieve"
  | "analyze"
  | "approve"
  | "notify"
  | "action"
  | "branch"
  | "custom";

export type WorkflowNode = {
  id: string;
  label: string;
  type: WorkflowNodeType | string;
  config?: Record<string, unknown>;
  next?: string[];
};

export type Workflow = {
  id: string;
  org_id: string;
  name: string;
  description: string;
  steps: WorkflowNode[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type AgentJobStatus =
  | "pending"
  | "running"
  | "awaiting_approval"
  | "completed"
  | "failed"
  | "rejected";

export type AgentJob = {
  id: string;
  org_id: string;
  user_id: string;
  name: string;
  agent_type: string;
  status: AgentJobStatus | string;
  input: Record<string, unknown>;
  plan?: { step: number; action: string; detail: string }[];
  result?: Record<string, unknown>;
  requires_approval: boolean;
  approved: boolean | null;
  created_at: string;
  completed_at: string | null;
};

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";

export type Approval = {
  id: string;
  org_id: string;
  resource_type: "agent_job" | "workflow_run" | "document" | "connector_action" | string;
  resource_id: string;
  requested_by: string;
  status: ApprovalStatus;
  note?: string;
  decided_by?: string | null;
  decided_at?: string | null;
  created_at: string;
};

export type AuditLog = {
  id: string;
  org_id: string;
  user_id: string | null;
  action: string;
  resource: string;
  details?: Record<string, unknown>;
  created_at: string;
};

export type IndustryPackStatus = "active" | "available" | "roadmap";

export type IndustryPack = {
  id: string;
  name: string;
  short?: string;
  status: IndustryPackStatus;
  description: string;
  modules?: { href: string; label: string }[];
  kpis?: string[];
};
