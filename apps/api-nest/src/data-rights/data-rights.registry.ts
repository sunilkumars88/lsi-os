export type DataRightsZone = {
  id: string;
  name: string;
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  residency: string;
  purposes: string[];
  retentionDays: number;
  systems: string[];
  status: 'active' | 'review' | 'archived';
};

export const DATA_RIGHTS_ZONES: DataRightsZone[] = [
  {
    id: 'zone-clinical',
    name: 'Clinical trial operations',
    classification: 'restricted',
    residency: 'India / EU dual control',
    purposes: ['trial coordination', 'safety reporting', 'protocol compliance'],
    retentionDays: 2555,
    systems: ['Memory', 'Life Sciences pack', 'OpenFDA tools'],
    status: 'active',
  },
  {
    id: 'zone-banking-kyc',
    name: 'Banking KYC / AML',
    classification: 'restricted',
    residency: 'India',
    purposes: ['loan origination', 'AML screening', 'STR filing'],
    retentionDays: 3650,
    systems: ['Banking pack', 'Eyes connectors', 'Approvals'],
    status: 'active',
  },
  {
    id: 'zone-insurance-claims',
    name: 'Insurance claims & SIU',
    classification: 'confidential',
    residency: 'India',
    purposes: ['FNOL', 'underwriting', 'SIU investigation'],
    retentionDays: 2920,
    systems: ['Insurance pack', 'Hands workflows'],
    status: 'active',
  },
  {
    id: 'zone-commercial',
    name: 'Commercial CRM sync',
    classification: 'internal',
    residency: 'Multi-region',
    purposes: ['CRM sync', 'billing', 'support'],
    retentionDays: 1095,
    systems: ['Salesforce', 'HubSpot', 'Stripe', 'Razorpay'],
    status: 'review',
  },
];
