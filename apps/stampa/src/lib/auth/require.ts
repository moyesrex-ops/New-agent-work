import "server-only";
import { redirect } from "next/navigation";
import { currentPrincipal } from "./session";
import type { Principal } from "./policy";

/**
 * Route guards. These decide only *who is here*; what they may do is still
 * decided by the policy module on every mutation. Reaching a page is never
 * treated as authorisation.
 */

export async function requireSupplier(): Promise<Extract<Principal, { role: "supplier_owner" }>> {
  const principal = await currentPrincipal();
  if (principal.role !== "supplier_owner") redirect("/s/start");
  return principal;
}

export async function requireBuyer(): Promise<
  Extract<Principal, { role: "buyer_admin" | "buyer_member" }>
> {
  const principal = await currentPrincipal();
  if (principal.role !== "buyer_admin" && principal.role !== "buyer_member") redirect("/c/signin");
  return principal;
}

export async function requireOperator(): Promise<Extract<Principal, { role: "operator" }>> {
  const principal = await currentPrincipal();
  if (principal.role !== "operator") redirect("/ops/signin");
  return principal;
}
