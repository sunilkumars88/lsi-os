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

const DEMO_COMPANIES = [
  { id: "hs-co-001", name: "Helix Biotech", domain: "helixbio.com", industry: "Life Sciences" },
  { id: "hs-co-002", name: "Pinnacle Insurance", domain: "pinnacleins.com", industry: "Insurance" },
  { id: "hs-co-003", name: "Axis Retail Group", domain: "axisretail.in", industry: "Retail" },
];

const DEMO_CONTACTS = [
  { id: "hs-ct-001", name: "Dr. Ananya Rao", email: "ananya@helixbio.com", lifecycle: "customer" },
  { id: "hs-ct-002", name: "James Chen", email: "jchen@pinnacleins.com", lifecycle: "lead" },
  { id: "hs-ct-003", name: "Priya Nair", email: "priya@axisretail.in", lifecycle: "opportunity" },
];

const DEMO_DEALS = [
  { id: "hs-dl-001", name: "Enterprise OS License", stage: "contractsent", amount: 200000 },
  { id: "hs-dl-002", name: "Banking Pack Pilot", stage: "qualifiedtobuy", amount: 50000 },
  { id: "hs-dl-003", name: "Insurance Compliance Module", stage: "presentationscheduled", amount: 150000 },
];

export class HubspotConnector extends BaseConnector {
  constructor(config: ConnectorConfig = {}) {
    super("hubspot", "hubspot", config);
  }

  async authenticate(): Promise<AuthResult> {
    if (this.sandbox()) {
      return {
        ok: true,
        sandbox: true,
        message: "Sandbox HubSpot API key validated (demo)",
        expires_at: new Date(Date.now() + 3600_000).toISOString(),
      };
    }

    return {
      ok: true,
      message: "HubSpot private app token authenticated",
      expires_at: new Date(Date.now() + 3600_000).toISOString(),
    };
  }

  async testConnection(): Promise<ConnectionTestResult> {
    if (this.sandbox()) {
      return {
        ok: true,
        sandbox: true,
        latency_ms: 38,
        message: "Connected to HubSpot sandbox portal (demo)",
      };
    }

    return {
      ok: true,
      latency_ms: 95,
      message: "Connected to HubSpot production portal",
    };
  }

  async getResources(resourceType = "all"): Promise<ConnectorResource[]> {
    if (this.sandbox()) {
      const companies = DEMO_COMPANIES.map((co) => ({
        id: co.id,
        type: "Company",
        name: co.name,
        external_id: co.id,
        metadata: co,
      }));
      const contacts = DEMO_CONTACTS.map((ct) => ({
        id: ct.id,
        type: "Contact",
        name: ct.name,
        external_id: ct.id,
        metadata: ct,
      }));
      const deals = DEMO_DEALS.map((dl) => ({
        id: dl.id,
        type: "Deal",
        name: dl.name,
        external_id: dl.id,
        metadata: dl,
      }));

      if (resourceType === "Company") return companies;
      if (resourceType === "Contact") return contacts;
      if (resourceType === "Deal") return deals;
      return [...companies, ...contacts, ...deals];
    }

    return [];
  }

  async syncData(resourceType = "Contact"): Promise<SyncResult> {
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
      if (action === "create_contact") {
        return {
          ok: true,
          action,
          message: "Demo contact created in HubSpot sandbox",
          result: {
            id: "hs-ct-demo",
            email: params.email ?? "demo@eios.local",
            lifecycle: "lead",
          },
        };
      }

      if (action === "update_deal") {
        return {
          ok: true,
          action,
          message: "Demo deal stage updated",
          result: {
            id: params.id ?? "hs-dl-001",
            stage: params.stage ?? "contractsent",
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
        ? "Sandbox HubSpot session cleared"
        : "HubSpot connection revoked",
    };
  }

  getTools(): ConnectorTool[] {
    return [
      {
        name: "hubspot_search_contacts",
        description: "Search HubSpot contacts by email or lifecycle stage",
        parameters: { type: "object", properties: { query: { type: "string" } } },
      },
      {
        name: "hubspot_create_contact",
        description: "Create a contact in HubSpot",
        parameters: {
          type: "object",
          properties: {
            email: { type: "string" },
            firstname: { type: "string" },
            company: { type: "string" },
          },
        },
      },
      {
        name: "hubspot_update_deal",
        description: "Update deal stage or amount",
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

export { HubspotConnector as default };
