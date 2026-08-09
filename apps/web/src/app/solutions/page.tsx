import Link from "next/link";
import { Button } from "@/components/ui";

const layers = [
  { title: "L5 Customer private intelligence", body: "Tenant-isolated docs, CRM, ERP, memory, and keys." },
  { title: "L4 Industry packs", body: "Life Sciences, Banking, Insurance, Manufacturing, and more." },
  { title: "L3 Proprietary enterprise intelligence", body: "Ontologies, workflows, agents, evaluations, rules." },
  { title: "L2 Model router", body: "GPT, Claude, Gemini, Llama — replaceable brains." },
  { title: "L1 Cloud + security + data platform", body: "Storage, vector, graph, IAM, encryption, audit." },
];

const executiveValue = [
  {
    role: "CTO",
    headline: "Ship governed AI without rebuilding the stack",
    points: [
      "Multi-LLM router with BYOK — swap models without rewriting agents.",
      "Nest API + Python AI service split: platform APIs vs. agent runtime.",
      "Docker Compose for full stack; Vercel for web; VPC/on-prem for enterprise.",
      "Connector hub with sandbox mode — demo integrations before vendor keys.",
      "Tenant isolation, RBAC, and audit logs from day one.",
    ],
  },
  {
    role: "CFO",
    headline: "Predictable India-first pricing and usage visibility",
    points: [
      "Monthly INR plans: Life Sciences Starter ₹50K through Enterprise ₹5L+/month.",
      "Banking and Insurance packs with tiered professional and enterprise options.",
      "Usage meters and commercial module for seat and API consumption tracking.",
      "Razorpay + Stripe connectors for billing alignment with your finance stack.",
      "Avoid shadow-AI spend — one OS for agents, workflows, and governance.",
    ],
  },
  {
    role: "Compliance",
    headline: "Audit-ready intelligence with data rights built in",
    points: [
      "Data Rights Registry: GREEN / BLUE / YELLOW / RED zones — no training on unclear rights.",
      "Human approvals on high-risk agent actions with immutable audit trails.",
      "SOC 2, GDPR, and India compliance documentation stubs for enterprise reviews.",
      "Citations and provenance on every grounded answer; connector sync logs.",
      "Industry pack rules for Life Sciences, Banking, and Insurance regulatory context.",
    ],
  },
];

export default function SolutionsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Link href="/" className="text-sm text-[var(--accent)]">← EIOS</Link>
      <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl">Platform</h1>
      <p className="mt-3 text-[var(--ink-muted)]">
        Enterprise Intelligence Operating System — Connect. Understand. Automate. Govern.
        Not an AI chatbot; the operating layer for accountable enterprise intelligence.
      </p>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
          Executive value
        </h2>
        <div className="mt-6 space-y-8">
          {executiveValue.map((exec) => (
            <div key={exec.role} className="border-b border-[var(--line)] pb-8">
              <div className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">
                {exec.role}
              </div>
              <h3 className="mt-2 text-lg font-semibold">{exec.headline}</h3>
              <ul className="mt-3 space-y-2 text-sm text-[var(--ink-muted)]">
                {exec.points.map((point) => (
                  <li key={point}>• {point}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
          Architecture layers
        </h2>
        <ul className="mt-6 space-y-4">
          {layers.map((l) => (
            <li key={l.title} className="border-b border-[var(--line)] py-4">
              <div className="text-lg font-semibold">{l.title}</div>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">{l.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/login">
          <Button>Enter Command Center</Button>
        </Link>
        <Link href="/pricing">
          <Button variant="secondary">View pricing</Button>
        </Link>
      </div>
    </div>
  );
}
