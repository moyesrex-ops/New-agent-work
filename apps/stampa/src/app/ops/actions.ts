"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";
import { createMagicLink, parseWorkEmail } from "@/lib/auth/magic-link";
import { isOperator } from "@/lib/auth/operators";
import { endSession } from "@/lib/auth/session";
import { requireOperator } from "@/lib/auth/require";
import { authorise } from "@/lib/auth/policy";
import { sendEmail } from "@/lib/messaging";
import { appUrl } from "@/lib/services/notify";
import {
  correctTin,
  raiseFlag,
  resolveFlag,
  retryGroup,
  retryTransmission,
} from "@/lib/services/operator";

function fail(path: string, error: string): never {
  redirect(`${path}?error=${error}`);
}

/**
 * Every write below takes a typed reason and passes it to the audit writer,
 * which rejects the action if it is blank. That is not a UI nicety: an
 * operator correcting a stranger's tax identifier without saying why is
 * exactly the record an incident review needs and never has.
 */
function reasonFrom(formData: FormData, path: string): string {
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 4) fail(path, "reason");
  return reason;
}

export async function requestOperatorLink(formData: FormData): Promise<void> {
  const email = parseWorkEmail(String(formData.get("email") ?? ""));
  if (!email.ok) fail("/ops/signin", email.error);

  if (isOperator(email.value)) {
    const db = await getDb();
    const { token } = await createMagicLink(db, email.value);
    await sendEmail({
      to: email.value,
      subject: "Stampa operator sign-in",
      body: `${appUrl(`/ops/signin/${token}`)}\n\nThis link works once and expires in 20 minutes.`,
    });
  }

  redirect(`/ops/signin?sent=${encodeURIComponent(email.value)}`);
}

export async function signOutOperator(): Promise<void> {
  await endSession("operator");
  redirect("/ops/signin");
}

export async function retryOne(formData: FormData): Promise<void> {
  const principal = await requireOperator();
  authorise(principal, "operator.retry_transmission", { kind: "platform" });

  const transmissionId = String(formData.get("transmissionId") ?? "");
  const reason = reasonFrom(formData, "/ops/failures");

  await retryTransmission(transmissionId, principal.operatorId, reason);
  revalidatePath("/ops/failures");
}

export async function retryAll(formData: FormData): Promise<void> {
  const principal = await requireOperator();
  authorise(principal, "operator.retry_transmission", { kind: "platform" });

  const code = String(formData.get("code") ?? "");
  const reason = reasonFrom(formData, "/ops/failures");

  const count = await retryGroup(code, principal.operatorId, reason);
  revalidatePath("/ops/failures");
  redirect(`/ops/failures?retried=${count}`);
}

export async function openRecord(formData: FormData): Promise<void> {
  await requireOperator();
  const supplierId = String(formData.get("supplierId") ?? "");
  const reason = reasonFrom(formData, "/ops/lookup");
  redirect(`/ops/supplier/${supplierId}?reason=${encodeURIComponent(reason)}`);
}

export async function fixTin(formData: FormData): Promise<void> {
  const principal = await requireOperator();
  authorise(principal, "operator.correct_tin", { kind: "platform" });

  const supplierId = String(formData.get("supplierId") ?? "");
  const path = `/ops/supplier/${supplierId}`;
  const reason = reasonFrom(formData, path);

  const result = await correctTin(
    supplierId,
    String(formData.get("tin") ?? ""),
    principal.operatorId,
    reason,
  );
  if (!result.ok) fail(path, "tin");

  revalidatePath(path);
  redirect(`${path}?reason=${encodeURIComponent(reason)}&corrected=1`);
}

export async function flagSupplier(formData: FormData): Promise<void> {
  const principal = await requireOperator();
  const supplierId = String(formData.get("supplierId") ?? "");
  const path = `/ops/supplier/${supplierId}`;
  const reason = reasonFrom(formData, path);

  await raiseFlag({
    subjectType: "supplier",
    subjectId: supplierId,
    reason,
    raisedBy: principal.operatorId,
  });
  revalidatePath("/ops/flags");
  redirect("/ops/flags");
}

export async function decideFlag(formData: FormData): Promise<void> {
  const principal = await requireOperator();
  const resolution = String(formData.get("resolution") ?? "");
  if (resolution !== "suspend" && resolution !== "dismiss") fail("/ops/flags", "resolution");

  authorise(
    principal,
    resolution === "suspend" ? "operator.suspend" : "operator.resolve_flag",
    { kind: "platform" },
  );

  const reason = reasonFrom(formData, "/ops/flags");
  await resolveFlag(String(formData.get("flagId") ?? ""), resolution, principal.operatorId, reason);

  revalidatePath("/ops/flags");
  redirect("/ops/flags");
}
