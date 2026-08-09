"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Loading, PageHeader, Panel } from "@/components/ui";
import { api, isNestBackend } from "@/lib/api";

type Zone = { zone: string; label: string; count: number; policy: string };
type Dataset = {
  dataset_id: string;
  publisher: string;
  license: string;
  commercial_use_allowed: boolean;
  model_training_allowed: boolean;
  rag_allowed: boolean;
  zone: string;
};
type Review = { dataset_id: string; decision: string; note: string; created_at: string };

type NestZone = {
  zone?: string;
  id?: string;
  label?: string;
  name?: string;
  count?: number;
  policy?: string;
  description?: string;
};

type NestDataset = {
  datasetId?: string;
  dataset_id?: string;
  id?: string;
  publisher?: string;
  license?: string;
  commercialUseAllowed?: boolean;
  commercial_use_allowed?: boolean;
  modelTrainingAllowed?: boolean;
  model_training_allowed?: boolean;
  ragAllowed?: boolean;
  rag_allowed?: boolean;
  zone?: string;
};

function normalizeZones(raw: unknown): Zone[] {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { zones?: unknown }).zones)
      ? ((raw as { zones: NestZone[] }).zones)
      : [];
  return list.map((z) => ({
    zone: String(z.zone || z.id || "YELLOW"),
    label: String(z.label || z.name || z.zone || "Zone"),
    count: Number(z.count ?? 0),
    policy: String(z.policy || z.description || ""),
  }));
}

function normalizeRegistry(raw: unknown): Dataset[] {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { registry?: unknown }).registry)
      ? ((raw as { registry: NestDataset[] }).registry)
      : [];
  return list.map((d) => ({
    dataset_id: String(d.dataset_id || d.datasetId || d.id || "unknown"),
    publisher: String(d.publisher || "—"),
    license: String(d.license || "—"),
    commercial_use_allowed: Boolean(d.commercial_use_allowed ?? d.commercialUseAllowed),
    model_training_allowed: Boolean(d.model_training_allowed ?? d.modelTrainingAllowed),
    rag_allowed: Boolean(d.rag_allowed ?? d.ragAllowed),
    zone: String(d.zone || "YELLOW"),
  }));
}

