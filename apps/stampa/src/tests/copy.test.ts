/**
 * The message catalogue is load-bearing, so it is tested like code.
 *
 * Two things are being protected here. The first is the trust script: three
 * promises appear verbatim on specific screens and a paraphrase is a
 * regression, not a style choice. The second is that every string built from a
 * variable still reads as English once the variable is substituted — which is
 * where the defects actually live, because a template looks correct in the
 * source and wrong on the phone.
 */
import { describe, expect, it } from "vitest";
import { BRAND, TRUST, copy, formatDate, formatDateTime, formatRelative } from "@/lib/copy";

describe("Given a rejection the NRS blames on the buyer", () => {
  const reason = "the NRS does not recognise your customer's TIN";

  it("Then the customer is named instead of called 'your customer'", () => {
    const line = copy.notStamped.buyer.why(reason, "Lekki Beverages Ltd");
    expect(line).toContain("Lekki Beverages Ltd's TIN");
    expect(line).not.toContain("your customer's");
  });

  it("Then it reads as a sentence rather than a fragment", () => {
    // Gateway reasons are written to follow "The NRS says …", so they arrive
    // lower-case. Two of the three S10 variants use them standalone, which is
    // how a sentence beginning "the NRS does not recognise…" shipped.
    for (const line of [
      copy.notStamped.buyer.why(reason, "Lekki Beverages Ltd"),
      copy.notStamped.neither.why("the NRS is not responding"),
    ]) {
      expect(line[0]).toBe(line[0].toUpperCase());
      expect(line).toMatch(/\.$/);
    }
  });

  it("Then the supplier is told it is not their fault and not their job", () => {
    expect(copy.notStamped.buyer.next).toContain("not yours");
    expect(copy.notStamped.buyer.next).toContain("We have told them");
  });
});

describe("Given the NRS never answered and the retries are spent", () => {
  it("Then the screen stops promising a retry it will not make", () => {
    const waiting = copy.notStamped.neither.next("2975");
    const finished = copy.notStamped.neither.exhausted("2975");

    expect(waiting).toMatch(/retrying/i);
    expect(finished).not.toMatch(/retrying/i);
    // A promise of a message nobody will send is worse than asking for a call.
    expect(finished).not.toMatch(/we will message you/i);
    expect(finished).toMatch(/call us/i);
  });

  it("Then both variants carry the same case number the operator sees", () => {
    expect(copy.notStamped.neither.next("2975")).toContain("2975");
    expect(copy.notStamped.neither.exhausted("2975")).toContain("2975");
  });

  it("Then the heading drops 'yet' once nothing further is going to happen", () => {
    expect(copy.notStamped.neither.heading).toMatch(/yet/);
    expect(copy.notStamped.neither.finalHeading).not.toMatch(/yet/);
  });
});

describe("Given the trust script has three load-bearing promises", () => {
  it("Then the free-for-suppliers promise says who is never charged", () => {
    expect(TRUST.free).toMatch(/free for suppliers/i);
    expect(TRUST.free).toMatch(/never be asked to pay/i);
    // Repeated verbatim on S1, and on the help screen.
    expect(copy.invite.free).toMatch(/free for suppliers/i);
    expect(copy.help.freeHeading).toMatch(/free for suppliers/i);
  });

  it("Then the anti-scam line names a number to call", () => {
    expect(TRUST.antiScam).toContain(BRAND.supportPhone);
    expect(copy.help.freeBody).toBe(TRUST.antiScam);
  });

  it("Then the reference disclaimer disclaims the reference", () => {
    // Stampa must never be read as the issuer of a government number.
    expect(TRUST.notOurNumber).toMatch(/did not issue/i);
    expect(TRUST.notOurNumber).toContain(BRAND.verifyHost);
    expect(copy.stamped.disclaimer).toBe(TRUST.notOurNumber);
  });

  it("Then every rejection variant says the invoice is not lost", () => {
    expect(copy.notStamped.saved).toBe(TRUST.saved);
    expect(copy.sending.permission).toMatch(/your invoice is saved/i);
  });
});

describe("Given a count is put into a sentence", () => {
  it("Then one is not written as '1 invoices'", () => {
    expect(copy.home.search.found(1)).toBe("1 invoice found.");
    expect(copy.home.search.found(4)).toBe("4 invoices found.");
    expect(copy.buyer.inviteHeading(1)).toBe("Invite 1 supplier");
    expect(copy.buyer.inviteHeading(3)).toBe("Invite 3 suppliers");
    expect(copy.buyer.inviteSent(1)).toBe("1 invitation sent.");
    expect(copy.buyer.mappingRecovered(1)).toMatch(/^1 TIN /);
    expect(copy.buyer.exposureRemaining(1)).toMatch(/has not finished/);
    expect(copy.buyer.exposureRemaining(2)).toMatch(/have not finished/);
    expect(copy.buyer.mappingMoreProblems(1)).toMatch(/^And 1 more\./);
  });
});

describe("Given a supplier reads a date", () => {
  // Nigeria is UTC+1 and does not observe DST, so the offset is fixed and a
  // stamp issued at 23:30 UTC is dated the next day locally.
  it("Then it is West Africa Time, not the server's clock", () => {
    expect(formatDate(new Date("2026-09-14T09:42:00Z"))).toBe("14 Sep 2026");
    expect(formatDateTime(new Date("2026-09-14T09:42:00Z"))).toBe("14 Sep 2026, 10:42 WAT");
  });

  it("Then a stamp just before midnight UTC carries the local date", () => {
    expect(formatDateTime(new Date("2026-09-14T23:30:00Z"))).toBe("15 Sep 2026, 00:30 WAT");
  });

  it("Then recent times are relative and older ones are dates", () => {
    const now = new Date("2026-09-14T12:00:00Z");
    expect(formatRelative(new Date("2026-09-14T11:59:40Z"), now)).toBe("just now");
    expect(formatRelative(new Date("2026-09-14T11:59:00Z"), now)).toBe("1 minute ago");
    expect(formatRelative(new Date("2026-09-14T11:30:00Z"), now)).toBe("30 minutes ago");
    expect(formatRelative(new Date("2026-09-14T09:00:00Z"), now)).toBe("3 hours ago");
    expect(formatRelative(new Date("2026-09-01T09:00:00Z"), now)).toBe("1 Sep 2026");
  });
});

describe("Given the copy deck forbids a paraphrase", () => {
  it("Then the invitation a buyer sends still says the link is free", () => {
    const message = copy.buyer.inviteMessage("Agbara Foods Plc", "https://stampa.ng/s/i/AGB-4471");
    expect(message).toMatch(/^Agbara Foods Plc:/);
    expect(message).toContain("https://stampa.ng/s/i/AGB-4471");
    expect(message).toMatch(/never be asked to pay/i);
  });

  it("Then an OTP message tells the supplier we will never ask for it", () => {
    const message = copy.notify.otp("482913");
    expect(message).toMatch(/^482913 /);
    expect(message).toMatch(/never ask you for it/i);
  });

  it("Then a stamped notification carries the reference, not 'you have an update'", () => {
    const message = copy.notify.stamped({
      number: "INV-0032",
      buyer: "Agbara Foods Plc",
      amount: "NGN 1,850,075.00",
      irn: "IRN-7K2M-88QX-2026",
    });
    expect(message).toContain("IRN-7K2M-88QX-2026");
    expect(message).toContain("NGN 1,850,075.00");
    expect(message).not.toMatch(/update/i);
  });
});
