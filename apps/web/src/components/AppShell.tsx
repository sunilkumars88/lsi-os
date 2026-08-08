"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Bot,
  BriefcaseMedical,
  FlaskConical,
  LayoutDashboard,
  MessageSquare,
  Package,
  Scale,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Workflow,
  BookOpen,
  ChartColumnIncreasing,
  LogOut,
  Menu,
  X,
  Network,
  Plug,
  GitBranch,
  Layers,
  Route,
  CheckSquare,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { usePack } from "@/lib/pack-context";
import { CORE_OS_NAV } from "@/lib/packs";
import { Loading, cx } from "./ui";

const iconMap: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/copilot": MessageSquare,
  "/agents": Bot,
  "/workflows": Workflow,
  "/approvals": CheckSquare,
  "/knowledge": BookOpen,
  "/graph": GitBranch,
  "/data-rights": ShieldCheck,
  "/integrations": Plug,
  "/router": Route,
  "/industry-packs": Layers,
  "/marketplace": Package,
  "/admin": ShieldCheck,
  "/settings": Settings,
  "/commercial": ChartColumnIncreasing,
  "/medical": BriefcaseMedical,
  "/clinical": FlaskConical,
  "/heor": Activity,
  "/regulatory": Scale,
  "/safety": ShieldAlert,
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { pack, packs, setPackId } = usePack();
  const [open, setOpen] = useState(false);

  const groups = useMemo(() => {
    const map = new Map<string, (typeof CORE_OS_NAV)[number][]>();
    for (const item of CORE_OS_NAV) {
      const list = map.get(item.group) || [];
      list.push(item);
      map.set(item.group, list);
    }
    return [...map.entries()];
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <Loading />
      </div>
    );
  }

  if (!user) {
    router.replace("/login");
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="flex min-h-screen">
        <aside
          className={cx(
            "fixed inset-y-0 left-0 z-40 w-[19rem] border-r border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur transition-transform lg:static lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-16 items-center justify-between px-5">
            <Link href="/dashboard" className="font-[family-name:var(--font-display)] text-xl tracking-tight">
              EIOS
            </Link>
            <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
              <X size={18} />
            </button>
          </div>

          <div className="px-4 pb-3">
            <label className="mb-1 block text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">Industry pack</label>
            <select
              className="w-full rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm"
              value={pack.id}
              onChange={(e) => {
                const id = e.target.value;
                setPackId(id);
                if (id === "life-sciences") router.push("/dashboard");
                else router.push(`/packs/${id}`);
              }}
            >
              {packs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.short} · {p.status}
                </option>
              ))}
            </select>
          </div>

          <nav className="max-h-[calc(100vh-8rem)] space-y-4 overflow-y-auto px-3 pb-8">
            {groups.map(([group, items]) => (
              <div key={group}>
                <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                  Core OS · {group}
                </div>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = iconMap[item.href] || Network;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cx(
                          "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition",
                          active
                            ? "bg-[var(--accent-soft)] font-medium text-[var(--accent-ink)]"
                            : "text-[var(--ink-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]",
                        )}
                      >
                        <Icon size={16} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {pack.id === "life-sciences" ? (
              <div>
                <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                  Pack · {pack.short}
                </div>
                <div className="space-y-0.5">
                  {pack.modules.map((item) => {
                    const active = pathname.startsWith(item.href);
                    const Icon = iconMap[item.href] || Layers;
                    return (
                      <Link
                        key={item.href + item.label}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cx(
                          "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition",
                          active
                            ? "bg-[var(--accent-soft)] font-medium text-[var(--accent-ink)]"
                            : "text-[var(--ink-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]",
                        )}
                      >
                        <Icon size={16} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mx-3 rounded-md border border-[var(--line)] bg-[var(--bg)] p-3 text-xs text-[var(--ink-muted)]">
                <p className="font-medium text-[var(--ink)]">{pack.short} workspace</p>
                <p className="mt-1">Open the pack console for live KPIs, agents, and workflows.</p>
                <Link href={`/packs/${pack.id}`} className="mt-2 inline-block text-[var(--accent)]" onClick={() => setOpen(false)}>
                  Open {pack.short} pack →
                </Link>
              </div>
            )}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--line)] bg-[var(--bg)]/90 px-4 backdrop-blur sm:px-6">
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
            <div className="text-sm text-[var(--ink-muted)]">
              {user.org_name || "Organization"} · {pack.short} · {user.role}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right text-sm">
                <div className="font-medium">{user.full_name}</div>
                <div className="text-[var(--ink-muted)]">{user.email}</div>
              </div>
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="rounded-md border border-[var(--line)] p-2 text-[var(--ink-muted)] hover:text-[var(--ink)]"
                aria-label="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
