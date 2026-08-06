"use client";

import { useEffect, useState } from "react";
import { Badge, Loading, PageHeader, Panel } from "@/components/ui";
import { api } from "@/lib/api";

export default function AdminPage() {
  const [users, setUsers] = useState<{ id: string; email: string; full_name: string; role: string }[]>([]);
  const [audit, setAudit] = useState<{ id: string; action: string; resource: string; created_at: string }[]>([]);
  const [models, setModels] = useState<{ active_provider: string; routes: { task: string; tier: string; provider: string }[]; note: string } | null>(null);
  const [usage, setUsage] = useState<{ meters: { provider: string; model: string; tokens_in: number; tokens_out: number; cost_usd: number; calls: number }[] } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api<typeof users>("/api/v1/admin/users"),
      api<typeof audit>("/api/v1/admin/audit"),
      api<NonNullable<typeof models>>("/api/v1/admin/models"),
      api<NonNullable<typeof usage>>("/api/v1/admin/usage"),
    ])
      .then(([u, a, m, us]) => {
        setUsers(u);
        setAudit(a);
        setModels(m);
        setUsage(us);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-[var(--danger)]">{error}</p>;
  if (!models) return <Loading />;

  return (
    <div>
      <PageHeader title="Admin Console" subtitle="Users, audit trail, model routing, and AI cost meters." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="font-semibold">Users</h2>
          <div className="mt-3 space-y-2 text-sm">
            {users.map((u) => (
              <div key={u.id} className="flex justify-between border-b border-[var(--line)] py-2">
                <span>{u.full_name} · {u.email}</span>
                <Badge>{u.role}</Badge>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Model routing</h2>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">Active: <strong>{models.active_provider}</strong></p>
          <div className="mt-3 space-y-2 text-sm">
            {models.routes.map((r) => (
              <div key={r.task} className="flex justify-between border-b border-[var(--line)] py-2">
                <span>{r.task}</span>
                <span>{r.tier} → {r.provider}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-[var(--ink-muted)]">{models.note}</p>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Usage meters</h2>
          <div className="mt-3 space-y-2 text-sm">
            {(usage?.meters || []).map((m, i) => (
              <div key={i} className="border-b border-[var(--line)] py-2">
                {m.provider}/{m.model} · {m.calls} calls · {m.tokens_in + m.tokens_out} tokens · ${m.cost_usd.toFixed(4)}
              </div>
            ))}
            {!usage?.meters?.length ? <p className="text-[var(--ink-muted)]">No usage yet — run Copilot or an agent.</p> : null}
          </div>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Audit log</h2>
          <div className="mt-3 max-h-80 space-y-2 overflow-y-auto text-sm">
            {audit.map((a) => (
              <div key={a.id} className="border-b border-[var(--line)] py-2">
                <div className="font-medium">{a.action}</div>
                <div className="text-[var(--ink-muted)]">{a.resource} · {new Date(a.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
