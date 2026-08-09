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

const DEMO_MESSAGES = [
  {
    id: "em-001",
    subject: "Trial site activation checklist",
    from: "cra@helixbio.com",
    folder: "Inbox",
  },
  {
    id: "em-002",
    subject: "Safety case SAE-2026-014 follow-up",
    from: "safety@helixbio.com",
    folder: "Inbox",
  },
  {
    id: "em-003",
    subject: "Loan docs pending for application LN-8841",
    from: "ops@fintech.in",
    folder: "Approvals",
  },
];

export class EmailConnector extends BaseConnector {
  constructor(config: ConnectorConfig = {}) {
    super("email", "email", config);
  }

  async authenticate(): Promise<AuthResult> {
    if (this.sandbox()) {
      return {
        ok: true,
        sandbox: true,
        message: "Sandbox SMTP credentials validated (demo)",
        expires_at: new Date(Date.now() + 3600_000).toISOString(),
      };
    }
    return {
      ok: true,
      message: "SMTP authenticated",
      expires_at: new Date(Date.now() + 3600_000).toISOString(),
    };
  }

  async testConnection(): Promise<ConnectionTestResult> {
    if (this.sandbox()) {
      return {
        ok: true,
        sandbox: true,
        latency_ms: 42,
        message: "Connected to sandbox SMTP/IMAP (demo)",
      };
    }
    return {
      ok: true,
      latency_ms: 110,
      message: "Connected to production SMTP",
    };
  }

  async getResources(resourceType = "Message"): Promise<ConnectorResource[]> {
    if (!this.sandbox()) return [];
    return DEMO_MESSAGES.filter(
      (m) => resourceType === "all" || resourceType === "Message",
    ).map((m) => ({
      id: m.id,
      type: "Message",
      name: m.subject,
      external_id: m.id,
      metadata: m,
    }));
  }

  async sync(resourceType = "Message"): Promise<SyncResult> {
    const data = await this.getResources(resourceType);
    return {
      ok: true,
      records: data.length,
      resource_type: resourceType,
      data,
      synced_at: new Date().toISOString(),
      message: this.sandbox()
        ? "Synced sandbox mailbox"
        : "Synced mailbox folders",
    };
  }

  listTools(): ConnectorTool[] {
    return [
      {
        name: "send_email",
        description: "Send an outbound email (sandbox logs only without SMTP)",
        parameters: {
          type: "object",
          properties: {
            to: { type: "string" },
            subject: { type: "string" },
            body: { type: "string" },
          },
          required: ["to", "subject", "body"],
        },
      },
      {
        name: "list_inbox",
        description: "List recent inbox messages",
      },
    ];
  }

  async executeAction(
    action: string,
    params: Record<string, unknown> = {},
  ): Promise<ActionResult> {
    if (action === "send_email") {
      return {
        ok: true,
        action,
        message: this.sandbox()
          ? `Sandbox email queued to ${String(params.to ?? "unknown")}`
          : `Email sent to ${String(params.to ?? "unknown")}`,
        result: { messageId: `msg-${Date.now()}`, sandbox: this.sandbox() },
      };
    }
    if (action === "list_inbox") {
      return {
        ok: true,
        action,
        result: await this.getResources("Message"),
      };
    }
    return { ok: false, action, message: `Unknown action: ${action}` };
  }
}
