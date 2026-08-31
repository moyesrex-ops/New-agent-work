/**
 * Trust tests for identity (Phase 18.4): replayed OTP, brute force, and the
 * invite binding rules that decide whether a scam can walk in behind a real
 * supplier.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { otpChallenges, suppliers } from "@/lib/db/schema";
import { issueOtp, MAX_ISSUES_PER_WINDOW, MAX_VERIFY_ATTEMPTS, verifyOtp } from "@/lib/auth/otp";
import { parsePhone, type E164 } from "@/lib/phone";
import { bindSupplierToInvite, confirmSupplierDetails, openInvite } from "@/lib/services/onboarding";
import { makeFixture, type Fixture } from "./support/db";

const PHONE = "+2348030000001" as E164;
let fixture: Fixture;

beforeEach(async () => {
  fixture = await makeFixture();
});

async function currentCode(): Promise<string> {
  const issued = await issueOtp(fixture.db, PHONE);
  if (!issued.ok) throw new Error("expected an issued code");
  return issued.devCode!;
}

describe("OTP", () => {
  it("never stores the plaintext code", async () => {
    const code = await currentCode();
    const [row] = await fixture.db
      .select()
      .from(otpChallenges)
      .where(eq(otpChallenges.phone, PHONE));
    expect(row.codeHash).not.toContain(code);
    expect(row.codeHash).toHaveLength(64);
  });

  it("accepts the right code once and never again", async () => {
    const code = await currentCode();
    expect((await verifyOtp(fixture.db, PHONE, code)).ok).toBe(true);

    // The replay. This is the trust test.
    const replay = await verifyOtp(fixture.db, PHONE, code);
    expect(replay.ok).toBe(false);
    expect(!replay.ok && replay.error).toBe("no_challenge");
  });

  it("tolerates a pasted code with spaces", async () => {
    const code = await currentCode();
    const spaced = code.split("").join(" ");
    expect((await verifyOtp(fixture.db, PHONE, spaced)).ok).toBe(true);
  });

  it("locks out after five wrong attempts rather than inviting a sixth", async () => {
    await currentCode();
    for (let attempt = 1; attempt < MAX_VERIFY_ATTEMPTS; attempt += 1) {
      const result = await verifyOtp(fixture.db, PHONE, "000000");
      expect(!result.ok && result.error).toBe("wrong_code");
    }
    const final = await verifyOtp(fixture.db, PHONE, "000000");
    expect(!final.ok && final.error).toBe("locked_out");
  });

  it("refuses an expired code", async () => {
    const code = await currentCode();
    const later = new Date(Date.now() + 11 * 60 * 1000);
    const result = await verifyOtp(fixture.db, PHONE, code, later);
    expect(!result.ok && result.error).toBe("expired");
  });

  it("rate-limits repeated requests for the same number", async () => {
    for (let i = 0; i < MAX_ISSUES_PER_WINDOW; i += 1) {
      expect((await issueOtp(fixture.db, PHONE)).ok).toBe(true);
    }
    const blocked = await issueOtp(fixture.db, PHONE);
    expect(blocked.ok).toBe(false);
    expect(!blocked.ok && blocked.error).toBe("rate_limited");
  });

  it("says nothing about a phone number that has no challenge", async () => {
    const result = await verifyOtp(fixture.db, "+2348039999999" as E164, "123456");
    expect(!result.ok && result.error).toBe("no_challenge");
  });
});

describe("invite landing", () => {
  it("shows the buyer's own name, which is the authority being borrowed", async () => {
    const view = await openInvite(fixture.code);
    expect(view.state).toBe("open");
    if (view.state !== "open") return;
    expect(view.buyerName).toBe("Agbara Foods Plc");
    expect(view.supplierName).toBe("Emeka Aluminium Works Ltd");
    expect(view.bankLast4).toBe("4471");
  });

  it("treats an unknown code as invalid without leaking whether it ever existed", async () => {
    expect((await openInvite("AGB-NOPE")).state).toBe("invalid");
  });

  it("expires a stale link but still names the buyer, so the supplier knows who to ask", async () => {
    const later = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
    const view = await openInvite(fixture.code, later);
    expect(view.state).toBe("expired");
    if (view.state !== "expired") return;
    expect(view.buyerName).toBe("Agbara Foods Plc");
  });

  it("records the open once, not on every refresh", async () => {
    await openInvite(fixture.code);
    await openInvite(fixture.code);
    const events = await fixture.db.query.analyticsEvents.findMany();
    expect(events.filter((event) => event.name === "invite_opened")).toHaveLength(1);
  });
});

describe("binding a verified phone", () => {
  it("accepts a number that differs from the vendor master, and flags the mismatch", async () => {
    const different = parsePhone("08039999999");
    expect(different.ok).toBe(true);
    if (!different.ok) return;

    const result = await bindSupplierToInvite(fixture.code, different.value);
    expect(result.phoneMismatch).toBe(true);
    // Accepted, not blocked: the supplier is not told their own number is wrong.
    expect(result.supplierId).toBeTruthy();
  });

  it("folds an invited placeholder into an existing supplier, which is the network effect", async () => {
    // A second buyer imports the same business under a different placeholder.
    const other = await bindSupplierToInvite(fixture.code, PHONE);
    expect(other.supplierId).toBe(fixture.supplierId);
    expect(other.phoneMismatch).toBe(false);

    const rows = await fixture.db.select().from(suppliers).where(eq(suppliers.phone, PHONE));
    expect(rows).toHaveLength(1);
  });
});

describe("confirming business details", () => {
  it("marks the supplier live for that buyer and audits the change", async () => {
    await bindSupplierToInvite(fixture.code, PHONE);
    await confirmSupplierDetails(
      fixture.supplierId,
      fixture.organisationId,
      {
        businessName: "Emeka Aluminium Works Ltd",
        tin: "20481166-0001",
        address: "14 Ladipo Street, Oshodi, Lagos",
      },
      { type: "supplier", id: fixture.supplierId },
    );

    const supplier = await fixture.db.query.suppliers.findFirst({
      where: eq(suppliers.id, fixture.supplierId),
    });
    expect(supplier?.confirmedAt).toBeInstanceOf(Date);

    const link = await fixture.db.query.supplierLinks.findFirst();
    expect(link?.status).toBe("live");
    expect(link?.activatedAt).toBeInstanceOf(Date);

    const events = await fixture.db.query.auditEvents.findMany();
    expect(events.map((event) => event.action)).toContain("supplier.confirmed");
  });

  it("throws if a caller ever tries to smuggle a bank field through this path", async () => {
    await expect(
      confirmSupplierDetails(
        fixture.supplierId,
        fixture.organisationId,
        {
          businessName: "Emeka",
          tin: "20481166-0001",
          address: "x",
          bankLast4: "9999",
        } as never,
        { type: "supplier", id: fixture.supplierId },
      ),
    ).rejects.toThrow(/not writable/);
  });
});
