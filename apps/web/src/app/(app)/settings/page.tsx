"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { API_URL, api, isNestBackend } from "@/lib/api";
import { Badge, Button, Input, Loading, PageHeader, Panel } from "@/components/ui";
import type { NestConnectorRegistryItem } from "@/lib/nest-adapters";

const CRED_KEY = "eios_connector_creds";

type HealthView = {
  openai?: boolean;
  openai_configured?: boolean;
  openai_status?: { ok: boolean; configured: boolean; error?: string };
  action_required?: string | null;
  knowledge?: { documents: number };
  sources?: number;
  smtp?: { configured?: boolean; ok?: boolean; message?: string };
  service?: string;
  status?: string;
};

export default function SettingsPage() {
  const { user } = useAuth();
  const nest = isNestBackend();
  const [health, setHealth] = useState<HealthView | null>(null);
  const [registry, setRegistry] = useState<NestConnectorRegistryItem[]>([]);
  const [selectedType, setSelectedType] = useState("email");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      if (nest) {
        const [healthRes, models, smtp, reg] = await Promise.all([
          api<{ status?: string; service?: string }>("/api/v1/health").catch(() =>
            api<{ status?: string; service?: string }>("/health"),
          ),
          api<{
            providers?: {
              openai?: { configured?: boolean; probe?: { ok?: boolean; error?: string } };
            };
          }>("/api/v1/admin/models/status").catch(() => null),
          api<{ configured?: boolean; ok?: boolean; message?: string }>(
            "/api/v1/admin/smtp-status",
          ).catch(() => null),
          api<NestConnectorRegistryItem[]>("/api/v1/connectors/registry").catch(() => []),
        ]);

        const openaiConfigured = Boolean(models?.providers?.openai?.configured);
        const openaiOk = Boolean(models?.providers?.openai?.probe?.ok);
        setHealth({
          status: healthRes.status,
          service: healthRes.service,
          openai: openaiOk,
          openai_configured: openaiConfigured,
          openai_status: {
            ok: openaiOk,
            configured: openaiConfigured,
            error: models?.providers?.openai?.probe?.error,
          },
          smtp: smtp || undefined,
          action_required: openaiOk
            ? null
            : "Set OPENAI_API_KEY on the Nest API to enable live model routing.",
        });
        setRegistry(reg);
        if (reg[0]) setSelectedType(reg.find((r) => r.type === "email")?.type || reg[0].type);

        try {
          const stored = JSON.parse(localStorage.getItem(CRED_KEY) || "{}");
          const type = reg.find((r) => r.type === "email")?.type || reg[0]?.type || "email";
          setFields(stored[type] || {});
        } catch {
          /* ignore */
        }
        return;
      }

      const h = await api<HealthView>("/api/health");
      setHealth(h);
    }

    load().catch((e) => setError(e.message));
  }, [nest]);

  useEffect(() => {
    if (!nest) return;
    try {
      const stored = JSON.parse(localStorage.getItem(CRED_KEY) || "{}");
      setFields(stored[selectedType] || {});
    } catch {
      setFields({});
    }
  }, [selectedType, nest]);

  const selectedMeta = registry.find((r) => r.type === selectedType);

  async function saveCredentials(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNote("");
    try {
      const all = JSON.parse(localStorage.getItem(CRED_KEY) || "{}");
      all[selectedType] = fields;
      localStorage.setItem(CRED_KEY, JSON.stringify(all));

      if (nest) {
        await api("/api/v1/connectors/connect", {
          method: "POST",
          body: JSON.stringify({
            type: selectedType,
            name: selectedMeta?.name || selectedType,
            config: fields,
          }),
        });
        setNote(`Saved and connected ${selectedMeta?.name || selectedType} (sandbox).`);
      } else {
        setNote("Credentials stored locally.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Organization profile, API status, connector credentials, and runtime probes."
      />
      {error ? <p className="mb-3 text-sm text-[var(--danger)]">{error}</p> : null}
      {note ? <p className="mb-3 text-sm text-[var(--accent)]">{note}</p> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="font-semibold">Organization</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--ink-muted)]">Name</dt>
              <dd>{user?.org_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--ink-muted)]">User</dt>
              <dd>{user?.full_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--ink-muted)]">Email</dt>
              <dd>{user?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--ink-muted)]">Role</dt>
              <dd>{user?.role}</dd>
            </div>
          </dl>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Runtime status</h2>
          {!health ? (
            <Loading />
          ) : (
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span>API base</span>
                <code>{API_URL || "same-origin /api"}</code>
              </div>
              {health.service ? (
                <div className="flex items-center justify-between gap-2">
                  <span>Service</span>
                  <Badge tone="neutral">{health.service}</Badge>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-2">
                <span>OpenAI</span>
                <Badge tone={health.openai_status?.ok ? "good" : "warn"}>
                  {health.openai_status?.ok
                    ? "Working"
                    : health.openai_configured
                      ? "Key invalid"
                      : "Not set"}
                </Badge>
              </div>
              {nest ? (
                <div className="flex items-center justify-between gap-2">
                  <span>SMTP</span>
                  <Badge
                    tone={
                      health.smtp?.ok
                        ? "good"
                        : health.smtp?.configured
                          ? "warn"
                          : "neutral"
                    }
                  >
                    {health.smtp?.ok
                      ? "OK"
                      : health.smtp?.configured
                        ? "Configured"
                        : health.smtp
                          ? "Unavailable"
                          : "No smtp-status endpoint"}
                  </Badge>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span>Knowledge docs</span>
                    <span>{health.knowledge?.documents ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Live sources</span>
                    <span>{health.sources ?? "—"}</span>
                  </div>
                </>
              )}
              {health.openai_status?.error ? (
                <p className="rounded-md bg-rose-500/10 px-3 py-2 text-[var(--danger)]">
                  {health.openai_status.error}
                </p>
              ) : null}
              {health.smtp?.message ? (
                <p className="text-[var(--ink-muted)]">{health.smtp.message}</p>
              ) : null}
              {health.action_required ? (
                <p className="rounded-md bg-amber-500/10 px-3 py-2 text-amber-900">
                  {health.action_required}
                </p>
              ) : null}
              {!nest ? (
                <p className="text-[var(--ink-muted)]">
                  ClinicalTrials.gov, OpenFDA, PubMed, Europe PMC, RxNorm, and DailyMed work without
                  OpenAI. Copilot/agents use the demo brain until a valid key is set.
                </p>
              ) : null}
            </div>
          )}
        </Panel>
      </div>

      {nest ? (
        <Panel className="mt-4">
          <h2 className="font-semibold">Connector credentials</h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Values are stored in localStorage and posted to Nest{" "}
            <code>/api/v1/connectors/connect</code> as sandbox config.
          </p>
          <form onSubmit={saveCredentials} className="mt-3 space-y-3">
            <select
              className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {registry.map((r) => (
                <option key={r.type} value={r.type}>
                  {r.name}
                </option>
              ))}
            </select>
            {(selectedMeta?.sandboxFields || ["apiKey"]).map((field) => (
              <Input
                key={field}
                placeholder={field}
                value={fields[field] || ""}
                onChange={(e) => setFields((prev) => ({ ...prev, [field]: e.target.value }))}
              />
            ))}
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save & connect"}
            </Button>
          </form>
        </Panel>
      ) : null}
    </div>
  );
}
