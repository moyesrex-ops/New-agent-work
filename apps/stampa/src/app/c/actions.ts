"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";
import { issueMagicLink, parseWorkEmail } from "@/lib/auth/magic-link";
import { endSession } from "@/lib/auth/session";
import { requireBuyer } from "@/lib/auth/require";
import { authorise } from "@/lib/auth/policy";
import { sendEmail } from "@/lib/messaging";
import { appUrl } from "@/lib/services/notify";
import { importVendors, nudgeSupplier, sendInvitations } from "@/lib/services/buyer";
import { ingestVendorMaster, type ColumnKey, type Mapping } from "@/lib/services/vendor-master";
import { dropUpload, readUpload, stageUpload } from "@/lib/services/staging";
import { writeAudit } from "@/lib/audit";

const UPLOAD_COOKIE = "stampa_upload";
/** A 5,000-row vendor master is around 500KB. Ten times that is generous. */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function fail(path: string, error: string): never {
  redirect(`${path}?error=${error}`);
}

export async function requestMagicLink(formData: FormData): Promise<void> {
  const email = parseWorkEmail(String(formData.get("email") ?? ""));
  if (!email.ok) fail("/c/signin", email.error);

  const db = await getDb();
  const issued = await issueMagicLink(db, email.value);

  // Only sent when the account exists, but the screen says the same thing
  // either way. The form must not be usable to discover our customer list.
  if (issued) {
    await sendEmail({
      to: email.value,
      subject: "Your Stampa sign-in link",
      body: `${appUrl(`/c/signin/${issued.token}`)}\n\nThis link works once and expires in 20 minutes.`,
    });
  }

  redirect(`/c/signin?sent=${encodeURIComponent(email.value)}`);
}

export async function signOutBuyer(): Promise<void> {
  await endSession("buyer");
  redirect("/c/signin");
}

/**
 * Parse the vendor master and hold it for the mapping screen (ticket B-01).
 * The file itself is never written to disk or to Postgres — see staging.ts.
 */
export async function uploadVendorMaster(formData: FormData): Promise<void> {
  const principal = await requireBuyer();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) fail("/c/upload", "no_file");
  if (file.size > MAX_UPLOAD_BYTES) fail("/c/upload", "too_large");

  const text = await file.text();
  const parsed = ingestVendorMaster(text);
  if (!parsed.headers.length) fail("/c/upload", "empty");
  if (parsed.mapping.businessName === undefined && parsed.mapping.phone === undefined) {
    fail("/c/upload", "unreadable");
  }

  const token = stageUpload(principal.organisationId, file.name, text);
  const store = await cookies();
  store.set(UPLOAD_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/" });

  redirect("/c/upload/review");
}

function readMappingOverride(formData: FormData): Mapping {
  const override: Mapping = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("column.")) continue;
    const index = Number(value);
    if (Number.isInteger(index) && index >= 0) {
      override[key.slice("column.".length) as ColumnKey] = index;
    }
  }
  return override;
}

export async function confirmMapping(formData: FormData): Promise<void> {
  const principal = await requireBuyer();
  authorise(principal, "vendor_master.upload", {
    kind: "organisation",
    organisationId: principal.organisationId,
  });

  const store = await cookies();
  const token = store.get(UPLOAD_COOKIE)?.value ?? "";
  const staged = readUpload(token, principal.organisationId);
  if (!staged) fail("/c/upload", "expired");

  const parsed = ingestVendorMaster(staged.csv, readMappingOverride(formData));
  if (parsed.mapping.businessName === undefined) fail("/c/upload/review", "businessName");
  if (parsed.mapping.phone === undefined) fail("/c/upload/review", "phone");

  const actor = { type: "buyer", id: principal.userId } as const;
  const summary = await importVendors(principal.organisationId, parsed.vendors, actor);

  const db = await getDb();
  await writeAudit(db, {
    actor,
    action: "vendor_master.imported",
    subjectType: "organisation",
    subjectId: principal.organisationId,
    after: {
      rows: parsed.vendors.length,
      created: summary.created,
      updated: summary.updated,
      bankChanges: summary.bankChanges,
      tinsRecovered: parsed.tinsRecovered,
    },
  });

  // The moment the extraction is committed, the cells go.
  dropUpload(token);
  store.delete(UPLOAD_COOKIE);

  redirect("/c/exposure");
}

export async function discardUpload(): Promise<void> {
  const store = await cookies();
  const token = store.get(UPLOAD_COOKIE)?.value;
  if (token) dropUpload(token);
  store.delete(UPLOAD_COOKIE);
  redirect("/c/upload");
}

export async function inviteSuppliers(formData: FormData): Promise<void> {
  const principal = await requireBuyer();
  authorise(principal, "supplier_link.invite", {
    kind: "supplier_link",
    organisationId: principal.organisationId,
  });

  const linkIds = formData.getAll("linkId").map(String).filter(Boolean);
  if (!linkIds.length) fail("/c/invite", "none_selected");

  const outcomes = await sendInvitations(principal.organisationId, linkIds, {
    type: "buyer",
    id: principal.userId,
  });

  const sent = outcomes.filter((outcome) => outcome.sent).length;
  revalidatePath("/c/suppliers");
  redirect(`/c/suppliers?sent=${sent}&failed=${outcomes.length - sent}`);
}

export async function nudge(linkId: string): Promise<void> {
  const principal = await requireBuyer();
  authorise(principal, "supplier_link.invite", {
    kind: "supplier_link",
    organisationId: principal.organisationId,
  });

  await nudgeSupplier(principal.organisationId, linkId, { type: "buyer", id: principal.userId });
  revalidatePath(`/c/suppliers/${linkId}`);
}
