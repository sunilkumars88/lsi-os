export interface PricingPlan {
  id: string;
  name: string;
  currency: 'INR';
  monthlyInr: number;
  annualInr: number;
  features: string[];
  limits: Record<string, number | string>;
}

export const INR_PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    currency: 'INR',
    monthlyInr: 4999,
    annualInr: 49990,
    features: ['5 users', 'Knowledge base', 'Basic workflows', 'Email support'],
    limits: { users: 5, documents: 500, agentRuns: 200 },
  },
  {
    id: 'professional',
    name: 'Professional',
    currency: 'INR',
    monthlyInr: 19999,
    annualInr: 199990,
    features: [
      '25 users',
      'Industry packs',
      'Connectors (sandbox)',
      'Approvals & audit',
      'Priority support',
    ],
    limits: { users: 25, documents: 5000, agentRuns: 2000 },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    currency: 'INR',
    monthlyInr: 79999,
    annualInr: 799990,
    features: [
      'Unlimited users',
      'Custom workflows',
      'Production connectors',
      'SSO & RBAC',
      'Dedicated success manager',
    ],
    limits: { users: 'unlimited', documents: 'unlimited', agentRuns: 'unlimited' },
  },
];
