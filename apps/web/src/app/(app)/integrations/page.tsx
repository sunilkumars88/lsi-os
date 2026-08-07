"use client";

import { useEffect, useState } from "react";
import { Badge, Loading, PageHeader, Panel } from "@/components/ui";
import { api } from "@/lib/api";

type Connector = {
  id: string;
  name: string;
  category: string;
  status: string;
  description: string;
};

export default function IntegrationsPage() {
  const [items, setItems] = useState<Connector[]>([]);

  useEffect(() => {
    api<{ connectors: Connector[] }>("/api/v1/modules/integrations")
      .then((d) => setItems(d.connectors))
      .catch(console.error);
  }, []);

  if (!items.length) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Integration Hub"
        subtitle="Eyes of the OS — CRM, ERP, clinical, safety, productivity, and document systems. LLM alone has none of these."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((c) => (
          <Panel key={c.id}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold">{c.name}</h2>
              <Badge tone={c.status === "connected" ? "good" : c.status === "available" ? "neutral" : "warn"}>
                {c.status}
              </Badge>
            </div>
            <div className="mt-2"><Badge tone="neutral">{c.category}</Badge></div>
            <p className="mt-3 text-sm text-[var(--ink-muted)]">{c.description}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}
