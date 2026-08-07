"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Brain, Building2, Lock, Network, Workflow } from "lucide-react";
import { Button } from "@/components/ui";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 lg:px-10">
        <div className="font-[family-name:var(--font-display)] text-2xl text-white tracking-tight">
          EIOS
        </div>
        <nav className="hidden items-center gap-8 text-sm text-teal-50/90 md:flex">
          <Link href="/solutions">Platform</Link>
          <Link href="/packs">Industry packs</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/security">Security</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm text-teal-50 sm:inline">
            Sign in
          </Link>
          <Link href="/register">
            <Button className="!bg-white !text-slate-900">Open workspace</Button>
          </Link>
        </div>
      </header>

      <section className="relative min-h-[100svh] overflow-hidden text-white">
        <div className="absolute inset-0" style={{ background: "var(--hero-glow)" }} />
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            mixBlendMode: "luminosity",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050b14]/90 via-transparent to-[#050b14]/40" />

        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-6 pb-20 pt-32 lg:px-10">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-[family-name:var(--font-display)] text-5xl leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl"
          >
            EIOS
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-5 max-w-3xl text-2xl font-medium leading-snug text-teal-50 sm:text-3xl"
          >
            The Enterprise Intelligence Operating System.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mt-4 max-w-2xl text-base text-teal-100/85"
          >
            Not another chatbot. Connect CRM, clinical, safety, ERP, and documents. Ground answers in your
            knowledge. Orchestrate agents with approvals. Deliver outcomes ChatGPT cannot reach alone.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link href="/login">
              <Button className="!bg-teal-100 !text-teal-950">
                Enter Command Center <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/packs">
              <Button variant="secondary" className="!border-white/20 !bg-white/10 !text-white">
                Browse industry packs
              </Button>
            </Link>
          </motion.div>
          <p className="mt-6 text-xs text-teal-100/70">Demo: admin@lsi.os / demo1234 · Life Sciences pack active</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 lg:px-10">
        <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          The LLM is the brain. EIOS is the enterprise.
        </h2>
        <p className="mt-3 max-w-2xl text-[var(--ink-muted)]">
          Memory, data access, automation, permissions, and governance—so AI runs real work inside your company.
        </p>
        <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Brain, title: "Memory", body: "Enterprise memory, RAG, knowledge graph, citations." },
            { icon: Network, title: "Eyes", body: "CRM, ERP, trials, safety, documents, connectors." },
            { icon: Workflow, title: "Hands", body: "Agents, workflows, approvals, task assignment." },
            { icon: Lock, title: "Governance", body: "RBAC, audit, data rights, tenant isolation." },
          ].map((item) => (
            <div key={item.title} className="border-t border-[var(--line)] pt-5">
              <item.icon className="text-[var(--accent)]" size={22} />
              <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--surface)]/70 py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">One core. Many industries.</h2>
              <p className="mt-3 max-w-xl text-[var(--ink-muted)]">
                Shared Enterprise Intelligence OS with plug-in industry packs—Life Sciences first.
              </p>
            </div>
            <Building2 className="hidden text-[var(--accent)] sm:block" size={28} />
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {["Life Sciences", "Banking", "Insurance", "Manufacturing", "Retail", "Government", "Healthcare", "Legal"].map(
              (name, i) => (
                <div key={name} className="border border-[var(--line)] bg-[var(--bg)] px-4 py-4">
                  <div className="text-sm font-semibold">{name}</div>
                  <div className="mt-1 text-xs text-[var(--ink-muted)]">{i === 0 ? "Active pack" : "Pack ready / roadmap"}</div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
