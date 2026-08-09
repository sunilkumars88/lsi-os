/** Smoke NestJS platform API (port 4000). */
const base = process.env.SMOKE_BASE || "http://127.0.0.1:4000";

async function req(path, { method = "GET", token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

const results = [];
async function test(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail });
    console.log(`OK   ${name}: ${String(detail).slice(0, 120)}`);
  } catch (e) {
    results.push({ name, ok: false, detail: e.message });
    console.log(`FAIL ${name}: ${e.message}`);
  }
}

await test("health", async () => (await req("/health")).status);
await test("ready", async () => (await req("/api/v1/ready")).status);

const login = await req("/api/v1/auth/login", {
  method: "POST",
  body: { email: "admin@lsi.os", password: "demo1234" },
});
const token = login.accessToken || login.access_token;

await test("me", async () => (await req("/api/v1/auth/me", { token })).email);
await test("packs", async () => (await req("/api/v1/packs", { token })).length);
await test("connectors", async () => (await req("/api/v1/connectors/registry", { token })).length);
await test("workflows", async () => (await req("/api/v1/workflows", { token })).length);
await test("billing", async () => (await req("/api/v1/billing/plans")).length);
await test("compliance", async () => (await req("/api/v1/compliance/checklists", { token })).length);
await test("data-rights", async () => (await req("/api/v1/data-rights/zones", { token })).length);
await test("smtp-status", async () => (await req("/api/v1/admin/smtp-status", { token })).status);
await test("search", async () => {
  const res = await req("/api/v1/knowledge/search", {
    method: "POST",
    token,
    body: { query: "CardiaX" },
  });
  const hits = Array.isArray(res) ? res : res.results || [];
  return `${hits.length} hits / ${(res.citations || []).length} citations`;
});
await test("pack-run", async () =>
  (
    await req("/api/v1/packs/life-sciences/agents/trial_coordinator/run", {
      method: "POST",
      token,
      body: { query: "Identify eligible HFpEF patients for CardiaX" },
    })
  ).status,
);
await test("connector-connect", async () => {
  const c = await req("/api/v1/connectors/connect", {
    method: "POST",
    token,
    body: { type: "email", name: "Sandbox Email" },
  });
  const t = await req(`/api/v1/connectors/${c.id}/test`, { method: "POST", token });
  return t.message || t.success;
});

const fail = results.filter((r) => !r.ok);
console.log(`\nPASS ${results.length - fail.length}/${results.length}`);
if (fail.length) process.exit(1);
