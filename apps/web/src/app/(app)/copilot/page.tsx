"use client";

import { FormEvent, useState } from "react";
import { Badge, Button, Loading, PageHeader, Panel, Textarea } from "@/components/ui";
import { api } from "@/lib/api";

type ChatOut = {
  session_id: string;
  content: string;
  citations: { title: string; content: string; score: number }[];
  tool_traces: unknown[];
  model: string;
  provider: string;
};

type Msg = { role: "user" | "assistant"; content: string; meta?: ChatOut };

export default function CopilotPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("What is the enrollment status risk for CardiaX Phase III?");
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setLoading(true);
    setError("");
    try {
      const res = await api<ChatOut>("/api/v1/chat", {
        method: "POST",
        body: JSON.stringify({ message: userMsg, session_id: sessionId, use_rag: true, use_tools: true }),
      });
      setSessionId(res.session_id);
      setMessages((m) => [...m, { role: "assistant", content: res.content, meta: res }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="AI Copilot"
        subtitle="RAG + tool-using assistant for life sciences questions. Works with demo brain or your LLM keys."
      />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <Panel className="flex min-h-[60vh] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-sm text-[var(--ink-muted)]">
                Try clinical, safety, literature, or KPI questions. Tools fire automatically from intent.
              </p>
            ) : null}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "ml-8" : "mr-4"}>
                <div className="mb-1 text-xs uppercase tracking-wide text-[var(--ink-muted)]">{m.role}</div>
                <div className="prose-chat whitespace-pre-wrap rounded-lg bg-[var(--surface-2)] px-4 py-3 text-sm leading-relaxed">
                  {m.content}
                </div>
                {m.meta ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge>{m.meta.provider}/{m.meta.model}</Badge>
                    <Badge tone="good">{m.meta.citations?.length || 0} citations</Badge>
                    <Badge>{m.meta.tool_traces?.length || 0} tools</Badge>
                  </div>
                ) : null}
              </div>
            ))}
            {loading ? <Loading /> : null}
            {error ? (
              <p className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-[var(--danger)]">
                {error}. If this persists, sign out and sign in again with admin@lsi.os / demo1234.
              </p>
            ) : null}
          </div>
          <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 border-t border-[var(--line)] pt-4">
            <Textarea rows={3} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask LSI-OS…" />
            <Button type="submit" disabled={loading}>
              Send
            </Button>
          </form>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Latest citations</h2>
          <div className="mt-3 space-y-3">
            {(messages.filter((m) => m.meta).at(-1)?.meta?.citations || []).map((c, i) => (
              <div key={i} className="border-b border-[var(--line)] pb-3 text-sm">
                <div className="font-medium">{c.title}</div>
                <div className="mt-1 text-[var(--ink-muted)]">{c.content.slice(0, 180)}…</div>
                <Badge className="mt-2">score {c.score}</Badge>
              </div>
            ))}
            {!messages.filter((m) => m.meta).at(-1)?.meta?.citations?.length ? (
              <p className="text-sm text-[var(--ink-muted)]">Citations appear after a RAG-backed answer.</p>
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}
