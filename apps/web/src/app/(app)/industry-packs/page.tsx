"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button, PageHeader, Panel } from "@/components/ui";
import { usePack } from "@/lib/pack-context";

export default function PacksPage() {
  const router = useRouter();
  const { packs, packId, setPackId } = usePack();

  function openPack(id: string) {
    setPackId(id);
    if (id === "life-sciences") router.push("/dashboard");
    else router.push(`/packs/${id}`);
  }

  return (
    <div>
      <PageHeader
        title="Industry Packs"
        subtitle="Shared Enterprise Intelligence OS core. Domain packs plug in ontologies, agents, workflows, KPIs, and connectors."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {packs.map((p) => (
          <Panel key={p.id}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold">{p.name}</h2>
              <Badge tone={p.status === "active" ? "good" : p.status === "available" ? "neutral" : "warn"}>
                {p.status}
              </Badge>
            </div>
            <p className="mt-3 text-sm text-[var(--ink-muted)]">{p.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.kpis.map((k) => (
                <Badge key={k} tone="neutral">
                  {k}
                </Badge>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant={packId === p.id ? "primary" : "secondary"} onClick={() => setPackId(p.id)}>
                {packId === p.id ? "Selected" : "Select pack"}
              </Button>
              <Button onClick={() => openPack(p.id)}>Open console</Button>
              {p.id === "life-sciences" ? (
                <Link href="/commercial">
                  <Button variant="ghost">Modules</Button>
                </Link>
              ) : null}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
