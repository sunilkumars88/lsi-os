"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bot, Network, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 lg:px-10">
        <div className="font-[family-name:var(--font-display)] text-2xl text-white">
          LSI<span className="text-teal-200">-OS</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-teal-50/90 md:flex">
          <Link href="/solutions">Solutions</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/security">Security</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm text-teal-50 sm:inline">
            Sign in
          </Link>
          <Link href="/register">
            <Button className="!bg-white !text-teal-900">Start demo</Button>
          </Link>
        </div>
      </header>

      <section className="relative min-h-[100svh] overflow-hidden text-white">
        <div className="absolute inset-0" style={{ background: "var(--hero-glow)" }} />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=2000&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            mixBlendMode: "luminosity",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#061021]/85 via-transparent to-[#061021]/35" />

        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-6 pb-20 pt-32 lg:px-10">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-[family-name:var(--font-display)] text-5xl leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl"
          >
            LSI-OS
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-5 max-w-2xl text-2xl font-medium leading-snug text-teal-50 sm:text-3xl"
          >
            The AI operating system for life sciences decisions.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-4 max-w-xl text-base text-teal-100/85"
          >
            Unify agents, RAG knowledge, clinical intelligence, and enterprise workflows for pharma, biotech, and
            healthcare teams.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link href="/login">
              <Button className="!bg-teal-100 !text-teal-950">
                Enter workspace <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/solutions">
              <Button variant="secondary" className="!border-white/20 !bg-white/10 !text-white">
                Explore modules
              </Button>
            </Link>
          </motion.div>
          <p className="mt-6 text-xs text-teal-100/70">Demo: admin@lsi.os / demo1234</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 lg:px-10">
        <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)]">
          One workspace. Every intelligence function.
        </h2>
        <p className="mt-3 max-w-2xl text-[var(--ink-muted)]">
          Built for two-person teams that still need enterprise-grade AI: modular APIs, LLM-agnostic routing, and
          human-in-the-loop control.
        </p>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {[
            {
              icon: Bot,
              title: "Agentic AI",
              body: "Researcher, Safety, Regulatory, and Analyst agents with tool traces and approval gates.",
            },
            {
              icon: Network,
              title: "Live data fabric",
              body: "ClinicalTrials.gov, OpenFDA, PubMed, and your private RAG corpus in one retrieval layer.",
            },
            {
              icon: ShieldCheck,
              title: "Governed by design",
              body: "RBAC, audit logs, model cost meters, and demo-safe operation without API keys.",
            },
          ].map((item) => (
            <div key={item.title} className="border-t border-[var(--line)] pt-5">
              <item.icon className="text-[var(--accent)]" size={22} />
              <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
