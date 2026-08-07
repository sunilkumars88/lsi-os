import OpenAI from "openai";

export type LLMResult = {
  content: string;
  model: string;
  provider: string;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
};

function client() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

export function hasOpenAI() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function completeChat(opts: {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  temperature?: number;
}): Promise<LLMResult> {
  const c = client();
  if (!c) {
    return demoComplete(opts.messages.at(-1)?.content || "", opts.system);
  }

  try {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const resp = await c.chat.completions.create({
      model,
      temperature: opts.temperature ?? 0.2,
      messages: [{ role: "system", content: opts.system }, ...opts.messages],
    });
    const content = resp.choices[0]?.message?.content || "";
    const tin = resp.usage?.prompt_tokens || 0;
    const tout = resp.usage?.completion_tokens || 0;
    return {
      content,
      model,
      provider: "openai",
      tokens_in: tin,
      tokens_out: tout,
      cost_usd: (tin * 0.15 + tout * 0.6) / 1_000_000,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "OpenAI error";
    const fallback = demoComplete(opts.messages.at(-1)?.content || "", opts.system);
    fallback.content = `${fallback.content}\n\n_(OpenAI unavailable: ${msg})_`;
    return fallback;
  }
}

function demoComplete(query: string, system: string): LLMResult {
  const ctx = system.includes("CONTEXT:") ? system.split("CONTEXT:").pop()?.trim().slice(0, 2200) : "";
  const content = ctx
    ? `**LSI-OS Copilot**\n\n${summarizeContext(query, ctx)}`
    : `**LSI-OS Copilot**\n\nAsk about trials, safety, literature, commercial, HEOR, or regulatory topics. Knowledge base and government APIs are connected.`;
  return {
    content,
    model: "demo-brain",
    provider: "demo",
    tokens_in: Math.ceil(query.length / 4),
    tokens_out: Math.ceil(content.length / 4),
    cost_usd: 0,
  };
}

function summarizeContext(query: string, ctx: string) {
  return `Query: ${query}\n\nBased on retrieved knowledge and live tool results:\n\n${ctx}\n\nSources are cited in the citations/tool panels. Escalate safety/regulatory communications for human approval.`;
}

export const SYSTEM_PROMPTS = {
  copilot:
    "You are LSI-OS Copilot, an enterprise AI for life sciences. Be precise, cite NCT IDs / PMIDs / report IDs when present in context, never invent trial IDs or adverse event counts, and flag uncertainty. Prefer actionable recommendations for commercial, medical, clinical, HEOR, regulatory, and pharmacovigilance teams.",
  researcher:
    "You are a clinical research agent. Prioritize study design quality, endpoints, and enrollment risk. Cite NCT IDs when available.",
  analyst:
    "You are a commercial analytics agent. Focus on brand performance, HCP engagement, and competitive moves with clear next actions.",
  safety:
    "You are a pharmacovigilance analyst. Highlight signal strength, seriousness, confounding, and required next actions. Require human approval for external communications.",
  regulatory:
    "You are a regulatory affairs specialist. Map findings to FDA/EMA guidance and submission readiness risk.",
};
