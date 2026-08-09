export type ConnectorConfig = {
  sandbox?: boolean;
  credentials?: Record<string, string | undefined>;
  [key: string]: unknown;
};

export type ConnectorResource = {
  id: string;
  type: string;
  name: string;
  external_id?: string;
  metadata?: Record<string, unknown>;
};

export type SyncResult = {
  ok: boolean;
  records: number;
  resource_type?: string;
  data: unknown[];
  synced_at: string;
  message?: string;
};

export type ConnectionTestResult = {
  ok: boolean;
  latency_ms?: number;
  message?: string;
  sandbox?: boolean;
};

export type AuthResult = {
  ok: boolean;
  message?: string;
  expires_at?: string;
  sandbox?: boolean;
};

export type ConnectorTool = {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
};

export type ActionResult = {
  ok: boolean;
  action: string;
  result?: unknown;
  message?: string;
};

const SECRET_KEYS = [
  "api_key",
  "apiKey",
  "access_token",
  "accessToken",
  "client_secret",
  "clientSecret",
  "private_key",
  "privateKey",
  "password",
  "secret",
  "token",
  "webhook_secret",
];

export function isSandboxMode(config: ConnectorConfig): boolean {
  if (config.sandbox === true) {
    return true;
  }

  const credentials = config.credentials ?? config;
  const hasSecret = SECRET_KEYS.some((key) => {
    const value = credentials[key];
    return typeof value === "string" && value.trim().length > 0;
  });

  return !hasSecret;
}

export abstract class BaseConnector {
  readonly id: string;
  readonly provider: string;
  protected config: ConnectorConfig;

  constructor(id: string, provider: string, config: ConnectorConfig = {}) {
    this.id = id;
    this.provider = provider;
    this.config = config;
  }

  protected sandbox(): boolean {
    return isSandboxMode(this.config);
  }

  abstract authenticate(): Promise<AuthResult>;
  abstract testConnection(): Promise<ConnectionTestResult>;
  abstract getResources(resourceType?: string): Promise<ConnectorResource[]>;
  abstract syncData(resourceType?: string): Promise<SyncResult>;
  abstract performAction(
    action: string,
    params?: Record<string, unknown>,
  ): Promise<ActionResult>;
  abstract disconnect(): Promise<{ ok: boolean; message?: string }>;
  abstract getTools(): ConnectorTool[];

  protected now(): string {
    return new Date().toISOString();
  }
}
