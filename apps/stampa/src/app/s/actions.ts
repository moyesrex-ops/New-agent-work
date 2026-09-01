"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";
import { issueOtp, verifyOtp } from "@/lib/auth/otp";
import { endSession, startSession } from "@/lib/auth/session";
import { requireSupplier } from "@/lib/auth/require";
import { authorise } from "@/lib/auth/policy";
import { parsePhone } from "@/lib/phone";
import { parseAmountToKobo } from "@/lib/money";
import {
  InviteAlreadyBoundError,
  bindSupplierToInvite,
  confirmSupplierDetails,
  openInvite,
} from "@/lib/services/onboarding";
import { createInvoice, enqueueTransmission, runTransmission } from "@/lib/services/invoices";
import { track } from "@/lib/analytics";
import { canDelete, softDeleteAccount } from "@/lib/services/account";
import { sendOtp, sendVoiceOtp } from "@/lib/messaging";
import { copy } from "@/lib/copy";

const INVITE_COOKIE = "stampa_invite";
const PHONE_COOKIE = "stampa_pending_phone";

/**
 * Every action here redirects with an error code in the query string rather
 * than returning state to a client hook. The forms then work with no
 * JavaScript at all, which is the correct posture for a 3G connection on a
 * cheap Android — and it costs nothing on a good one.
 */
function fail(path: string, error: string): never {
  redirect(`${path}?error=${error}`);
}

