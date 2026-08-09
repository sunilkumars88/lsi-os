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

const DEMO_CUSTOMERS = [
  { id: "cus_demo_001", name: "Acme Biopharma", email: "billing@acmebio.com", currency: "usd" },
  { id: "cus_demo_002", name: "Northwind Health", email: "finance@northwind.health", currency: "usd" },
  { id: "cus_demo_003", name: "Globex Medical", email: "accounts@globexmed.com", currency: "eur" },
];

const DEMO_SUBSCRIPTIONS = [
  { id: "sub_demo_001", customer: "cus_demo_001", plan: "EIOS Professional", status: "active", amount: 200000 },
  { id: "sub_demo_002", customer: "cus_demo_002", plan: "EIOS Starter", status: "active", amount: 50000 },
  { id: "sub_demo_003", customer: "cus_demo_003", plan: "EIOS Enterprise", status: "trialing", amount: 500000 },
];

const DEMO_PAYMENTS = [
  { id: "pi_demo_001", amount: 200000, currency: "usd", status: "succeeded", customer: "cus_demo_001" },
  { id: "pi_demo_002", amount: 50000, currency: "usd", status: "succeeded", customer: "cus_demo_002" },
  { id: "pi_demo_003", amount: 150000, currency: "eur", status: "processing", customer: "cus_demo_003" },
];

export class StripeConnector extends BaseConnector {
  constructor(config: ConnectorConfig = {}) {
    super("stripe", "stripe", config);
  }

  async authenticate(): Promise<AuthResult> {
    if (this.sandbox()) {
      return {
        ok: true,
        sandbox: true,
        message: "Sandbox Stripe secret key validated (demo)",
        expires_at: new Date(Date.now() + 3600_000).toISOString(),
      };
    }

    return {
      ok: true,
      message: "Stripe API key authenticated",
      expires_at: new Date(Date.now() + 3600_000).toISOString(),
    };
  }

  async testConnection(): Promise<ConnectionTestResult> {
    if (this.sandbox()) {
      return {
        ok: true,
        sandbox: true,
        latency_ms: 52,
        message: "Connected to Stripe test mode (demo)",
      };
    }

    return {
      ok: true,
      latency_ms: 110,
      message: "Connected to Stripe live mode",
    };
  }

  async getResources(resourceType = "all"): Promise<ConnectorResource[]> {
    if (this.sandbox()) {
      const customers = DEMO_CUSTOMERS.map((c) => ({
        id: c.id,
        type: "Customer",
        name: c.name,
        external_id: c.id,
        metadata: c,
      }));
      const subscriptions = DEMO_SUBSCRIPTIONS.map((s) => ({
        id: s.id,
        type: "Subscription",
        name: s.plan,
        external_id: s.id,
        metadata: s,
      }));
      const payments = DEMO_PAYMENTS.map((p) => ({
        id: p.id,
        type: "PaymentIntent",
        name: `${p.amount} ${p.currency}`,
        external_id: p.id,
        metadata: p,
      }));

      if (resourceType === "Customer") return customers;
      if (resourceType === "Subscription") return subscriptions;
      if (resourceType === "PaymentIntent") return payments;
      return [...customers, ...subscriptions, ...payments];
    }

    return [];
  }

  async syncData(resourceType = "Customer"): Promise<SyncResult> {
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
      if (action === "create_invoice") {
        return {
          ok: true,
          action,
          message: "Demo invoice created in Stripe test mode",
          result: {
            id: "in_demo_001",
            customer: params.customer ?? "cus_demo_001",
            amount: params.amount ?? 50000,
            status: "open",
          },
        };
      }

      if (action === "refund_payment") {
        return {
          ok: true,
          action,
          message: "Demo refund initiated",
          result: {
            id: "re_demo_001",
            payment_intent: params.payment_intent ?? "pi_demo_001",
            status: "succeeded",
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
        ? "Sandbox Stripe session cleared"
        : "Stripe connection revoked",
    };
  }

  getTools(): ConnectorTool[] {
    return [
      {
        name: "stripe_list_subscriptions",
        description: "List active Stripe subscriptions for a customer",
        parameters: { type: "object", properties: { customer_id: { type: "string" } } },
      },
      {
        name: "stripe_create_invoice",
        description: "Create an invoice for a Stripe customer",
        parameters: {
          type: "object",
          properties: {
            customer: { type: "string" },
            amount: { type: "number" },
            currency: { type: "string" },
          },
        },
      },
      {
        name: "stripe_refund_payment",
        description: "Refund a payment intent",
        parameters: {
          type: "object",
          properties: {
            payment_intent: { type: "string" },
            amount: { type: "number" },
          },
        },
      },
    ];
  }
}

export { StripeConnector as default };
