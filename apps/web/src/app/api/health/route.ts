import { NextResponse } from "next/server";
import { hasOpenAI } from "@/lib/server/openai";
import { ensureReady, knowledgeStats } from "@/lib/server/store";
import { DATA_SOURCES } from "@/lib/server/tools";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureReady();
  const stats = knowledgeStats();
  return NextResponse.json({
    status: "ok",
    service: "LSI-OS Web API",
    openai: hasOpenAI(),
    knowledge: stats,
    sources: DATA_SOURCES.length,
    demo: { email: "admin@lsi.os", password: "demo1234" },
  });
}
