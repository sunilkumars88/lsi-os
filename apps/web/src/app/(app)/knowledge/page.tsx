"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge, Button, Input, PageHeader, Panel, Textarea } from "@/components/ui";
import { api } from "@/lib/api";

type Doc = {
  id: string;
  title: string;
  doc_type: string;
  source: string;
  preview?: string;
  chunk_count?: number;
  embedded?: number;
};
type Hit = { title: string; content: string; score: number; doc_type: string; source?: string };
type Stats = {
  documents: number;
  chunks: number;
  embedded_chunks: number;
  embedding_ready: boolean;
  openai_configured: boolean;
  sources?: { id: string; name: string; type: string; status: string }[];
};

export default function KnowledgePage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [query, setQuery] = useState("CardiaX enrollment safety HFpEF");
  const [hits, setHits] = useState<Hit[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selected, setSelected] = useState<{ title: string; content: string; chunk_count?: number; embedded?: number } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const [d, s] = await Promise.all([
      api<Doc[]>("/api/v1/knowledge/documents"),
      api<Stats>("/api/v1/knowledge/stats"),
    ]);
    setDocs(d);
    setStats(s);
  }

  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, []);

  async function ingest(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/v1/knowledge/documents", {
        method: "POST",
        body: JSON.stringify({ title, content, doc_type: "general", source: "upload" }),
      });
      setTitle("");
      setContent("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ingest failed");
    } finally {
      setBusy(false);
    }
  }

  async function search(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api<{ results: Hit[]; stats: Stats }>("/api/v1/knowledge/search", {
        method: "POST",
        body: JSON.stringify({ query, limit: 8 }),
      });
      setHits(res.results);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Knowledge Hub"
        subtitle="Offline dossier corpus + OpenAI embeddings + hybrid RAG search with government-source citations."
      />
      {error ? <p className="mb-3 text-sm text-[var(--danger)]">{error}</p> : null}
      {stats ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <Panel><div className="text-sm text-[var(--ink-muted)]">Documents</div><div className="font-[family-name:var(--font-display)] text-3xl">{stats.documents}</div></Panel>
          <Panel><div className="text-sm text-[var(--ink-muted)]">Chunks</div><div className="font-[family-name:var(--font-display)] text-3xl">{stats.chunks}</div></Panel>
          <Panel><div className="text-sm text-[var(--ink-muted)]">Embedded</div><div className="font-[family-name:var(--font-display)] text-3xl">{stats.embedded_chunks}</div></Panel>
          <Panel>
            <div className="text-sm text-[var(--ink-muted)]">Embeddings</div>
            <div className="mt-2"><Badge tone={stats.openai_configured ? "good" : "warn"}>{stats.openai_configured ? "OpenAI active" : "Local fallback"}</Badge></div>
          </Panel>
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="font-semibold">Ingest document</h2>
          <form onSubmit={ingest} className="mt-3 space-y-3">
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <Textarea rows={8} placeholder="Paste protocol, label, or brief…" value={content} onChange={(e) => setContent(e.target.value)} required />
            <Button type="submit" disabled={busy}>{busy ? "Working…" : "Ingest & embed"}</Button>
          </form>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Hybrid vector + keyword search</h2>
          <form onSubmit={search} className="mt-3 flex gap-2">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} />
            <Button type="submit" disabled={busy}>{busy ? "…" : "Search"}</Button>
          </form>
          <div className="mt-4 space-y-3">
            {hits.map((h, i) => (
              <div key={i} className="border-b border-[var(--line)] pb-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{h.title}</span>
                  <Badge>{h.score}</Badge>
                  {h.source ? <Badge tone="neutral">{h.source}</Badge> : null}
                </div>
                <p className="mt-1 text-[var(--ink-muted)]">{h.content.slice(0, 220)}…</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      {stats?.sources?.length ? (
        <Panel className="mt-4">
          <h2 className="font-semibold">Connected data sources</h2>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {stats.sources.map((s) => (
              <div key={s.id} className="flex items-center justify-between border-b border-[var(--line)] py-2 text-sm">
                <span>{s.name}</span>
                <Badge tone={s.status === "active" || s.status?.includes?.("active") ? "good" : "warn"}>{s.type}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}
      <Panel className="mt-4">
        <h2 className="font-semibold">Corpus</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {docs.map((d) => (
            <button
              key={d.id}
              className="rounded-lg border border-[var(--line)] p-4 text-left hover:bg-[var(--surface-2)]"
              onClick={() =>
                api<{ title: string; content: string; chunk_count: number; embedded: number }>(
                  `/api/v1/knowledge/documents/${d.id}`,
                )
                  .then(setSelected)
                  .catch((e) => setError(e.message))
              }
            >
              <div className="font-medium">{d.title}</div>
              <div className="mt-1 flex flex-wrap gap-2">
                <Badge>{d.doc_type}</Badge>
                <Badge tone="neutral">{d.source}</Badge>
                <Badge tone="good">{d.embedded ?? 0}/{d.chunk_count ?? 0} embedded</Badge>
              </div>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">{d.preview}</p>
            </button>
          ))}
        </div>
        {selected ? (
          <div className="mt-4 whitespace-pre-wrap rounded-lg bg-[var(--surface-2)] p-4 text-sm">
            <div className="mb-2 font-semibold">
              {selected.title} · {selected.chunk_count} chunks · {selected.embedded} embedded
            </div>
            {selected.content}
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
