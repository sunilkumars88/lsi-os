export const CONNECTOR_REGISTRY = [
  {
    type: 'salesforce',
    name: 'Salesforce',
    description: 'CRM data sync',
    sandboxFields: ['instanceUrl', 'clientId'],
  },
  {
    type: 'hubspot',
    name: 'HubSpot',
    description: 'Marketing and CRM',
    sandboxFields: ['portalId', 'apiKey'],
  },
  {
    type: 'stripe',
    name: 'Stripe',
    description: 'Payments and billing',
    sandboxFields: ['accountId'],
  },
  {
    type: 'razorpay',
    name: 'Razorpay',
    description: 'India payments',
    sandboxFields: ['merchantId'],
  },
  {
    type: 'slack',
    name: 'Slack',
    description: 'Team notifications',
    sandboxFields: ['workspaceId', 'channel'],
  },
  {
    type: 'email',
    name: 'Email',
    description: 'SMTP/IMAP connector',
    sandboxFields: ['smtpHost', 'fromAddress'],
  },
] as const;

export type ConnectorType = (typeof CONNECTOR_REGISTRY)[number]['type'];
