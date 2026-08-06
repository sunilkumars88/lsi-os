"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge, Button, Input, PageHeader, Panel, Textarea } from "@/components/ui";
import { api } from "@/lib/api";

type Doc = { id: string; title: string; doc_type: string; source: string; preview?: string };
type Hit = { title: string; content: string; score: number; doc_type: string };

export default function KnowledgePage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [query, setQuery] = useState("CardiaX enrollment safety");
  const [hits, setHits] = useState<Hit[]>([]);
  const [selected, setSelected] = useState<{ title: string; content: string; chunk_count?: number } | null>(null);

  async function refresh() {
    setDocs(await api<Doc[]>("/api/v1/knowledge/documents"));
  }

  useEffect(() => {
    refresh().catch(console.error);
  }, []);

  async function ingest(e: FormEvent) {
    e.preventDefault();
    await api("/api/v1/knowledge/documents", {
      method: "POST",
      body: JSON.stringify({ title, content, doc_type: "general", source: "upload" }),
    });
    setTitle("");
    setContent("");
    await refresh();
  }

  async function search(e: FormEvent) {
    e.preventDefault();
    const res = await api<{ results: Hit[] }>("/api/v1/knowledge/search", {
      method: "POST",
      body: JSON.stringify({ query, limit: 6 }),
    });
    setHits(res.results);
  }

  return (
    <div>
      <PageHeader title="Knowledge Hub" subtitle="Ingest documents, embed chunks, and run hybrid RAG search with citations." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="font-semibold">Ingest document</h2>
          <form onSubmit={ingest} className="mt-3 space-y-3">
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <Textarea rows={8} placeholder="Paste protocol, label, or brief…" value={content} onChange={(e) => setContent(e.target.value)} required />
            <Button type="submit">Ingest & embed</Button>
          </form>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Hybrid search</h2>
          <form onSubmit={search} className="mt-3 flex gap-2">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} />
            <Button type="submit">Search</Button>
          </form>
          <div className="mt-4 space-y-3">
            {hits.map((h, i) => (
              <div key={i} className="border-b border-[var(--line)] pb-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{h.title}</span>
                  <Badge>{h.score}</Badge>
                </div>
                <p className="mt-1 text-[var(--ink-muted)]">{h.content.slice(0, 220)}…</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel className="mt-4">
        <h2 className="font-semibold">Corpus</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {docs.map((d) => (
            <button
              key={d.id}
              className="rounded-lg border border-[var(--line)] p-4 text-left hover:bg-[var(--surface-2)]"
              onClick={() => api<{ title: string; content: string; chunk_count: number }>(`/api/v1/knowledge/documents/${d.id}`).then(setSelected)}
            >
              <div className="font-medium">{d.title}</div>
              <div className="mt-1 flex gap-2">
                <Badge>{d.doc_type}</Badge>
                <Badge tone="neutral">{d.source}</Badge>
              </div>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">{d.preview}</p>
            </button>
          ))}
        </div>
        {selected ? (
          <div className="mt-4 rounded-lg bg-[var(--surface-2)] p-4 text-sm whitespace-pre-wrap">
            <div className="mb-2 font-semibold">{selected.title} · {selected.chunk_count} chunks</div>
            {selected.content}
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
