"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Input, Loading, PageHeader, Panel } from "@/components/ui";
import { api, isNestBackend } from "@/lib/api";
import {
  mergeConnectorViews,
  type IntegrationCard,
  type NestConnector,
  type NestConnectorRegistryItem,
} from "@/lib/nest-adapters";

const CRED_KEY = "eios_connector_creds";

function loadLocalCreds(): Record<string, Record<string, string>> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(CRED_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveLocalCreds(all: Record<string, Record<string, string>>) {
  localStorage.setItem(CRED_KEY, JSON.stringify(all));
}

export default function IntegrationsPage() {
  const [items, setItems] = useState<IntegrationCard[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [creds, setCreds] = useState<Record<string, Record<string, string>>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const nest = isNestBackend();

  async function refresh() {
    if (nest) {
      const [registry, connected] = await Promise.all([
        api<NestConnectorRegistryItem[]>("/api/v1/connectors/registry"),
        api<NestConnector[]>("/api/v1/connectors"),
      ]);
      setItems(mergeConnectorViews(registry, connected));
      return;
    }
    const d = await api<{ connectors: IntegrationCard[] }>("/api/v1/modules/integrations");
    setItems(d.connectors);
  }

  useEffect(() => {
    setCreds(loadLocalCreds());
    refresh().catch((e) => setError(e.message));
  }, []);

  function updateField(type: string, field: string, value: string) {
    setCreds((prev) => {
      const next = { ...prev, [type]: { ...(prev[type] || {}), [field]: value } };
      saveLocalCreds(next);
      return next;
    });
  }

  async function connect(card: IntegrationCard) {
    setBusy(card.id);
    setError("");
    try {
      if (nest) {
        const config = creds[card.type] || {};
        await api("/api/v1/connectors/connect", {
          method: "POST",
          body: JSON.stringify({
            type: card.type,
            name: card.name,
            config,
          }),
        });
        setNote(`Connected ${card.name}`);
      } else {
        await api("/api/v1/modules/integrations/connect", {
          method: "POST",
          body: JSON.stringify({ id: card.id }),
        });
        setNote(`Connected ${card.id}`);
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connect failed");
    } finally {
      setBusy(null);
    }
  }

  async function disconnect(card: IntegrationCard) {
    setBusy(card.id);
    setError("");
    try {
      if (nest) {
        const id = card.instanceId || card.id;
        await api(`/api/v1/connectors/${id}/disconnect`, { method: "POST" });
      } else {
        await api("/api/v1/modules/integrations/disconnect", {
          method: "POST",
          body: JSON.stringify({ id: card.id }),
        });
      }
      setNote(`Disconnected ${card.name}`);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Disconnect failed");
    } finally {
      setBusy(null);
    }
  }

  async function sync(card: IntegrationCard) {
    setBusy(card.id);
    setError("");
    try {
      if (nest) {
        const id = card.instanceId || card.id;
        const res = await api<{
          stats?: { recordsProcessed?: number };
          message?: string;
        }>(`/api/v1/connectors/${id}/sync`, { method: "POST" });
        const records = res.stats?.recordsProcessed ?? 0;
        setNote(`Synced ${card.name} · ${records} records`);
      } else {
        const res = await api<{ message: string; records: number }>(
          "/api/v1/modules/integrations/sync",
          {
            method: "POST",
            body: JSON.stringify({ id: card.id }),
          },
        );
        setNote(`${res.message} · ${res.records} records`);
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setBusy(null);
    }
  }

  async function test(card: IntegrationCard) {
    if (!nest) return;
    setBusy(card.id);
    setError("");
    try {
      const id = card.instanceId || card.id;
      const res = await api<{ message?: string; latencyMs?: number }>(
        `/api/v1/connectors/${id}/test`,
        { method: "POST" },
      );
      setNote(res.message || `Test OK (${res.latencyMs ?? "?"}ms)`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Test failed");
    } finally {
      setBusy(null);
    }
  }

  if (!items.length && !error) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Integration Hub"
        subtitle={
          nest
            ? "Nest connector registry — connect, test, sync, and disconnect sandbox integrations."
            : "Connect, sync, and disconnect enterprise systems. Status updates hit the live API store."
        }
      />
      {error ? <p className="mb-3 text-sm text-[var(--danger)]">{error}</p> : null}
      {note ? <p className="mb-3 text-sm text-[var(--accent)]">{note}</p> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((c) => (
          <Panel key={`${c.type}-${c.id}`}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold">{c.name}</h2>
              <Badge
                tone={
                  c.status === "connected" ? "good" : c.status === "available" ? "neutral" : "warn"
                }
              >
                {c.status}
              </Badge>
            </div>
            <div className="mt-2">
              <Badge tone="neutral">{c.category}</Badge>
            </div>
            <p className="mt-3 text-sm text-[var(--ink-muted)]">{c.description}</p>
            {c.last_sync ? (
              <p className="mt-2 text-xs text-[var(--ink-muted)]">
                Last sync: {new Date(c.last_sync).toLocaleString()}
              </p>
            ) : null}

            {nest && c.status === "available" && c.sandboxFields?.length ? (
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  className="text-xs text-[var(--accent)]"
                  onClick={() => setExpanded(expanded === c.type ? null : c.type)}
                >
                  {expanded === c.type ? "Hide credentials" : "Configure credentials"}
                </button>
                {expanded === c.type
                  ? c.sandboxFields.map((field) => (
                      <Input
                        key={field}
                        placeholder={field}
                        value={creds[c.type]?.[field] || ""}
                        onChange={(e) => updateField(c.type, field, e.target.value)}
                      />
                    ))
                  : null}
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              {c.status === "available" ? (
                <Button disabled={busy === c.id} onClick={() => connect(c)}>
                  {busy === c.id ? "Working…" : "Connect"}
                </Button>
              ) : null}
              {c.status === "connected" ? (
                <>
                  {nest ? (
                    <Button variant="secondary" disabled={busy === c.id} onClick={() => test(c)}>
                      Test
                    </Button>
                  ) : null}
                  <Button disabled={busy === c.id} onClick={() => sync(c)}>
                    {busy === c.id ? "Working…" : "Sync now"}
                  </Button>
                  <Button variant="secondary" disabled={busy === c.id} onClick={() => disconnect(c)}>
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
