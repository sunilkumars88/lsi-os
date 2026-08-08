"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Loading, PageHeader, Panel } from "@/components/ui";
import { api } from "@/lib/api";

type Connector = {
  id: string;
  name: string;
  category: string;
  status: string;
  description: string;
  last_sync?: string | null;
};

export default function IntegrationsPage() {
  const [items, setItems] = useState<Connector[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function refresh() {
    const d = await api<{ connectors: Connector[] }>("/api/v1/modules/integrations");
    setItems(d.connectors);
  }

  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, []);

  async function connect(id: string) {
    setBusy(id);
    setError("");
    try {
      await api("/api/v1/modules/integrations/connect", { method: "POST", body: JSON.stringify({ id }) });
      setNote(`Connected ${id}`);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connect failed");
    } finally {
      setBusy(null);
    }
  }

  async function disconnect(id: string) {
    setBusy(id);
    setError("");
    try {
      await api("/api/v1/modules/integrations/disconnect", { method: "POST", body: JSON.stringify({ id }) });
      setNote(`Disconnected ${id}`);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Disconnect failed");
    } finally {
      setBusy(null);
    }
  }

  async function sync(id: string) {
    setBusy(id);
    setError("");
    try {
      const res = await api<{ message: string; records: number }>("/api/v1/modules/integrations/sync", {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      setNote(`${res.message} · ${res.records} records`);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setBusy(null);
    }
  }

  if (!items.length && !error) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Integration Hub"
        subtitle="Connect, sync, and disconnect enterprise systems. Status updates hit the live API store."
      />
      {error ? <p className="mb-3 text-sm text-[var(--danger)]">{error}</p> : null}
      {note ? <p className="mb-3 text-sm text-[var(--accent)]">{note}</p> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((c) => (
          <Panel key={c.id}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold">{c.name}</h2>
              <Badge tone={c.status === "connected" ? "good" : c.status === "available" ? "neutral" : "warn"}>
                {c.status}
              </Badge>
            </div>
            <div className="mt-2">
              <Badge tone="neutral">{c.category}</Badge>
            </div>
            <p className="mt-3 text-sm text-[var(--ink-muted)]">{c.description}</p>
            {c.last_sync ? (
              <p className="mt-2 text-xs text-[var(--ink-muted)]">Last sync: {new Date(c.last_sync).toLocaleString()}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {c.status === "available" ? (
                <Button disabled={busy === c.id} onClick={() => connect(c.id)}>
                  {busy === c.id ? "Working…" : "Connect"}
                </Button>
              ) : null}
              {c.status === "connected" ? (
                <>
                  <Button disabled={busy === c.id} onClick={() => sync(c.id)}>
                    {busy === c.id ? "Working…" : "Sync now"}
                  </Button>
                  <Button variant="secondary" disabled={busy === c.id} onClick={() => disconnect(c.id)}>
                    Disconnect
                  </Button>
                </>
              ) : null}
              {c.status === "roadmap" ? <Badge tone="warn">Coming soon</Badge> : null}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
