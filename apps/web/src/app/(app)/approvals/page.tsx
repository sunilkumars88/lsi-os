"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Loading, PageHeader, Panel } from "@/components/ui";
import { api } from "@/lib/api";

type Job = {
  id: string;
  name: string;
  agent_type: string;
  status: string;
  requires_approval: boolean;
  result_preview?: string;
};

export default function ApprovalsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const all = await api<Job[]>("/api/v1/agents/jobs");
    setJobs(all.filter((j) => j.status === "awaiting_approval" || j.requires_approval));
    setLoading(false);
  }

  useEffect(() => {
    refresh().catch(console.error);
  }, []);

  async function approve(id: string) {
    await api(`/api/v1/agents/jobs/${id}/approve`, { method: "POST" });
    await refresh();
  }

  async function reject(id: string) {
    await api(`/api/v1/agents/jobs/${id}/reject`, { method: "POST" });
    await refresh();
  }

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Human Approvals"
        subtitle="Regulated communications and high-risk agent outputs require human-in-the-loop before completion."
      />
      <div className="space-y-3">
        {jobs.filter((j) => j.status === "awaiting_approval").map((j) => (
          <Panel key={j.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{j.name}</h2>
                  <Badge tone="warn">{j.status}</Badge>
                  <Badge>{j.agent_type}</Badge>
                </div>
                <p className="mt-2 text-sm text-[var(--ink-muted)]">{j.result_preview || "Awaiting review"}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => approve(j.id)}>Approve</Button>
                <Button variant="secondary" onClick={() => reject(j.id)}>Reject</Button>
              </div>
            </div>
          </Panel>
        ))}
        {!jobs.filter((j) => j.status === "awaiting_approval").length ? (
          <Panel>
            <p className="text-sm text-[var(--ink-muted)]">
              No pending approvals. Run a Safety or Regulatory agent in Agent Runtime to create a review item.
            </p>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
