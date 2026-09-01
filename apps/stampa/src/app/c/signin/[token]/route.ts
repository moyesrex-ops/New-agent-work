import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db/client";
import { consumeMagicLink } from "@/lib/auth/magic-link";
import { startSession } from "@/lib/auth/session";
import { track } from "@/lib/analytics";

/**
 * A route handler rather than a page, because consuming a sign-in link is a
 * side effect and pages should not have those. A crawler or a mail scanner
 * that follows the link burns it, which is the correct outcome for a
 * single-use credential.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const db = await getDb();
  const result = await consumeMagicLink(db, token);

  if (!result.ok) {
    return NextResponse.redirect(new URL(`/c/signin?error=${result.error}`, request.url));
  }

  await startSession("buyer", result.userId);
  await track(db, "buyer_signed_in", { type: "buyer", id: result.userId });

  return NextResponse.redirect(new URL("/c", request.url));
}
