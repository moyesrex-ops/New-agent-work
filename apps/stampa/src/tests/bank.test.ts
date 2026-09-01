import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { supplierLinks } from "@/lib/db/schema";
import { withBankWrite } from "@/lib/db/client";
import { makeFixture } from "./support/db";

describe("Given bank columns on supplier_links", () => {
  it("Then a raw UPDATE of the last4 is refused at the database", async () => {
    const fixture = await makeFixture();
    try {
      await fixture.db
        .update(supplierLinks)
        .set({ bankLast4: "0000" })
        .where(eq(supplierLinks.id, fixture.linkId));
      expect.fail("update should have been refused");
    } catch (error) {
      const text = error instanceof Error ? `${error.message} ${error.cause ?? ""}` : String(error);
      expect(text).toMatch(/immutable|42501|Failed query/i);
    }
  });

  it("Then the audited vendor-master path can still change them", async () => {
    const fixture = await makeFixture();
    await withBankWrite(fixture.db, async (tx) => {
      await tx
        .update(supplierLinks)
        .set({ bankLast4: "9999" })
        .where(eq(supplierLinks.id, fixture.linkId));
    });
    const row = await fixture.db.query.supplierLinks.findFirst({
      where: eq(supplierLinks.id, fixture.linkId),
    });
    expect(row?.bankLast4).toBe("9999");
  });
});
