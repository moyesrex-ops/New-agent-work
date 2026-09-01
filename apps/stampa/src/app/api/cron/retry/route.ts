import { NextResponse } from "next/server";
import { cronAuthorised } from "@/lib/cron";
import { env } from "@/lib/env";
import { runDueTransmissions } from "@/lib/services/invoices";
import { sendDueNudges } from "@/lib/services/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron, every five minutes. Empty CRON_SECRET disables the route
 * rather than leaving it open.
 */
export async function GET(request: Request) {
  const secret = env().CRON_SECRET;
  if (!secret) return NextResponse.json({ ok: false }, { status: 404 });
  if (!cronAuthorised(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const retried = await runDueTransmissions();
  const nudged = await sendDueNudges();
  return NextResponse.json({ ok: true, retried, nudged });
}
