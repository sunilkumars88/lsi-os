export interface IndustryPack {
  id: string;
  name: string;
  industry: string;
  description: string;
  agents: { id: string; name: string; description: string; requiresApproval: boolean }[];
  workflows: { id: string; name: string; description: string }[];
  actions: { id: string; name: string; description: string }[];
  pricing: { starter: string; professional: string; enterprise: string };
}

export const PACKS: IndustryPack[] = [
  {
    id: 'life-sciences',
    name: 'Life Sciences Pack',
    industry: 'pharma',
    description:
      'Patient recruitment, protocol compliance, safety monitoring, and CDSCO-ready documentation.',
    agents: [
      {
        id: 'trial_coordinator',
        name: 'Trial Coordinator',
        description: 'Eligibility, recruitment letters, visit tracking',
        requiresApproval: false,
      },
      {
        id: 'safety_monitor',
        name: 'Safety Monitoring',
        description: 'AE tracking and Grade 3+ alerts',
        requiresApproval: true,
      },
      {
        id: 'protocol_compliance',
        name: 'Protocol Compliance',
        description: 'GCP/CDSCO deviation checks',
        requiresApproval: true,
      },
      {
        id: 'regulatory_docs',
        name: 'Regulatory Documentation',
        description: 'CDSCO-compliant report drafts',
        requiresApproval: true,
      },
    ],
    workflows: [
      {
        id: 'patient_recruitment',
        name: 'Patient Recruitment',
        description: 'Extract → eligibility → letter → track → enroll',
      },
      {
        id: 'safety_reporting',
        name: 'Safety Reporting',
        description: 'Log AE → severity → alert → report',
      },
      {
        id: 'trial_closeout',
        name: 'Trial Closeout',
        description: 'Collect → verify → report → archive',
      },
    ],
    actions: [
      { id: 'trial-brief', name: 'Trial Brief', description: 'Generate trial intelligence brief' },
      { id: 'safety-scan', name: 'Safety Scan', description: 'Scan safety literature and FAERS' },
      { id: 'regulatory-pack', name: 'Regulatory Pack', description: 'CDSCO / FDA readiness checklist' },
    ],
    pricing: {
      starter: '₹50,000/month',
      professional: '₹2,00,000/month',
      enterprise: '₹5,00,000+/month',
    },
  },
  {
    id: 'banking',
    name: 'Banking Pack',
    industry: 'banking',
    description: 'Loan origination, fraud detection, AML/KYC, and regulated customer support.',
    agents: [
      {
        id: 'loan_originator',
        name: 'Loan Origination',
        description: 'Extract details, KYC/CIBIL checks, risk score',
        requiresApproval: true,
      },
      {
        id: 'fraud_detector',
        name: 'Fraud Detection',
        description: 'Real-time anomaly scoring',
        requiresApproval: false,
      },
      {
        id: 'aml_compliance',
        name: 'AML/KYC Compliance',
        description: 'PEP/sanctions screen and STR prep',
        requiresApproval: true,
      },
      {
        id: 'customer_support',
        name: 'Customer Support',
        description: 'Account queries with grounded answers',
        requiresApproval: false,
      },
    ],
    workflows: [
      {
        id: 'loan_auto_decision',
        name: 'Loan Auto-Decision',
        description: 'Ingest app → KYC → score → approve/reject gate',
      },
      {
        id: 'str_filing',
        name: 'STR Filing',
        description: 'Alert → investigate → draft STR → human approve',
      },
    ],
    actions: [
      { id: 'kyc-review', name: 'KYC Review', description: 'Review customer KYC documents' },
      { id: 'aml-alert', name: 'AML Alert Triage', description: 'Triage AML alerts' },
      { id: 'credit-memo', name: 'Credit Memo', description: 'Draft credit risk memo' },
    ],
    pricing: {
      starter: '₹75,000/month',
      professional: '₹2,50,000/month',
      enterprise: '₹6,00,000+/month',
    },
  },
  {
    id: 'insurance',
    name: 'Insurance Pack',
    industry: 'insurance',
    description: 'Claims triage, underwriting support, and SIU pattern detection.',
    agents: [
      {
        id: 'claims_triage',
        name: 'Claims Triage',
        description: 'FNOL classification and routing',
        requiresApproval: false,
      },
      {
        id: 'underwriting',
        name: 'Underwriting Support',
        description: 'Referral packs and risk notes',
        requiresApproval: true,
      },
      {
        id: 'siu',
        name: 'SIU Pattern Finder',
        description: 'Suspicious claim clustering',
        requiresApproval: true,
      },
    ],
    workflows: [
      {
        id: 'fnol_to_settle',
        name: 'FNOL → Settlement',
        description: 'Intake → triage → investigate → settle/approve',
      },
    ],
    actions: [
      { id: 'claims-triage', name: 'Claims Triage', description: 'Classify and route claims' },
      { id: 'policy-compare', name: 'Policy Compare', description: 'Compare policy variants' },
      { id: 'underwriting-brief', name: 'Underwriting Brief', description: 'Generate underwriting summary' },
    ],
    pricing: {
      starter: '₹60,000/month',
      professional: '₹2,20,000/month',
      enterprise: '₹5,50,000+/month',
    },
  },
];
