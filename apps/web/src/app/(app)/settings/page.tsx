"use client";

import { useAuth } from "@/lib/auth";
import { API_URL } from "@/lib/api";
import { PageHeader, Panel } from "@/components/ui";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader title="Settings" subtitle="Organization profile and local integration points." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="font-semibold">Organization</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-[var(--ink-muted)]">Name</dt><dd>{user?.org_name}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--ink-muted)]">User</dt><dd>{user?.full_name}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--ink-muted)]">Email</dt><dd>{user?.email}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--ink-muted)]">Role</dt><dd>{user?.role}</dd></div>
          </dl>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Integrations</h2>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            API base: <code>{API_URL}</code>
          </p>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            Set <code>OPENAI_API_KEY</code> or <code>ANTHROPIC_API_KEY</code> on the API process to enable cloud LLMs.
            Without keys, LSI-OS uses the demo brain with full retrieval and tools.
          </p>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            Notifications: in-app audit events are written on login, chat, agent, and workflow actions.
          </p>
        </Panel>
      </div>
    </div>
  );
}
