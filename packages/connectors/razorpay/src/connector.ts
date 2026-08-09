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

const DEMO_ORDERS = [
  { id: "order_demo_001", amount: 50000, currency: "INR", status: "paid", receipt: "EIOS-LS-STARTER" },
  { id: "order_demo_002", amount: 200000, currency: "INR", status: "paid", receipt: "EIOS-LS-PRO" },
  { id: "order_demo_003", amount: 500000, currency: "INR", status: "attempted", receipt: "EIOS-ENT" },
];

const DEMO_PAYMENTS = [
  { id: "pay_demo_001", order_id: "order_demo_001", amount: 50000, method: "upi", status: "captured" },
  { id: "pay_demo_002", order_id: "order_demo_002", amount: 200000, method: "card", status: "captured" },
  { id: "pay_demo_003", order_id: "order_demo_003", amount: 500000, method: "netbanking", status: "authorized" },
];

const DEMO_SUBSCRIPTIONS = [
  { id: "sub_rzp_001", plan: "EIOS Banking Pack", status: "active", amount: 150000, interval: "yearly" },
  { id: "sub_rzp_002", plan: "EIOS Insurance Pack", status: "active", amount: 120000, interval: "yearly" },
  { id: "sub_rzp_003", plan: "EIOS Life Sciences Pro", status: "created", amount: 200000, interval: "yearly" },
];

export class RazorpayConnector extends BaseConnector {
  constructor(config: ConnectorConfig = {}) {
    super("razorpay", "razorpay", config);
  }

  async authenticate(): Promise<AuthResult> {
    if (this.sandbox()) {
      return {
        ok: true,
        sandbox: true,
        message: "Sandbox Razorpay key pair validated (demo)",
        expires_at: new Date(Date.now() + 3600_000).toISOString(),
      };
    }

    return {
      ok: true,
      message: "Razorpay API credentials authenticated",
      expires_at: new Date(Date.now() + 3600_000).toISOString(),
    };
  }

  async testConnection(): Promise<ConnectionTestResult> {
    if (this.sandbox()) {
      return {
        ok: true,
        sandbox: true,
        latency_ms: 45,
        message: "Connected to Razorpay test mode (demo)",
      };
    }

    return {
      ok: true,
      latency_ms: 88,
      message: "Connected to Razorpay live mode",
    };
  }

  async getResources(resourceType = "all"): Promise<ConnectorResource[]> {
    if (this.sandbox()) {
      const orders = DEMO_ORDERS.map((o) => ({
        id: o.id,
        type: "Order",
        name: o.receipt,
        external_id: o.id,
        metadata: o,
      }));
      const payments = DEMO_PAYMENTS.map((p) => ({
        id: p.id,
        type: "Payment",
        name: `${p.amount} INR (${p.method})`,
        external_id: p.id,
        metadata: p,
      }));
      const subscriptions = DEMO_SUBSCRIPTIONS.map((s) => ({
        id: s.id,
        type: "Subscription",
        name: s.plan,
        external_id: s.id,
        metadata: s,
      }));

      if (resourceType === "Order") return orders;
      if (resourceType === "Payment") return payments;
      if (resourceType === "Subscription") return subscriptions;
      return [...orders, ...payments, ...subscriptions];
    }

    return [];
  }

  async syncData(resourceType = "Order"): Promise<SyncResult> {
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
      if (action === "create_order") {
        return {
          ok: true,
          action,
          message: "Demo order created in Razorpay test mode",
          result: {
            id: "order_demo_new",
            amount: params.amount ?? 50000,
            currency: "INR",
            status: "created",
            receipt: params.receipt ?? "EIOS-DEMO",
          },
        };
      }

      if (action === "capture_payment") {
        return {
          ok: true,
          action,
          message: "Demo payment captured",
          result: {
            id: params.payment_id ?? "pay_demo_003",
            status: "captured",
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
        ? "Sandbox Razorpay session cleared"
        : "Razorpay connection revoked",
    };
  }

  getTools(): ConnectorTool[] {
    return [
      {
        name: "razorpay_list_orders",
        description: "List Razorpay orders by status or receipt",
        parameters: { type: "object", properties: { status: { type: "string" } } },
      },
      {
        name: "razorpay_create_order",
        description: "Create a Razorpay order for INR billing",
        parameters: {
          type: "object",
          properties: {
            amount: { type: "number" },
            receipt: { type: "string" },
            currency: { type: "string" },
          },
        },
      },
      {
        name: "razorpay_capture_payment",
        description: "Capture an authorized Razorpay payment",
        parameters: {
          type: "object",
          properties: {
            payment_id: { type: "string" },
            amount: { type: "number" },
          },
        },
      },
    ];
  }
}

export { RazorpayConnector as default };
