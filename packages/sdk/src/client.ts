import type {
  AgentJob,
  Connector,
  IndustryPack,
  User,
} from "@eios/types";

export type EiosClientOptions = {
  baseUrl: string;
  token?: string;
  fetch?: typeof fetch;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
};

export type MeResponse = User & {
  org_name?: string;
};

export type KnowledgeSearchResult = {
  query: string;
  results: {
    document_id: string;
    title: string;
    snippet: string;
    score: number;
    source?: string;
  }[];
  stats?: Record<string, unknown>;
};

export type RunAgentInput = {
  name?: string;
  agent_type?: string;
  query?: string;
};

export type RunWorkflowInput = Record<string, unknown>;

export type ConnectConnectorInput = {
  id: string;
  config?: Record<string, unknown>;
};

export type RunPackInput = {
  action?: "agent" | "workflow" | "complete_queue";
  query?: string;
  workflow_id?: string;
  queue_id?: string;
  notes?: string;
};

export class EiosClient {
  private baseUrl: string;
  private token?: string;
  private http: typeof fetch;

  constructor(options: EiosClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.token = options.token;
    this.http = options.fetch ?? fetch;
  }

  setToken(token: string | undefined) {
    this.token = token;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await this.http(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const detail =
        typeof data?.detail === "string"
          ? data.detail
          : `Request failed (${response.status})`;
      throw new Error(detail);
    }

    return data as T;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const result = await this.request<LoginResponse>("POST", "/auth/login", {
      email,
      password,
    });
    this.token = result.access_token;
    return result;
  }

  async me(): Promise<MeResponse> {
    return this.request<MeResponse>("GET", "/auth/me");
  }

  async knowledgeSearch(
    query: string,
    limit = 8,
  ): Promise<KnowledgeSearchResult> {
    return this.request<KnowledgeSearchResult>("POST", "/knowledge/search", {
      query,
      limit,
    });
  }

  async runAgent(input: RunAgentInput): Promise<AgentJob> {
    return this.request<AgentJob>("POST", "/agents/jobs", input);
  }

  async runWorkflow(
    workflowId: string,
    input: RunWorkflowInput = {},
  ): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      "POST",
      `/workflows/${workflowId}/run`,
      input,
    );
  }

  async listConnectors(): Promise<{ connectors: Connector[] }> {
    return this.request<{ connectors: Connector[] }>(
      "GET",
      "/modules/integrations",
    );
  }

  async connectConnector(
    input: ConnectConnectorInput,
  ): Promise<{ ok: boolean; connector: Connector }> {
    return this.request<{ ok: boolean; connector: Connector }>(
      "POST",
      "/modules/integrations/connect",
      input,
    );
  }

  async listPacks(): Promise<IndustryPack[]> {
    try {
      return await this.request<IndustryPack[]>("GET", "/modules/packs");
    } catch {
      const ids = [
        "life-sciences",
        "banking",
        "insurance",
        "healthcare",
        "manufacturing",
        "retail",
        "government",
        "education",
        "energy",
        "telecom",
        "hospitality",
      ];

      const packs = await Promise.all(
        ids.map(async (id) => {
          try {
            const pack = await this.request<{
              id: string;
              name: string;
              insights?: string[];
            }>("GET", `/modules/packs/${id}`);
            return {
              id: pack.id ?? id,
              name: pack.name,
              status: "available" as const,
              description: pack.insights?.[0] ?? `${pack.name} industry pack`,
            } satisfies IndustryPack;
          } catch {
            return null;
          }
        }),
      );

      return packs.filter((pack): pack is IndustryPack => pack !== null);
    }
  }

  async runPack(
    packId: string,
    input: RunPackInput = {},
  ): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      "POST",
      `/modules/packs/${packId}/run`,
      input,
    );
  }
}
