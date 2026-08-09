export type IndustryPack = {
  id: string;
  name: string;
  short: string;
  status: "active" | "available" | "roadmap";
  description: string;
  modules: { href: string; label: string }[];
  kpis: string[];
};

export const INDUSTRY_PACKS: IndustryPack[] = [
  {
    id: "life-sciences",
    name: "Life Sciences Intelligence",
    short: "Life Sciences",
    status: "active",
    description:
      "Commercial, medical, clinical, HEOR/RWE, regulatory, and pharmacovigilance intelligence with governed AI workflows.",
    modules: [
      { href: "/commercial", label: "Commercial" },
      { href: "/medical", label: "Medical Affairs" },
      { href: "/clinical", label: "Clinical" },
      { href: "/heor", label: "HEOR / RWE" },
      { href: "/regulatory", label: "Regulatory" },
      { href: "/safety", label: "Pharmacovigilance" },
    ],
    kpis: ["Pipeline value", "Enrollment lag", "Safety signals", "HTA readiness"],
  },
  {
    id: "banking",
    name: "Banking & Financial Services",
    short: "Banking",
    status: "available",
    description: "Fraud, credit risk, KYC/AML, customer intelligence, and regulated workflow automation.",
    modules: [{ href: "/packs/banking", label: "Banking console" }],
    kpis: ["Fraud loss rate", "KYC SLA", "NPL ratio"],
  },
  {
    id: "insurance",
    name: "Insurance Intelligence",
    short: "Insurance",
    status: "available",
    description: "Claims triage, underwriting support, policy intelligence, and broker workflows.",
    modules: [{ href: "/packs/insurance", label: "Insurance console" }],
    kpis: ["Claims cycle time", "Leakage", "Combined ratio"],
  },
  {
    id: "manufacturing",
    name: "Manufacturing & Supply Chain",
    short: "Manufacturing",
    status: "available",
    description: "Plant ops, quality, supplier risk, and predictive maintenance agents.",
    modules: [{ href: "/packs/manufacturing", label: "Manufacturing console" }],
    kpis: ["OEE", "Defect rate", "Lead time"],
  },
  {
    id: "retail",
    name: "Retail & eCommerce",
    short: "Retail",
    status: "available",
    description: "Demand sensing, merchandising, CX orchestration, and inventory intelligence.",
    modules: [{ href: "/packs/retail", label: "Retail console" }],
    kpis: ["Sell-through", "Stockouts", "NPS"],
  },
  {
    id: "government",
    name: "Government & Public Sector",
    short: "Government",
    status: "available",
    description: "Casework, citizen services, policy intelligence, and secure multi-agency collaboration.",
    modules: [{ href: "/packs/government", label: "Government console" }],
    kpis: ["Case SLA", "Service satisfaction"],
  },
  {
    id: "healthcare",
    name: "Healthcare Provider",
    short: "Healthcare",
    status: "available",
    description: "Clinical operations, care pathways, revenue cycle, and provider knowledge workflows.",
    modules: [{ href: "/packs/healthcare", label: "Healthcare console" }],
    kpis: ["Length of stay", "Denial rate"],
  },
  {
    id: "energy",
    name: "Energy & Utilities",
    short: "Energy",
    status: "roadmap",
    description: "Asset reliability, grid intelligence, and field operations automation.",
    modules: [{ href: "/packs/energy", label: "Energy console" }],
    kpis: ["Uptime", "SAIDI"],
  },
  {
    id: "telecom",
    name: "Telecommunications",
    short: "Telecom",
    status: "roadmap",
    description: "Network ops, churn prevention, and service assurance agents.",
    modules: [{ href: "/packs/telecom", label: "Telecom console" }],
    kpis: ["Churn", "MTTR"],
  },
  {
    id: "legal",
    name: "Legal Intelligence",
    short: "Legal",
    status: "available",
    description: "Contract intelligence, matter workflows, and citation-grounded research.",
    modules: [{ href: "/packs/legal", label: "Legal console" }],
    kpis: ["Cycle time", "Risk flags"],
  },
  {
    id: "hr",
    name: "People / HR Intelligence",
    short: "HR",
    status: "roadmap",
    description: "Talent workflows, policy Q&A with governance, and workforce analytics.",
    modules: [{ href: "/packs/hr", label: "HR console" }],
    kpis: ["Time-to-hire", "Attrition"],
  },
  {
    id: "logistics",
    name: "Logistics",
    short: "Logistics",
    status: "roadmap",
    description: "Route optimization intelligence, exception handling, and partner orchestration.",
    modules: [{ href: "/packs/logistics", label: "Logistics console" }],
    kpis: ["OTIF", "Cost/ton-mile"],
  },
  {
    id: "education",
    name: "Education",
    short: "Education",
    status: "roadmap",
    description: "Learner operations, institutional knowledge, and advising workflows.",
    modules: [{ href: "/packs/education", label: "Education console" }],
    kpis: ["Retention", "Completion"],
  },
];

export const CORE_OS_NAV = [
  { href: "/dashboard", label: "Command Center", group: "Operate" },
  { href: "/copilot", label: "Intelligence Copilot", group: "Operate" },
  { href: "/agents", label: "Agent Runtime", group: "Operate" },
  { href: "/workflows", label: "Workflow Engine", group: "Operate" },
  { href: "/approvals", label: "Human Approvals", group: "Operate" },
  { href: "/knowledge", label: "Enterprise Memory", group: "Know" },
  { href: "/graph", label: "Knowledge Graph", group: "Know" },
  { href: "/data-rights", label: "Data Rights Registry", group: "Know" },
  { href: "/integrations", label: "Integration Hub", group: "Connect" },
  { href: "/router", label: "Model Router", group: "Connect" },
  { href: "/industry-packs", label: "Industry Packs", group: "Extend" },
  { href: "/marketplace", label: "Marketplace", group: "Extend" },
  { href: "/admin", label: "Governance", group: "Govern" },
  { href: "/settings", label: "Settings", group: "Govern" },
] as const;

export const DEFAULT_PACK_ID = "life-sciences";

/** Where a pack opens after login / from marketing CTAs. */
export function packWorkspaceHref(packId: string) {
  return `/packs/${packId}`;
}

export function packLoginHref(packId: string) {
  const next = packWorkspaceHref(packId);
  return `/login?pack=${encodeURIComponent(packId)}&next=${encodeURIComponent(next)}`;
}
