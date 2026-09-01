"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BRAND } from "@/lib/copy";
import { contactLimited, readContact } from "@/lib/contact-form";
import { sendEmail } from "@/lib/messaging";

export async function sendContact(formData: FormData): Promise<void> {
  const fields = readContact(formData);
  if (fields.trap) redirect("/contact?sent=1");
  if (!fields.message) redirect("/contact?error=empty");

  const requestHeaders = await headers();
  const network = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (contactLimited(network)) redirect("/contact?error=too_many");

  const result = await sendEmail({
    to: BRAND.supportEmail,
    subject: `Stampa contact from ${fields.name || fields.email || "site"}`,
    body: [`Name: ${fields.name || "—"}`, `Email: ${fields.email || "—"}`, "", fields.message].join("\n"),
  });

  if (!result.ok) redirect("/contact?error=failed");
  redirect("/contact?sent=1");
}
