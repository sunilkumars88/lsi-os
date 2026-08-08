const base = process.env.SMOKE_BASE || "http://localhost:3010";

async function req(path, { method = "GET", token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${typeof data === "string" ? data : data.detail || JSON.stringify(data)}`);
  return data;
}

const results = [];
async function test(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail: String(detail).slice(0, 140) });
    console.log(`OK   ${name}: ${String(detail).slice(0, 100)}`);
  } catch (e) {
    results.push({ name, ok: false, detail: e.message });
    console.log(`FAIL ${name}: ${e.message}`);
  }
}

const login = await req("/api/v1/auth/login", {
  method: "POST",
  body: { email: "admin@lsi.os", password: "demo1234" },
});
const token = login.access_token;

await test("health", async () => (await req("/api/health")).status || "ok");
await test("me", async () => (await req("/api/v1/auth/me", { token })).email);
await test("dashboard", async () => (await req("/api/v1/modules/dashboard", { token })).kpis?.length);
await test("docs", async () => (await req("/api/v1/knowledge/documents", { token })).length);
await test("doc-get", async () => (await req("/api/v1/knowledge/documents/doc-0001", { token })).title);
await test("search", async () => (await req("/api/v1/knowledge/search", { method: "POST", token, body: { query: "CardiaX", limit: 3 } })).results.length);
await test("chat", async () => (await req("/api/v1/chat", { method: "POST", token, body: { message: "Summarize CardiaX enrollment risk" } })).provider);
await test("agents", async () => (await req("/api/v1/agents/types", { token })).length);
await test("jobs", async () => (await req("/api/v1/agents/jobs", { token })).length);
await test("approve", async () => {
  const jobs = await req("/api/v1/agents/jobs", { token });
  const j = jobs.find((x) => x.status === "awaiting_approval");
  if (!j) throw new Error("no pending");
  return (await req(`/api/v1/agents/jobs/${j.id}/approve`, { method: "POST", token })).status;
});
await test("workflows", async () => (await req("/api/v1/workflows", { token })).length);
await test("wf-run", async () => {
  const w = (await req("/api/v1/workflows", { token }))[0];
  return (await req(`/api/v1/workflows/${w.id}/run`, { method: "POST", token })).status;
});
await test("integrations", async () => (await req("/api/v1/modules/integrations", { token })).connectors.length);
await test("connect", async () => (await req("/api/v1/modules/integrations/connect", { method: "POST", token, body: { id: "salesforce" } })).ok);
await test("sync", async () => (await req("/api/v1/modules/integrations/sync", { method: "POST", token, body: { id: "salesforce" } })).records);
await test("marketplace", async () => (await req("/api/v1/modules/marketplace/install", { method: "POST", token, body: { id: "workflow-hta" } })).ok);
await test("rights", async () => (await req("/api/v1/modules/data-rights/review", { method: "POST", token, body: { dataset_id: "openfda-faers", decision: "allow_rag" } })).ok);
await test("pack-banking", async () => (await req("/api/v1/modules/packs/banking", { token })).queues.length);
await test("pack-run", async () => (await req("/api/v1/modules/packs/banking/run", { method: "POST", token, body: { action: "agent", query: "Triage overnight fraud alerts" } })).ok);
await test("pack-queue", async () => {
  const r = await req("/api/v1/modules/packs/banking/run", { method: "POST", token, body: { action: "complete_queue", queue_id: "b1" } });
  return r.queues.find((q) => q.id === "b1")?.status;
});
await test("clinical", async () => (await req("/api/v1/modules/clinical?q=oncology", { token })).trials.length);
await test("safety", async () => (await req("/api/v1/modules/safety?drug=aspirin", { token })).events.length);
await test("medical", async () => (await req("/api/v1/modules/medical?q=immunotherapy", { token })).publications.length);
await test("commercial", async () => (await req("/api/v1/modules/commercial", { token })).kpis?.length ?? Object.keys(await req("/api/v1/modules/commercial", { token })).length);
await test("graph", async () => (await req("/api/v1/modules/graph", { token })).entities.length);
await test("router", async () => (await req("/api/v1/modules/router", { token })).active_provider);

const fail = results.filter((r) => !r.ok);
console.log(`\nPASS ${results.length - fail.length}/${results.length}`);
if (fail.length) process.exit(1);
