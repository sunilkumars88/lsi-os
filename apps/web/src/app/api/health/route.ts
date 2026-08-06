import { NextResponse } from "next/server";
import { ensureSeeded } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = ensureSeeded();
  return NextResponse.json({
    status: "ok",
    service: "LSI-OS Web API",
    users: s.users.length,
    documents: s.documents.length,
    demo: { email: "admin@lsi.os", password: "demo1234" },
  });
}
