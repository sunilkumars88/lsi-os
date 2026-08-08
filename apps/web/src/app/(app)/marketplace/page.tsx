"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Loading, PageHeader, Panel } from "@/components/ui";
import { api } from "@/lib/api";

type Item = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: string;
  installed: boolean;
};

export default function MarketplacePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function refresh() {
    const d = await api<{ items: Item[] }>("/api/v1/modules/marketplace");
    setItems(d.items);
  }

  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, []);

  async function toggle(id: string, installed: boolean) {
    setBusy(id);
    setError("");
    try {
      await api(installed ? "/api/v1/modules/marketplace/uninstall" : "/api/v1/modules/marketplace/install", {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  if (!items.length && !error) return <Loading />;

  return (
    <div>
      <PageHeader title="Marketplace" subtitle="Install agent packs, corpora, SDKs, and workflow templates into your workspace." />
      {error ? <p className="mb-3 text-sm text-[var(--danger)]">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Panel key={item.id}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{item.name}</h2>
              <Badge>{item.price}</Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="neutral">{item.category}</Badge>
              <Badge tone={item.installed ? "good" : "warn"}>{item.installed ? "Installed" : "Not installed"}</Badge>
            </div>
            <p className="mt-3 text-sm text-[var(--ink-muted)]">{item.description}</p>
            <div className="mt-4">
              <Button variant={item.installed ? "secondary" : "primary"} disabled={busy === item.id} onClick={() => toggle(item.id, item.installed)}>
                {busy === item.id ? "Working…" : item.installed ? "Uninstall" : "Install"}
              </Button>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
