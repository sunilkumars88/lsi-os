export type PackWorkspace = {
  id: string;
  name: string;
  kpis: { label: string; value: string; delta: string }[];
  queues: { id: string; title: string; owner: string; priority: string; status: string }[];
  agents: { id: string; name: string; last_run: string; outcome: string }[];
  workflows: { id: string; name: string; status: string }[];
  insights: string[];
  actions: string[];
};

const PACKS: Record<string, PackWorkspace> = {
  banking: {
    id: "banking",
    name: "Banking & Financial Services",
    kpis: [
      { label: "Fraud loss rate", value: "4.2 bps", delta: "-0.6 bps" },
      { label: "KYC SLA", value: "92%", delta: "+3%" },
      { label: "NPL ratio", value: "1.8%", delta: "stable" },
      { label: "Alerts cleared", value: "1,204", delta: "+18%" },
    ],
    queues: [
      { id: "b1", title: "High-risk wire review — Corp desk", owner: "Fraud Ops", priority: "high", status: "open" },
      { id: "b2", title: "KYC refresh overdue — SME portfolio", owner: "Onboarding", priority: "medium", status: "in_progress" },
      { id: "b3", title: "Credit exception — mid-market facility", owner: "Credit", priority: "high", status: "open" },
    ],
    agents: [
      { id: "ba1", name: "Fraud Triage Agent", last_run: "2m ago", outcome: "12 cases scored" },
      { id: "ba2", name: "KYC Document Checker", last_run: "11m ago", outcome: "8 docs extracted" },
      { id: "ba3", name: "Credit Memo Drafter", last_run: "1h ago", outcome: "Awaiting approval" },
    ],
    workflows: [
      { id: "bw1", name: "SAR preparation", status: "ready" },
      { id: "bw2", name: "Onboarding exception path", status: "ready" },
    ],
    insights: [
      "Fraud spikes correlate with new device fingerprints in retail banking app.",
      "KYC backlog concentrated in jurisdictions requiring enhanced due diligence.",
    ],
    actions: ["Run Fraud Triage on overnight alerts", "Approve credit memo draft", "Clear KYC queue top 20"],
  },
  insurance: {
    id: "insurance",
    name: "Insurance Intelligence",
    kpis: [
      { label: "Claims cycle time", value: "9.4d", delta: "-1.1d" },
      { label: "Leakage estimate", value: "$2.1M", delta: "-8%" },
      { label: "Combined ratio", value: "96.2", delta: "-0.4" },
      { label: "FNOL auto-triage", value: "78%", delta: "+5%" },
    ],
    queues: [
      { id: "i1", title: "Complex bodily injury claim", owner: "Claims", priority: "high", status: "open" },
      { id: "i2", title: "Underwriting referral — commercial property", owner: "UW", priority: "medium", status: "in_progress" },
    ],
    agents: [
      { id: "ia1", name: "Claims Intake Agent", last_run: "4m ago", outcome: "36 FNOLs classified" },
      { id: "ia2", name: "SIU Pattern Finder", last_run: "40m ago", outcome: "3 referrals" },
    ],
    workflows: [
      { id: "iw1", name: "Fast-track claim settlement", status: "ready" },
      { id: "iw2", name: "Underwriting referral pack", status: "ready" },
    ],
    insights: ["Auto glass claims show seasonal surge in Region West.", "SIU model flags vendor concentration risk."],
    actions: ["Triage overnight FNOLs", "Generate UW referral brief", "Review SIU referrals"],
  },
  healthcare: {
    id: "healthcare",
    name: "Healthcare Provider",
    kpis: [
      { label: "Length of stay", value: "4.6d", delta: "-0.2d" },
      { label: "Denial rate", value: "6.1%", delta: "-0.8%" },
      { label: "OR utilization", value: "81%", delta: "+2%" },
      { label: "Care gap closure", value: "64%", delta: "+4%" },
    ],
    queues: [
      { id: "h1", title: "Denial appeal pack — cardiology", owner: "RCM", priority: "high", status: "open" },
      { id: "h2", title: "Discharge planning delay — Ward B", owner: "Care Mgmt", priority: "medium", status: "open" },
    ],
    agents: [
      { id: "ha1", name: "Denial Prevention Agent", last_run: "9m ago", outcome: "22 claims reviewed" },
      { id: "ha2", name: "Care Pathway Copilot", last_run: "25m ago", outcome: "14 summaries" },
    ],
    workflows: [
      { id: "hw1", name: "Denial appeal assembly", status: "ready" },
      { id: "hw2", name: "Discharge checklist", status: "ready" },
    ],
    insights: ["Top denial reason: missing auth for imaging.", "LOS outliers concentrated in respiratory DRGs."],
    actions: ["Build appeal pack", "Flag LOS outliers", "Close diabetes care gaps"],
  },
  manufacturing: {
    id: "manufacturing",
    name: "Manufacturing & Supply Chain",
    kpis: [
      { label: "OEE", value: "74%", delta: "+2%" },
      { label: "Defect rate", value: "1.3%", delta: "-0.2%" },
      { label: "Lead time", value: "12.4d", delta: "-0.8d" },
      { label: "Supplier risk", value: "7 open", delta: "-2" },
    ],
    queues: [
      { id: "m1", title: "Line 3 vibration anomaly", owner: "Maintenance", priority: "high", status: "open" },
      { id: "m2", title: "Supplier delay — PCB lot", owner: "Procurement", priority: "high", status: "in_progress" },
    ],
    agents: [
      { id: "ma1", name: "Predictive Maintenance Agent", last_run: "6m ago", outcome: "2 work orders drafted" },
      { id: "ma2", name: "Quality Root-Cause Agent", last_run: "33m ago", outcome: "Pareto updated" },
    ],
    workflows: [
      { id: "mw1", name: "Breakdown response", status: "ready" },
      { id: "mw2", name: "Supplier risk escalation", status: "ready" },
    ],
    insights: ["Bearing temperature trend predicts failure within 72h on Line 3.", "Single-source PCB supplier elevates continuity risk."],
    actions: ["Create maintenance WO", "Escalate supplier risk", "Run quality pareto"],
  },
  retail: {
    id: "retail",
    name: "Retail & eCommerce",
    kpis: [
      { label: "Sell-through", value: "68%", delta: "+3%" },
      { label: "Stockouts", value: "2.4%", delta: "-0.5%" },
      { label: "NPS", value: "47", delta: "+2" },
      { label: "Promo ROI", value: "3.1x", delta: "+0.2x" },
    ],
    queues: [
      { id: "r1", title: "Replenish SKU-8841 — DC East", owner: "Merch", priority: "high", status: "open" },
      { id: "r2", title: "Promo conflict — weekend bundle", owner: "Pricing", priority: "medium", status: "open" },
    ],
    agents: [
      { id: "ra1", name: "Demand Sensing Agent", last_run: "5m ago", outcome: "12 SKUs reforecast" },
      { id: "ra2", name: "CX Recovery Agent", last_run: "20m ago", outcome: "47 tickets summarized" },
    ],
    workflows: [
      { id: "rw1", name: "Stockout prevention", status: "ready" },
      { id: "rw2", name: "Promo approval", status: "ready" },
    ],
    insights: ["Weather-driven demand uplift expected in apparel South region.", "Returns clustering on size chart mismatch."],
    actions: ["Replenish risk SKUs", "Approve promo", "Summarize CX themes"],
  },
  government: {
    id: "government",
    name: "Government & Public Sector",
    kpis: [
      { label: "Case SLA", value: "88%", delta: "+4%" },
      { label: "Service CSAT", value: "4.1", delta: "+0.2" },
      { label: "Backlog", value: "612", delta: "-9%" },
      { label: "FOIA on-time", value: "91%", delta: "+1%" },
    ],
    queues: [
      { id: "g1", title: "Benefits eligibility appeal", owner: "Casework", priority: "high", status: "open" },
      { id: "g2", title: "Policy briefing — housing", owner: "Policy", priority: "medium", status: "in_progress" },
    ],
    agents: [
      { id: "ga1", name: "Case Intake Agent", last_run: "3m ago", outcome: "54 cases classified" },
      { id: "ga2", name: "Policy Research Agent", last_run: "1h ago", outcome: "Brief drafted" },
    ],
    workflows: [
      { id: "gw1", name: "Appeal adjudication pack", status: "ready" },
      { id: "gw2", name: "Citizen response approval", status: "ready" },
    ],
    insights: ["Backlog aging worst in benefits appeals >30 days.", "Housing policy queries surged after new ordinance."],
    actions: ["Assemble appeal pack", "Approve citizen response", "Prioritize aged cases"],
  },
  energy: {
    id: "energy",
    name: "Energy & Utilities",
    kpis: [
      { label: "Uptime", value: "99.92%", delta: "+0.01%" },
      { label: "SAIDI", value: "68m", delta: "-4m" },
      { label: "Field jobs done", value: "312", delta: "+6%" },
      { label: "Asset risk", value: "14", delta: "-2" },
    ],
    queues: [
      { id: "e1", title: "Transformer overload risk — Substation 12", owner: "Grid Ops", priority: "high", status: "open" },
    ],
    agents: [
      { id: "ea1", name: "Asset Risk Agent", last_run: "8m ago", outcome: "5 assets flagged" },
      { id: "ea2", name: "Outage Comms Agent", last_run: "15m ago", outcome: "Draft ready" },
    ],
    workflows: [{ id: "ew1", name: "Storm response", status: "ready" }],
    insights: ["Load forecasts indicate Substation 12 risk during evening peak."],
    actions: ["Dispatch inspection", "Approve outage comms"],
  },
  telecom: {
    id: "telecom",
    name: "Telecommunications",
    kpis: [
      { label: "Churn", value: "1.4%", delta: "-0.1%" },
      { label: "MTTR", value: "42m", delta: "-6m" },
      { label: "NPS", value: "31", delta: "+3" },
      { label: "Ticket deflection", value: "39%", delta: "+5%" },
    ],
    queues: [
      { id: "t1", title: "Cell site degradation — Cluster 9", owner: "NOC", priority: "high", status: "open" },
    ],
    agents: [
      { id: "ta1", name: "Churn Rescue Agent", last_run: "7m ago", outcome: "29 offers ranked" },
      { id: "ta2", name: "NOC Incident Agent", last_run: "2m ago", outcome: "RCA draft" },
    ],
    workflows: [{ id: "tw1", name: "Major incident bridge", status: "ready" }],
    insights: ["Churn risk highest in prepaid segment with repeated outages."],
    actions: ["Launch rescue offers", "Open incident bridge"],
  },
  legal: {
    id: "legal",
    name: "Legal Intelligence",
    kpis: [
      { label: "Contract cycle", value: "11d", delta: "-2d" },
      { label: "Risk flags", value: "37", delta: "-5" },
      { label: "Matters open", value: "128", delta: "+3" },
    ],
    queues: [
      { id: "l1", title: "MSA renewal — liability cap dispute", owner: "Commercial Legal", priority: "high", status: "open" },
    ],
    agents: [
      { id: "la1", name: "Contract Clause Agent", last_run: "12m ago", outcome: "16 contracts reviewed" },
      { id: "la2", name: "Citation Research Agent", last_run: "40m ago", outcome: "Memo drafted" },
    ],
    workflows: [{ id: "lw1", name: "Contract approval", status: "ready" }],
    insights: ["Unlimited liability clauses appearing in vendor paper again."],
    actions: ["Escalate liability clause", "Approve redlines"],
  },
  hr: {
    id: "hr",
    name: "People / HR Intelligence",
    kpis: [
      { label: "Time-to-hire", value: "34d", delta: "-3d" },
      { label: "Attrition", value: "12%", delta: "-1%" },
      { label: "Policy answers", value: "96%", delta: "+2%" },
    ],
    queues: [
      { id: "hr1", title: "Policy exception — remote work", owner: "HRBP", priority: "medium", status: "open" },
    ],
    agents: [
      { id: "hra1", name: "Policy Copilot", last_run: "5m ago", outcome: "41 answers grounded" },
      { id: "hra2", name: "Attrition Risk Agent", last_run: "1h ago", outcome: "9 managers alerted" },
    ],
    workflows: [{ id: "hrw1", name: "Offer approval", status: "ready" }],
    insights: ["Attrition risk rising in engineering managers with span >10."],
    actions: ["Draft retention plan", "Approve offer packet"],
  },
  logistics: {
    id: "logistics",
    name: "Logistics",
    kpis: [
      { label: "OTIF", value: "93%", delta: "+1%" },
      { label: "Cost/ton-mile", value: "$0.18", delta: "-2%" },
      { label: "Exceptions", value: "46", delta: "-7" },
    ],
    queues: [
      { id: "lg1", title: "Port congestion delay — Lane APAC-EU", owner: "Control Tower", priority: "high", status: "open" },
    ],
    agents: [
      { id: "lga1", name: "Exception Agent", last_run: "3m ago", outcome: "14 exceptions ranked" },
      { id: "lga2", name: "Route Replan Agent", last_run: "18m ago", outcome: "3 alternates" },
    ],
    workflows: [{ id: "lgw1", name: "Exception escalation", status: "ready" }],
    insights: ["APAC-EU lane delays driven by port dwell time, not carrier capacity."],
    actions: ["Replan lane", "Notify customers"],
  },
  education: {
    id: "education",
    name: "Education",
    kpis: [
      { label: "Retention", value: "84%", delta: "+1%" },
      { label: "Completion", value: "71%", delta: "+2%" },
      { label: "Advisor load", value: "180", delta: "-10" },
    ],
    queues: [
      { id: "ed1", title: "At-risk learner cohort — Term 2", owner: "Advising", priority: "high", status: "open" },
    ],
    agents: [
      { id: "eda1", name: "Learner Risk Agent", last_run: "10m ago", outcome: "62 students flagged" },
      { id: "eda2", name: "Advising Copilot", last_run: "22m ago", outcome: "30 outreach drafts" },
    ],
    workflows: [{ id: "edw1", name: "Retention outreach", status: "ready" }],
    insights: ["Early alert strongest from missed LMS activity in week 3."],
    actions: ["Launch outreach", "Assign advisors"],
  },
};

export function getPackWorkspace(packId: string): PackWorkspace | null {
  return PACKS[packId] || null;
}

export function listPackIds() {
  return Object.keys(PACKS);
}
