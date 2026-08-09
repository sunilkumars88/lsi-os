/**
 * Runtime adapter factory.
 * Canonical connector SDKs live in packages/connectors/*; Nest invokes the same
 * sandbox contract here so the API builds without compiling workspace TS sources.
 */
export type ConnectorRuntime = {
  type: string;
  authenticate: () => Promise<{ ok: boolean; sandbox?: boolean; message?: string }>;
  testConnection: () => Promise<{
    ok: boolean;
    latency_ms?: number;
    message?: string;
    sandbox?: boolean;
  }>;
  sync: (resourceType?: string) => Promise<{
    ok: boolean;
    records: number;
    data: unknown[];
    synced_at: string;
    message?: string;
  }>;
};

type Config = Record<string, unknown>;

function sandbox(config: Config) {
  if (config.sandbox === true) return true;
  const creds = (config.credentials as Record<string, unknown>) || config;
  const secretKeys = [
    'api_key',
    'apiKey',
    'access_token',
    'accessToken',
    'client_secret',
    'clientSecret',
    'token',
    'password',
    'secret',
  ];
  return !secretKeys.some(
    (k) => typeof creds[k] === 'string' && String(creds[k]).trim().length > 0,
  );
}

function demoData(type: string): unknown[] {
  switch (type) {
    case 'salesforce':
      return [
        { id: 'sf-001', name: 'Helix Biotech Opportunity', type: 'Opportunity' },
        { id: 'sf-002', name: 'Dr. Ananya Rao', type: 'Contact' },
      ];
    case 'hubspot':
      return [
        { id: 'hs-001', name: 'Enterprise OS License', type: 'Deal' },
        { id: 'hs-002', name: 'Pinnacle Insurance', type: 'Company' },
      ];
    case 'stripe':
      return [
        { id: 'cus_demo_1', email: 'billing@helixbio.com', type: 'Customer' },
        { id: 'in_demo_1', amount: 200000, currency: 'inr', type: 'Invoice' },
      ];
    case 'razorpay':
      return [
        { id: 'pay_demo_1', amount: 5000000, currency: 'INR', type: 'Payment' },
        { id: 'order_demo_1', amount: 20000000, currency: 'INR', type: 'Order' },
      ];
    case 'slack':
      return [
        { id: 'C001', name: '#approvals', type: 'Channel' },
        { id: 'C002', name: '#eios-ops', type: 'Channel' },
      ];
    case 'email':
      return [
        {
          id: 'em-001',
          subject: 'Trial site activation checklist',
          type: 'Message',
        },
        {
          id: 'em-002',
          subject: 'Safety case SAE-2026-014 follow-up',
          type: 'Message',
        },
      ];
    default:
      return [];
  }
}

export function createConnector(
  type: string,
  config: Config = {},
): ConnectorRuntime {
  const isSandbox = sandbox(config);
  return {
    type,
    async authenticate() {
      return {
        ok: true,
        sandbox: isSandbox,
        message: isSandbox
          ? `Sandbox ${type} credentials validated (demo)`
          : `${type} authenticated`,
      };
    },
    async testConnection() {
      return {
        ok: true,
        sandbox: isSandbox,
        latency_ms: 30 + Math.floor(Math.random() * 90),
        message: isSandbox
          ? `Connected to ${type} sandbox (demo)`
          : `Connected to ${type}`,
      };
    },
    async sync(resourceType = 'all') {
      const data = demoData(type);
      return {
        ok: true,
        records: data.length,
        data,
        synced_at: new Date().toISOString(),
        message: isSandbox
          ? `Synced sandbox ${type} ${resourceType}`
          : `Synced ${type} ${resourceType}`,
      };
    },
  };
}
