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
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Workflow,
  BookOpen,
  ChartColumnIncreasing,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { cx } from "./ui";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/copilot", label: "AI Copilot", icon: MessageSquare },
  { href: "/agents", label: "Agent Studio", icon: Bot },
  { href: "/knowledge", label: "Knowledge Hub", icon: BookOpen },
  { href: "/workflows", label: "Workflows", icon: Workflow },
  { href: "/commercial", label: "Commercial", icon: ChartColumnIncreasing },
  { href: "/medical", label: "Medical Affairs", icon: BriefcaseMedical },
  { href: "/clinical", label: "Clinical", icon: FlaskConical },
  { href: "/heor", label: "HEOR / RWE", icon: Activity },
  { href: "/regulatory", label: "Regulatory", icon: Scale },
  { href: "/safety", label: "Pharmacovigilance", icon: ShieldAlert },
  { href: "/marketplace", label: "Marketplace", icon: Package },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (!loading && !user) {
    router.replace("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="flex min-h-screen">
        <aside
          className={cx(
            "fixed inset-y-0 left-0 z-40 w-72 border-r border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur transition-transform lg:static lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-16 items-center justify-between px-5">
            <Link href="/dashboard" className="font-[family-name:var(--font-display)] text-xl tracking-tight">
              LSI<span className="text-[var(--accent)]">-OS</span>
            </Link>
            <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
              <X size={18} />
            </button>
          </div>
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink-muted)]">
              <Search size={14} />
              <span>Search-first workspace</span>
            </div>
          </div>
          <nav className="space-y-0.5 px-3 pb-8">
            {nav.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cx(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition",
                    active
                      ? "bg-[var(--accent-soft)] text-[var(--accent-ink)] font-medium"
                      : "text-[var(--ink-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]",
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--line)] bg-[var(--bg)]/90 px-4 backdrop-blur sm:px-6">
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
            <div className="text-sm text-[var(--ink-muted)]">
              {user?.org_name || "Organization"} · {user?.role}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right text-sm">
                <div className="font-medium">{user?.full_name}</div>
                <div className="text-[var(--ink-muted)]">{user?.email}</div>
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
