"use server";

import { redirect } from "next/navigation";
import { BRAND } from "@/lib/copy";
import { sendEmail } from "@/lib/messaging";

export async function sendContact(formData: FormData): Promise<void> {
  const trap = String(formData.get("company") ?? "").trim();
  if (trap) redirect("/contact?sent=1");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  if (!message) redirect("/contact?error=empty");

  await sendEmail({
    to: BRAND.supportEmail,
    subject: `Stampa contact from ${name || email || "site"}`,
    body: [`Name: ${name || "—"}`, `Email: ${email || "—"}`, "", message].join("\n"),
  });

  redirect("/contact?sent=1");
}
