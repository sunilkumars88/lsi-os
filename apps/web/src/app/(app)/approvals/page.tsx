"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Loading, PageHeader, Panel } from "@/components/ui";
import { api, isNestBackend } from "@/lib/api";
import { nestApprovalToView, type ApprovalView, type NestApproval } from "@/lib/nest-adapters";

type BffJob = {
  id: string;
  name: string;
  agent_type: string;
  status: string;
  requires_approval: boolean;
  result_preview?: string;
};

export default function ApprovalsPage() {
  const nest = isNestBackend();
  const [jobs, setJobs] = useState<ApprovalView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function refresh() {
    if (nest) {
      const all = await api<NestApproval[]>("/api/v1/approvals");
      setJobs(all.map(nestApprovalToView));
    } else {
      const all = await api<BffJob[]>("/api/v1/agents/jobs");
      setJobs(
        all
          .filter((j) => j.status === "awaiting_approval" || j.requires_approval)
          .map((j) => ({
            id: j.id,
            name: j.name,
            agent_type: j.agent_type,
            status: j.status,
            requires_approval: j.requires_approval,
            result_preview: j.result_preview,
          })),
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    refresh().catch((e) => {
      setError(e.message);
      setLoading(false);
    });
  }, []);

  async function approve(id: string) {
    setBusy(id);
    setError("");
    try {
      if (nest) {
        await api(`/api/v1/approvals/${id}/approve`, {
          method: "POST",
          body: JSON.stringify({ comment: "Approved from UI" }),
        });
      } else {
        await api(`/api/v1/agents/jobs/${id}/approve`, { method: "POST" });
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setBusy(null);
    }
  }

  async function reject(id: string) {
    setBusy(id);
    setError("");
    try {
      if (nest) {
        await api(`/api/v1/approvals/${id}/reject`, {
          method: "POST",
          body: JSON.stringify({ comment: "Rejected from UI" }),
        });
      } else {
        await api(`/api/v1/agents/jobs/${id}/reject`, { method: "POST" });
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reject failed");
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <Loading />;

  const pending = jobs.filter(
    (j) => j.status === "awaiting_approval" || j.status === "pending",
  );

  return (
    <div>
      <PageHeader
        title="Human Approvals"
        subtitle="Regulated communications and high-risk agent outputs require human-in-the-loop before completion."
      />
      {error ? <p className="mb-3 text-sm text-[var(--danger)]">{error}</p> : null}
      <div className="space-y-3">
        {pending.map((j) => (
          <Panel key={j.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{j.name}</h2>
                  <Badge tone="warn">{j.status}</Badge>
                  <Badge>{j.agent_type}</Badge>
                </div>
                <p className="mt-2 text-sm text-[var(--ink-muted)]">
                  {j.result_preview || "Awaiting review"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button disabled={busy === j.id} onClick={() => approve(j.id)}>
                  {busy === j.id ? "…" : "Approve"}
                </Button>
                <Button variant="secondary" disabled={busy === j.id} onClick={() => reject(j.id)}>
                  Reject
                </Button>
              </div>
            </div>
          </Panel>
        ))}
        {!pending.length ? (
          <Panel>
            <p className="text-sm text-[var(--ink-muted)]">
              No pending approvals.{" "}
              {nest
                ? "Run a workflow with an approval node to create a review item."
                : "Run a Safety or Regulatory agent in Agent Runtime to create a review item."}
            </p>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
