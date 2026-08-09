"""OpenAI embeddings with deterministic hash fallback (Nest-aligned dims)."""

from __future__ import annotations

import hashlib
import math
import re

import numpy as np

from app.core.config import get_settings


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


def embed_text(text: str) -> list[float]:
    """Deterministic local embedding matching configured Nest dims."""
    dims = get_settings().embedding_dims
    vec = np.zeros(dims, dtype=np.float32)
    tokens = _tokenize(text)
    if not tokens:
        return vec.tolist()
    for token in tokens:
        digest = hashlib.sha256(token.encode()).digest()
        for i in range(0, min(len(digest), 32), 4):
            idx = int.from_bytes(digest[i : i + 2], "little") % dims
            sign = 1.0 if digest[i + 2] % 2 == 0 else -1.0
            vec[idx] += sign
    norm = float(np.linalg.norm(vec))
    if norm > 0:
        vec /= norm
    return vec.tolist()


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed many texts via OpenAI when configured, else hash fallback."""
    if not texts:
        return []
    settings = get_settings()
    if settings.openai_api_key:
        try:
            return await _openai_embed(texts)
        except Exception:  # noqa: BLE001
            pass
    return [embed_text(t) for t in texts]


async def _openai_embed(texts: list[str]) -> list[list[float]]:
    from openai import AsyncOpenAI

    settings = get_settings()
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    kwargs: dict = {
        "model": settings.openai_embedding_model,
        "input": texts,
    }
    # text-embedding-3-* supports shortening to Nest dims
    if settings.embedding_dims and settings.embedding_dims > 0:
        kwargs["dimensions"] = settings.embedding_dims
    resp = await client.embeddings.create(**kwargs)
    ordered = sorted(resp.data, key=lambda d: d.index)
    return [list(d.embedding) for d in ordered]


def cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b:
        return 0.0
    va = np.array(a, dtype=np.float32)
    vb = np.array(b, dtype=np.float32)
    denom = float(np.linalg.norm(va) * np.linalg.norm(vb))
    if denom == 0:
        return 0.0
    return float(np.dot(va, vb) / denom)


def chunk_text(text: str, chunk_size: int = 700, overlap: int = 100) -> list[str]:
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= chunk_size:
        return [text] if text else []
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(len(text), start + chunk_size)
        chunks.append(text[start:end])
        if end >= len(text):
            break
        start = max(0, end - overlap)
    return chunks


def keyword_score(query: str, content: str) -> float:
    q = set(_tokenize(query))
    c = set(_tokenize(content))
    if not q or not c:
        return 0.0
    return len(q & c) / math.sqrt(len(q) * len(c))
