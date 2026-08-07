import { hybridSearch } from "./store";

async function safeJson(url: string, init?: RequestInit) {
  const resp = await fetch(url, { ...init, next: { revalidate: 300 } });
  if (!resp.ok) throw new Error(`${url} → ${resp.status}`);
  return resp.json();
}

export async function searchTrials(query: string, maxResults = 10) {
  try {
    const url = new URL("https://clinicaltrials.gov/api/v2/studies");
    url.searchParams.set("query.term", query);
    url.searchParams.set("pageSize", String(maxResults));
    url.searchParams.set("format", "json");
    const data = await safeJson(url.toString());
    const results = (data.studies || []).slice(0, maxResults).map((item: Record<string, unknown>) => {
      const proto = (item.protocolSection || {}) as Record<string, unknown>;
      const ident = (proto.identificationModule || {}) as Record<string, unknown>;
      const status = (proto.statusModule || {}) as Record<string, unknown>;
      const design = (proto.designModule || {}) as Record<string, unknown>;
      const conditions = (proto.conditionsModule || {}) as Record<string, unknown>;
      const sponsorMod = (proto.sponsorCollaboratorsModule || {}) as Record<string, unknown>;
      const lead = (sponsorMod.leadSponsor || {}) as Record<string, unknown>;
      const phases = (design.phases as string[]) || [];
      return {
        nct_id: ident.nctId,
        title: ident.briefTitle || ident.officialTitle,
        status: status.overallStatus,
        phase: phases[0] || "N/A",
        sponsor: lead.name,
        conditions: (conditions.conditions as string[])?.slice(0, 3) || [],
        source: "ClinicalTrials.gov",
      };
    });
    return { tool: "search_trials", query, results, source: "ClinicalTrials.gov API v2" };
  } catch (error) {
    return {
      tool: "search_trials",
      query,
      error: error instanceof Error ? error.message : "fetch failed",
      results: [],
      source: "ClinicalTrials.gov API v2",
    };
  }
}

export async function searchPubmed(query: string, maxResults = 8) {
  try {
    const searchUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi");
    searchUrl.searchParams.set("db", "pubmed");
    searchUrl.searchParams.set("term", query);
    searchUrl.searchParams.set("retmax", String(maxResults));
    searchUrl.searchParams.set("retmode", "json");
    const searchJson = await safeJson(searchUrl.toString());
    const ids: string[] = searchJson?.esearchresult?.idlist || [];
    if (!ids.length) return { tool: "search_pubmed", query, results: [], source: "PubMed E-utilities" };
    const sumUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi");
    sumUrl.searchParams.set("db", "pubmed");
    sumUrl.searchParams.set("id", ids.join(","));
    sumUrl.searchParams.set("retmode", "json");
    const sumJson = await safeJson(sumUrl.toString());
    const result = sumJson.result || {};
    const results = ids.map((pmid) => {
      const item = result[pmid] || {};
      return {
        pmid,
        title: item.title,
        journal: item.fulljournalname || item.source,
        pubdate: item.pubdate,
        authors: (item.authors || []).slice(0, 3).map((a: { name: string }) => a.name),
        source: "PubMed",
      };
    });
    return { tool: "search_pubmed", query, results, source: "PubMed E-utilities" };
  } catch (error) {
    return {
      tool: "search_pubmed",
      query,
      error: error instanceof Error ? error.message : "fetch failed",
      results: [],
      source: "PubMed E-utilities",
    };
  }
}

