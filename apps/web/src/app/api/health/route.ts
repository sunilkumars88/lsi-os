import { NextResponse } from "next/server";
import { hasOpenAI, probeOpenAI } from "@/lib/server/openai";
import { ensureReady, knowledgeStats } from "@/lib/server/store";
import { DATA_SOURCES } from "@/lib/server/tools";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureReady();
  const stats = knowledgeStats();
  const openai = await probeOpenAI();
  return NextResponse.json({
    status: "ok",
    service: "EIOS API",
    openai: openai.ok,
    openai_configured: hasOpenAI(),
    openai_status: openai,
    knowledge: stats,
    sources: DATA_SOURCES.length,
    demo: { email: "admin@lsi.os", password: "demo1234" },
    action_required: openai.ok
      ? null
      : "Replace OPENAI_API_KEY in Vercel with a valid key from https://platform.openai.com/api-keys",
  });
}