export default function DataRightsPage() {
  const nest = isNestBackend();
  const [data, setData] = useState<{ zones: Zone[]; registry: Dataset[]; reviews?: Review[] } | null>(
    null,
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [nestMode, setNestMode] = useState(false);

  async function refresh() {
    if (nest) {
      try {
        const [zonesRaw, registryRaw] = await Promise.all([
          api<unknown>("/api/v1/data-rights/zones").catch(() =>
            api<unknown>("/api/v1/compliance/checklists").then((checklists) => {
              // Soft map checklists into zones if dedicated data-rights is not live yet.
              const list = Array.isArray(checklists) ? checklists : [];
              return list.map((c: { id?: string; name?: string; status?: string }, i: number) => ({
                zone: ["GREEN", "BLUE", "YELLOW", "RED"][i % 4],
                label: c.name || c.id || `Checklist ${i + 1}`,
                count: 1,
                policy: c.status || "Compliance checklist",
              }));
            }),
          ),
          api<unknown>("/api/v1/data-rights/registry").catch(() =>
            api<unknown>("/api/v1/data-rights").catch(() => []),
          ),
        ]);
        setNestMode(true);
        setData({
          zones: normalizeZones(zonesRaw),
          registry: normalizeRegistry(registryRaw),
          reviews: [],
        });
        return;
      } catch {
        // Fall through to BFF-style modules path if Nest data-rights is absent.
      }
    }

    const d = await api<NonNullable<typeof data>>("/api/v1/modules/data-rights");
    setNestMode(false);
    setData(d);
  }

  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, []);

  async function review(dataset_id: string, decision: "allow_rag" | "block" | "escalate") {
    setBusy(dataset_id + decision);
    setError("");
    try {
      if (nestMode) {
        try {
          await api("/api/v1/data-rights/review", {
            method: "POST",
            body: JSON.stringify({
              datasetId: dataset_id,
              dataset_id,
              decision,
              note: `UI review: ${decision}`,
            }),
          });
          setNote(`${dataset_id} → ${decision}`);
        } catch {
          setNote(`${dataset_id} → ${decision} (local only; Nest review endpoint unavailable)`);
        }
      } else {
        await api("/api/v1/modules/data-rights/review", {
          method: "POST",
          body: JSON.stringify({ dataset_id, decision, note: `UI review: ${decision}` }),
        });
        setNote(`${dataset_id} → ${decision}`);
      }
      await refresh().catch(() => undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed");
    } finally {
      setBusy(null);
    }
  }

  if (!data && !error) return <Loading />;
  if (!data) {
    return (
      <div>
        <PageHeader title="Data Rights Registry" subtitle="Enterprise trust starts here." />
        <Panel>
          <p className="text-sm text-[var(--danger)]">{error}</p>
        </Panel>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Data Rights Registry"
        subtitle={
          nestMode
            ? "Nest data-rights / compliance zones when available."
            : "Green / Blue / Yellow / Red zones. Review decisions write to the live audit trail."
        }
      />
      {error ? <p className="mb-3 text-sm text-[var(--danger)]">{error}</p> : null}
      {note ? <p className="mb-3 text-sm text-[var(--accent)]">{note}</p> : null}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {data.zones.map((z) => (
          <Panel key={z.zone + z.label}>
            <Badge
              tone={
                z.zone === "GREEN" ? "good" : z.zone === "RED" ? "bad" : z.zone === "YELLOW" ? "warn" : "neutral"
              }
            >
              {z.zone}
            </Badge>
            <div className="mt-2 font-semibold">{z.label}</div>
            <div className="mt-1 font-[family-name:var(--font-display)] text-2xl">{z.count}</div>
            <p className="mt-2 text-xs text-[var(--ink-muted)]">{z.policy}</p>
          </Panel>
        ))}
        {!data.zones.length ? (
          <Panel>
            <p className="text-sm text-[var(--ink-muted)]">
              No data-rights zones from Nest yet. Endpoint assumed: GET /api/v1/data-rights/zones.
            </p>
          </Panel>
        ) : null}
      </div>
      <Panel>
        <h2 className="font-semibold">Registry</h2>
        <div className="mt-3 space-y-3">
          {data.registry.map((d) => (
            <div
              key={d.dataset_id}
              className="grid gap-2 border-b border-[var(--line)] pb-3 text-sm lg:grid-cols-[1.2fr_1fr_auto]"
            >
              <div>
                <div className="font-medium">{d.dataset_id}</div>
                <div className="text-[var(--ink-muted)]">
                  {d.publisher} · {d.license}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone={d.rag_allowed ? "good" : "bad"}>RAG {d.rag_allowed ? "yes" : "no"}</Badge>
                <Badge tone={d.model_training_allowed ? "good" : "warn"}>
                  Train {d.model_training_allowed ? "yes" : "no"}
                </Badge>
                <Badge tone={d.commercial_use_allowed ? "good" : "warn"}>
                  Commercial {d.commercial_use_allowed ? "yes" : "no"}
                </Badge>
                <Badge>{d.zone}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  disabled={busy === d.dataset_id + "allow_rag"}
                  onClick={() => review(d.dataset_id, "allow_rag")}
                >
                  Allow RAG
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy === d.dataset_id + "escalate"}
                  onClick={() => review(d.dataset_id, "escalate")}
                >
                  Escalate
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy === d.dataset_id + "block"}
                  onClick={() => review(d.dataset_id, "block")}
                >
                  Block
                </Button>
              </div>
            </div>
          ))}
          {!data.registry.length ? (
            <p className="text-sm text-[var(--ink-muted)]">No registry datasets returned.</p>
          ) : null}
        </div>
      </Panel>
      {data.reviews?.length ? (
        <Panel className="mt-4">
          <h2 className="font-semibold">Recent reviews</h2>
          <div className="mt-3 space-y-2 text-sm">
            {data.reviews.map((r, i) => (
              <div
                key={`${r.dataset_id}-${r.created_at}-${i}`}
                className="flex justify-between border-b border-[var(--line)] py-2"
              >
                <span>
                  {r.dataset_id} · <Badge>{r.decision}</Badge>
                </span>
                <span className="text-[var(--ink-muted)]">{new Date(r.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
