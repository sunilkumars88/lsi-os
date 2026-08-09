import Link from "next/link";
import { Button, Panel } from "@/components/ui";

const lifeSciencesPlans = [
  {
    name: "Starter",
    price: "₹50,000",
    period: "/ month",
    points: ["1 clinical trial", "50 patients", "Basic CDSCO compliance reports", "Memory + Copilot"],
  },
  {
    name: "Professional",
    price: "₹2,00,000",
    period: "/ month",
    points: ["5 concurrent trials", "500 patients", "Advanced compliance + custom workflows", "Agents + approvals"],
    featured: true,
  },
  {
    name: "Enterprise",
    price: "₹5,00,000+",
    period: "/ month",
    points: ["Unlimited trials", "White-label / on-premise", "24/7 support", "SSO + audit export"],
  },
];

const bankingPlans = [
  {
    name: "Banking Starter",
    price: "₹75,000",
    period: "/ month",
    points: ["Loan origination agent", "KYC/AML screening", "Sandbox connectors", "Audit trails"],
  },
  {
    name: "Banking Professional",
    price: "₹2,50,000",
    period: "/ month",
    points: ["Fraud detection", "STR preparation workflows", "Model router", "Approvals hub"],
    featured: true,
  },
  {
    name: "Banking Enterprise",
    price: "₹6,00,000+",
    period: "/ month",
    points: ["On-prem / VPC", "RBI-aligned controls", "Custom pack modules", "Enterprise SSO"],
  },
];

const insurancePlans = [
  {
    name: "Insurance Starter",
    price: "₹60,000",
    period: "/ month",
    points: ["FNOL claims triage", "Policy Q&A", "Sandbox mode", "Audit trails"],
  },
  {
    name: "Insurance Professional",
    price: "₹2,20,000",
    period: "/ month",
    points: ["Underwriting referral packs", "SIU pattern finder", "Approvals + connectors", "IRDAI messaging"],
    featured: true,
  },
  {
    name: "Insurance Enterprise",
    price: "₹5,50,000+",
    period: "/ month",
    points: ["IRDAI-aligned governance", "VPC / BYOK", "Custom integrations", "Marketplace access"],
  },
];

function PlanGrid({
  title,
  subtitle,
  plans,
}: {
  title: string;
  subtitle: string;
  plans: typeof lifeSciencesPlans;
}) {
  return (
    <section className="mt-14">
      <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">{title}</h2>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">{subtitle}</p>
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {plans.map((p) => (
          <Panel
            key={p.name}
            className={p.featured ? "border-[var(--accent)] ring-1 ring-[var(--accent)]/30" : undefined}
          >
            {p.featured && (
              <span className="text-xs font-medium uppercase tracking-wide text-[var(--accent)]">
                Most popular
              </span>
            )}
            <h3 className="text-xl font-semibold">{p.name}</h3>
            <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">
              {p.price}
              {p.period && <span className="text-base text-[var(--ink-muted)]">{p.period}</span>}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--ink-muted)]">
              {p.points.map((x) => (
                <li key={x}>• {x}</li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </section>
  );
}

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <Link href="/" className="text-sm text-[var(--accent)]">← EIOS</Link>
      <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl">Pricing</h1>
      <p className="mt-3 text-lg text-[var(--ink-muted)]">
        Connect. Understand. Automate. Govern.
      </p>
      <p className="mt-2 max-w-2xl text-sm text-[var(--ink-muted)]">
        India-first annual plans in INR. Enterprise Intelligence OS — not a chatbot subscription.
        Sandbox connectors work without vendor accounts; production sync requires your keys.
      </p>

      <PlanGrid
        title="Life Sciences"
        subtitle="Commercial, clinical, safety, HEOR, and regulatory modules."
        plans={lifeSciencesPlans}
      />
      <PlanGrid
        title="Banking"
        subtitle="AML/KYC, risk, compliance, and core banking intelligence."
        plans={bankingPlans}
      />
      <PlanGrid
        title="Insurance"
        subtitle="Underwriting, claims, fraud, and regulatory intelligence."
        plans={insurancePlans}
      />

      <div className="mt-12 flex flex-wrap gap-4">
        <Link href="/register">
          <Button>Start demo</Button>
        </Link>
        <Link href="/contact">
          <Button variant="secondary">Talk to sales</Button>
        </Link>
      </div>
    </div>
  );
}
