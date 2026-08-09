from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.embeddings import cosine_similarity, embed_text, keyword_score
from app.models import Document, DocumentChunk


def ingest_document(db: Session, document: Document) -> int:
    from app.ai.embeddings import chunk_text

    # clear old chunks
    for chunk in list(document.chunks):
        db.delete(chunk)
    db.flush()

    chunks = chunk_text(document.content)
    for idx, text in enumerate(chunks):
        emb = embed_text(text)
        db.add(
            DocumentChunk(
                document_id=document.id,
                org_id=document.org_id,
                chunk_index=idx,
                content=text,
                embedding=emb,
            )
        )
    db.commit()
    return len(chunks)


def hybrid_search(
    db: Session,
    org_id: str,
    query: str,
    *,
    limit: int = 6,
) -> list[dict[str, Any]]:
    q_emb = embed_text(query)
    rows = db.scalars(
        select(DocumentChunk).where(DocumentChunk.org_id == org_id).limit(500)
    ).all()
    scored: list[tuple[float, DocumentChunk]] = []
    for row in rows:
        emb = list(row.embedding) if isinstance(row.embedding, list) else []
        vec_score = cosine_similarity(q_emb, emb)
        kw = keyword_score(query, row.content)
        score = 0.65 * vec_score + 0.35 * kw
        if score > 0.05:
            scored.append((score, row))
    scored.sort(key=lambda x: x[0], reverse=True)

    results: list[dict[str, Any]] = []
    for score, chunk in scored[:limit]:
        doc = db.get(Document, chunk.document_id)
        results.append(
            {
                "chunk_id": chunk.id,
                "document_id": chunk.document_id,
                "title": doc.title if doc else "Unknown",
                "doc_type": doc.doc_type if doc else "general",
                "content": chunk.content,
                "score": round(float(score), 4),
            }
        )
    return results
