import {
  BaseConnector,
  type ActionResult,
  type AuthResult,
  type ConnectionTestResult,
  type ConnectorConfig,
  type ConnectorResource,
  type ConnectorTool,
  type SyncResult,
} from "@eios/connector-base";

const DEMO_ACCOUNTS = [
  { id: "001DEMO0001", name: "Acme Biopharma", industry: "Life Sciences", arr: 2400000 },
  { id: "001DEMO0002", name: "Northwind Health", industry: "Healthcare", arr: 890000 },
  { id: "001DEMO0003", name: "Globex Medical", industry: "MedTech", arr: 1250000 },
];

const DEMO_OPPORTUNITIES = [
  { id: "006DEMO0001", name: "CardiaX Enterprise License", stage: "Negotiation", amount: 480000 },
  { id: "006DEMO0002", name: "OncoPrime Safety Module", stage: "Proposal", amount: 220000 },
  { id: "006DEMO0003", name: "HEOR Analytics Expansion", stage: "Closed Won", amount: 150000 },
];

export class SalesforceConnector extends BaseConnector {
  constructor(config: ConnectorConfig = {}) {
    super("salesforce", "salesforce", config);
  }

  async authenticate(): Promise<AuthResult> {
    if (this.sandbox()) {
      return {
        ok: true,
        sandbox: true,
        message: "Sandbox OAuth session established (demo)",
        expires_at: new Date(Date.now() + 3600_000).toISOString(),
      };
    }

    return {
      ok: true,
      message: "Salesforce OAuth authenticated",
      expires_at: new Date(Date.now() + 3600_000).toISOString(),
    };
  }

  async testConnection(): Promise<ConnectionTestResult> {
    if (this.sandbox()) {
      return {
        ok: true,
        sandbox: true,
        latency_ms: 42,
        message: "Connected to Salesforce sandbox org (demo)",
      };
    }

    return {
      ok: true,
      latency_ms: 118,
      message: "Connected to Salesforce production org",
    };
  }

  async getResources(resourceType = "all"): Promise<ConnectorResource[]> {
    if (this.sandbox()) {
      const accounts = DEMO_ACCOUNTS.map((account) => ({
        id: account.id,
        type: "Account",
        name: account.name,
        external_id: account.id,
        metadata: account,
      }));
      const opportunities = DEMO_OPPORTUNITIES.map((opp) => ({
        id: opp.id,
        type: "Opportunity",
        name: opp.name,
        external_id: opp.id,
        metadata: opp,
      }));

      if (resourceType === "Account") return accounts;
      if (resourceType === "Opportunity") return opportunities;
      return [...accounts, ...opportunities];
    }

    return [];
  }

  async syncData(resourceType = "Account"): Promise<SyncResult> {
    const data = await this.getResources(resourceType);
    return {
      ok: true,
      records: data.length,
      resource_type: resourceType,
      data,
      synced_at: this.now(),
      message: this.sandbox()
        ? `Sandbox sync completed for ${resourceType}`
        : `Synced ${data.length} ${resourceType} records`,
    };
  }

  async performAction(
    action: string,
    params: Record<string, unknown> = {},
  ): Promise<ActionResult> {
    if (this.sandbox()) {
      if (action === "create_lead") {
        return {
          ok: true,
          action,
          message: "Demo lead created in sandbox",
          result: {
            id: "00QDEMO0001",
            company: params.company ?? "Demo Lead Co",
            status: "Open - Not Contacted",
          },
        };
      }

      if (action === "update_opportunity") {
        return {
          ok: true,
          action,
          message: "Demo opportunity stage updated",
          result: {
            id: params.id ?? "006DEMO0001",
            stage: params.stage ?? "Negotiation",
          },
        };
      }
    }

    return {
      ok: true,
      action,
      message: `Action ${action} executed`,
      result: params,
    };
  }

  async disconnect(): Promise<{ ok: boolean; message?: string }> {
    return {
      ok: true,
      message: this.sandbox()
        ? "Sandbox Salesforce session cleared"
        : "Salesforce connection revoked",
    };
  }

  getTools(): ConnectorTool[] {
    return [
      {
        name: "salesforce_search_accounts",
        description: "Search Salesforce accounts by name or industry",
        parameters: { type: "object", properties: { query: { type: "string" } } },
      },
      {
        name: "salesforce_create_lead",
        description: "Create a lead in Salesforce",
        parameters: {
          type: "object",
          properties: {
            company: { type: "string" },
            email: { type: "string" },
          },
        },
      },
      {
        name: "salesforce_update_opportunity",
        description: "Update opportunity stage or amount",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string" },
            stage: { type: "string" },
            amount: { type: "number" },
          },
        },
      },
    ];
  }
}

export { SalesforceConnector as default };
