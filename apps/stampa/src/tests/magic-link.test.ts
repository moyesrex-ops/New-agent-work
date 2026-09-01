/**
 * Buyer sign-in tests (ticket A-04).
 *
 * The three properties that matter are all security properties: work email
 * only, single use, and no enumeration — the reply to "send me a link" must be
 * the same whether or not the account exists.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { magicLinks } from "@/lib/db/schema";
import {
  consumeMagicLink,
  issueMagicLink,
  LINK_TTL_MS,
  parseWorkEmail,
} from "@/lib/auth/magic-link";
import { isOperator } from "@/lib/auth/operators";
import { makeFixture, type Fixture } from "./support/db";

const KNOWN = "tax.manager@agbarafoods.com";

let fixture: Fixture;

beforeEach(async () => {
  fixture = await makeFixture();
});

describe("parseWorkEmail", () => {
  it("accepts a corporate address and normalises it", () => {
    const parsed = parseWorkEmail("  Tax.Manager@AgbaraFoods.com ");
    expect(parsed).toEqual({
      ok: true,
      value: "tax.manager@agbarafoods.com",
      domain: "agbarafoods.com",
    });
  });

  it("rejects consumer mailboxes, which is the whole point of the check", () => {
    for (const address of [
      "someone@gmail.com",
      "someone@yahoo.com",
      "someone@outlook.com",
      "someone@icloud.com",
      "someone@proton.me",
    ]) {
      expect(parseWorkEmail(address)).toEqual({ ok: false, error: "not_work_email" });
    }
  });

  it("rejects nonsense without being pedantic about valid addresses", () => {
    expect(parseWorkEmail("")).toEqual({ ok: false, error: "empty" });
    for (const bad of ["no-at-sign", "two@@at.com", "a@b"]) {
      expect(parseWorkEmail(bad)).toEqual({ ok: false, error: "malformed" });
    }
    // Plus addressing and subdomains are real and must survive.
    expect(parseWorkEmail("ap+stampa@finance.agbarafoods.com").ok).toBe(true);
  });
});

describe("Given a known buyer, When they ask for a link", () => {
  it("Then it signs them in exactly once", async () => {
    const issued = await issueMagicLink(fixture.db, KNOWN);
    expect(issued).not.toBeNull();

    const first = await consumeMagicLink(fixture.db, issued!.token);
    expect(first.ok).toBe(true);
    expect(first.ok && first.organisationId).toBe(fixture.organisationId);

    // Forwarded to a colleague, or opened by a mail scanner: dead either way.
    const second = await consumeMagicLink(fixture.db, issued!.token);
    expect(second).toEqual({ ok: false, error: "used" });
  });

  it("Then the plaintext token is never stored", async () => {
    const issued = await issueMagicLink(fixture.db, KNOWN);
    const [row] = await fixture.db
      .select()
      .from(magicLinks)
      .where(eq(magicLinks.email, KNOWN));

    expect(row.tokenHash).not.toContain(issued!.token);
    expect(row.tokenHash).toHaveLength(64);
  });

  it("Then an expired link is refused", async () => {
    const past = new Date(Date.now() - LINK_TTL_MS - 1000);
    const issued = await issueMagicLink(fixture.db, KNOWN, past);
    expect(await consumeMagicLink(fixture.db, issued!.token)).toEqual({
      ok: false,
      error: "expired",
    });
  });
});

describe("Given an address we do not know", () => {
  it("Then no link is created, and the caller cannot tell", async () => {
    expect(await issueMagicLink(fixture.db, "stranger@othercompany.com")).toBeNull();

    const rows = await fixture.db.select().from(magicLinks);
    expect(rows).toHaveLength(0);
  });
});

describe("Given an invented token", () => {
  it("Then it is invalid rather than an error", async () => {
    expect(await consumeMagicLink(fixture.db, "not-a-real-token")).toEqual({
      ok: false,
      error: "invalid",
    });
  });
});

describe("operator allow-list", () => {
  it("is empty unless configured, so the console is closed by default", () => {
    delete process.env.STAMPA_OPERATORS;
    expect(isOperator("anyone@stampa.ng")).toBe(false);
  });

  it("matches case-insensitively and ignores spacing", () => {
    process.env.STAMPA_OPERATORS = " Ops@Stampa.ng , second@stampa.ng ";
    expect(isOperator("ops@stampa.ng")).toBe(true);
    expect(isOperator("SECOND@stampa.ng")).toBe(true);
    expect(isOperator("someone.else@stampa.ng")).toBe(false);
    delete process.env.STAMPA_OPERATORS;
  });
});
