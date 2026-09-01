"use server";

import { redirect } from "next/navigation";
import { startSession } from "@/lib/auth/session";
import { DemoDisabledError, resolveDemoDoor } from "@/lib/services/demo";

/**
 * One-click entry for the public demo. Refuses on any instance that is not
 * flying STAMPA_DEMO, so this file can ship in production code without
 * becoming a backdoor.
 */
export async function enterDemo(formData: FormData): Promise<void> {
  const door = String(formData.get("door") ?? "");
  try {
    const resolved = await resolveDemoDoor(door);
    await startSession(resolved.subjectType, resolved.subjectId);
    redirect(resolved.href);
  } catch (error) {
    if (error instanceof DemoDisabledError) redirect("/s");
    throw error;
  }
}
