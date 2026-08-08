import { NextRequest, NextResponse } from "next/server";
import { hashPassword, signToken, userFromAuthHeader, verifyPassword } from "@/lib/server/auth";
import { SYSTEM_PROMPTS, completeChat, hasOpenAI, probeOpenAI } from "@/lib/server/openai";
import {
  AGENT_TYPES,
  DATA_SOURCES,
  knowledgeSearch,
  openFdaEnforcement,
  openFdaEvents,
  openFdaLabels,
  runToolSuite,
  searchDailyMed,
  searchEuropePmc,
  searchPubmed,
  searchRxNorm,
  searchTrials,
  sqlMetrics,
} from "@/lib/server/tools";
import { DEMO_ORG_ID } from "@/lib/server/ids";
import { getPackWorkspace, listPackIds } from "@/lib/server/industry";
import {
  audit,
  buildChunks,
  ensureReady,
  ensureSeeded,
  hybridSearch,
  knowledgeStats,
  now,
  uid,
  type Document,
} from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function err(detail: string, status = 400) {
  return json({ detail }, status);
}

async function requireUser(req: NextRequest) {
  return userFromAuthHeader(req.headers.get("authorization"));
}

async function handle(req: NextRequest, pathParts: string[]) {
  await ensureReady();
  const path = pathParts.join("/");
  const method = req.method.toUpperCase();
  const url = new URL(req.url);
  const body = method === "GET" || method === "HEAD" ? null : await req.json().catch(() => ({}));

  if (path === "auth/login" && method === "POST") {
    const s = ensureSeeded();
    const email = String(body?.email || "").toLowerCase();
    const password = String(body?.password || "");
    const user = s.users.find((u) => u.email === email);
    if (!user || !verifyPassword(password, user.hashed_password)) return err("Invalid email or password", 401);
    audit(user.org_id, user.id, "login", "auth");
    return json({ access_token: await signToken(user), token_type: "bearer" });
  }

  if (path === "auth/register" && method === "POST") {
    const s = ensureSeeded();
    const email = String(body?.email || "").toLowerCase();
    if (s.users.some((u) => u.email === email)) return err("Email already registered", 400);
    const orgId = uid();
    s.orgs.push({
      id: orgId,
      name: String(body?.org_name || "Personal Workspace"),
      slug: `${String(body?.org_name || "org").toLowerCase().replace(/\s+/g, "-")}-${email.split("@")[0]}`,
      plan: "professional",
    });
    const user = {
      id: uid(),
      org_id: orgId,
      email,
      full_name: String(body?.full_name || "User"),
      hashed_password: hashPassword(String(body?.password || "demo1234")),
      role: "admin",
      is_active: true,
      created_at: now(),
    };
    s.users.push(user);
    audit(orgId, user.id, "register", "auth", { email });
    return json({ access_token: await signToken(user), token_type: "bearer" });
  }

  if (path === "auth/me" && method === "GET") {
    const user = await requireUser(req);
    if (!user) return err("Not authenticated", 401);
    const org = ensureSeeded().orgs.find((o) => o.id === user.org_id);
    return json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      org_id: user.org_id,
      org_name: org?.name || "LSI Demo Pharma",
    });
  }

  const user = await requireUser(req);
  if (!user) return err("Not authenticated", 401);

  if (path === "knowledge/documents" && method === "GET") {
    const docs = ensureSeeded()
      .documents.filter((d) => d.org_id === user.org_id || d.org_id === DEMO_ORG_ID)
      .map((d) => ({
        id: d.id,
        title: d.title,
        doc_type: d.doc_type,
        source: d.source,
        created_at: d.created_at,
        preview: d.content.slice(0, 240),
        chunk_count: d.chunks.length,
        embedded: d.chunks.filter((c) => c.embedding?.length).length,
      }));
    // Prefer tenant docs first
    docs.sort((a, b) => Number(a.source === "seed" || a.source === "offline-seed") - Number(b.source === "seed" || b.source === "offline-seed"));
    return json(docs);
  }

  if (path === "knowledge/documents" && method === "POST") {
    const s = ensureSeeded();
    const content = String(body?.content || "");
    const doc: Document = {
      id: uid(),
      org_id: user.org_id,
      title: String(body?.title || "Untitled"),
      content,
      doc_type: String(body?.doc_type || "general"),
      source: String(body?.source || "upload"),
      created_at: now(),
      chunks: await buildChunks(content),
    };
    s.documents.unshift(doc);
    audit(user.org_id, user.id, "ingest_document", doc.id);
    return json({
      id: doc.id,
      title: doc.title,
      doc_type: doc.doc_type,
      source: doc.source,
      created_at: doc.created_at,
      preview: doc.content.slice(0, 240),
      chunk_count: doc.chunks.length,
      embedded: doc.chunks.filter((c) => c.embedding?.length).length,
    });
  }

  if (path.startsWith("knowledge/documents/") && method === "GET") {
    const id = path.split("/")[2];
    const doc = ensureSeeded().documents.find(
      (d) => d.id === id && (d.org_id === user.org_id || d.org_id === DEMO_ORG_ID),
    );
    if (!doc) return err("Document not found", 404);
    return json({
      id: doc.id,
      title: doc.title,
      doc_type: doc.doc_type,
      source: doc.source,
      content: doc.content,
      created_at: doc.created_at,
      chunk_count: doc.chunks.length,
      embedded: doc.chunks.filter((c) => c.embedding?.length).length,
    });
  }

  if (path === "knowledge/search" && method === "POST") {
    const query = String(body?.query || "");
    const limit = Number(body?.limit || 8);
    return json({ query, results: await hybridSearch(user.org_id, query, limit), stats: knowledgeStats() });
  }

  if (path === "knowledge/stats" && method === "GET") {
    return json({ ...knowledgeStats(), sources: DATA_SOURCES });
  }

  if (path === "chat/sessions" && method === "GET") {
    return json(
      ensureSeeded()
        .sessions.filter((s) => s.user_id === user.id)
        .map((s) => ({
          id: s.id,
          title: s.title,
          created_at: s.created_at,
          message_count: s.messages.length,
        })),
    );
  }

  if (path.startsWith("chat/sessions/") && method === "GET") {
    const id = path.split("/")[2];
    const session = ensureSeeded().sessions.find((s) => s.id === id && s.user_id === user.id);
    if (!session) return json({ error: "not found" });
    return json({ id: session.id, title: session.title, messages: session.messages });
  }

  if (path === "chat" && method === "POST") {
    const s = ensureSeeded();
    const message = String(body?.message || "");
    let session = body?.session_id
      ? s.sessions.find((x) => x.id === body.session_id && x.user_id === user.id)
      : undefined;
    if (!session) {
      session = {
        id: uid(),
        org_id: user.org_id,
        user_id: user.id,
        title: message.slice(0, 60),
        created_at: now(),
        messages: [],
      };
      s.sessions.unshift(session);
    }
    session.messages.push({
      id: uid(),
      role: "user",
      content: message,
      citations: [],
      tool_traces: [],
      model: "user",
      created_at: now(),
    });

    const citations = body?.use_rag === false ? [] : await hybridSearch(user.org_id, message, 6);
    const tool_traces: unknown[] = [];
    const lowered = message.toLowerCase();
    if (body?.use_tools !== false) {
      const tools: string[] = ["knowledge_search"];
      if (/(trial|nct|clinical|phase|enrollment)/.test(lowered)) tools.push("search_trials");
      if (/(pubmed|paper|literature|publication|kol)/.test(lowered)) tools.push("search_pubmed", "search_europe_pmc");
      if (/(adverse|safety|faers|pharmacovigilance|signal|recall)/.test(lowered)) {
        tools.push("openfda_events", "openfda_enforcement", "rxnorm");
      }
      if (/(label|smPC|indication|dailymed|ndc)/.test(lowered)) tools.push("openfda_labels", "dailymed");
      if (/(kpi|metric|dashboard|forecast|pipeline|commercial)/.test(lowered)) tools.push("sql_metrics");
      tool_traces.push(...(await runToolSuite(user.org_id, message, [...new Set(tools)])));
    }

    const context = [
      "Knowledge citations:",
      ...citations.map((c, i) => `[${i + 1}] ${c.title} (${c.source}): ${c.content.slice(0, 320)}`),
      "Tool results:",
      ...tool_traces.map((t) => JSON.stringify(t).slice(0, 1200)),
    ].join("\n");

    const history = session.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-8)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const llm = await completeChat({
      system: `${SYSTEM_PROMPTS.copilot}\n\nCONTEXT:\n${context}`,
      messages: history.length ? history : [{ role: "user", content: message }],
    });

    const msg = {
      id: uid(),
      role: "assistant",
      content: llm.content,
      citations,
      tool_traces,
      model: llm.model,
      created_at: now(),
    };
    session.messages.push(msg);
    s.usage.push({
      id: uid(),
      org_id: user.org_id,
      provider: llm.provider,
      model: llm.model,
      tokens_in: llm.tokens_in,
      tokens_out: llm.tokens_out,
      cost_usd: llm.cost_usd,
      created_at: now(),
    });
    audit(user.org_id, user.id, "chat", session.id, { provider: llm.provider });
    return json({
      session_id: session.id,
      message_id: msg.id,
      content: msg.content,
      citations,
      tool_traces,
      model: llm.model,
      provider: llm.provider,
      error: llm.error,
    });
  }

  if (path === "agents/types" && method === "GET") {
    return json(
      Object.entries(AGENT_TYPES).map(([id, v]) => ({
        id,
        name: v.name,
        tools: v.tools,
        requires_approval: v.requires_approval,
      })),
    );
  }

  if (path === "agents/jobs" && method === "GET") {
    return json(
      ensureSeeded()
        .jobs.filter((j) => j.org_id === user.org_id)
        .map((j) => ({
          id: j.id,
          name: j.name,
          agent_type: j.agent_type,
          status: j.status,
          requires_approval: j.requires_approval,
          approved: j.approved,
          created_at: j.created_at,
          completed_at: j.completed_at,
          result_preview: j.result?.summary?.slice(0, 240) || "",
        })),
    );
  }

  if (path === "agents/jobs" && method === "POST") {
    const s = ensureSeeded();
    const agentType = String(body?.agent_type || "researcher");
    const spec = AGENT_TYPES[agentType] || AGENT_TYPES.researcher;
    const query = String(body?.query || body?.name || "");
    const traces = await runToolSuite(user.org_id, query, spec.tools);
    const llm = await completeChat({
      system: `${SYSTEM_PROMPTS[agentType as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.copilot}\n\nCONTEXT:\n${traces
        .map((t) => JSON.stringify(t).slice(0, 1400))
        .join("\n---\n")}`,
      messages: [{ role: "user", content: `Run agent objective: ${query}` }],
    });
    const job = {
      id: uid(),
      org_id: user.org_id,
      user_id: user.id,
      name: String(body?.name || "Agent job"),
      agent_type: agentType,
      status: spec.requires_approval ? "awaiting_approval" : "completed",
      input: { query },
      plan: [
        { step: 1, action: "plan", detail: `Analyze objective for ${spec.name}` },
        { step: 2, action: "retrieve", detail: `Invoke tools: ${spec.tools.join(", ")}` },
        { step: 3, action: "synthesize", detail: `Generate with ${llm.provider}/${llm.model}` },
      ],
      result: { summary: llm.content, tool_traces: traces, model: llm.model, provider: llm.provider },
      requires_approval: spec.requires_approval,
      approved: null as boolean | null,
      created_at: now(),
      completed_at: spec.requires_approval ? null : now(),
    };
    s.jobs.unshift(job);
    s.usage.push({
      id: uid(),
      org_id: user.org_id,
      provider: llm.provider,
      model: llm.model,
      tokens_in: llm.tokens_in,
      tokens_out: llm.tokens_out,
      cost_usd: llm.cost_usd,
      created_at: now(),
    });
    audit(user.org_id, user.id, "agent_run", job.id, { type: agentType, provider: llm.provider });
    return json(job);
  }

  if (path.startsWith("agents/jobs/") && path.endsWith("/approve") && method === "POST") {
    const id = path.split("/")[2];
    const job = ensureSeeded().jobs.find((j) => j.id === id && j.org_id === user.org_id);
    if (!job) return err("Job not found", 404);
    job.approved = true;
    job.status = "completed";
    job.completed_at = now();
    audit(user.org_id, user.id, "agent_approve", job.id);
    return json(job);
  }

  if (path.startsWith("agents/jobs/") && path.endsWith("/reject") && method === "POST") {
    const id = path.split("/")[2];
    const job = ensureSeeded().jobs.find((j) => j.id === id && j.org_id === user.org_id);
    if (!job) return err("Job not found", 404);
    job.approved = false;
    job.status = "rejected";
    job.completed_at = now();
    return json(job);
  }

  if (path.startsWith("agents/jobs/") && method === "GET") {
    const id = path.split("/")[2];
    const job = ensureSeeded().jobs.find((j) => j.id === id && j.org_id === user.org_id);
    if (!job) return err("Job not found", 404);
    return json(job);
  }

  if (path === "workflows" && method === "GET") {
    return json(
      ensureSeeded().workflows.filter((w) => w.org_id === user.org_id || w.org_id === DEMO_ORG_ID),
    );
  }

  if (path === "workflows" && method === "POST") {
    const s = ensureSeeded();
    const wf = {
      id: uid(),
      org_id: user.org_id,
      name: String(body?.name || "Untitled workflow"),
      description: String(body?.description || ""),
      steps: body?.steps?.length
        ? body.steps
        : [
            { id: "ingest", label: "Ingest", type: "ingest" },
            { id: "extract", label: "Extract", type: "extract" },
            { id: "analyze", label: "Analyze", type: "analyze" },
            { id: "approve", label: "Approve", type: "approve" },
            { id: "notify", label: "Notify", type: "notify" },
          ],
      is_active: true,
    };
    s.workflows.unshift(wf);
    return json(wf);
  }

  if (path === "workflows/runs/recent" && method === "GET") {
    return json(
      ensureSeeded()
        .runs.filter((r) => r.org_id === user.org_id)
        .slice(0, 20)
        .map((r) => ({
          id: r.id,
          workflow_id: r.workflow_id,
          status: r.status,
          created_at: r.created_at,
          completed_at: r.completed_at,
          steps_completed: (r.step_results || []).length,
        })),
    );
  }

  if (path.startsWith("workflows/") && path.endsWith("/run") && method === "POST") {
    const id = path.split("/")[1];
    const s = ensureSeeded();
    const wf = s.workflows.find(
      (w) => w.id === id && (w.org_id === user.org_id || w.org_id === DEMO_ORG_ID),
    );
    if (!wf) return err("Workflow not found", 404);
    const step_results = [];
    for (const step of wf.steps) {
      let detail: unknown;
      if (step.type === "ingest") detail = await knowledgeSearch(user.org_id, wf.name);
      else if (step.type === "extract") detail = await searchTrials(wf.name);
      else if (step.type === "analyze") detail = sqlMetrics();
      else if (step.type === "approve") detail = { status: "auto-approved", by: user.email };
      else detail = { notified: ["executives@lsi.os", user.email], channel: "in-app" };
      step_results.push({ step, result: detail, status: "completed" });
    }
    const run = {
      id: uid(),
      workflow_id: wf.id,
      org_id: user.org_id,
      status: "completed",
      step_results,
      created_at: now(),
      completed_at: now(),
    };
    s.runs.unshift(run);
    audit(user.org_id, user.id, "workflow_run", run.id);
    return json(run);
  }

  if (path === "modules/sources" && method === "GET") {
    return json({
      sources: DATA_SOURCES.map((d) => ({
        ...d,
        status:
          d.status === "env"
            ? hasOpenAI()
              ? "active"
              : "configure OPENAI_API_KEY"
            : d.status,
      })),
      knowledge: knowledgeStats(),
    });
  }

  if (path === "modules/dashboard" && method === "GET") {
    const stats = knowledgeStats();
    return json({
      kpis: [
        { id: "arr", label: "Pipeline Value", value: "$2.4B", delta: "+6.2%", trend: "up" },
        { id: "trials", label: "Active Trials", value: "28", delta: "+3", trend: "up" },
        { id: "signals", label: "Open Safety Signals", value: "6", delta: "-2", trend: "down" },
        { id: "subs", label: "Regulatory Filings QTD", value: "3", delta: "on track", trend: "flat" },
        { id: "kol", label: "KOL Engagements (30d)", value: "112", delta: "+18%", trend: "up" },
        { id: "kb", label: "Knowledge Chunks", value: String(stats.embedded_chunks || stats.chunks), delta: `${stats.documents} docs`, trend: "up" },
      ],
      briefing: hasOpenAI()
        ? "OpenAI connected. Portfolio risk remains concentrated in Oncology Phase III; CardiaX APAC enrollment lag is the top operational risk. Safety signals for ImmunoPath require human-approved communications."
        : "Demo brain active (set OPENAI_API_KEY for generative upgrades). Portfolio risk concentrated in Oncology Phase III; CardiaX APAC enrollment lag is top operational risk.",
      risks: [
        { title: "Oncology Ph3 enrollment lag", severity: "high", owner: "Clinical Ops" },
        { title: "Label negotiation — EU", severity: "medium", owner: "Regulatory" },
        { title: "Competitor launch — immunology", severity: "medium", owner: "Commercial" },
      ],
      ai_actions: [
        "Run Safety Sentinel on ImmunoPath colitis signal",
        "Search ClinicalTrials.gov for HFpEF competitive landscape",
        "Draft HEOR evidence brief for OncoPrime HTA",
      ],
      sources_online: DATA_SOURCES.length,
      openai: hasOpenAI(),
    });
  }

  if (path === "modules/commercial" && method === "GET") {
    const labels = await openFdaLabels("pembrolizumab", 3);
    return json({
      brands: [
        { name: "CardiaX", share: 18.4, growth: 4.2, hcp_reach: 4200, nrx: 12800 },
        { name: "OncoPrime", share: 11.1, growth: 9.8, hcp_reach: 2100, nrx: 5400 },
        { name: "ImmunoPath", share: 7.6, growth: -1.2, hcp_reach: 1800, nrx: 3900 },
      ],
      competitors: [
        { name: "Rival-A", move: "Expanded specialty pharmacy network", impact: "medium" },
        { name: "Rival-B", move: "DTP campaign in top 10 MSAs", impact: "high" },
      ],
      insights: [
        "CardiaX growth driven by cardiology KOLs in Mid-Atlantic.",
        "OncoPrime share gains correlate with new biomarker testing coverage.",
      ],
      label_intel: labels.results,
      sources: ["offline-corpus", "OpenFDA Labels"],
    });
  }

  if (path === "modules/medical" && method === "GET") {
    const q = url.searchParams.get("q") || "immunotherapy checkpoint inhibitor";
    const [pubmed, epmc] = await Promise.all([searchPubmed(q, 6), searchEuropePmc(q, 5)]);
    return json({
      query: q,
      kols: [
        { name: "Dr. Maya Chen", specialty: "Oncology", influence: 92, recent_topic: "PD-1 combinations" },
        { name: "Dr. Luis Ortega", specialty: "Cardiology", influence: 88, recent_topic: "SGLT2 outcomes" },
        { name: "Dr. Aisha Rahman", specialty: "Immunology", influence: 85, recent_topic: "IL-17 safety" },
      ],
      publications: pubmed.results,
      europe_pmc: epmc.results,
      msls_focus: ["Congress abstract mining", "Advisory board synthesis", "Medical information FAQs"],
      sources: [pubmed.source, epmc.source, "offline-corpus"],
    });
  }

  if (path === "modules/clinical" && method === "GET") {
    const q = url.searchParams.get("q") || "heart failure preserved ejection fraction";
    const trials = await searchTrials(q, 12);
    return json({
      query: q,
      trials: trials.results,
      ops: {
        sites_activated: 146,
        screen_fail_rate: 0.22,
        median_enrollment_days: 118,
        protocol_amendments_ytd: 7,
      },
      error: trials.error,
      sources: [trials.source, "offline-corpus"],
    });
  }

  if (path === "modules/heor" && method === "GET") {
    const lit = await searchPubmed("real world evidence HFpEF SGLT2", 5);
    return json({
      evidence: [
        { study: "RWE CardiaX 24m", design: "Retrospective cohort", endpoint: "Hospitalization", result: "-18% vs SOC" },
        { study: "OncoPrime QALY", design: "Markov model", endpoint: "ICER", result: "$64k/QALY" },
        { study: "ImmunoPath adherence", design: "Claims RWE", endpoint: "PDC", result: "0.81" },
      ],
      hta: [
        { market: "NICE", status: "In review", risk: "medium" },
        { market: "G-BA", status: "Additional benefit pending", risk: "high" },
        { market: "HAS", status: "ASMR III expected", risk: "low" },
      ],
      literature: lit.results,
      recommendations: [
        "Expand RWE to include underrepresented populations.",
        "Prepare budget-impact model for US payer dossier refresh.",
      ],
      sources: ["offline-corpus", lit.source],
    });
  }

  if (path === "modules/regulatory" && method === "GET") {
    const drug = url.searchParams.get("drug") || "empagliflozin";
    const [labels, dailymed] = await Promise.all([openFdaLabels(drug, 4), searchDailyMed(drug, 4)]);
    return json({
      guidances: [
        { title: "Oncology clinical trial endpoints", agency: "FDA", updated: "2025-11-02", relevance: "high" },
        { title: "RWE for regulatory decision-making", agency: "FDA", updated: "2025-08-14", relevance: "high" },
        { title: "Pharmacovigilance system master file", agency: "EMA", updated: "2025-06-01", relevance: "medium" },
      ],
      submissions: [
        { name: "sNDA CardiaX", type: "sNDA", status: "CMC responses pending", due: "2026-09-15" },
        { name: "MAA OncoPrime", type: "MAA", status: "Day 120 questions", due: "2026-08-30" },
      ],
      readiness: { cmc: 78, clinical: 91, labeling: 84, safety: 88 },
      labels: labels.results,
      dailymed: dailymed.results,
      sources: [labels.source, dailymed.source, "offline-corpus"],
    });
  }

  if (path === "modules/safety" && method === "GET") {
    const drug = url.searchParams.get("drug") || "aspirin";
    const [events, enforcement, rxnorm] = await Promise.all([
      openFdaEvents(drug, 8),
      openFdaEnforcement(drug, 5),
      searchRxNorm(drug),
    ]);
    return json({
      drug,
      total_reports: events.total,
      events: events.results,
      recalls: enforcement.results,
      rxnorm: rxnorm.results,
      signals: [
        { term: "Gastrointestinal haemorrhage", score: 0.82, trend: "stable" },
        { term: "Hypersensitivity", score: 0.61, trend: "down" },
        { term: "Renal impairment", score: 0.44, trend: "up" },
      ],
      error: events.error,
      note: events.note,
      sources: [events.source, enforcement.source, rxnorm.source, "offline-corpus"],
    });
  }

  if (path.startsWith("modules/packs/") && method === "GET" && !path.endsWith("/run")) {
    const packId = path.split("/")[2];
    if (packId === "life-sciences") {
      return json({
        id: "life-sciences",
        name: "Life Sciences Intelligence",
        redirect: "/dashboard",
        message: "Use Commercial, Clinical, Medical, HEOR, Regulatory, and Safety modules.",
      });
    }
    const pack = getPackWorkspace(packId);
    if (!pack) return err(`Unknown pack: ${packId}. Available: ${listPackIds().join(", ")}`, 404);
    const s = ensureSeeded();
    if (!s.packQueues[packId]) {
      s.packQueues[packId] = pack.queues.map((q) => ({ ...q }));
    }
    return json({ ...pack, queues: s.packQueues[packId] });
  }

  if (path.startsWith("modules/packs/") && path.endsWith("/run") && method === "POST") {
    const packId = path.split("/")[2];
    const pack = getPackWorkspace(packId);
    if (!pack) return err(`Unknown pack: ${packId}`, 404);
    const s = ensureSeeded();
    if (!s.packQueues[packId]) {
      s.packQueues[packId] = pack.queues.map((q) => ({ ...q }));
    }
    const action = String(body?.action || "agent");
    const query = String(body?.query || "");
    const notes = String(body?.notes || "");
    audit(user.org_id, user.id, "pack_run", packId, { action, query });

    if (action === "complete_queue") {
      const queueId = String(body?.queue_id || "");
      s.packQueues[packId] = s.packQueues[packId].map((q) =>
        q.id === queueId ? { ...q, status: "done" } : q,
      );
      return json({
        ok: true,
        message: `Queue item ${queueId} marked done in ${pack.name}.`,
        details: ["Queue updated in runtime store", "Audit event written", "Owner notified in-app"],
        queues: s.packQueues[packId],
      });
    }

    if (action === "workflow") {
      const step_results = [
        "Step 1/4 ingest pack context",
        "Step 2/4 apply business rules",
        "Step 3/4 draft outputs",
        "Step 4/4 waiting human approval where required",
        notes ? `Notes: ${notes}` : "No extra notes",
      ];
      s.runs.unshift({
        id: uid(),
        workflow_id: String(body?.workflow_id || `pack-${packId}`),
        org_id: user.org_id,
        status: "completed",
        step_results: step_results.map((label) => ({ step: { label }, status: "completed" })),
        created_at: now(),
        completed_at: now(),
      });
      return json({
        ok: true,
        message: `Workflow executed for ${pack.name}: ${query || body?.workflow_id}`,
        details: step_results,
      });
    }

    const citations = await hybridSearch(user.org_id, query || pack.name, 4);
    const traces = await runToolSuite(user.org_id, query || pack.name, ["knowledge_search", "sql_metrics"]);
    return json({
      ok: true,
      message: `${pack.name} agent completed: ${query}`,
      details: [
        `Retrieved ${citations.length} enterprise knowledge hits`,
        ...citations.slice(0, 3).map((c) => `Cite: ${c.title}`),
        `Tool suite returned ${traces.length} traces`,
        "Generated recommended next actions",
        "Wrote audit + usage meter events",
        notes ? `Operator notes captured: ${notes.slice(0, 160)}` : "Ready for approval if gated",
      ],
    });
  }

  if (path === "modules/integrations" && method === "GET") {
    return json({ connectors: ensureSeeded().connectors });
  }

  if (path === "modules/integrations/connect" && method === "POST") {
    const s = ensureSeeded();
    const id = String(body?.id || "");
    const connector = s.connectors.find((c) => c.id === id);
    if (!connector) return err("Connector not found", 404);
    if (connector.status === "roadmap") return err("Connector is on the roadmap and cannot be connected yet", 400);
    connector.status = "connected";
    connector.last_sync = now();
    audit(user.org_id, user.id, "connector_connect", id);
    return json({ ok: true, connector });
  }

  if (path === "modules/integrations/disconnect" && method === "POST") {
    const s = ensureSeeded();
    const id = String(body?.id || "");
    const connector = s.connectors.find((c) => c.id === id);
    if (!connector) return err("Connector not found", 404);
    if (connector.status === "roadmap") return err("Connector is on the roadmap", 400);
    connector.status = "available";
    connector.last_sync = null;
    audit(user.org_id, user.id, "connector_disconnect", id);
    return json({ ok: true, connector });
  }

  if (path === "modules/integrations/sync" && method === "POST") {
    const s = ensureSeeded();
    const id = String(body?.id || "");
    const connector = s.connectors.find((c) => c.id === id);
    if (!connector) return err("Connector not found", 404);
    if (connector.status !== "connected") return err("Connect the connector before syncing", 400);
    connector.last_sync = now();
    audit(user.org_id, user.id, "connector_sync", id);
    return json({
      ok: true,
      message: `Synced ${connector.name}`,
      records: 40 + Math.floor(Math.random() * 120),
      connector,
    });
  }

  if (path === "modules/graph" && method === "GET") {
    return json({
      entities: [
        { type: "Organization", count: 42 },
        { type: "Product / Brand", count: 18 },
        { type: "Trial", count: 128 },
        { type: "HCP / KOL", count: 960 },
        { type: "Document", count: knowledgeStats().documents },
        { type: "Risk", count: 36 },
        { type: "Adverse Event Signal", count: 22 },
        { type: "Regulation", count: 74 },
      ],
      relationships: [
        { from: "CardiaX", rel: "STUDIED_IN", to: "Phase III HFpEF" },
        { from: "OncoPrime", rel: "REQUIRES", to: "PD-L1 companion diagnostic" },
        { from: "ImmunoPath", rel: "HAS_SIGNAL", to: "Colitis (EB05 1.8)" },
        { from: "Dr. Maya Chen", rel: "INFLUENCES", to: "Oncology KOL network" },
        { from: "CardiaX sNDA", rel: "GOVERNED_BY", to: "FDA RWE guidance" },
      ],
      ontology: [
        "Organization", "Person", "Product", "Customer", "Contract", "Document", "Regulation", "Policy",
        "Asset", "Event", "Risk", "Metric", "Process", "Decision", "Evidence",
        "Drug", "Disease", "Trial", "HCP", "Publication", "Submission", "AdverseEvent",
      ],
    });
  }

  if (path === "modules/data-rights" && method === "GET") {
    const s = ensureSeeded();
    return json({
      zones: [
        { zone: "GREEN", label: "Unrestricted / licensed", count: 8, policy: "Eligible for RAG; training only if license allows." },
        { zone: "BLUE", label: "Retrieval permitted", count: 14, policy: "Store/search/cite. No model-weight training." },
        { zone: "YELLOW", label: "Customer private", count: knowledgeStats().documents, policy: "Tenant-isolated. No cross-tenant training by default." },
        { zone: "RED", label: "Prohibited / unclear", count: s.rightsReviews.filter((r) => r.decision === "block").length, policy: "Hard exclude. Unclear rights = do not train." },
      ],
      registry: [
        { dataset_id: "clinicaltrials-gov-v2", publisher: "NIH/NLM", license: "Public government", commercial_use_allowed: true, model_training_allowed: false, rag_allowed: true, zone: "BLUE" },
        { dataset_id: "openfda-faers", publisher: "FDA", license: "Public government", commercial_use_allowed: true, model_training_allowed: false, rag_allowed: true, zone: "BLUE" },
        { dataset_id: "pubmed-eutils", publisher: "NCBI", license: "Public metadata + publisher fulltext varies", commercial_use_allowed: true, model_training_allowed: false, rag_allowed: true, zone: "BLUE" },
        { dataset_id: "europe-pmc", publisher: "EMBL-EBI", license: "Mixed / OA subset", commercial_use_allowed: true, model_training_allowed: false, rag_allowed: true, zone: "BLUE" },
        { dataset_id: "rxnorm", publisher: "NLM", license: "UMLS / RxNorm terms", commercial_use_allowed: true, model_training_allowed: false, rag_allowed: true, zone: "BLUE" },
        { dataset_id: "dailymed-spl", publisher: "NLM", license: "Public SPL", commercial_use_allowed: true, model_training_allowed: false, rag_allowed: true, zone: "BLUE" },
        { dataset_id: "eios-offline-corpus", publisher: "EIOS curated", license: "Internal synthetic/demo", commercial_use_allowed: true, model_training_allowed: true, rag_allowed: true, zone: "GREEN" },
        { dataset_id: "tenant-private-docs", publisher: "Customer", license: "Customer contract", commercial_use_allowed: false, model_training_allowed: false, rag_allowed: true, zone: "YELLOW" },
      ],
      reviews: s.rightsReviews.filter((r) => r.reviewer_id === user.id || true).slice(0, 20),
    });
  }

  if (path === "modules/data-rights/review" && method === "POST") {
    const s = ensureSeeded();
    const dataset_id = String(body?.dataset_id || "");
    const decision = String(body?.decision || "escalate") as "allow_rag" | "block" | "escalate";
    if (!dataset_id) return err("dataset_id required", 400);
    if (!["allow_rag", "block", "escalate"].includes(decision)) return err("Invalid decision", 400);
    const review = {
      dataset_id,
      decision,
      note: String(body?.note || ""),
      reviewer_id: user.id,
      created_at: now(),
    };
    s.rightsReviews.unshift(review);
    audit(user.org_id, user.id, "data_rights_review", dataset_id, { decision });
    return json({ ok: true, review });
  }

  if (path === "modules/router" && method === "GET") {
    const probe = await probeOpenAI();
    const provider = probe.ok ? "openai" : "demo";
    return json({
      active_provider: provider,
      openai: probe,
      routes: [
        { task: "chat_synthesis", tier: "quality", provider, reason: "Grounded answers with citations" },
        { task: "classification", tier: "fast", provider: probe.ok ? "gpt-4o-mini" : "demo", reason: "Cheap intent/routing" },
        { task: "embeddings", tier: "vector", provider: probe.ok ? "text-embedding-3-small" : "local-hash", reason: "Hybrid RAG" },
        { task: "safety_comms", tier: "gated", provider, reason: "Requires human approval before complete" },
      ],
      policy: [
        "Choose lowest-cost model that meets quality gates.",
        "Never invent NCT IDs, PMIDs, or FAERS counts.",
        "Customer private context stays tenant-scoped.",
        "Models are replaceable; orchestration stays proprietary.",
      ],
      note: probe.ok
        ? "OpenAI key valid — synthesis and embeddings use cloud models with offline fallbacks."
        : probe.configured
          ? `OpenAI key rejected: ${probe.error}. Platform still runs with demo brain + live government APIs. Replace OPENAI_API_KEY in Vercel.`
          : "Demo brain active. Set OPENAI_API_KEY in Vercel for cloud synthesis.",
      action_required: probe.ok
        ? null
        : "Create a new OpenAI API key and set it as OPENAI_API_KEY (Production) in Vercel, then redeploy.",
    });
  }

  if (path === "modules/marketplace" && method === "GET") {
    return json({ items: ensureSeeded().marketplace, sources: DATA_SOURCES });
  }

  if (path === "modules/marketplace/install" && method === "POST") {
    const s = ensureSeeded();
    const id = String(body?.id || "");
    const item = s.marketplace.find((m) => m.id === id);
    if (!item) return err("Marketplace item not found", 404);
    item.installed = true;
    if (id === "workflow-hta" && !s.workflows.some((w) => w.name === "HTA Dossier Workflow" && w.org_id === user.org_id)) {
      s.workflows.unshift({
        id: uid(),
        org_id: user.org_id,
        name: "HTA Dossier Workflow",
        description: "Installed from marketplace — ingest → extract → analyze → approve → notify.",
        steps: [
          { id: "ingest", label: "Ingest", type: "ingest" },
          { id: "extract", label: "Extract", type: "extract" },
          { id: "analyze", label: "Analyze", type: "analyze" },
          { id: "approve", label: "Approve", type: "approve" },
          { id: "notify", label: "Notify", type: "notify" },
        ],
        is_active: true,
      });
    }
    audit(user.org_id, user.id, "marketplace_install", id);
    return json({ ok: true, item });
  }

  if (path === "modules/marketplace/uninstall" && method === "POST") {
    const s = ensureSeeded();
    const id = String(body?.id || "");
    const item = s.marketplace.find((m) => m.id === id);
    if (!item) return err("Marketplace item not found", 404);
    item.installed = false;
    audit(user.org_id, user.id, "marketplace_uninstall", id);
    return json({ ok: true, item });
  }

  if (path === "admin/users" && method === "GET") {
    if (user.role !== "admin") return err("Insufficient permissions", 403);
    return json(
      ensureSeeded()
        .users.filter((u) => u.org_id === user.org_id)
        .map((u) => ({
          id: u.id,
          email: u.email,
          full_name: u.full_name,
          role: u.role,
          is_active: u.is_active,
          created_at: u.created_at,
        })),
    );
  }

  if (path === "admin/audit" && method === "GET") {
    if (!["admin", "compliance"].includes(user.role)) return err("Insufficient permissions", 403);
    return json(ensureSeeded().audit.filter((a) => a.org_id === user.org_id).slice(0, 100));
  }

  if (path === "admin/models" && method === "GET") {
    if (user.role !== "admin") return err("Insufficient permissions", 403);
    const provider = hasOpenAI() ? "openai" : "demo";
    return json({
      active_provider: provider,
      routes: [
        { task: "chat", tier: "fast", provider },
        { task: "agent_synthesis", tier: "quality", provider },
        { task: "embeddings", tier: hasOpenAI() ? "openai" : "local", provider: hasOpenAI() ? "text-embedding-3-small" : "demo-hash" },
      ],
      knowledge: knowledgeStats(),
      sources: DATA_SOURCES,
      note: hasOpenAI()
        ? "OpenAI key detected. Chat, agents, and embeddings use cloud models with offline/local fallbacks."
        : "Set OPENAI_API_KEY for cloud LLM + embeddings.",
    });
  }

  if (path === "admin/usage" && method === "GET") {
    if (user.role !== "admin") return err("Insufficient permissions", 403);
    const meters = new Map<
      string,
      { provider: string; model: string; tokens_in: number; tokens_out: number; cost_usd: number; calls: number }
    >();
    for (const m of ensureSeeded().usage.filter((x) => x.org_id === user.org_id)) {
      const key = `${m.provider}:${m.model}`;
      const cur = meters.get(key) || {
        provider: m.provider,
        model: m.model,
        tokens_in: 0,
        tokens_out: 0,
        cost_usd: 0,
        calls: 0,
      };
      cur.tokens_in += m.tokens_in;
      cur.tokens_out += m.tokens_out;
      cur.cost_usd += m.cost_usd;
      cur.calls += 1;
      meters.set(key, cur);
    }
    return json({ meters: [...meters.values()] });
  }

  return err(`Route not found: ${method} /api/v1/${path}`, 404);
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  return handle(req, (await ctx.params).path);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return handle(req, (await ctx.params).path);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  return handle(req, (await ctx.params).path);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return handle(req, (await ctx.params).path);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return handle(req, (await ctx.params).path);
}
