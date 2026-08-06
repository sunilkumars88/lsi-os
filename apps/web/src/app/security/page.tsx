import Link from "next/link";

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-[var(--accent)]">← LSI-OS</Link>
      <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl">Security & governance</h1>
      <div className="mt-8 space-y-4 text-[var(--ink-muted)]">
        <p>JWT authentication, role-based access, tenant isolation by organization, and immutable audit logs on sensitive actions.</p>
        <p>AI calls are metered with provider/model attribution. Safety and regulatory agents support human-in-the-loop approval before completion.</p>
        <p>Configure your own OpenAI or Anthropic keys; without keys the demo brain keeps workflows functional offline.</p>
      </div>
    </div>
  );
}
