import Link from "next/link";

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-[var(--accent)]">← EIOS</Link>
      <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl">Security & data rights</h1>
      <div className="mt-8 space-y-4 text-[var(--ink-muted)]">
        <p>Multi-tenant isolation, JWT/RBAC, audit logs, and human-in-the-loop for regulated agent outputs.</p>
        <p>
          Data Rights Registry enforces GREEN / BLUE / YELLOW / RED zones. Unclear rights never enter training
          corpora. Customer private knowledge stays in-tenant by default.
        </p>
        <p>
          Model weights are not the moat. Crown-jewel logic — routing, orchestration, evaluation, ontology, and
          workflows — stays server-side.
        </p>
      </div>
    </div>
  );
}
