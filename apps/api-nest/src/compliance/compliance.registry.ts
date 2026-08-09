export type ChecklistItem = {
  id: string;
  title: string;
  status: 'implemented' | 'partial' | 'planned';
  owner: 'code' | 'account';
  notes: string;
};

export type ComplianceFramework = {
  id: string;
  name: string;
  region: string;
  description: string;
  items: ChecklistItem[];
};

export const COMPLIANCE_FRAMEWORKS: ComplianceFramework[] = [
  {
    id: 'soc2',
    name: 'SOC 2',
    region: 'Global',
    description: 'Trust services criteria for security and availability.',
    items: [
      {
        id: 'soc2-audit',
        title: 'Immutable audit logging',
        status: 'implemented',
        owner: 'code',
        notes: 'audit_logs table + export API',
      },
      {
        id: 'soc2-rbac',
        title: 'Role-based access control',
        status: 'implemented',
        owner: 'code',
        notes: 'Admin/Manager/Operator/Viewer guards',
      },
      {
        id: 'soc2-attest',
        title: 'External SOC 2 Type II attestation',
        status: 'planned',
        owner: 'account',
        notes: 'Requires auditor engagement',
      },
    ],
  },
  {
    id: 'gdpr',
    name: 'GDPR',
    region: 'EU',
    description: 'EU personal data rights and lawful processing.',
    items: [
      {
        id: 'gdpr-rights',
        title: 'Data subject rights registry',
        status: 'implemented',
        owner: 'code',
        notes: 'Data-rights zones + review workflow',
      },
      {
        id: 'gdpr-dpa',
        title: 'Processor DPAs with vendors',
        status: 'partial',
        owner: 'account',
        notes: 'Template docs; legal execution needed',
      },
    ],
  },
  {
    id: 'dpdp',
    name: 'DPDP Act 2023',
    region: 'India',
    description: 'India Digital Personal Data Protection Act.',
    items: [
      {
        id: 'dpdp-consent',
        title: 'Purpose limitation + consent tracking',
        status: 'partial',
        owner: 'code',
        notes: 'Zones modeled; consent UI partial',
      },
      {
        id: 'dpdp-localize',
        title: 'India-region hosting option',
        status: 'planned',
        owner: 'account',
        notes: 'Compose/AWS India region when authorized',
      },
    ],
  },
  {
    id: 'cdsco',
    name: 'CDSCO',
    region: 'India',
    description: 'Clinical trial and drug safety regulatory controls.',
    items: [
      {
        id: 'cdsco-safety',
        title: 'Safety Monitor agent + SAE workflows',
        status: 'implemented',
        owner: 'code',
        notes: 'Life Sciences pack',
      },
      {
        id: 'cdsco-protocol',
        title: 'Protocol compliance checkpoints',
        status: 'implemented',
        owner: 'code',
        notes: 'Protocol Compliance agent',
      },
    ],
  },
  {
    id: 'rbi',
    name: 'RBI',
    region: 'India',
    description: 'Banking AML/KYC and operational controls.',
    items: [
      {
        id: 'rbi-aml',
        title: 'AML/KYC compliance agent',
        status: 'implemented',
        owner: 'code',
        notes: 'Banking pack',
      },
      {
        id: 'rbi-str',
        title: 'STR filing workflow',
        status: 'partial',
        owner: 'code',
        notes: 'Sandbox workflow; live FIU filing Needs account',
      },
    ],
  },
  {
    id: 'irdai',
    name: 'IRDAI',
    region: 'India',
    description: 'Insurance underwriting, claims, and SIU governance.',
    items: [
      {
        id: 'irdai-claims',
        title: 'FNOL → settle claims workflow',
        status: 'implemented',
        owner: 'code',
        notes: 'Insurance pack',
      },
      {
        id: 'irdai-messaging',
        title: 'IRDAI customer disclosure messaging',
        status: 'partial',
        owner: 'code',
        notes: 'GTM copy + notify node; production templates Needs account',
      },
    ],
  },
];
