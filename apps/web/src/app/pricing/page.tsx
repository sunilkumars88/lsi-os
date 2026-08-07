import Link from "next/link";
import { Button, Panel } from "@/components/ui";

const plans = [
  { name: "Core OS", price: "Pilot", points: ["Command Center", "Memory + RAG", "Agent runtime", "1 industry pack"] },
  { name: "Professional", price: "SaaS", points: ["Connectors hub", "Approvals", "Data rights registry", "Model router"] },
  { name: "Enterprise", price: "Custom", points: ["BYOK / VPC", "Extra packs", "Audit & SSO", "Marketplace"] },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <Link href="/" className="text-sm text-[var(--accent)]">← EIOS</Link>
      <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl">Pricing</h1>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {plans.map((p) => (
          <Panel key={p.name}>
            <h2 className="text-xl font-semibold">{p.name}</h2>
            <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">{p.price}</p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--ink-muted)]">
              {p.points.map((x) => (
                <li key={x}>• {x}</li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
      <Link href="/register" className="mt-8 inline-block">
        <Button>Start demo</Button>
      </Link>
    </div>
  );
}