export async function beginInvite(formData: FormData): Promise<void> {
  const code = String(formData.get("code") ?? "");
  const invite = await openInvite(code);
  if (invite.state !== "open") redirect(`/s/i/${encodeURIComponent(code)}`);

  const store = await cookies();
  store.set(INVITE_COOKIE, code, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/s/start");
}

export async function sendCode(formData: FormData): Promise<void> {
  const phone = parsePhone(String(formData.get("phone") ?? ""));
  if (!phone.ok) fail("/s/start", phone.error);

  const db = await getDb();
  const issued = await issueOtp(db, phone.value);
  if (!issued.ok) fail("/s/start", "rate_limited");

  const store = await cookies();
  store.set(PHONE_COOKIE, phone.value, { httpOnly: true, sameSite: "lax", path: "/" });

  const delivered = await sendOtp(phone.value, issued.code, copy.notify.otp(issued.code));
  if (!delivered.ok) fail("/s/start", "delivery_failed");

  redirect("/s/code");
}

export async function resendCode(): Promise<void> {
  const store = await cookies();
  const phone = parsePhone(store.get(PHONE_COOKIE)?.value ?? "");
  if (!phone.ok) redirect("/s/start");

  const db = await getDb();
  const issued = await issueOtp(db, phone.value, "sms");
  if (!issued.ok) fail("/s/code", "rate_limited");
  const result = await sendOtp(phone.value, issued.code, copy.notify.otp(issued.code));
  if (!result.ok) fail("/s/code", "delivery_failed");
  redirect("/s/code");
}

export async function sendVoiceCode(): Promise<void> {
  const store = await cookies();
  const phone = parsePhone(store.get(PHONE_COOKIE)?.value ?? "");
  if (!phone.ok) redirect("/s/start");

  const db = await getDb();
  const issued = await issueOtp(db, phone.value, "voice");
  if (!issued.ok) fail("/s/code", "rate_limited");
  const result = await sendVoiceOtp(phone.value, issued.code, copy.notify.otp(issued.code));
  if (!result.ok) fail("/s/code", "delivery_failed");
  redirect("/s/code?voice=1");
}

export async function checkCode(formData: FormData): Promise<void> {
  const store = await cookies();
  const phone = parsePhone(store.get(PHONE_COOKIE)?.value ?? "");
  if (!phone.ok) redirect("/s/start");

  const db = await getDb();
  const result = await verifyOtp(db, phone.value, String(formData.get("code") ?? ""));
  if (!result.ok) fail("/s/code", result.error);

  const inviteCode = store.get(INVITE_COOKIE)?.value;
  let supplierId: string;

  if (inviteCode) {
    let bound: { supplierId: string };
    try {
      bound = await bindSupplierToInvite(inviteCode, phone.value);
    } catch (error) {
      if (!(error instanceof InviteAlreadyBoundError)) throw error;
      // Drop the cookie: holding a link this number cannot use would send them
      // round the same loop on every retry.
      store.delete(INVITE_COOKIE);
      store.delete(PHONE_COOKIE);
      fail("/s/start", "invite_taken");
    }
    supplierId = bound.supplierId;
  } else {
    const existing = await db.query.suppliers.findFirst({
      where: (suppliers, { eq }) => eq(suppliers.phone, phone.value),
    });
    // No invite and no record: direct supplier signup is P1, so there is
    // nothing to sign in to yet. Say that plainly instead of creating an
    // orphan account with no buyer attached.
    if (!existing) fail("/s/start", "no_account");
    supplierId = existing.id;
    await track(db, "supplier_verified", { type: "supplier", id: supplierId });
  }

  store.delete(PHONE_COOKIE);
  await startSession("supplier", supplierId);

  const supplier = await db.query.suppliers.findFirst({
    where: (suppliers, { eq }) => eq(suppliers.id, supplierId),
  });
  redirect(supplier?.confirmedAt ? "/s" : "/s/confirm");
}

export async function confirmDetails(formData: FormData): Promise<void> {
  const principal = await requireSupplier();
  const store = await cookies();
  const inviteCode = store.get(INVITE_COOKIE)?.value;
  if (!inviteCode) redirect("/s");

  const invite = await openInvite(inviteCode);
  if (invite.state !== "open") redirect("/s");

  const db = await getDb();
  const link = await db.query.supplierLinks.findFirst({
    where: (links, { eq }) => eq(links.supplierId, principal.supplierId),
  });
  if (!link) redirect("/s");

  authorise(principal, "supplier.write", {
    kind: "supplier",
    supplierId: principal.supplierId,
  });

  const businessName = String(formData.get("businessName") ?? "").trim();
  const tin = String(formData.get("tin") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (!businessName) fail("/s/confirm", "businessName");
  if (!tin) fail("/s/confirm", "tin");

  await confirmSupplierDetails(
    principal.supplierId,
    link.organisationId,
    { businessName, tin, address },
    { type: "supplier", id: principal.supplierId },
  );

  store.delete(INVITE_COOKIE);
  redirect("/s/new");
}

export async function createDraft(formData: FormData): Promise<void> {
  const principal = await requireSupplier();
  const db = await getDb();

  const link = await db.query.supplierLinks.findFirst({
    where: (links, { eq }) => eq(links.supplierId, principal.supplierId),
  });
  if (!link) redirect("/s");

  authorise(principal, "invoice.create", {
    kind: "invoice",
    supplierId: principal.supplierId,
    organisationId: link.organisationId,
  });

  const description = String(formData.get("description") ?? "").trim();
  const quantityRaw = String(formData.get("quantity") ?? "").trim();
  const unitPrice = parseAmountToKobo(String(formData.get("unitPrice") ?? ""));

  if (!description) fail("/s/new", "description");
  const quantity = Number(quantityRaw);
  if (!Number.isSafeInteger(quantity) || quantity < 1) fail("/s/new", "quantity");
  if (!unitPrice.ok) fail("/s/new", "unitPrice");
  if (unitPrice.value * quantity === 0) fail("/s/new", "zeroTotal");

  const invoice = await createInvoice(
    {
      supplierId: principal.supplierId,
      organisationId: link.organisationId,
      description,
      quantity,
      unitPriceKobo: unitPrice.value,
    },
    { type: "supplier", id: principal.supplierId },
  );

  // Saved before anything is sent, so the review screen has something real to
  // show and "Your invoice is saved" is already true.
  redirect(`/s/invoice/${invoice.id}/review`);
}

export async function sendDraft(formData: FormData): Promise<void> {
  const principal = await requireSupplier();
  const invoiceId = String(formData.get("invoiceId") ?? "");

  const db = await getDb();
  const invoice = await db.query.invoices.findFirst({
    where: (rows, { eq }) => eq(rows.id, invoiceId),
  });
  if (!invoice) redirect("/s");

  authorise(principal, "invoice.transmit", {
    kind: "invoice",
    supplierId: invoice.supplierId,
    organisationId: invoice.organisationId,
  });

  // The key is generated once, here, and reused by every retry — by the
  // browser, by a refresh, and by the background worker.
  if (invoice.status === "draft") await enqueueTransmission(invoice.id, randomUUID());
  redirect(`/s/invoice/${invoice.id}`);
}

/**
 * Called by the Sending screen. Idempotent, so a double tap, a refresh and the
 * background worker all converge on one transmission.
 */
export async function finishTransmission(invoiceId: string): Promise<void> {
  const principal = await requireSupplier();
  const db = await getDb();
  const invoice = await db.query.invoices.findFirst({
    where: (rows, { eq }) => eq(rows.id, invoiceId),
  });
  if (!invoice) return;

  authorise(principal, "invoice.transmit", {
    kind: "invoice",
    supplierId: invoice.supplierId,
    organisationId: invoice.organisationId,
  });

  await runTransmission(invoiceId, { type: "supplier", id: principal.supplierId });
  revalidatePath(`/s/invoice/${invoiceId}`);
}

export async function recordShare(invoiceId: string): Promise<void> {
  const principal = await requireSupplier();
  const db = await getDb();
  await track(db, "stamp_shared", { type: "supplier", id: principal.supplierId }, { invoiceId });
}

export async function signOut(): Promise<void> {
  await endSession("supplier");
  redirect("/s/start");
}

export async function deleteAccount(formData: FormData): Promise<void> {
  const principal = await requireSupplier();
  if (String(formData.get("confirm") ?? "").trim() !== "DELETE") {
    fail("/s/account/delete", "confirm");
  }

  authorise(principal, "supplier.delete", {
    kind: "supplier",
    supplierId: principal.supplierId,
  });

  const check = await canDelete(principal.supplierId);
  if (!check.allowed) fail("/s/account/delete", check.reason);

  await softDeleteAccount(principal.supplierId);
  await endSession("supplier");
  redirect("/s/goodbye");
}
