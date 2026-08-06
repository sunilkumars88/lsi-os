import Link from "next/link";
import { Panel } from "@/components/ui";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm text-[var(--accent)]">← LSI-OS</Link>
      <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl">Contact</h1>
      <Panel className="mt-8">
        <p className="text-[var(--ink-muted)]">
          Building LSI-OS with a two-person team? Reach the product owners at{" "}
          <strong className="text-[var(--ink)]">founders@lsi.os</strong> or launch the demo workspace and explore modules directly.
        </p>
      </Panel>
    </div>
  );
}
