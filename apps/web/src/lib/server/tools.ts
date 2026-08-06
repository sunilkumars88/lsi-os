import { hybridSearch } from "./store";

export async function searchTrials(query: string, maxResults = 8) {
  try {
    const url = new URL("https://clinicaltrials.gov/api/v2/studies");
    url.searchParams.set("query.term", query);
    url.searchParams.set("pageSize", String(maxResults));
    url.searchParams.set("format", "json");
    const resp = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!resp.ok) throw new Error(`ClinicalTrials.gov ${resp.status}`);
    const data = await resp.json();
    const results = (data.studies || []).slice(0, maxResults).map((item: Record<string, unknown>) => {
      const proto = (item.protocolSection || {}) as Record<string, unknown>;
      const ident = (proto.identificationModule || {}) as Record<string, unknown>;
      const status = (proto.statusModule || {}) as Record<string, unknown>;
      const design = (proto.designModule || {}) as Record<string, unknown>;
      const sponsorMod = (proto.sponsorCollaboratorsModule || {}) as Record<string, unknown>;
      const lead = (sponsorMod.leadSponsor || {}) as Record<string, unknown>;
      const phases = (design.phases as string[]) || [];
      return {
        nct_id: ident.nctId,
        title: ident.briefTitle || ident.officialTitle,
        status: status.overallStatus,
        phase: phases[0] || "N/A",
        sponsor: lead.name,
      };
    });
    return { tool: "search_trials", query, results };
  } catch (error) {
    return {
      tool: "search_trials",
      query,
      error: error instanceof Error ? error.message : "fetch failed",
      results: [
        {
          nct_id: "NCT00000001",
          title: `${query} — demo adaptive Phase III study`,
          status: "RECRUITING",
          phase: "PHASE3",
          sponsor: "LSI Demo Pharma",
        },
      ],
    };
  }
}

export async function searchPubmed(query: string, maxResults = 6) {
  try {
    const searchUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi");
    searchUrl.searchParams.set("db", "pubmed");
    searchUrl.searchParams.set("term", query);
    searchUrl.searchParams.set("retmax", String(maxResults));
    searchUrl.searchParams.set("retmode", "json");
    const search = await fetch(searchUrl.toString(), { next: { revalidate: 300 } });
    const searchJson = await search.json();
    const ids: string[] = searchJson?.esearchresult?.idlist || [];
    if (!ids.length) return { tool: "search_pubmed", query, results: [] };
    const sumUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi");
    sumUrl.searchParams.set("db", "pubmed");
    sumUrl.searchParams.set("id", ids.join(","));
    sumUrl.searchParams.set("retmode", "json");
    const summary = await fetch(sumUrl.toString(), { next: { revalidate: 300 } });
    const sumJson = await summary.json();
    const result = sumJson.result || {};
    const results = ids.map((pmid) => {
      const item = result[pmid] || {};
      return {
        pmid,
        title: item.title,
        journal: item.fulljournalname || item.source,
        pubdate: item.pubdate,
        authors: (item.authors || []).slice(0, 3).map((a: { name: string }) => a.name),
      };
    });
    return { tool: "search_pubmed", query, results };
  } catch (error) {
    return {
      tool: "search_pubmed",
      query,
      error: error instanceof Error ? error.message : "fetch failed",
      results: [
        {
          pmid: "00000000",
          title: `Evidence brief for ${query}`,
          journal: "LSI Demo Journal",
          pubdate: "2026",
          authors: ["Demo Author"],
        },
      ],
    };
  }
}

export async function openFdaEvents(drug: string, maxResults = 8) {
  try {
    const url = new URL("https://api.fda.gov/drug/event.json");
    url.searchParams.set("search", `patient.drug.medicinalproduct:"${drug}"`);
    url.searchParams.set("limit", String(maxResults));
    const resp = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (resp.status === 404) return { tool: "openfda_events", drug, results: [], note: "No events found", total: 0 };
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
      };
    });
    return {
      tool: "openfda_events",
      drug,
      results,
      total: data?.meta?.results?.total,
    };
  } catch (error) {
    return {
      tool: "openfda_events",
      drug,
      error: error instanceof Error ? error.message : "fetch failed",
      results: [
        {
          safetyreportid: "demo-1",
          serious: "1",
          reactions: ["Nausea", "Dizziness"],
          receive_date: "20260115",
        },
      ],
      total: 1,
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
    },
  };
}

export function knowledgeSearch(orgId: string, query: string) {
  return { tool: "knowledge_search", query, results: hybridSearch(orgId, query, 5) };
}

export function demoBrain(query: string, context: string) {
  const content = context
    ? `**LSI-OS Copilot**\n\nQuery: ${query}\n\nBased on retrieved knowledge and tool results:\n\n${context.slice(0, 2200)}\n\n— Demo brain is active. Configure OPENAI_API_KEY on a dedicated API host for generative upgrades.`
    : `**LSI-OS Copilot**\n\nI can help with clinical trials, OpenFDA safety signals, PubMed literature, commercial analytics, regulatory readiness, and your knowledge base.\n\nAsk about CardiaX enrollment, ImmunoPath safety, or run Agent Studio.`;
  return {
    content,
    model: "demo-brain",
    provider: "demo",
    tokens_in: Math.ceil(query.length / 4),
    tokens_out: Math.ceil(content.length / 4),
    cost_usd: 0,
  };
}

export const AGENT_TYPES: Record<
  string,
  { name: string; tools: string[]; requires_approval: boolean }
> = {
  researcher: {
    name: "Clinical Researcher",
    tools: ["search_trials", "search_pubmed", "knowledge_search"],
    requires_approval: false,
  },
  analyst: {
    name: "Commercial Analyst",
    tools: ["sql_metrics", "knowledge_search"],
    requires_approval: false,
  },
  safety: {
    name: "Safety Sentinel",
    tools: ["openfda_events", "search_pubmed", "knowledge_search"],
    requires_approval: true,
  },
  regulatory: {
    name: "Regulatory Navigator",
    tools: ["knowledge_search", "search_trials"],
    requires_approval: true,
  },
};
