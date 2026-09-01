import { NextResponse } from "next/server";
import { healthSnapshot } from "@/lib/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await healthSnapshot();
  return NextResponse.json(snapshot, { status: snapshot.ok ? 200 : 503 });
}
