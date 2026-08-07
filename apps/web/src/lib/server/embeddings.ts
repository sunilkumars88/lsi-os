import OpenAI from "openai";
import { createHash } from "crypto";

const EMBED_MODEL = "text-embedding-3-small";
const DIMS = 1536;

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

/** Deterministic local embedding fallback (no network). */
export function localEmbed(text: string, dims = 384): number[] {
  const vec = new Array(dims).fill(0);
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g) || [];
  for (const token of tokens) {
    const digest = createHash("sha256").update(token).digest();
    for (let i = 0; i < 16; i++) {
      const idx = digest.readUInt16LE(i % 30) % dims;
      vec[idx] += digest[i] % 2 === 0 ? 1 : -1;
    }
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  const client = getOpenAI();
  if (!client) return texts.map((t) => localEmbed(t));

  try {
    const resp = await client.embeddings.create({
      model: EMBED_MODEL,
      input: texts.map((t) => t.slice(0, 7000)),
    });
    return resp.data
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding);
  } catch {
    return texts.map((t) => localEmbed(t));
  }
}

export async function embedQuery(text: string): Promise<number[]> {
  const [v] = await embedTexts([text]);
  return v;
}

export function cosine(a: number[], b: number[]): number {
  if (!a?.length || !b?.length) return 0;
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom ? dot / denom : 0;
}

export function keywordScore(query: string, content: string): number {
  const q = new Set(query.toLowerCase().match(/[a-z0-9]+/g) || []);
  const c = content.toLowerCase().match(/[a-z0-9]+/g) || [];
  if (!q.size || !c.length) return 0;
  const setC = new Set(c);
  let overlap = 0;
  for (const t of q) if (setC.has(t)) overlap++;
  return overlap / Math.sqrt(q.size * setC.size);
}

export { DIMS, EMBED_MODEL };
