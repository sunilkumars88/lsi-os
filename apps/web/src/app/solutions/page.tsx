import Link from "next/link";
import { Button } from "@/components/ui";

const layers = [
  { title: "L5 Customer private intelligence", body: "Tenant-isolated docs, CRM, ERP, memory, and keys." },
  { title: "L4 Industry packs", body: "Life Sciences, Banking, Insurance, Manufacturing, and more." },
  { title: "L3 Proprietary enterprise intelligence", body: "Ontologies, workflows, agents, evaluations, rules." },
  { title: "L2 Model router", body: "GPT, Claude, Gemini, Llama — replaceable brains." },
  { title: "L1 Cloud + security + data platform", body: "Storage, vector, graph, IAM, encryption, audit." },
];

export default function SolutionsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Link href="/" className="text-sm text-[var(--accent)]">← EIOS</Link>
      <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl">Platform</h1>
      <p className="mt-3 text-[var(--ink-muted)]">
        Marketed as an Enterprise Intelligence Operating System — not an AI chatbot for life sciences.
      </p>
      <ul className="mt-10 space-y-4">
        {layers.map((l) => (
          <li key={l.title} className="border-b border-[var(--line)] py-4">
            <div className="text-lg font-semibold">{l.title}</div>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">{l.body}</p>
          </li>
        ))}
      </ul>
      <Link href="/login" className="mt-8 inline-block">
        <Button>Enter Command Center</Button>
      </Link>
    </div>
  );
}
