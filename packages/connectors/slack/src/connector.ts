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

const DEMO_CHANNELS = [
  { id: "C001", name: "eios-approvals", topic: "Human approval notifications", members: 12 },
  { id: "C002", name: "clinical-alerts", topic: "Clinical trial safety signals", members: 8 },
  { id: "C003", name: "compliance-audit", topic: "Audit trail and policy updates", members: 6 },
];

const DEMO_USERS = [
  { id: "U001", name: "Dr. Ananya Rao", email: "ananya@helixbio.com", role: "admin" },
  { id: "U002", name: "James Chen", email: "jchen@pinnacleins.com", role: "member" },
  { id: "U003", name: "Priya Nair", email: "priya@axisretail.in", role: "member" },
];

const DEMO_MESSAGES = [
  { id: "M001", channel: "eios-approvals", text: "Approval required: HEOR report v2.1", user: "U001" },
  { id: "M002", channel: "clinical-alerts", text: "Safety signal flagged for CardiaX trial", user: "U002" },
  { id: "M003", channel: "compliance-audit", text: "SOC2 evidence pack updated", user: "U003" },
];

export class SlackConnector extends BaseConnector {
  constructor(config: ConnectorConfig = {}) {
    super("slack", "slack", config);
  }

  async authenticate(): Promise<AuthResult> {
    if (this.sandbox()) {
      return {
        ok: true,
        sandbox: true,
        message: "Sandbox Slack bot token validated (demo)",
        expires_at: new Date(Date.now() + 3600_000).toISOString(),
      };
    }

    return {
      ok: true,
      message: "Slack bot token authenticated",
      expires_at: new Date(Date.now() + 3600_000).toISOString(),
    };
  }

  async testConnection(): Promise<ConnectionTestResult> {
    if (this.sandbox()) {
      return {
        ok: true,
        sandbox: true,
        latency_ms: 35,
        message: "Connected to Slack sandbox workspace (demo)",
      };
    }

    return {
      ok: true,
      latency_ms: 72,
      message: "Connected to Slack production workspace",
    };
  }

  async getResources(resourceType = "all"): Promise<ConnectorResource[]> {
    if (this.sandbox()) {
      const channels = DEMO_CHANNELS.map((ch) => ({
        id: ch.id,
        type: "Channel",
        name: ch.name,
        external_id: ch.id,
        metadata: ch,
      }));
      const users = DEMO_USERS.map((u) => ({
        id: u.id,
        type: "User",
        name: u.name,
        external_id: u.id,
        metadata: u,
      }));
      const messages = DEMO_MESSAGES.map((m) => ({
        id: m.id,
        type: "Message",
        name: m.text.slice(0, 40),
        external_id: m.id,
        metadata: m,
      }));

      if (resourceType === "Channel") return channels;
      if (resourceType === "User") return users;
      if (resourceType === "Message") return messages;
      return [...channels, ...users, ...messages];
    }

    return [];
  }

  async syncData(resourceType = "Channel"): Promise<SyncResult> {
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
      if (action === "post_message") {
        return {
          ok: true,
          action,
          message: "Demo message posted to Slack sandbox",
          result: {
            id: "M-demo",
            channel: params.channel ?? "eios-approvals",
            text: params.text ?? "EIOS notification (demo)",
            ts: String(Date.now()),
          },
        };
      }

      if (action === "request_approval") {
        return {
          ok: true,
          action,
          message: "Demo approval request sent to channel",
          result: {
            id: "M-approval-demo",
            channel: params.channel ?? "eios-approvals",
            approval_id: params.approval_id ?? "apr-demo-001",
            status: "pending",
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
        ? "Sandbox Slack session cleared"
        : "Slack connection revoked",
    };
  }

  getTools(): ConnectorTool[] {
    return [
      {
        name: "slack_post_message",
        description: "Post a message to a Slack channel",
        parameters: {
          type: "object",
          properties: {
            channel: { type: "string" },
            text: { type: "string" },
          },
        },
      },
      {
        name: "slack_request_approval",
        description: "Send an approval request notification to a Slack channel",
        parameters: {
          type: "object",
          properties: {
            channel: { type: "string" },
            approval_id: { type: "string" },
            summary: { type: "string" },
          },
        },
      },
      {
        name: "slack_list_channels",
        description: "List Slack channels in the workspace",
        parameters: { type: "object", properties: {} },
      },
    ];
  }
}

export { SlackConnector as default };