export async function searchEuropePmc(query: string, maxResults = 6) {
  try {
    const url = new URL("https://www.ebi.ac.uk/europepmc/webservices/rest/search");
    url.searchParams.set("query", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("pageSize", String(maxResults));
    const data = await safeJson(url.toString());
    const results = (data?.resultList?.result || []).slice(0, maxResults).map((r: Record<string, unknown>) => ({
      id: r.id,
      source: r.source,
      title: r.title,
      journal: r.journalTitle,
      pubyear: r.pubYear,
      doi: r.doi,
      isOpenAccess: r.isOpenAccess,
      provider: "Europe PMC",
    }));
    return { tool: "search_europe_pmc", query, results, source: "Europe PMC" };
  } catch (error) {
    return {
      tool: "search_europe_pmc",
      query,
      error: error instanceof Error ? error.message : "fetch failed",
      results: [],
      source: "Europe PMC",
    };
  }
}

export async function openFdaEvents(drug: string, maxResults = 8) {
  try {
    const url = new URL("https://api.fda.gov/drug/event.json");
    url.searchParams.set("search", `patient.drug.medicinalproduct:"${drug}"`);
    url.searchParams.set("limit", String(maxResults));
    const resp = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (resp.status === 404) {
      return { tool: "openfda_events", drug, results: [], note: "No events found", total: 0, source: "OpenFDA FAERS" };
    }
    if (!resp.ok) throw new Error(`OpenFDA ${resp.status}`);
    const data = await resp.json();
    const results = (data.results || []).map((row: Record<string, unknown>) => {
      const patient = (row.patient || {}) as Record<string, unknown>;
      const reactions = ((patient.reaction as Record<string, unknown>[]) || [])
        .slice(0, 5)
        .map((r) => r.reactionmeddrapt);
      return {
        safetyreportid: row.safetyreportid,
        serious: row.serious,
        reactions,
        receive_date: row.receivedate,
        source: "OpenFDA FAERS",
      };
    });
    return {
      tool: "openfda_events",
      drug,
      results,
      total: data?.meta?.results?.total,
      source: "OpenFDA FAERS",
    };
  } catch (error) {
    return {
      tool: "openfda_events",
      drug,
      error: error instanceof Error ? error.message : "fetch failed",
      results: [],
      source: "OpenFDA FAERS",
    };
  }
}

export async function openFdaLabels(query: string, maxResults = 5) {
  try {
    const url = new URL("https://api.fda.gov/drug/label.json");
    url.searchParams.set("search", `openfda.brand_name:"${query}" OR openfda.generic_name:"${query}"`);
    url.searchParams.set("limit", String(maxResults));
    const resp = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (resp.status === 404) return { tool: "openfda_labels", query, results: [], source: "OpenFDA Labels" };
    if (!resp.ok) throw new Error(`OpenFDA label ${resp.status}`);
    const data = await resp.json();
    const results = (data.results || []).map((row: Record<string, unknown>) => {
      const openfda = (row.openfda || {}) as Record<string, unknown>;
      return {
        brand: (openfda.brand_name as string[])?.[0],
        generic: (openfda.generic_name as string[])?.[0],
        manufacturer: (openfda.manufacturer_name as string[])?.[0],
        route: (openfda.route as string[])?.[0],
        indications: Array.isArray(row.indications_and_usage)
          ? String(row.indications_and_usage[0]).slice(0, 280)
          : undefined,
        warnings: Array.isArray(row.warnings) ? String(row.warnings[0]).slice(0, 220) : undefined,
        source: "OpenFDA Labels",
      };
    });
    return { tool: "openfda_labels", query, results, source: "OpenFDA Labels" };
  } catch (error) {
    return {
      tool: "openfda_labels",
      query,
      error: error instanceof Error ? error.message : "fetch failed",
      results: [],
      source: "OpenFDA Labels",
    };
  }
}

export async function openFdaEnforcement(query: string, maxResults = 5) {
  try {
    const url = new URL("https://api.fda.gov/drug/enforcement.json");
    url.searchParams.set("search", `product_description:"${query}"`);
    url.searchParams.set("limit", String(maxResults));
    const resp = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (resp.status === 404) return { tool: "openfda_enforcement", query, results: [], source: "OpenFDA Enforcement" };
    if (!resp.ok) throw new Error(`OpenFDA enforcement ${resp.status}`);
    const data = await resp.json();
    const results = (data.results || []).map((row: Record<string, unknown>) => ({
      recall_number: row.recall_number,
      status: row.status,
      classification: row.classification,
      product_description: String(row.product_description || "").slice(0, 220),
      reason: String(row.reason_for_recall || "").slice(0, 220),
      recalling_firm: row.recalling_firm,
      source: "OpenFDA Enforcement",
    }));
    return { tool: "openfda_enforcement", query, results, source: "OpenFDA Enforcement" };
  } catch (error) {
    return {
      tool: "openfda_enforcement",
      query,
      error: error instanceof Error ? error.message : "fetch failed",
      results: [],
      source: "OpenFDA Enforcement",
    };
  }
}

export async function searchRxNorm(drug: string) {
  try {
    const url = new URL("https://rxnav.nlm.nih.gov/REST/drugs.json");
    url.searchParams.set("name", drug);
    const data = await safeJson(url.toString());
    const conceptGroups = data?.drugGroup?.conceptGroup || [];
    const results: { name: string; rxcui: string; tty: string; source: string }[] = [];
    for (const g of conceptGroups) {
      for (const c of g.conceptProperties || []) {
        results.push({ name: c.name, rxcui: c.rxcui, tty: c.tty, source: "RxNorm" });
      }
    }
    return { tool: "rxnorm", drug, results: results.slice(0, 12), source: "NLM RxNorm/RxNav" };
  } catch (error) {
    return {
      tool: "rxnorm",
      drug,
      error: error instanceof Error ? error.message : "fetch failed",
      results: [],
      source: "NLM RxNorm/RxNav",
    };
  }
}

export async function searchDailyMed(query: string, maxResults = 5) {
  try {
    const url = new URL("https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json");
    url.searchParams.set("drug_name", query);
    url.searchParams.set("pagesize", String(maxResults));
    const data = await safeJson(url.toString());
    const results = (data?.data || []).slice(0, maxResults).map((r: Record<string, unknown>) => ({
      setid: r.setid,
      title: r.title,
      published: r.published_date,
      source: "DailyMed",
    }));
    return { tool: "dailymed", query, results, source: "NLM DailyMed" };
  } catch (error) {
    return {
      tool: "dailymed",
      query,
      error: error instanceof Error ? error.message : "fetch failed",
      results: [],
      source: "NLM DailyMed",
    };
  }
}

export function sqlMetrics() {
  return {
    tool: "sql_metrics",
    results: {
      pipeline_assets: 14,
      active_trials: 28,
      open_safety_signals: 6,
      kol_engagements_30d: 112,
      regulatory_submissions_qtd: 3,
      forecast_accuracy: 0.91,
      knowledge_docs: "seeded-offline+live",
    },
    source: "LSI-OS metrics",
  };
}

export async function knowledgeSearch(orgId: string, query: string) {
  return { tool: "knowledge_search", query, results: await hybridSearch(orgId, query, 6), source: "LSI Knowledge Hub" };
}

export async function runToolSuite(orgId: string, query: string, tools: string[]) {
  const traces: unknown[] = [];
  const drugGuess = query.split(/\s+/).find((w) => w.length > 3) || "aspirin";
  for (const t of tools) {
    if (t === "search_trials") traces.push(await searchTrials(query));
    if (t === "search_pubmed") traces.push(await searchPubmed(query));
    if (t === "search_europe_pmc") traces.push(await searchEuropePmc(query));
    if (t === "openfda_events") traces.push(await openFdaEvents(drugGuess));
    if (t === "openfda_labels") traces.push(await openFdaLabels(drugGuess));
    if (t === "openfda_enforcement") traces.push(await openFdaEnforcement(drugGuess));
    if (t === "rxnorm") traces.push(await searchRxNorm(drugGuess));
    if (t === "dailymed") traces.push(await searchDailyMed(drugGuess));
    if (t === "knowledge_search") traces.push(await knowledgeSearch(orgId, query));
    if (t === "sql_metrics") traces.push(sqlMetrics());
  }
  return traces;
}

export const AGENT_TYPES: Record<
  string,
  { name: string; tools: string[]; requires_approval: boolean }
> = {
  researcher: {
    name: "Clinical Researcher",
    tools: ["search_trials", "search_pubmed", "search_europe_pmc", "knowledge_search"],
    requires_approval: false,
  },
  analyst: {
    name: "Commercial Analyst",
    tools: ["sql_metrics", "knowledge_search", "openfda_labels"],
    requires_approval: false,
  },
  safety: {
    name: "Safety Sentinel",
    tools: ["openfda_events", "openfda_enforcement", "search_pubmed", "rxnorm", "knowledge_search"],
    requires_approval: true,
  },
  regulatory: {
    name: "Regulatory Navigator",
    tools: ["openfda_labels", "dailymed", "search_trials", "knowledge_search"],
    requires_approval: true,
  },
};

export const DATA_SOURCES = [
  { id: "offline-corpus", name: "LSI Offline Dossier Corpus", type: "offline", status: "active" },
  { id: "clinicaltrials", name: "ClinicalTrials.gov API v2", type: "government", status: "active" },
  { id: "openfda-faers", name: "OpenFDA FAERS", type: "government", status: "active" },
  { id: "openfda-labels", name: "OpenFDA Drug Labels", type: "government", status: "active" },
  { id: "openfda-enforcement", name: "OpenFDA Enforcement/Recalls", type: "government", status: "active" },
  { id: "pubmed", name: "PubMed E-utilities (NCBI)", type: "government", status: "active" },
  { id: "europepmc", name: "Europe PMC", type: "open", status: "active" },
  { id: "rxnorm", name: "NLM RxNorm / RxNav", type: "government", status: "active" },
  { id: "dailymed", name: "NLM DailyMed SPL", type: "government", status: "active" },
  { id: "openai-embeddings", name: "OpenAI text-embedding-3-small", type: "ai", status: "env" },
  { id: "openai-chat", name: "OpenAI gpt-4o-mini", type: "ai", status: "env" },
];
