/** Curated offline life-sciences knowledge corpus for RAG (always available offline). */

export type CorpusDoc = {
  title: string;
  doc_type: string;
  source: string;
  content: string;
};

export const OFFLINE_CORPUS: CorpusDoc[] = [
  {
    title: "CardiaX Phase III Clinical Synopsis",
    doc_type: "protocol",
    source: "offline-seed",
    content: `CardiaX (LX-402) is an oral SGLT2-pathway modulator in Phase III for heart failure with preserved ejection fraction (HFpEF). Primary endpoint: composite of cardiovascular death or HF hospitalization at 24 months. Key inclusion: LVEF >= 50%, NYHA II-III, elevated NT-proBNP. Target enrollment 4200 across 180 sites in US, EU, and APAC. Current APAC enrollment lag is approximately 14% behind plan. Secondary endpoints include KCCQ-CSS, 6-minute walk distance, and renal composite. Safety monitoring focuses on genital mycotic infections, volume depletion, and ketoacidosis. DSMB reviews quarterly. Regulatory path: US sNDA and EU Type II variation after primary readout.`,
  },
  {
    title: "OncoPrime Biomarker and Medical Affairs Brief",
    doc_type: "medical",
    source: "offline-seed",
    content: `OncoPrime is a PD-1 combination regimen for first-line NSCLC with PD-L1 TPS >= 50%. Companion diagnostic is required prior to treatment initiation. Medical affairs priorities: KOL education on biomarker testing pathways, congress abstract mining (ASCO/AACR/ESMO), MSL talk tracks on immune-related adverse events (irAEs), and advisory boards on never-smoker and EGFR-mutant subgroups. Evidence gaps remain for underrepresented populations. Competitive pressure from Rival-B dual checkpoint regimen. HCP engagement metrics show strongest uplift where pathology turnaround time is under 7 days.`,
  },
  {
    title: "ImmunoPath Pharmacovigilance Signal Assessment",
    doc_type: "safety",
    source: "offline-seed",
    content: `ImmunoPath (IL-17 pathway inhibitor) has an open signal for inflammatory bowel events. Disproportionality analysis shows EB05 1.8 for colitis and EB05 1.4 for Crohn's-like enteritis. Cases cluster in patients with prior autoimmune history. Recommended actions: enhanced monitoring, weekly OpenFDA FAERS refresh, Dear Healthcare Professional Communication draft, and label language review with PV and Regulatory. Human-in-the-loop approval is mandatory before external safety communications. Signal detection cadence: weekly for priority brands, monthly for long-tail products.`,
  },
  {
    title: "EU HTA and HEOR Evidence Requirements",
    doc_type: "heor",
    source: "offline-seed",
    content: `For EU HTA Joint Clinical Assessment readiness, OncoPrime requires relative effectiveness versus relevant comparators, subgroup consistency, EQ-5D utilities, and budget-impact models including biomarker testing costs. NICE and G-BA remain critical markets. Target ICER thresholds vary by jurisdiction; US payer dossiers should refresh annually with RWE adherence and hospitalization outcomes. CardiaX RWE 24-month cohort showed -18% HF hospitalization versus standard of care. Recommendations: expand RWE diversity, pre-specify SAP for regulatory-grade RWD, and align PRO instruments early.`,
  },
  {
    title: "FDA RWE and Regulatory Readiness Playbook",
    doc_type: "regulatory",
    source: "offline-seed",
    content: `FDA guidance on real-world evidence supports RWD for label expansions when data quality, provenance, and confounding control are demonstrated. Map each RWE study to a fit-for-purpose checklist, maintain audit trails of transformations, and use pre-specified statistical analysis plans. CardiaX sNDA CMC readiness is at 78%; clinical package readiness 91%; labeling 84%; safety 88%. EMA Day 120 questions for OncoPrime MAA are in progress. Maintain guidance radar for oncology endpoints, RWE decision-making, and pharmacovigilance system master file updates.`,
  },
  {
    title: "Commercial Competitive Landscape Q2",
    doc_type: "commercial",
    source: "offline-seed",
    content: `Rival-A expanded specialty pharmacy access, increasing fill rates in urban MSAs. Rival-B launched dual-checkpoint with aggressive digital detailing. CardiaX share 18.4% (+4.2% growth), OncoPrime 11.1% (+9.8%), ImmunoPath 7.6% (-1.2%). Growth drivers: Mid-Atlantic cardiology KOLs for CardiaX; biomarker coverage expansion for OncoPrime. Recommended commercial actions: reinforce testing pathways, protect formulary position, and counter Rival-B congress presence at ASCO/EULAR/ESC.`,
  },
  {
    title: "ICH E6(R2) GCP Essentials for Clinical Operations",
    doc_type: "clinical",
    source: "offline-seed",
    content: `ICH E6(R2) Good Clinical Practice emphasizes quality management, risk-based monitoring, and sponsor oversight. Critical processes: protocol compliance, informed consent, investigational product accountability, safety reporting (SAE/SUSAR), and data integrity (ALCOA+). Site activation KPIs: median activation days, screen-fail rate, query aging, and protocol amendment frequency. For CardiaX, screen-fail rate is 22% and median enrollment cycle 118 days. CAPA should prioritize APAC site performance and eConsent adoption.`,
  },
  {
    title: "FDA FAERS Signal Detection Methodology",
    doc_type: "safety",
    source: "offline-seed",
    content: `FDA Adverse Event Reporting System (FAERS) is a spontaneous reporting database. Disproportionality methods include PRR, ROR, and EBGM/EB05. Signals require clinical assessment for seriousness, expectedness, causality, and confounding by indication. OpenFDA drug/event endpoint supports product-level queries. Enterprise practice: combine FAERS with literature (PubMed), clinical trial SAE listings, and internal case processing. Document decision trees for continue monitoring, escalate, or refute.`,
  },
  {
    title: "ClinicalTrials.gov Data Model Overview",
    doc_type: "clinical",
    source: "offline-seed",
    content: `ClinicalTrials.gov API v2 exposes protocolSection modules: identification, status, design, arms/interventions, outcomes, eligibility, contacts/locations, and sponsor/collaborators. Useful filters: condition, intervention, phase, overallStatus, locationCountry. Competitive intelligence use cases: landscape scans by indication, enrollment velocity proxies, and endpoint strategy benchmarking. Always cite NCT IDs and avoid inventing trial identifiers.`,
  },
  {
    title: "PubMed and Europe PMC Literature Workflow",
    doc_type: "medical",
    source: "offline-seed",
    content: `PubMed E-utilities (eSearch/eSummary/eFetch) and Europe PMC REST APIs provide free biomedical literature access. Medical affairs workflows: KOL publication tracking, congress abstract harvesting, and evidence synthesis for MSLs. Prefer recent high-impact journals and systematic reviews for HEOR dossiers. Store PMIDs with titles, journals, and dates for citation-ready outputs.`,
  },
  {
    title: "OpenFDA Drug Label and NDC Reference",
    doc_type: "regulatory",
    source: "offline-seed",
    content: `OpenFDA drug/label provides Structured Product Labeling sections including indications, contraindications, warnings, adverse reactions, and dosage. NDC directory links packaged products to labels. Use label mining for competitive claims analysis and safety language benchmarking. Cross-check DailyMed for current SPL versions. Never alter labeled safety language without Regulatory and Legal review.`,
  },
  {
    title: "RxNorm and Medication Terminology Map",
    doc_type: "data",
    source: "offline-seed",
    content: `RxNorm (NLM) provides normalized names and relationships for clinical drugs. Useful for mapping brand/generic names across FAERS, claims, and EHR extracts. Combine with ATC classification for portfolio analyses. When querying adverse events, map user-entered drug strings to RxCUI candidates before FAERS searches to improve recall.`,
  },
  {
    title: "G-BA AMNOG and NICE HTA Comparison",
    doc_type: "heor",
    source: "offline-seed",
    content: `Germany G-BA assesses additional benefit versus appropriate comparator under AMNOG; NICE evaluates clinical and cost-effectiveness with explicit ICER considerations. HAS (France) assigns ASMR ratings. Early scientific advice, robust comparator justification, and subgroup pre-specification reduce access risk. For OncoPrime, G-BA risk is high pending additional benefit evidence; NICE is in review; HAS ASMR III expected.`,
  },
  {
    title: "Enterprise AI Governance for Life Sciences",
    doc_type: "governance",
    source: "offline-seed",
    content: `AI systems in regulated environments require human-in-the-loop for safety/regulatory communications, prompt/response audit logging, PII minimization, model routing by task risk, and citation-backed outputs. Prefer retrieval-augmented generation over unconstrained generation for clinical facts. Track tokens, latency, and cost. Evaluate answers against ground-truth dossiers before release.`,
  },
  {
    title: "Pharmacovigilance ICSR Triage Checklist",
    doc_type: "safety",
    source: "offline-seed",
    content: `Individual Case Safety Report triage: identify product, event, seriousness, expectedness, reporter type, and causality. Expedited reporting timelines vary by region (e.g., 7/15-day). Aggregate signal detection complements case-level review. Maintain PSMF references and ensure auditability of AI-assisted case narratives.`,
  },
  {
    title: "Oncology Endpoint Strategy Primer",
    doc_type: "clinical",
    source: "offline-seed",
    content: `Common oncology endpoints: OS, PFS, ORR, DoR, and patient-reported outcomes. FDA and EMA guidance stress estimands, multiplicity control, and clinical relevance of radiographic endpoints. Biomarker-defined populations require assay validation. For OncoPrime, primary strategy emphasizes PFS with OS follow-up and IRRC assessment.`,
  },
  {
    title: "SGLT2 Inhibitor Class Safety Context",
    doc_type: "safety",
    source: "offline-seed",
    content: `SGLT2 inhibitor class effects include genital mycotic infections, volume depletion, and rare ketoacidosis. Cardiorenal outcome benefits are well documented in HFrEF/HFpEF and CKD. Labeling typically includes warnings for hypotension risk in volume-depleted patients. CardiaX monitoring plan mirrors class risk management with protocol-defined hydration counseling.`,
  },
  {
    title: "Immune Checkpoint Inhibitor irAE Management",
    doc_type: "medical",
    source: "offline-seed",
    content: `Immune-related adverse events can affect skin, GI, liver, endocrine, and pulmonary systems. Management uses CTCAE grading, temporary hold/steroids, and specialty consults. MSL materials should emphasize early recognition and multidisciplinary pathways. Literature surveillance via PubMed should track combination regimen toxicity signals.`,
  },
  {
    title: "Marketplace Agent Pack Catalog Notes",
    doc_type: "platform",
    source: "offline-seed",
    content: `LSI-OS marketplace includes Safety Sentinel, Regulatory RAG Corpus, Python SDK, and HTA dossier workflow templates. Agents must declare tools, approval requirements, and audit events. Enterprise customers can publish private packs with tenant isolation.`,
  },
  {
    title: "Data Sources Registry — Government and Open APIs",
    doc_type: "data",
    source: "offline-seed",
    content: `Primary free sources integrated in LSI-OS: ClinicalTrials.gov API v2, OpenFDA (drug/event, drug/label, drug/enforcement), PubMed E-utilities, Europe PMC, RxNorm/RxNav, DailyMed SPL, Drugs@FDA via OpenFDA, and curated offline dossier corpus. Use caching and graceful fallbacks. Always display source attribution in UI responses.`,
  },
  {
    title: "CardiaX Risk Register Extract",
    doc_type: "executive",
    source: "offline-seed",
    content: `Top risks: Oncology Ph3 enrollment lag (high, Clinical Ops), EU label negotiation (medium, Regulatory), competitor immunology launch (medium, Commercial). Mitigation: site performance CAPA, early EMA dialogue, and congress share-of-voice program. AI task completion currently 94%.`,
  },
  {
    title: "Workflow Automation Patterns for Intelligence Briefs",
    doc_type: "platform",
    source: "offline-seed",
    content: `Recommended workflow: ingest documents → extract trials/literature → analyze KPIs → human approve → notify stakeholders. Each step emits audit events. Safety and regulatory workflows default to approval gates. Outputs should include citations and tool traces for explainability.`,
  },
  {
    title: "NSCLC Epidemiology and Testing Funnel",
    doc_type: "medical",
    source: "offline-seed",
    content: `NSCLC accounts for the majority of lung cancer cases. Biomarker testing rates vary by site sophistication. PD-L1, EGFR, ALK, ROS1, BRAF, MET, RET, and KRAS panels inform therapy selection. Funnel leakage often occurs between biopsy and molecular report. OncoPrime uptake correlates with pathology partnership programs.`,
  },
  {
    title: "HFpEF Clinical Landscape Summary",
    doc_type: "clinical",
    source: "offline-seed",
    content: `HFpEF is heterogeneous with comorbidities including hypertension, obesity, AF, and CKD. Guideline-directed therapies increasingly include SGLT2 inhibitors. Trial design challenges: event rates, enrichment via NT-proBNP, and regional practice variation. CardiaX Phase III design reflects contemporary HFpEF endpoint conventions.`,
  },
  {
    title: "Labeling Negotiation Negotiation Points EU",
    doc_type: "regulatory",
    source: "offline-seed",
    content: `EU SmPC negotiations often focus on indication wording, posology in special populations, and safety section granularity. Prepare QRD-compliant texts, RMP summaries, and benefit-risk conclusions. Align HEOR claims with approved label to avoid promotional risk.`,
  },
];
