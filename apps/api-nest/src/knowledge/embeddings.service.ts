import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class EmbeddingsService {
  private openai: OpenAI | null = null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('app.openaiApiKey');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    const aiUrl = this.config.get<string>('app.aiServiceUrl');
    if (aiUrl) {
      const base = aiUrl.replace(/\/$/, '');
      for (const path of ['/embeddings', '/api/v1/embeddings']) {
        try {
          const res = await fetch(`${base}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts }),
          });
          if (res.ok) {
            const data = (await res.json()) as { embeddings: number[][] };
            return data.embeddings;
          }
        } catch {
          // try next path
        }
      }
    }

    if (this.openai) {
      const model = this.config.get<string>('app.embeddingModel')!;
      const response = await this.openai.embeddings.create({
        model,
        input: texts,
      });
      return response.data.map((d) => d.embedding);
    }

    const dims = this.config.get<number>('app.embeddingDims') ?? 384;
    return texts.map((t) => this.hashEmbedding(t, dims));
  }

  private hashEmbedding(text: string, dims: number): number[] {
    const vec = new Array<number>(dims).fill(0);
    const tokens = text.toLowerCase().split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      const hash = createHash('sha256').update(token).digest();
      for (let i = 0; i < dims; i++) {
        vec[i] += (hash[i % hash.length] - 128) / 128;
      }
    }
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }
}

export function chunkText(
  text: string,
  maxTokens = 512,
  overlapRatio = 0.2,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunkWords = maxTokens;
  const overlapWords = Math.floor(chunkWords * overlapRatio);
  const step = Math.max(1, chunkWords - overlapWords);
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += step) {
    const slice = words.slice(i, i + chunkWords);
    if (slice.length === 0) break;
    chunks.push(slice.join(' '));
    if (i + chunkWords >= words.length) break;
  }

  return chunks;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

export function rankBySimilarity(
  query: number[],
  items: { id: string; embedding: number[] | null; content: string }[],
  topK = 10,
) {
  return items
    .filter((i) => i.embedding && i.embedding.length > 0)
    .map((i) => ({
      id: i.id,
      content: i.content,
      score: cosineSimilarity(query, i.embedding!),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
