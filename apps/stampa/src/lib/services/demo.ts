/**
 * Public-demo doors. One-click sessions into the seeded identities so a
 * visitor can look at the product without an SMS arriving.
 *
 * Gated on STAMPA_DEMO. The same function on a real instance throws rather
 * than minting a session, because a forgotten flag is how a demo backdoor
 * becomes a production incident.
 */
import { eq } from "drizzle-orm";
import { env, isDemo } from "../env";
import { getDb } from "../db/client";
import { buyerUsers, suppliers } from "../db/schema";
import type { SubjectType } from "../auth/session";
import {
  DEMO_BUYER,
  DEMO_LIVE_SUPPLIER_PHONE,
  DEMO_OPERATOR_EMAIL,
  DEMO_SUPPLIER_PHONE,
  seed,
} from "./seed";

export type DemoDoor = "supplier" | "invite" | "buyer" | "operator";

export class DemoDisabledError extends Error {
  constructor() {
    super("Demo doors are disabled on this instance");
    this.name = "DemoDisabledError";
  }
}

export class DemoDoorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DemoDoorError";
  }
}

export async function resolveDemoDoor(door: string): Promise<{
  subjectType: SubjectType;
  subjectId: string;
  href: string;
}> {
  if (!isDemo()) throw new DemoDisabledError();
  await seed();
  const db = await getDb();

  switch (door) {
    case "supplier": {
      const row = await db.query.suppliers.findFirst({
        where: eq(suppliers.phone, DEMO_LIVE_SUPPLIER_PHONE),
      });
      if (!row) throw new DemoDoorError("Seeded live supplier is missing");
      return { subjectType: "supplier", subjectId: row.id, href: "/s" };
    }
    case "invite": {
      const row = await db.query.suppliers.findFirst({
        where: eq(suppliers.phone, DEMO_SUPPLIER_PHONE),
      });
      if (!row) throw new DemoDoorError("Seeded invited supplier is missing");
      return {
        subjectType: "supplier",
        subjectId: row.id,
        href: row.confirmedAt ? "/s" : "/s/confirm",
      };
    }
    case "buyer": {
      const row = await db.query.buyerUsers.findFirst({
        where: eq(buyerUsers.email, DEMO_BUYER.email),
      });
      if (!row) throw new DemoDoorError("Seeded buyer is missing");
      return { subjectType: "buyer", subjectId: row.id, href: "/c" };
    }
    case "operator": {
      const allowed = env().STAMPA_OPERATORS;
      const email = allowed.includes(DEMO_OPERATOR_EMAIL)
        ? DEMO_OPERATOR_EMAIL
        : allowed[0];
      if (!email) throw new DemoDoorError("STAMPA_OPERATORS is empty");
      return { subjectType: "operator", subjectId: email, href: "/ops" };
    }
    default:
      throw new DemoDoorError(`Unknown demo door: ${door}`);
  }
}
