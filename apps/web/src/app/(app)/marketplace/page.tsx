"use client";

import { useEffect, useState } from "react";
import { Badge, Loading, PageHeader, Panel } from "@/components/ui";
import { api } from "@/lib/api";

export default function MarketplacePage() {
  const [items, setItems] = useState<{ id: string; name: string; category: string; description: string; price: string }[]>([]);

  useEffect(() => {
    api<{ items: typeof items }>("/api/v1/modules/marketplace")
      .then((d) => setItems(d.items))
      .catch(console.error);
  }, []);

  if (!items.length) return <Loading />;

  return (
    <div>
      <PageHeader title="Marketplace" subtitle="Agent packs, knowledge corpora, SDKs, and workflow templates." />
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Panel key={item.id}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{item.name}</h2>
              <Badge>{item.price}</Badge>
            </div>
            <div className="mt-2">
              <Badge tone="neutral">{item.category}</Badge>
            </div>
            <p className="mt-3 text-sm text-[var(--ink-muted)]">{item.description}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}
