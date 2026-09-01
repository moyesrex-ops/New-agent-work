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
import {
  InviteAlreadyBoundError,
  bindSupplierToInvite,
  confirmSupplierDetails,
  openInvite,
} from "@/lib/services/onboarding";
import { makeFixture, type Fixture } from "./support/db";

const PHONE = "+2348030000001" as E164;
let fixture: Fixture;

beforeEach(async () => {
  fixture = await makeFixture();
});

async function currentCode(): Promise<string> {
  const issued = await issueOtp(fixture.db, PHONE);
  if (!issued.ok) throw new Error("expected an issued code");
  return issued.code;
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
    const start = new Date();
    for (let i = 0; i < MAX_ISSUES_PER_WINDOW; i += 1) {
      const now = new Date(start.getTime() + i * 31_000);
      expect((await issueOtp(fixture.db, PHONE, "sms", now)).ok).toBe(true);
    }
    const blocked = await issueOtp(
      fixture.db,
      PHONE,
      "sms",
      new Date(start.getTime() + MAX_ISSUES_PER_WINDOW * 31_000),
    );
    expect(blocked.ok).toBe(false);
    expect(!blocked.ok && blocked.error).toBe("rate_limited");
  });

  it("refuses a resend before thirty seconds, so a disabled button is not the only guard", async () => {
    const start = new Date();
    expect((await issueOtp(fixture.db, PHONE, "sms", start)).ok).toBe(true);
    const again = await issueOtp(fixture.db, PHONE, "sms", new Date(start.getTime() + 10_000));
    expect(again.ok).toBe(false);
    expect(!again.ok && again.error).toBe("too_soon");
  });

  it("refuses a voice call before sixty seconds", async () => {
    const start = new Date();
    expect((await issueOtp(fixture.db, PHONE, "sms", start)).ok).toBe(true);
    const voice = await issueOtp(fixture.db, PHONE, "voice", new Date(start.getTime() + 40_000));
    expect(voice.ok).toBe(false);
    expect(!voice.ok && voice.error).toBe("too_soon");
    const later = await issueOtp(fixture.db, PHONE, "voice", new Date(start.getTime() + 61_000));
    expect(later.ok).toBe(true);
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

  // AT-02. Invites travel by WhatsApp forward, which is the distribution
  // mechanic, so a forwarded link reaching the wrong person is not an exotic
  // case — it is Tuesday. Before this was enforced, the second number to
  // verify silently took over the first supplier's account and their history.
  describe("once an invitation has been claimed", () => {
    const STRANGER = "+2348037777777" as E164;

    beforeEach(async () => {
      await bindSupplierToInvite(fixture.code, PHONE);
    });

    it("refuses a different number rather than handing over the account", async () => {
      await expect(bindSupplierToInvite(fixture.code, STRANGER)).rejects.toBeInstanceOf(
        InviteAlreadyBoundError,
      );
    });

    it("leaves the supplier still reachable on the number that claimed it", async () => {
      await bindSupplierToInvite(fixture.code, STRANGER).catch(() => undefined);

      const [supplier] = await fixture.db
        .select({ phone: suppliers.phone })
        .from(suppliers)
        .where(eq(suppliers.id, fixture.supplierId));
      expect(supplier.phone).toBe(PHONE);
    });

    it("still lets the rightful number back in, so a re-verify is not a lockout", async () => {
      const again = await bindSupplierToInvite(fixture.code, PHONE);
      expect(again.supplierId).toBe(fixture.supplierId);
    });
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
    expect(supplier?.tin).toBe("20481166-0001");

    const link = await fixture.db.query.supplierLinks.findFirst();
    expect(link?.status).toBe("live");
    expect(link?.activatedAt).toBeInstanceOf(Date);

    const events = await fixture.db.query.auditEvents.findMany();
    expect(events.map((event) => event.action)).toContain("supplier.confirmed");
  });

  it("stores a bare eight-digit TIN in canonical form", async () => {
    await bindSupplierToInvite(fixture.code, PHONE);
    await confirmSupplierDetails(
      fixture.supplierId,
      fixture.organisationId,
      {
        businessName: "Emeka Aluminium Works Ltd",
        tin: "20481166",
        address: "14 Ladipo Street, Oshodi, Lagos",
      },
      { type: "supplier", id: fixture.supplierId },
    );
    const supplier = await fixture.db.query.suppliers.findFirst({
      where: eq(suppliers.id, fixture.supplierId),
    });
    expect(supplier?.tin).toBe("20481166-0001");
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
