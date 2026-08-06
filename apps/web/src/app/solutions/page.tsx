import Link from "next/link";
import { Button } from "@/components/ui";

const modules = [
  "Commercial Analytics",
  "Medical Affairs",
  "Clinical Intelligence",
  "HEOR / RWE",
  "Regulatory Affairs",
  "Pharmacovigilance",
  "AI Copilot & Agents",
  "Knowledge Hub (RAG)",
  "Workflow Automation",
];

export default function SolutionsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Link href="/" className="text-sm text-[var(--accent)]">← LSI-OS</Link>
      <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl">Solutions</h1>
      <p className="mt-3 text-[var(--ink-muted)]">
        Domain modules share one AI platform, identity model, and audit trail—so your team stays small while coverage stays enterprise.
      </p>
      <ul className="mt-10 space-y-3">
        {modules.map((m) => (
          <li key={m} className="border-b border-[var(--line)] py-3 text-lg">
            {m}
          </li>
        ))}
      </ul>
      <Link href="/login" className="mt-8 inline-block">
        <Button>Open workspace</Button>
      </Link>
    </div>
  );
}
