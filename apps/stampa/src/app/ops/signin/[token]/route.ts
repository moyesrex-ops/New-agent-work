import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db/client";
import { redeemMagicLink } from "@/lib/auth/magic-link";
import { isOperator } from "@/lib/auth/operators";
import { startSession } from "@/lib/auth/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const db = await getDb();
  const redeemed = await redeemMagicLink(db, token);

  if (!redeemed.ok) {
    return NextResponse.redirect(new URL(`/ops/signin?error=${redeemed.error}`, request.url));
  }

  // Re-checked at redemption, not only at issue: removing someone from the
  // operator list must invalidate a link that is already in their inbox.
  if (!isOperator(redeemed.email)) {
    return NextResponse.redirect(new URL("/ops/signin?error=invalid", request.url));
  }

  await startSession("operator", redeemed.email);
  return NextResponse.redirect(new URL("/ops", request.url));
}
