"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Loading, PageHeader, Panel } from "@/components/ui";
import { api } from "@/lib/api";

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

export default function DataRightsPage() {
  const [data, setData] = useState<{ zones: Zone[]; registry: Dataset[]; reviews?: Review[] } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function refresh() {
    const d = await api<NonNullable<typeof data>>("/api/v1/modules/data-rights");
    setData(d);
  }

  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, []);

  async function review(dataset_id: string, decision: "allow_rag" | "block" | "escalate") {
    setBusy(dataset_id + decision);
    setError("");
    try {
      await api("/api/v1/modules/data-rights/review", {
        method: "POST",
        body: JSON.stringify({ dataset_id, decision, note: `UI review: ${decision}` }),
      });
      setNote(`${dataset_id} → ${decision}`);
      await refresh();
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
        subtitle="Green / Blue / Yellow / Red zones. Review decisions write to the live audit trail."
      />
      {error ? <p className="mb-3 text-sm text-[var(--danger)]">{error}</p> : null}
      {note ? <p className="mb-3 text-sm text-[var(--accent)]">{note}</p> : null}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {data.zones.map((z) => (
          <Panel key={z.zone}>
            <Badge tone={z.zone === "GREEN" ? "good" : z.zone === "RED" ? "bad" : z.zone === "YELLOW" ? "warn" : "neutral"}>
              {z.zone}
            </Badge>
            <div className="mt-2 font-semibold">{z.label}</div>
            <div className="mt-1 font-[family-name:var(--font-display)] text-2xl">{z.count}</div>
            <p className="mt-2 text-xs text-[var(--ink-muted)]">{z.policy}</p>
          </Panel>
        ))}
      </div>
      <Panel>
        <h2 className="font-semibold">Registry</h2>
        <div className="mt-3 space-y-3">
          {data.registry.map((d) => (
            <div key={d.dataset_id} className="grid gap-2 border-b border-[var(--line)] pb-3 text-sm lg:grid-cols-[1.2fr_1fr_auto]">
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
        </div>
      </Panel>
      {data.reviews?.length ? (
        <Panel className="mt-4">
          <h2 className="font-semibold">Recent reviews</h2>
          <div className="mt-3 space-y-2 text-sm">
            {data.reviews.map((r, i) => (
              <div key={`${r.dataset_id}-${r.created_at}-${i}`} className="flex justify-between border-b border-[var(--line)] py-2">
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
