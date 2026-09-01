import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDb, setTestDb } from "@/lib/db/client";
import { isDemo } from "@/lib/env";
import {
  DemoDisabledError,
  DemoDoorError,
  resolveDemoDoor,
} from "@/lib/services/demo";
import {
  DEMO_BUYER,
  DEMO_LIVE_SUPPLIER_PHONE,
  DEMO_OPERATOR_EMAIL,
  DEMO_SUPPLIER_PHONE,
  seed,
} from "@/lib/services/seed";
import { suppliers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const originalDemo = process.env.STAMPA_DEMO;
const originalOperators = process.env.STAMPA_OPERATORS;

afterEach(() => {
  if (originalDemo === undefined) delete process.env.STAMPA_DEMO;
  else process.env.STAMPA_DEMO = originalDemo;
  if (originalOperators === undefined) delete process.env.STAMPA_OPERATORS;
  else process.env.STAMPA_OPERATORS = originalOperators;
});

describe("isDemo", () => {
  it("is off unless the flag is an explicit true", () => {
    expect(isDemo({})).toBe(false);
    expect(isDemo({ STAMPA_DEMO: "false" })).toBe(false);
    expect(isDemo({ STAMPA_DEMO: "true" })).toBe(true);
    expect(isDemo({ STAMPA_DEMO: "1" })).toBe(true);
  });
});

describe("Given demo doors are not enabled", () => {
  it("Then resolveDemoDoor refuses rather than minting a session identity", async () => {
    delete process.env.STAMPA_DEMO;
    await expect(resolveDemoDoor("supplier")).rejects.toBeInstanceOf(DemoDisabledError);
  });
});

describe("Given a seeded demo instance", () => {
  beforeEach(async () => {
    process.env.STAMPA_DEMO = "true";
    process.env.STAMPA_OPERATORS = DEMO_OPERATOR_EMAIL;
    const db = await createTestDb();
    setTestDb(db);
    await seed();
  });

  it("Then the supplier door is the live packaging supplier, not the invited one", async () => {
    const door = await resolveDemoDoor("supplier");
    expect(door.subjectType).toBe("supplier");
    expect(door.href).toBe("/s");

    const db = await import("@/lib/db/client").then((mod) => mod.getDb());
    const row = await (await db).query.suppliers.findFirst({
      where: eq(suppliers.id, door.subjectId),
    });
    expect(row?.phone).toBe(DEMO_LIVE_SUPPLIER_PHONE);
    expect(row?.confirmedAt).not.toBeNull();
  });

  it("Then the invite door is Emeka, still unconfirmed", async () => {
    const door = await resolveDemoDoor("invite");
    expect(door.href).toBe("/s/confirm");

    const db = await (await import("@/lib/db/client")).getDb();
    const row = await db.query.suppliers.findFirst({
      where: eq(suppliers.id, door.subjectId),
    });
    expect(row?.phone).toBe(DEMO_SUPPLIER_PHONE);
    expect(row?.confirmedAt).toBeNull();
  });

  it("Then the buyer door is the Agbara Foods tax manager", async () => {
    const door = await resolveDemoDoor("buyer");
    expect(door.subjectType).toBe("buyer");
    expect(door.href).toBe("/c");

    const db = await (await import("@/lib/db/client")).getDb();
    const row = await db.query.buyerUsers.findFirst({
      where: (users, { eq: equals }) => equals(users.id, door.subjectId),
    });
    expect(row?.email).toBe(DEMO_BUYER.email);
  });

  it("Then the operator door uses the seeded operator email", async () => {
    const door = await resolveDemoDoor("operator");
    expect(door).toEqual({
      subjectType: "operator",
      subjectId: DEMO_OPERATOR_EMAIL,
      href: "/ops",
    });
  });

  it("Then an unknown door is refused", async () => {
    await expect(resolveDemoDoor("admin")).rejects.toBeInstanceOf(DemoDoorError);
  });
});
